// constants/index.ts

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
    USER_PROFILE: '@storyteller_user_profile',
    AUDIO_SETTINGS: '@storyteller_audio_settings',
    THEME_PREFERENCE: '@storyteller_theme',
    LAST_STORY_ID: '@storyteller_last_story',
    STORY_CACHE: '@storyteller_story_cache',
};

// App Configuration
export const APP_CONFIG = {
    MAX_STORY_SCENES: 6,
    MIN_STORY_SCENES: 3,
    AUDIO_FORMAT: 'mp3',
    IMAGE_SIZE: '960x540',
    SUPPORTED_AUDIO_FORMATS: ['mp3', 'wav', 'm4a', 'aac'],
    SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    MAX_CONCURRENT_STORIES: 3,
    STORY_GENERATION_TIMEOUT: 120000, // 2 minutes
};

// Pagination Settings
export const PAGINATION = {
    STORIES_PER_PAGE: 20,
    MAX_STORIES_PER_REQUEST: 50,
    LOAD_MORE_THRESHOLD: 0.5,
    INITIAL_LOAD_COUNT: 10,
};

// Audio Player Configuration
export const AUDIO_CONFIG = {
    INITIAL_VOLUME: 1.0,
    FADE_DURATION: 1000, // 1 second
    POSITION_UPDATE_INTERVAL: 100, // 100ms
    BUFFER_SIZE: 8192,
    MAX_RETRY_ATTEMPTS: 3,
    SEEK_STEP: 10000, // 10 seconds
    AUTO_PLAY_NEXT: true,
};

// Story Generation Settings
export const STORY_CONFIG = {
    MIN_PROMPT_LENGTH: 10,
    MAX_PROMPT_LENGTH: 500,
    MIN_SYSTEM_PROMPT_LENGTH: 20,
    MAX_SYSTEM_PROMPT_LENGTH: 1000,
    MIN_CHILD_AGE: 2,
    MAX_CHILD_AGE: 18,
    MAX_INTERESTS: 10,
    MIN_SCENE_DURATION: 5000, // 5 seconds
    MAX_SCENE_DURATION: 60000, // 1 minute
    DEFAULT_STORY_PROMPT: "Create a magical adventure story that teaches important values and life lessons.",
    GENERATION_STATUSES: {
        PROCESSING: 'processing',
        COMPLETED: 'completed',
        FAILED: 'failed',
        PENDING: 'pending',
    } as const,
};

// Theme Colors
export const COLORS = {
    PRIMARY: '#FF69B4', // Hot Pink
    SECONDARY: '#DDA0DD', // Plum
    ACCENT: '#FFB6C1', // Light Pink
    BACKGROUND: '#FFF0F5', // Lavender Blush
    GRADIENT_START: '#FFE4E1', // Misty Rose
    GRADIENT_MIDDLE: '#E6E6FA', // Lavender
    GRADIENT_END: '#F0F8FF', // Alice Blue
    
    // Status Colors
    SUCCESS: '#4ECDC4', // Turquoise
    ERROR: '#FF6B6B', // Coral Red
    WARNING: '#FFE66D', // Yellow
    PROCESSING: '#FFA726', // Orange
    
    // Text Colors
    TEXT_PRIMARY: '#333333',
    TEXT_SECONDARY: '#8B7D8B',
    TEXT_LIGHT: '#C8A2C8',
    TEXT_WHITE: '#FFFFFF',
    
    // UI Colors
    CARD_BACKGROUND: 'rgba(255, 255, 255, 0.9)',
    CARD_BORDER: 'rgba(221, 160, 221, 0.3)',
    INPUT_BORDER: 'rgba(221, 160, 221, 0.5)',
    SHADOW_COLOR: '#000000',
    
    // Status Badge Colors
    STATUS_COMPLETED: '#4ECDC4',
    STATUS_PROCESSING: '#FFE66D',
    STATUS_FAILED: '#FF6B6B',
    STATUS_PENDING: '#DDA0DD',
};

// Screen Dimensions & Layout
export const LAYOUT = {
    HEADER_HEIGHT: 80,
    TAB_BAR_HEIGHT: 70,
    PLAYER_CONTROL_HEIGHT: 100,
    SAFE_AREA_TOP: 44,
    SAFE_AREA_BOTTOM: 34,
    CARD_BORDER_RADIUS: 15,
    BUTTON_BORDER_RADIUS: 20,
    INPUT_BORDER_RADIUS: 12,
    IMAGE_BORDER_RADIUS: 10,
    STORY_CARD_HEIGHT: 120,
    PROFILE_IMAGE_SIZE: 120,
    THUMBNAIL_SIZE: 80,
    ICON_SIZE_SMALL: 16,
    ICON_SIZE_MEDIUM: 20,
    ICON_SIZE_LARGE: 24,
};

// Animation Durations (in milliseconds)
export const ANIMATION = {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
    LOADING: 1000,
    FADE_IN: 300,
    FADE_OUT: 200,
    SLIDE_IN: 250,
    SLIDE_OUT: 200,
    BOUNCE: 600,
    SPRING: 400,
};

// Font Families
export const FONTS = {
    REGULAR: 'Nunito-Regular',
    SEMIBOLD: 'Nunito-SemiBold',
    BOLD: 'Nunito-Bold',
};

// Font Sizes
export const FONT_SIZES = {
    TINY: 10,
    SMALL: 12,
    MEDIUM: 14,
    LARGE: 16,
    XLARGE: 18,
    XXLARGE: 20,
    HUGE: 24,
    TITLE: 28,
    HEADER: 32,
    DISPLAY: 36,
};

// Spacing Scale
export const SPACING = {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    XXL: 24,
    XXXL: 32,
    HUGE: 40,
    SCREEN_HORIZONTAL: 20,
    SCREEN_VERTICAL: 20,
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    AUDIO_LOAD_ERROR: 'Failed to load audio. Please try again.',
    IMAGE_LOAD_ERROR: 'Failed to load image. Please try again.',
    STORY_GENERATION_ERROR: 'Failed to generate story. Please try again.',
    STORY_NOT_FOUND: 'Story not found or no longer available.',
    PERMISSION_DENIED: 'Permission denied. Please check your access rights.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
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
    PASSWORD_CHANGED: 'Password changed successfully!',
    EMAIL_VERIFIED: 'Email verified successfully!',
};

// Validation Rules
export const VALIDATION = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 50,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    NAME_REGEX: /^[a-zA-Z\s'-]+$/,
    CHILD_NAME_REGEX: /^[a-zA-Z\s'-]+$/,
    INTERESTS_MAX_COUNT: 10,
    INTEREST_MAX_LENGTH: 30,
};

// Story Generation Prompts
export const DEFAULT_PROMPTS = {
    SYSTEM_PROMPT: `You are a creative children's storyteller. Create engaging, age-appropriate stories that are educational and fun. 
Structure your story into clear scenes that can be visualized. Each scene should be 2-3 sentences long and paint a vivid picture.
Keep the language simple and appropriate for children aged 4-10.`,
    
    STORY_STARTERS: [
        "Tell me about a brave princess who...",
        "Create a story about a magical forest where...",
        "Write about a young explorer who discovers...",
        "Tell a tale of friendship between...",
        "Create an adventure story about...",
        "Write about a child who can talk to animals...",
        "Tell me about a magical school where...",
        "Create a story about a time-traveling adventure...",
    ],
    
    VISUAL_PROMPT_PREFIX: "Children's book illustration style, colorful and friendly, high quality digital art: ",
};

// Feature Flags
export const FEATURES = {
    OFFLINE_MODE: false,
    VOICE_RECORDING: false,
    SOCIAL_SHARING: false,
    PREMIUM_FEATURES: false,
    ANALYTICS: true,
    CRASH_REPORTING: true,
    PUSH_NOTIFICATIONS: false,
    BACKGROUND_AUDIO: false,
    AUTO_PLAY: true,
    STORY_RECOMMENDATIONS: false,
};

// Development Settings
export const DEV_CONFIG = {
    ENABLE_LOGS: __DEV__,
    ENABLE_DEBUG_OVERLAY: __DEV__,
    MOCK_API_RESPONSES: false,
    SKIP_AUTH: false,
    FAST_STORY_GENERATION: false,
    ENABLE_DEV_MENU: __DEV__,
};

// Platform Detection
export const PLATFORM = {
    IS_IOS: require('react-native').Platform.OS === 'ios',
    IS_ANDROID: require('react-native').Platform.OS === 'android',
    IS_WEB: require('react-native').Platform.OS === 'web',
};

// Image Configuration
export const IMAGE_CONFIG = {
    QUALITY: 0.8,
    MAX_WIDTH: 1024,
    MAX_HEIGHT: 1024,
    COMPRESSION_QUALITY: 0.7,
    THUMBNAIL_SIZE: 200,
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
};

// Network Configuration
export const NETWORK = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    CONNECTION_TIMEOUT: 30000,
    READ_TIMEOUT: 60000,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
};

// Export all constants as a single object for convenience
export const CONSTANTS = {
    API_CONFIG,
    STORAGE_KEYS,
    APP_CONFIG,
    PAGINATION,
    AUDIO_CONFIG,
    STORY_CONFIG,
    COLORS,
    LAYOUT,
    ANIMATION,
    FONTS,
    FONT_SIZES,
    SPACING,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    VALIDATION,
    DEFAULT_PROMPTS,
    FEATURES,
    DEV_CONFIG,
    PLATFORM,
    IMAGE_CONFIG,
    NETWORK,
} as const;

// Type exports for better TypeScript support
export type StoryStatus = typeof STORY_CONFIG.GENERATION_STATUSES[keyof typeof STORY_CONFIG.GENERATION_STATUSES];
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type ColorKey = keyof typeof COLORS;
export type FontSize = typeof FONT_SIZES[keyof typeof FONT_SIZES];
export type SpacingSize = typeof SPACING[keyof typeof SPACING];