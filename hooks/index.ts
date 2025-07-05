// hooks/index.ts - UPDATED WITH NEW HOOKS
export { useFrameworkReady } from './useFrameworkReady';
export { useTokenManager, withTokenManagement } from './useTokenManager';
export { useApiWithTokenRefresh } from './useApiWithTokenRefresh';

// constants/index.tsx - UPDATED CONFIGURATION
// API Configuration
export const API_CONFIG = {
    BASE_URL: 'https://stserver-lrr8.onrender.com', // Your FastAPI server URL
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    POLLING_INTERVAL: 5000, // 5 seconds for story generation polling
    TOKEN_REFRESH_INTERVAL: 50 * 60 * 1000, // 50 minutes
};

// Storage Keys for AsyncStorage
export const STORAGE_KEYS = {
    AUTH_TOKEN: '@storyteller_auth_token',
    REFRESH_TOKEN: '@storyteller_refresh_token',
    USER_PROFILE: '@storyteller_user_profile',
    AUDIO_SETTINGS: '@storyteller_audio_settings',
    THEME_PREFERENCE: '@storyteller_theme',
    LAST_STORY_ID: '@storyteller_last_story',
    STORY_CACHE: '@storyteller_story_cache',
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
    TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    STORY_GENERATION_ERROR: 'Failed to generate story. Please try again.',
    STORY_NOT_FOUND: 'Story not found or no longer available.',
    AUDIO_LOAD_ERROR: 'Failed to load audio. Please try again.',
    IMAGE_LOAD_ERROR: 'Failed to load image. Please try again.',
    PERMISSION_DENIED: 'Permission denied. Please check your access rights.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    INVALID_INPUT: 'Invalid input provided. Please check your data.',
    RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
    STORY_GENERATED: 'Story generated successfully!',
    STORY_DELETED: 'Story deleted successfully!',
    PROFILE_UPDATED: 'Profile updated successfully!',
    SETTINGS_SAVED: 'Settings saved successfully!',
    ACCOUNT_CREATED: 'Account created successfully!',
    SIGNED_IN: 'Welcome back!',
    SIGNED_OUT: 'Signed out successfully!',
    TOKEN_REFRESHED: 'Session refreshed successfully!',
};

// package.json - ADD MISSING DEPENDENCIES (if not already present)
/*
Add these to your package.json dependencies if they're missing:

"dependencies": {
  // ... existing dependencies
  "@react-native-async-storage/async-storage": "^1.21.0",
  "react-native-url-polyfill": "^2.0.0"
}
*/

// types/index.tsx - UPDATED TYPES
export interface User {
    uid: string;
    email: string;
    childName: string;
    childAge: number;
    childInterests: string[];
    storyPrompt: string;
    parentName: string;
    parentPhone?: string;
    childImageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
    signOut: () => Promise<void>;
    updateUserProfile: (userData: Partial<User>) => Promise<void>;
    refreshAuthToken: () => Promise<void>;
    verifyToken: () => Promise<boolean>;
}

export interface Story {
    story_id: string;
    title: string;
    user_prompt: string;
    created_at: string;
    total_scenes: number;
    total_duration: number;
    status: 'completed' | 'processing' | 'failed';
    thumbnail_url?: string;
    scenes?: StoryScene[];
}

export interface StoryScene {
    scene_number: number;
    text: string;
    visual_prompt: string;
    audio_url: string;
    image_url: string;
    start_time: number;
    duration: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    [key: string]: any;
}

// Server Setup Checklist
/*
SERVER SETUP CHECKLIST:

1. ✅ Ensure your FastAPI server is running on https://stserver-lrr8.onrender.com
2. ✅ Make sure these endpoints are working:
   - POST /auth/signup
   - POST /auth/signin  
   - POST /auth/register
   - POST /auth/verify-token
   - GET /auth/profile/{token}
   - PUT /auth/profile
   - POST /auth/refresh-token
   - POST /auth/signout
   - POST /stories/generate
   - GET /stories/fetch/{story_id}
   - GET /stories/user/{token}
   - DELETE /stories/user/{token}/story/{story_id}
   - POST /stories/system-prompt
   - GET /health

3. ✅ Environment Variables Required on Server:
   - OPENAI_API_KEY
   - FIREBASE_CREDENTIALS_PATH
   - FIREBASE_STORAGE_BUCKET
   - FIREBASE_WEB_API_KEY

4. ✅ CORS Configuration:
   - Allow origins: "*" (for development)
   - Allow methods: GET, POST, PUT, DELETE, OPTIONS
   - Allow headers: "*"
   - Allow credentials: true

5. ✅ Firebase Setup:
   - Firebase project created
   - Authentication enabled
   - Firestore database created
   - Storage bucket created
   - Service account key downloaded

CLIENT SETUP CHECKLIST:

1. ✅ Install required dependencies
2. ✅ Update API_CONFIG.BASE_URL to match your server
3. ✅ Test authentication flow
4. ✅ Test story generation
5. ✅ Test story playback
6. ✅ Test token refresh mechanism

TESTING FLOW:

1. Open the app
2. Sign up with a new account
3. Fill in child details
4. Generate a story
5. Wait for story completion (30-60 seconds)
6. Play the story with audio
7. Test logout/login
8. Verify token refresh works automatically

TROUBLESHOOTING:

- Check server logs for API errors
- Check React Native logs for client errors
- Verify CORS headers in network tab
- Check Firebase configuration
- Verify all environment variables are set
- Test API endpoints directly with Postman/curl
*/