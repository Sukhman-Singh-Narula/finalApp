// services/authService.ts - FLEXIBLE VERSION (Development + Production)
import { API_CONFIG, ApiResponse, UserProfile } from './apiConfig';

// Firebase configuration with development mode support
import { auth, isDevelopmentMode, developmentAuth } from '@/config/firebase';
import {
    signInWithEmailAndPassword as firebaseSignIn,
    createUserWithEmailAndPassword as firebaseCreateUser,
    signOut as firebaseSignOut
} from 'firebase/auth';

class AuthServiceClass {
    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        try {
            console.log(`🌐 Making API request to: ${url}`);
            console.log(`📝 Method: ${options.method || 'GET'}`);

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers,
                },
                timeout: API_CONFIG.TIMEOUT,
            });

            console.log(`📊 Response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error: ${response.status} - ${errorText}`);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`✅ API Success:`, data);
            return data;
        } catch (error) {
            console.error(`❌ Network Error:`, error);
            throw error;
        }
    }

    async registerUser(registrationData: {
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
    }): Promise<ApiResponse<UserProfile>> {
        return this.makeRequest(API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(registrationData),
        });
    }

    async verifyToken(firebase_token: string): Promise<ApiResponse> {
        return this.makeRequest(API_CONFIG.ENDPOINTS.VERIFY_TOKEN, {
            method: 'POST',
            body: JSON.stringify({ firebase_token }),
        });
    }

    async getUserProfile(firebase_token: string): Promise<ApiResponse<UserProfile>> {
        return this.makeRequest(`${API_CONFIG.ENDPOINTS.GET_PROFILE}/${firebase_token}`);
    }

    async updateUserProfile(updateData: {
        firebase_token: string;
        parent?: {
            name: string;
            email: string;
            phone_number?: string;
        };
        child?: {
            name: string;
            age: number;
            interests: string[];
        };
        system_prompt?: string;
    }): Promise<ApiResponse<UserProfile>> {
        return this.makeRequest(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: { uid: string, email: string }, idToken: string }> {
        try {
            if (isDevelopmentMode) {
                console.log('🧪 Development mode - Mock Firebase sign in:', email);

                // Use development auth
                const userCredential: any = await developmentAuth.signInWithEmailAndPassword(email, password);
                const idToken = await userCredential.user.getIdToken();

                return {
                    user: {
                        uid: userCredential.user.uid,
                        email: userCredential.user.email,
                    },
                    idToken: idToken,
                };
            } else {
                console.log('🔐 Production mode - Real Firebase sign in:', email);

                // Use real Firebase authentication
                const userCredential = await firebaseSignIn(auth, email, password);
                const user = userCredential.user;

                // Get the Firebase ID token
                const idToken = await user.getIdToken();

                console.log('✅ Firebase authentication successful');

                return {
                    user: {
                        uid: user.uid,
                        email: user.email || email,
                    },
                    idToken: idToken,
                };
            }
        } catch (error: any) {
            console.error('❌ Firebase sign in error:', error);
            throw new Error(error.message || 'Sign in failed');
        }
    }

    async createUserWithEmailAndPassword(email: string, password: string): Promise<{ user: { uid: string, email: string }, idToken: string }> {
        try {
            if (isDevelopmentMode) {
                console.log('🧪 Development mode - Mock Firebase create user:', email);

                // Use development auth
                const userCredential: any = await developmentAuth.createUserWithEmailAndPassword(email, password);
                const idToken = await userCredential.user.getIdToken();

                return {
                    user: {
                        uid: userCredential.user.uid,
                        email: userCredential.user.email,
                    },
                    idToken: idToken,
                };
            } else {
                console.log('🔐 Production mode - Real Firebase create user:', email);

                // Use real Firebase user creation
                const userCredential = await firebaseCreateUser(auth, email, password);
                const user = userCredential.user;

                // Get the Firebase ID token
                const idToken = await user.getIdToken();

                console.log('✅ Firebase user creation successful');

                return {
                    user: {
                        uid: user.uid,
                        email: user.email || email,
                    },
                    idToken: idToken,
                };
            }
        } catch (error: any) {
            console.error('❌ Firebase user creation error:', error);
            throw new Error(error.message || 'User creation failed');
        }
    }

    async signOut(): Promise<void> {
        try {
            if (isDevelopmentMode) {
                await developmentAuth.signOut();
            } else {
                await firebaseSignOut(auth);
            }
            console.log('✅ Sign out successful');
        } catch (error: any) {
            console.error('❌ Sign out error:', error);
            throw new Error(error.message || 'Sign out failed');
        }
    }
}

export const authService = new AuthServiceClass();