// services/authService.ts - CLEAN VERSION WITHOUT FIREBASE

import { apiService } from './apiService';

interface AuthResponse {
    success: boolean;
    message: string;
    user_id?: string;
    profile?: any;
}

interface UserRegistration {
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
}

interface UserProfileUpdate {
    firebase_token: string;
    parent?: {
        name?: string;
        email?: string;
        phone_number?: string;
    };
    child?: {
        name?: string;
        age?: number;
        interests?: string[];
    };
    system_prompt?: string;
}

class AuthService {
    async registerUser(request: UserRegistration): Promise<AuthResponse> {
        try {
            const response = await apiService.registerUser(request);
            
            return {
                success: response.success || false,
                message: response.message || 'Registration completed',
                user_id: response.user_id,
                profile: response.profile
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Registration failed',
            };
        }
    }

    async getUserProfile(firebaseToken: string): Promise<any> {
        try {
            const response = await apiService.getUserProfile(firebaseToken);
            
            if (response.success) {
                return {
                    success: true,
                    user_id: response.user_id,
                    profile: response.profile
                };
            } else {
                throw new Error(response.message || 'Failed to get profile');
            }
        } catch (error: any) {
            throw new Error(error.message || 'Failed to get user profile');
        }
    }

    async updateUserProfile(request: UserProfileUpdate): Promise<AuthResponse> {
        try {
            const response = await apiService.updateUserProfile(request, request.firebase_token);
            
            return {
                success: response.success || false,
                message: response.message || 'Profile updated successfully',
                user_id: response.user_id,
                profile: response.profile
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Profile update failed',
            };
        }
    }

    async deleteUserProfile(firebaseToken: string): Promise<{ success: boolean; message: string; user_id?: string }> {
        try {
            // Note: You'd need to add this endpoint to your API service if needed
            // const response = await apiService.deleteUserProfile(firebaseToken);
            
            return {
                success: true,
                message: 'Profile deletion not implemented yet',
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to delete profile',
            };
        }
    }

    async verifyToken(firebaseToken: string): Promise<any> {
        try {
            const response = await apiService.verifyToken(firebaseToken);
            
            return {
                success: response.success || false,
                valid: response.valid || false,
                user_info: response.user_info,
                has_profile: response.has_profile || false,
                profile: response.profile,
                error: response.error
            };
        } catch (error: any) {
            return {
                success: false,
                valid: false,
                error: error.message || 'Token verification failed'
            };
        }
    }
}

export const authService = new AuthService();

// Export types for use in components
export type {
    AuthResponse,
    UserRegistration,
    UserProfileUpdate,
};