// services/authService.ts - PRODUCTION VERSION with Real Firebase
import { API_CONFIG, ApiResponse, UserProfile } from './apiConfig';

// Import Firebase auth functions
import { auth } from '@/config/firebase';
import {
    signInWithEmailAndPassword as firebaseSignIn,
    createUserWithEmailAndPassword as firebaseCreateUser,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';

class AuthServiceClass {
    private currentUser: User | null = null;

    constructor() {
        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user');
        });
    }

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

    // Server API methods
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
        console.log('🔗 Registering user with server...');
        return this.makeRequest(API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(registrationData),
        });
    }

    async verifyToken(firebase_token: string): Promise<ApiResponse> {
        console.log('🔍 Verifying token with server...');
        return this.makeRequest(API_CONFIG.ENDPOINTS.VERIFY_TOKEN, {
            method: 'POST',
            body: JSON.stringify({ firebase_token }),
        });
    }

    async getUserProfile(firebase_token: string): Promise<ApiResponse<UserProfile>> {
        console.log('👤 Getting user profile from server...');
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
        console.log('📝 Updating user profile on server...');
        return this.makeRequest(API_CONFIG.ENDPOINTS.UPDATE_PROFILE, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    // Firebase Authentication methods
    async signInWithEmailAndPassword(email: string, password: string): Promise<{
        user: { uid: string, email: string },
        idToken: string
    }> {
        try {
            console.log('🔐 Signing in with Firebase:', email);

            // Sign in with Firebase
            const userCredential = await firebaseSignIn(auth, email, password);
            const user = userCredential.user;

            console.log('✅ Firebase sign in successful:', user.uid);

            // Get the ID token
            const idToken = await user.getIdToken();
            console.log('🎫 Firebase ID token obtained');

            return {
                user: {
                    uid: user.uid,
                    email: user.email || email,
                },
                idToken: idToken,
            };
        } catch (error: any) {
            console.error('❌ Firebase sign in error:', error);

            // Provide user-friendly error messages
            let errorMessage = 'Sign in failed';

            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later';
                    break;
                default:
                    errorMessage = error.message || 'Sign in failed';
            }

            throw new Error(errorMessage);
        }
    }

    async createUserWithEmailAndPassword(email: string, password: string): Promise<{
        user: { uid: string, email: string },
        idToken: string
    }> {
        try {
            console.log('🔐 Creating user with Firebase:', email);

            // Create user with Firebase
            const userCredential = await firebaseCreateUser(auth, email, password);
            const user = userCredential.user;

            console.log('✅ Firebase user creation successful:', user.uid);

            // Get the ID token
            const idToken = await user.getIdToken();
            console.log('🎫 Firebase ID token obtained');

            return {
                user: {
                    uid: user.uid,
                    email: user.email || email,
                },
                idToken: idToken,
            };
        } catch (error: any) {
            console.error('❌ Firebase user creation error:', error);

            // Provide user-friendly error messages
            let errorMessage = 'Account creation failed';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password accounts are not enabled';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please choose a stronger password';
                    break;
                default:
                    errorMessage = error.message || 'Account creation failed';
            }

            throw new Error(errorMessage);
        }
    }

    async signOut(): Promise<void> {
        try {
            console.log('🔐 Signing out from Firebase...');
            await firebaseSignOut(auth);
            this.currentUser = null;
            console.log('✅ Firebase sign out successful');
        } catch (error: any) {
            console.error('❌ Firebase sign out error:', error);
            throw new Error(error.message || 'Sign out failed');
        }
    }

    // Utility methods
    getCurrentUser(): User | null {
        return this.currentUser;
    }

    async getCurrentIdToken(): Promise<string | null> {
        try {
            if (this.currentUser) {
                return await this.currentUser.getIdToken();
            }
            return null;
        } catch (error) {
            console.error('❌ Error getting current ID token:', error);
            return null;
        }
    }

    async refreshIdToken(): Promise<string | null> {
        try {
            if (this.currentUser) {
                console.log('🔄 Refreshing Firebase ID token...');
                return await this.currentUser.getIdToken(true); // Force refresh
            }
            return null;
        } catch (error) {
            console.error('❌ Error refreshing ID token:', error);
            return null;
        }
    }

    isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    // Wait for authentication state to be determined
    async waitForAuthState(): Promise<User | null> {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }
}

export const authService = new AuthServiceClass();