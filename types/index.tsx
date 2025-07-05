export interface User {
    uid: string;
    email: string;
    childName: string;
    childAge: number;
    childInterests: string[];
    storyPrompt: string;
    childImageUrl?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
    signOut: () => Promise<void>;
    updateUserProfile: (userData: Partial<User>) => Promise<void>;
    refreshToken: () => Promise<void>;
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