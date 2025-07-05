// services/apiService.ts - FIXED VERSION WITH BETTER ERROR HANDLING
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

            let responseData;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                const textData = await response.text();
                console.error(`❌ Non-JSON response:`, textData);
                throw new Error(`Server returned non-JSON response: ${textData}`);
            }

            console.log(`✅ API Success Response:`, responseData);

            if (!response.ok) {
                const errorMessage = responseData.message || responseData.detail || `API Error: ${response.status} ${response.statusText}`;
                throw new Error(errorMessage);
            }

            return responseData;
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

    // ===== STORY METHODS - FIXED =====

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

    // FIXED: Enhanced story fetching with better error handling
    async getUserStories(token: string, limit: number = 20, offset: number = 0): Promise<ApiResponse> {
        console.log('📚 Fetching user stories...');
        console.log(`   Parameters: limit=${limit}, offset=${offset}`);
        console.log(`   Token (first 20 chars): ${token.substring(0, 20)}...`);
        
        try {
            const response = await this.makeRequest<ApiResponse>(
                `/stories/user/${token}?limit=${limit}&offset=${offset}`, 
                { method: 'GET' }
            );

            console.log('📚 User stories response:', response);
            
            // Enhanced logging for debugging
            if (response.success) {
                console.log(`✅ Stories fetch successful:`);
                console.log(`   Total stories: ${response.total_count || 0}`);
                console.log(`   Stories returned: ${response.stories?.length || 0}`);
                console.log(`   Method used: ${response.summary?.method_used || 'unknown'}`);
                console.log(`   User info:`, response.user_info);
                
                if (response.stories && response.stories.length > 0) {
                    console.log(`   First story:`, response.stories[0]);
                } else {
                    console.log(`   No stories in response`);
                    
                    // Additional debugging info
                    if (response.user_info) {
                        console.log(`   User story_ids array length: ${response.user_info.story_ids_array_length || 0}`);
                        console.log(`   User story_ids preview:`, response.user_info.story_ids_preview);
                    }
                }
            } else {
                console.log(`❌ Stories fetch failed: ${response.message}`);
            }
            
            return response;
        } catch (error: any) {
            console.error('❌ Error in getUserStories:', error);
            
            // Return a structured error response
            return {
                success: false,
                message: error.message || 'Failed to fetch stories',
                stories: [],
                total_count: 0,
                error: error.message
            };
        }
    }

    // NEW: Get story IDs only (for debugging)
    async getUserStoryIds(token: string): Promise<ApiResponse> {
        console.log('📋 Fetching user story IDs...');
        
        try {
            const response = await this.makeRequest<ApiResponse>(
                `/stories/user/${token}/story-ids`, 
                { method: 'GET' }
            );

            console.log('📋 User story IDs response:', response);
            return response;
        } catch (error: any) {
            console.error('❌ Error fetching story IDs:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch story IDs',
                story_ids: []
            };
        }
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
        console.log('🏥 Checking server health...');
        const response = await this.makeRequest('/health', {
            method: 'GET',
        });
        console.log('🏥 Health check response:', response);
        return response;
    }

    // NEW: Debug endpoint to test token and stories
    async debugUserStories(token: string): Promise<{
        tokenValid: boolean;
        userProfile: any;
        storyIds: string[];
        storiesResponse: any;
    }> {
        console.log('🔍 Running comprehensive stories debug...');
        
        try {
            // 1. Verify token
            const tokenCheck = await this.verifyToken(token);
            console.log('🔍 Token verification:', tokenCheck);
            
            // 2. Get user profile
            const profileCheck = await this.getUserProfile(token);
            console.log('🔍 User profile:', profileCheck);
            
            // 3. Get story IDs
            const idsCheck = await this.getUserStoryIds(token);
            console.log('🔍 Story IDs:', idsCheck);
            
            // 4. Get full stories
            const storiesCheck = await this.getUserStories(token, 10, 0);
            console.log('🔍 Full stories:', storiesCheck);
            
            return {
                tokenValid: tokenCheck.success && tokenCheck.valid,
                userProfile: profileCheck.success ? profileCheck.profile : null,
                storyIds: idsCheck.success ? idsCheck.story_ids : [],
                storiesResponse: storiesCheck
            };
            
        } catch (error) {
            console.error('🔍 Debug error:', error);
            throw error;
        }
    }
}

export const apiService = new ApiService();

// Export types for use in components
export type {
    Story,
    StoryScene,
    ApiResponse,
};