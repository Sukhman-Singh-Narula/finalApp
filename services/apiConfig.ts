// services/apiConfig.ts
export const API_CONFIG = {
    // Update this to your server URL
    BASE_URL: 'https://stserver-lrr8.onrender.com',
    ENDPOINTS: {
        // Auth endpoints
        REGISTER: '/auth/register',
        VERIFY_TOKEN: '/auth/verify-token',
        GET_PROFILE: '/auth/profile',
        UPDATE_PROFILE: '/auth/profile',

        // Story endpoints
        GENERATE_STORY: '/stories/generate',
        FETCH_STORY: '/stories/fetch',
        LIST_STORIES: '/stories/list',
        STORY_DETAILS: '/stories/details',
    },
    TIMEOUT: 30000, // 30 seconds
};

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface StoryApiResponse {
    success: boolean;
    message: string;
    story_id?: string;
    status?: string;
    story?: any;
}

export interface UserProfile {
    user_id: string;
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
    system_prompt: string;
    created_at: string;
    updated_at: string;
    story_count: number;
  }