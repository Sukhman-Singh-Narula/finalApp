// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import storySlice from './slices/storySlice';

// Persist configuration for auth slice
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['isAuthenticated', 'user', 'firebase_token'], // Only persist essential auth data
  blacklist: ['isLoading', 'error'], // Don't persist loading states and errors
};

// Persist configuration for stories slice
const storiesPersistConfig = {
  key: 'stories',
  storage: AsyncStorage,
  whitelist: ['stories'], // Only persist the stories array
  blacklist: ['isGenerating', 'isLoadingStories', 'generationProgress', 'error', 'currentStory', 'serverStory'], // Don't persist temporary states
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authSlice);
const persistedStoriesReducer = persistReducer(storiesPersistConfig, storySlice);

// Root reducer
const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  stories: persistedStoriesReducer,
});

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/FLUSH',
          'persist/PAUSE',
          'persist/PURGE',
        ],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: __DEV__, // Enable Redux DevTools in development
});

// Create persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Utility functions for store management
export const clearPersistedData = async () => {
  try {
    await AsyncStorage.multiRemove(['persist:auth', 'persist:stories']);
    console.log('✅ Persisted data cleared');
  } catch (error) {
    console.error('❌ Error clearing persisted data:', error);
  }
};

export const getPersistedDataKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const persistedKeys = keys.filter(key => key.startsWith('persist:'));
    return persistedKeys;
  } catch (error) {
    console.error('❌ Error getting persisted keys:', error);
    return [];
  }
};

// Debug function to log store state (development only)
export const logStoreState = () => {
  if (__DEV__) {
    const state = store.getState();
    console.log('🏪 Current store state:', {
      auth: {
        isAuthenticated: state.auth.isAuthenticated,
        user: state.auth.user ? {
          id: state.auth.user.id,
          childName: state.auth.user.childName,
          parentEmail: state.auth.user.parentEmail,
        } : null,
        hasToken: !!state.auth.firebase_token,
      },
      stories: {
        storiesCount: state.stories.stories.length,
        isGenerating: state.stories.isGenerating,
        hasCurrentStory: !!state.stories.currentStory,
        hasServerStory: !!state.stories.serverStory,
      },
    });
  }
};