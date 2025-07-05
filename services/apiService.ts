// services/apiService.ts
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

interface GenerateStoryRequest {
    firebase_token: string;
    prompt: string;
}

interface StoryGenerationResponse {
    success: boolean;
    message: string;
    story_id: string;
    status: 'processing' | 'completed' | 'failed';
    story?: Story;
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

    // Authentication endpoints
    async signIn(email: string, password: string): Promise<ApiResponse> {
        return this.makeRequest('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async signUp(email: string, password: string): Promise<ApiResponse> {
        return this.makeRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async registerUser(userData: any): Promise<ApiResponse> {
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
        }, token);
    }

    async updateUserProfile(updateData: any, token: string): Promise<ApiResponse> {
        console.log('API: Updating user profile with data:', updateData);
        
        const response = await this.makeRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(updateData),
        }, token);
        
        console.log('API: Profile update response:', response);
        return response;
    }

    async signOut(token: string): Promise<ApiResponse> {
        return this.makeRequest('/auth/signout', {
            method: 'POST',
            body: JSON.stringify({ firebase_token: token }),
        }, token);
    }

    async refreshToken(refreshToken: string): Promise<ApiResponse> {
        return this.makeRequest('/auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    }

    // Story Generation
    async generateStory(prompt: string, token: string): Promise<StoryGenerationResponse> {
        console.log('🎬 Generating story with prompt:', prompt);
        
        const response = await this.makeRequest<StoryGenerationResponse>('/stories/generate', {
            method: 'POST',
            body: JSON.stringify({
                firebase_token: token,
                prompt: prompt,
            }),
        }, token);

        console.log('📖 Story generation response:', response);
        return response;
    }

    // Fetch Story Status/Details
    async fetchStoryStatus(storyId: string): Promise<ApiResponse<Story>> {
        console.log('📡 Fetching story status for:', storyId);
        
        const response = await this.makeRequest<ApiResponse<Story>>(`/stories/fetch/${storyId}`, {
            method: 'GET',
        });

        console.log('📖 Story status response:', response);
        return response;
    }

    // Get User Stories
    async getUserStories(token: string, limit: number = 20, offset: number = 0): Promise<ApiResponse> {
        console.log('📚 Fetching user stories...');
        
        const response = await this.makeRequest<ApiResponse>(`/stories/user/${token}?limit=${limit}&offset=${offset}`, {
            method: 'GET',
        }, token);

        console.log('📚 User stories response:', response);
        return response;
    }

    // Get Story Details
    async getStoryDetails(storyId: string): Promise<ApiResponse<Story>> {
        console.log('📖 Fetching story details for:', storyId);
        
        const response = await this.makeRequest<ApiResponse<Story>>(`/stories/details/${storyId}`, {
            method: 'GET',
        });

        console.log('📖 Story details response:', response);
        return response;
    }

    // Delete User Story
    async deleteUserStory(storyId: string, token: string): Promise<ApiResponse> {
        console.log('🗑️ Deleting story:', storyId);
        
        const response = await this.makeRequest<ApiResponse>(`/stories/user/${token}/story/${storyId}`, {
            method: 'DELETE',
        }, token);

        console.log('🗑️ Delete story response:', response);
        return response;
    }

    // Update System Prompt
    async updateSystemPrompt(systemPrompt: string, token: string): Promise<ApiResponse> {
        console.log('📝 Updating system prompt...');
        
        const response = await this.makeRequest<ApiResponse>('/stories/system-prompt', {
            method: 'POST',
            body: JSON.stringify({
                firebase_token: token,
                system_prompt: systemPrompt,
            }),
        }, token);

        console.log('📝 System prompt update response:', response);
        return response;
    }

    // Health check
    async healthCheck(): Promise<ApiResponse> {
        return this.makeRequest('/health', {
            method: 'GET',
        });
    }

    // Test endpoints for debugging
    async testSimple(): Promise<ApiResponse> {
        return this.makeRequest('/auth/test-simple', {
            method: 'POST',
        });
    }

    async testEcho(data: any): Promise<ApiResponse> {
        return this.makeRequest('/auth/test-echo', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}

export const apiService = new ApiService();

// Export types for use in components
export type {
    Story,
    StoryScene,
    GenerateStoryRequest,
    StoryGenerationResponse,
    ApiResponse,
};