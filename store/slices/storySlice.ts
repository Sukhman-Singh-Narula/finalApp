// store/slices/storySlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { storyService, ServerStory, LocalStoryMetadata } from '@/services/storyService';

export interface Story {
  id: string;
  title: string;
  description: string;
  content: string;
  generatedTime: string;
  systemPrompt: string;
  isPlaying?: boolean;
  currentPosition?: number;
  scenes?: any[];
  duration?: number;
  status?: 'processing' | 'completed' | 'failed';
  thumbnail?: string;
}

interface StoryState {
  stories: Story[];
  currentStory: Story | null;
  serverStory: ServerStory | null;
  isGenerating: boolean;
  isLoadingStories: boolean;
  generationProgress: string;
  error: string | null;
}

const initialState: StoryState = {
  stories: [],
  currentStory: null,
  serverStory: null,
  isGenerating: false,
  isLoadingStories: false,
  generationProgress: '',
  error: null,
};

// Convert LocalStoryMetadata to Story format for compatibility
function convertLocalToStory(local: LocalStoryMetadata): Story {
  return {
    id: local.id,
    title: local.title,
    description: local.description,
    content: `Story about: ${local.description}`,
    generatedTime: local.generatedTime,
    systemPrompt: '',
    duration: local.duration,
    status: local.status,
    thumbnail: local.thumbnail,
  };
}

// Convert ServerStory to Story format
function convertServerToStory(server: ServerStory): Story {
  const content = server.scenes.map((scene, index) =>
    `Scene ${index + 1}: ${scene.text}`
  ).join('\n\n');

  return {
    id: server.story_id,
    title: server.title,
    description: server.user_prompt,
    content: content,
    generatedTime: server.generated_at,
    systemPrompt: '',
    scenes: server.scenes,
    duration: server.total_duration,
    status: server.status,
    thumbnail: server.scenes[0]?.image_url,
  };
}

// Async thunks
export const generateStoryAsync = createAsyncThunk(
  'stories/generateStoryAsync',
  async ({
    firebase_token,
    prompt
  }: {
    firebase_token: string;
    prompt: string;
  }, { rejectWithValue, dispatch }) => {
    try {
      // Start story generation
      const { story_id } = await storyService.generateStory(firebase_token, prompt);

      // Poll for completion with progress updates
      const completedStory = await storyService.pollStoryCompletion(
        story_id,
        (status) => {
          dispatch(setGenerationProgress(status));
        }
      );

      return {
        story_id,
        serverStory: completedStory,
        localStory: convertServerToStory(completedStory),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Story generation failed');
    }
  }
);

export const loadUserStories = createAsyncThunk(
  'stories/loadUserStories',
  async (firebase_token: string, { rejectWithValue }) => {
    try {
      const localStories = await storyService.getUserStories(firebase_token);
      return localStories.map(convertLocalToStory);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load stories');
    }
  }
);

export const loadStoryDetails = createAsyncThunk(
  'stories/loadStoryDetails',
  async (story_id: string, { rejectWithValue }) => {
    try {
      const serverStory = await storyService.getStoryDetails(story_id);
      return {
        serverStory,
        localStory: convertServerToStory(serverStory),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load story details');
    }
  }
);

export const refreshStories = createAsyncThunk(
  'stories/refreshStories',
  async (firebase_token: string, { rejectWithValue }) => {
    try {
      // Force refresh from server
      const localStories = await storyService.getUserStories(firebase_token);
      return localStories.map(convertLocalToStory);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh stories');
    }
  }
);

const storySlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    generateStoryStart: (state) => {
      state.isGenerating = true;
      state.error = null;
      state.generationProgress = 'Starting story generation...';
    },
    generateStorySuccess: (state, action: PayloadAction<Story>) => {
      state.stories.unshift(action.payload);
      state.isGenerating = false;
      state.error = null;
      state.generationProgress = '';
    },
    generateStoryFailure: (state, action: PayloadAction<string>) => {
      state.isGenerating = false;
      state.error = action.payload;
      state.generationProgress = '';
    },
    setGenerationProgress: (state, action: PayloadAction<string>) => {
      state.generationProgress = action.payload;
    },
    setCurrentStory: (state, action: PayloadAction<Story>) => {
      state.currentStory = action.payload;
    },
    setCurrentServerStory: (state, action: PayloadAction<ServerStory>) => {
      state.serverStory = action.payload;
      state.currentStory = convertServerToStory(action.payload);
    },
    updateStoryPlayback: (state, action: PayloadAction<{ id: string; isPlaying: boolean; currentPosition?: number }>) => {
      const { id, isPlaying, currentPosition } = action.payload;
      const story = state.stories.find(s => s.id === id);
      if (story) {
        story.isPlaying = isPlaying;
        if (currentPosition !== undefined) {
          story.currentPosition = currentPosition;
        }
      }
      if (state.currentStory?.id === id) {
        state.currentStory.isPlaying = isPlaying;
        if (currentPosition !== undefined) {
          state.currentStory.currentPosition = currentPosition;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearGenerationProgress: (state) => {
      state.generationProgress = '';
    },
    addStoryToList: (state, action: PayloadAction<Story>) => {
      // Add story to the beginning of the list if it doesn't exist
      const existingIndex = state.stories.findIndex(s => s.id === action.payload.id);
      if (existingIndex === -1) {
        state.stories.unshift(action.payload);
      } else {
        // Update existing story
        state.stories[existingIndex] = action.payload;
      }
    },
    updateStoryStatus: (state, action: PayloadAction<{ id: string; status: 'processing' | 'completed' | 'failed' }>) => {
      const { id, status } = action.payload;
      const story = state.stories.find(s => s.id === id);
      if (story) {
        story.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    // Generate story async
    builder
      .addCase(generateStoryAsync.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
        state.generationProgress = 'Starting story generation...';
      })
      .addCase(generateStoryAsync.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.error = null;
        state.generationProgress = '';
        state.serverStory = action.payload.serverStory;

        // Add or update story in list
        const existingIndex = state.stories.findIndex(s => s.id === action.payload.story_id);
        if (existingIndex === -1) {
          state.stories.unshift(action.payload.localStory);
        } else {
          state.stories[existingIndex] = action.payload.localStory;
        }
      })
      .addCase(generateStoryAsync.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
        state.generationProgress = '';
      });

    // Load user stories
    builder
      .addCase(loadUserStories.pending, (state) => {
        state.isLoadingStories = true;
        state.error = null;
      })
      .addCase(loadUserStories.fulfilled, (state, action) => {
        state.isLoadingStories = false;
        state.stories = action.payload;
      })
      .addCase(loadUserStories.rejected, (state, action) => {
        state.isLoadingStories = false;
        state.error = action.payload as string;
      });

    // Load story details
    builder
      .addCase(loadStoryDetails.pending, (state) => {
        state.isLoadingStories = true;
      })
      .addCase(loadStoryDetails.fulfilled, (state, action) => {
        state.isLoadingStories = false;
        state.serverStory = action.payload.serverStory;
        state.currentStory = action.payload.localStory;
      })
      .addCase(loadStoryDetails.rejected, (state, action) => {
        state.isLoadingStories = false;
        state.error = action.payload as string;
      });

    // Refresh stories
    builder
      .addCase(refreshStories.pending, (state) => {
        // Don't set loading state for refresh to avoid UI flicker
      })
      .addCase(refreshStories.fulfilled, (state, action) => {
        state.stories = action.payload;
      })
      .addCase(refreshStories.rejected, (state, action) => {
        // Silent fail for refresh
        console.warn('Stories refresh failed:', action.payload);
      });
  },
});

export const {
  generateStoryStart,
  generateStorySuccess,
  generateStoryFailure,
  setGenerationProgress,
  setCurrentStory,
  setCurrentServerStory,
  updateStoryPlayback,
  clearError,
  clearGenerationProgress,
  addStoryToList,
  updateStoryStatus,
} = storySlice.actions;

export default storySlice.reducer;