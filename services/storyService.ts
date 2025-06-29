// services/storyService.ts
import { API_CONFIG, StoryApiResponse } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ServerStory {
  story_id: string;
  title: string;
  user_prompt: string;
  total_scenes: number;
  total_duration: number;
  scenes: StoryScene[];
  status: 'processing' | 'completed' | 'failed';
  generated_at: string;
  optimizations?: string[];
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

export interface LocalStoryMetadata {
  id: string;
  title: string;
  description: string;
  generatedTime: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed';
  thumbnail?: string;
}

class StoryServiceClass {
  private readonly STORAGE_KEY = 'user_stories';

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
      console.log(`🌐 Story API request to: ${url}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        timeout: API_CONFIG.TIMEOUT,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Story API Error:`, error);
      throw error;
    }
  }

  async generateStory(firebase_token: string, prompt: string): Promise<{ story_id: string; status: string }> {
    const response: StoryApiResponse = await this.makeRequest(API_CONFIG.ENDPOINTS.GENERATE_STORY, {
      method: 'POST',
      body: JSON.stringify({
        firebase_token,
        prompt,
      }),
    });

    if (response.success && response.story_id) {
      // Save initial story metadata locally
      await this.saveLocalStoryMetadata({
        id: response.story_id,
        title: 'Generating...',
        description: prompt,
        generatedTime: new Date().toISOString(),
        duration: 0,
        status: 'processing',
      });

      return {
        story_id: response.story_id,
        status: response.status || 'processing',
      };
    } else {
      throw new Error(response.message || 'Failed to start story generation');
    }
  }

  async checkStoryStatus(story_id: string): Promise<StoryApiResponse> {
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.FETCH_STORY}/${story_id}`);
  }

  async pollStoryCompletion(story_id: string, onProgress?: (status: string) => void): Promise<ServerStory> {
    const maxAttempts = 20; // 5 minutes max (15 seconds * 20)
    const pollInterval = 15000; // 15 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📡 Polling story ${story_id} - Attempt ${attempt}/${maxAttempts}`);

        const response = await this.checkStoryStatus(story_id);

        if (response.success && response.story) {
          // Story completed successfully
          const serverStory = this.convertServerStoryFormat(response.story);

          // Update local metadata
          await this.saveLocalStoryMetadata({
            id: story_id,
            title: serverStory.title,
            description: response.story.user_prompt || '',
            generatedTime: serverStory.generated_at,
            duration: serverStory.total_duration,
            status: 'completed',
            thumbnail: serverStory.scenes[0]?.image_url,
          });

          return serverStory;
        } else if (response.status === 'failed') {
          // Story generation failed
          await this.updateLocalStoryStatus(story_id, 'failed');
          throw new Error(response.message || 'Story generation failed');
        } else {
          // Still processing
          onProgress?.(response.status || 'processing');

          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        }
      } catch (error) {
        console.error(`❌ Error polling story ${story_id}:`, error);

        if (attempt === maxAttempts) {
          await this.updateLocalStoryStatus(story_id, 'failed');
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    // Polling timed out
    await this.updateLocalStoryStatus(story_id, 'failed');
    throw new Error('Story generation timed out');
  }

  async getUserStories(firebase_token: string): Promise<LocalStoryMetadata[]> {
    try {
      // Try to get fresh data from server
      const response = await this.makeRequest(`${API_CONFIG.ENDPOINTS.LIST_STORIES}/${firebase_token}`);

      if (response.stories) {
        // Convert server stories to local format and save
        const localStories: LocalStoryMetadata[] = response.stories.map((story: any) => ({
          id: story.story_id,
          title: story.title,
          description: story.user_prompt || '',
          generatedTime: story.created_at || story.generated_at,
          duration: story.total_duration || 0,
          status: story.status || 'completed',
          thumbnail: story.thumbnail_url,
        }));

        await this.saveAllLocalStories(localStories);
        return localStories;
      }
    } catch (error) {
      console.warn('Failed to fetch stories from server, using local cache:', error);
    }

    // Fallback to local storage
    return this.getLocalStories();
  }

  async getStoryDetails(story_id: string): Promise<ServerStory> {
    const response = await this.makeRequest(`${API_CONFIG.ENDPOINTS.STORY_DETAILS}/${story_id}`);

    if (response.success && response.story) {
      return this.convertServerStoryFormat(response.story);
    } else {
      throw new Error('Story not found');
    }
  }

  // Local storage methods
  async getLocalStories(): Promise<LocalStoryMetadata[]> {
    try {
      const storiesJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      return storiesJson ? JSON.parse(storiesJson) : [];
    } catch (error) {
      console.error('Error loading local stories:', error);
      return [];
    }
  }

  async saveLocalStoryMetadata(story: LocalStoryMetadata): Promise<void> {
    try {
      const stories = await this.getLocalStories();
      const existingIndex = stories.findIndex(s => s.id === story.id);

      if (existingIndex >= 0) {
        stories[existingIndex] = story;
      } else {
        stories.unshift(story); // Add to beginning
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(stories));
    } catch (error) {
      console.error('Error saving local story metadata:', error);
    }
  }

  async saveAllLocalStories(stories: LocalStoryMetadata[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(stories));
    } catch (error) {
      console.error('Error saving all local stories:', error);
    }
  }

  async updateLocalStoryStatus(story_id: string, status: 'processing' | 'completed' | 'failed'): Promise<void> {
    try {
      const stories = await this.getLocalStories();
      const story = stories.find(s => s.id === story_id);

      if (story) {
        story.status = status;
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(stories));
      }
    } catch (error) {
      console.error('Error updating local story status:', error);
    }
  }

  private convertServerStoryFormat(serverStory: any): ServerStory {
    return {
      story_id: serverStory.story_id,
      title: serverStory.title,
      user_prompt: serverStory.user_prompt,
      total_scenes: serverStory.total_scenes || serverStory.scenes?.length || 0,
      total_duration: serverStory.total_duration || 0,
      scenes: serverStory.scenes || [],
      status: serverStory.status || 'completed',
      generated_at: serverStory.generated_at || serverStory.created_at,
      optimizations: serverStory.optimizations || [],
    };
  }
}

export const storyService = new StoryServiceClass();