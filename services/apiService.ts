// services/apiService.ts - UPDATED VERSION
import { API_CONFIG } from '@/constants';

interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    [key: string]: any;
}

interface Story {
    story_id: string;
    title: string;
    user_prompt: string;
    created_at: string;
    total_scenes: number;
    total_duration: number;
    status: string;
    thumbnail_url?: string;
    scenes?: StoryScene[];
}

interface StoryScene {
    scene_number: number;
    text: string;
    visual_prompt: string;
    audio_url: string;
    image_url: string;
    start_time: number;
    duration: number;
}

class ApiService {
    private get baseUrl(): string {
        return API_CONFIG.BASE_URL;
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {},
        token?: string
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            timeout: API_CONFIG.TIMEOUT,
            ...options,
        };

        try {
            console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
            if (options.body) {
                console.log(`📤 Request Body:`, JSON.parse(options.body as string));
            }

            const response = await fetch(url, defaultOptions);
            console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error Response:`, errorText);

                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText };
                }

                throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ API Success Response:`, data);
            return data;
        } catch (error) {
            console.error(`❌ API Request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // ===== AUTHENTICATION METHODS =====

    async signUp(email: string, password: string, displayName?: string): Promise<ApiResponse> {
        return this.makeRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ 
                email, 
                password, 
                display_name: displayName 
            }),
        });
    }

    async signIn(email: string, password: string): Promise<ApiResponse> {
        return this.makeRequest('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async registerUserProfile(userData: {
        firebase_token: string;
        parent: {
            name: string;
            email: string;
            phone_number?: string;
        };
        child: {
            name: string;
            age: number;
            interests: string[];
        };
        system_prompt?: string;
    }): Promise<ApiResponse> {
        return this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async verifyToken(token: string): Promise<ApiResponse> {
        return this.makeRequest('/auth/verify-token', {
            method: 'POST',
            body: JSON.stringify({ firebase_token: token }),
        });
    }

    async getUserProfile(token: string): Promise<ApiResponse> {
        return this.makeRequest(`/auth/profile/${token}`, {
            method: 'GET',
        });
    }

    async updateUserProfile(updateData: any): Promise<ApiResponse> {
        return this.makeRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async refreshToken(refreshToken: string): Promise<ApiResponse> {
        return this.makeRequest('/auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    }

    async signOut(token: string): Promise<ApiResponse> {
        return this.makeRequest('/auth/signout', {
            method: 'POST',
            body: JSON.stringify({ firebase_token: token }),
        });
    }

    // ===== STORY METHODS =====

    async generateStory(prompt: string, token: string): Promise<ApiResponse> {
        console.log('🎬 Generating story with prompt:', prompt);
        
        const response = await this.makeRequest<ApiResponse>('/stories/generate', {
            method: 'POST',
            body: JSON.stringify({
                firebase_token: token,
                prompt: prompt,
            }),
        });

        console.log('📖 Story generation response:', response);
        return response;
    }

    async fetchStoryStatus(storyId: string): Promise<ApiResponse> {
        console.log('📡 Fetching story status for:', storyId);
        
        const response = await this.makeRequest<ApiResponse>(`/stories/fetch/${storyId}`, {
            method: 'GET',
        });

        console.log('📖 Story status response:', response);
        return response;
    }

    async getUserStories(token: string, limit: number = 20, offset: number = 0): Promise<ApiResponse> {
        console.log('📚 Fetching user stories...');
        
        const response = await this.makeRequest<ApiResponse>(
            `/stories/user/${token}?limit=${limit}&offset=${offset}`, 
            { method: 'GET' }
        );

        console.log('📚 User stories response:', response);
        return response;
    }

    async getStoryDetails(storyId: string): Promise<ApiResponse> {
        console.log('📖 Fetching story details for:', storyId);
        
        const response = await this.makeRequest<ApiResponse>(`/stories/details/${storyId}`, {
            method: 'GET',
        });

        console.log('📖 Story details response:', response);
        return response;
    }

    async deleteUserStory(storyId: string, token: string): Promise<ApiResponse> {
        console.log('🗑️ Deleting story:', storyId);
        
        const response = await this.makeRequest<ApiResponse>(
            `/stories/user/${token}/story/${storyId}`, 
            { method: 'DELETE' }
        );

        console.log('🗑️ Delete story response:', response);
        return response;
    }

    async updateSystemPrompt(systemPrompt: string, token: string): Promise<ApiResponse> {
        console.log('📝 Updating system prompt...');
        
        const response = await this.makeRequest<ApiResponse>('/stories/system-prompt', {
            method: 'POST',
            body: JSON.stringify({
                firebase_token: token,
                system_prompt: systemPrompt,
            }),
        });

        console.log('📝 System prompt update response:', response);
        return response;
    }

    // ===== UTILITY METHODS =====

    async healthCheck(): Promise<ApiResponse> {
        return this.makeRequest('/health', {
            method: 'GET',
        });
    }
}

export const apiService = new ApiService();

// Export types for use in components
export type {
    Story,
    StoryScene,
    ApiResponse,
};