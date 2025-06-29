import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Story {
  id: string;
  title: string;
  description: string;
  content: string;
  generatedTime: string;
  systemPrompt: string;
  isPlaying?: boolean;
  currentPosition?: number;
}

interface StoryState {
  stories: Story[];
  currentStory: Story | null;
  isGenerating: boolean;
  error: string | null;
}

const initialState: StoryState = {
  stories: [],
  currentStory: null,
  isGenerating: false,
  error: null,
};

const storySlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    generateStoryStart: (state) => {
      state.isGenerating = true;
      state.error = null;
    },
    generateStorySuccess: (state, action: PayloadAction<Story>) => {
      state.stories.unshift(action.payload);
      state.isGenerating = false;
      state.error = null;
    },
    generateStoryFailure: (state, action: PayloadAction<string>) => {
      state.isGenerating = false;
      state.error = action.payload;
    },
    setCurrentStory: (state, action: PayloadAction<Story>) => {
      state.currentStory = action.payload;
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
  },
});

export const {
  generateStoryStart,
  generateStorySuccess,
  generateStoryFailure,
  setCurrentStory,
  updateStoryPlayback,
  clearError,
} = storySlice.actions;

export default storySlice.reducer;