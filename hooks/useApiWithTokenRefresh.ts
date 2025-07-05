// hooks/useApiWithTokenRefresh.ts - ENHANCED API WRAPPER
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/apiService';
import { Alert } from 'react-native';

interface ApiCallOptions {
  showErrorAlert?: boolean;
  retryOnTokenRefresh?: boolean;
  customErrorHandler?: (error: any) => void;
}

export function useApiWithTokenRefresh() {
  const { token, refreshAuthToken, signOut } = useAuth();

  const executeApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: ApiCallOptions = {}
  ): Promise<T> => {
    const {
      showErrorAlert = true,
      retryOnTokenRefresh = true,
      customErrorHandler
    } = options;

    try {
      // First attempt
      console.log('🌐 Executing API call...');
      return await apiCall();
    } catch (error: any) {
      console.error('❌ API call failed:', error);

      // Check if it's a token-related error
      const isTokenError = isTokenRelatedError(error);

      if (isTokenError && retryOnTokenRefresh) {
        console.log('🔄 Token error detected, attempting refresh...');
        
        try {
          await refreshAuthToken();
          console.log('✅ Token refreshed, retrying API call...');
          
          // Retry the API call with the new token
          return await apiCall();
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          
          // If token refresh fails, sign out the user
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please sign in again.',
            [
              {
                text: 'Sign In',
                onPress: () => signOut(),
              },
            ],
            { cancelable: false }
          );
          
          throw refreshError;
        }
      }

      // Handle the error based on options
      if (customErrorHandler) {
        customErrorHandler(error);
      } else if (showErrorAlert) {
        showDefaultErrorAlert(error);
      }

      throw error;
    }
  }, [token, refreshAuthToken, signOut]);

  // Specific API methods with automatic token refresh
  const api = {
    // Story methods
    generateStory: useCallback(async (prompt: string, options?: ApiCallOptions) => {
      return executeApiCall(
        () => apiService.generateStory(prompt, token!),
        options
      );
    }, [executeApiCall, token]),

    getUserStories: useCallback(async (limit?: number, offset?: number, options?: ApiCallOptions) => {
      return executeApiCall(
        () => apiService.getUserStories(token!, limit, offset),
        options
      );
    }, [executeApiCall, token]),

    fetchStoryStatus: useCallback(async (storyId: string, options?: ApiCallOptions) => {
      return executeApiCall(
        () => apiService.fetchStoryStatus(storyId),
        options
      );
    }, [executeApiCall]),

    deleteStory: useCallback(async (storyId: string, options?: ApiCallOptions) => {
      return executeApiCall(
        () => apiService.deleteUserStory(storyId, token!),
        options
      );
    }, [executeApiCall, token]),

    updateSystemPrompt: useCallback(async (systemPrompt: string, options?: ApiCallOptions) => {
      return executeApiCall(
        () => apiService.updateSystemPrompt(systemPrompt, token!),
        options
      );
    }, [executeApiCall, token]),

    // Profile methods
    updateProfile: useCallback(async (updateData: any, options?: ApiCallOptions) => {
      return executeApiCall(
        () => apiService.updateUserProfile(updateData),
        options
      );
    }, [executeApiCall]),

    // Generic API call wrapper
    call: executeApiCall,
  };

  return api;
}

// Helper function to determine if an error is token-related
function isTokenRelatedError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorStatus = error.status || error.statusCode;

  // Check status codes
  if (errorStatus === 401 || errorStatus === 403) {
    return true;
  }

  // Check error messages
  const tokenErrorKeywords = [
    'token',
    'unauthorized',
    'expired',
    'invalid',
    'authentication',
    'forbidden',
    'session'
  ];

  return tokenErrorKeywords.some(keyword => 
    errorMessage.includes(keyword)
  );
}

// Helper function to show user-friendly error alerts
function showDefaultErrorAlert(error: any) {
  let title = 'Error';
  let message = 'Something went wrong. Please try again.';

  if (error.message) {
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('network') || errorMsg.includes('connection')) {
      title = 'Connection Error';
      message = 'Please check your internet connection and try again.';
    } else if (errorMsg.includes('server') || errorMsg.includes('500')) {
      title = 'Server Error';
      message = 'Our servers are having issues. Please try again in a moment.';
    } else if (errorMsg.includes('timeout')) {
      title = 'Request Timeout';
      message = 'The request took too long. Please try again.';
    } else {
      message = error.message;
    }
  }

  Alert.alert(title, message, [{ text: 'OK' }]);
}

// Example usage in components:
/*
import { useApiWithTokenRefresh } from '@/hooks/useApiWithTokenRefresh';

function MyComponent() {
  const api = useApiWithTokenRefresh();

  const handleGenerateStory = async () => {
    try {
      const result = await api.generateStory(prompt, {
        showErrorAlert: true,
        retryOnTokenRefresh: true,
      });
      
      // Handle success
      console.log('Story generated:', result);
    } catch (error) {
      // Error is already handled by the wrapper
      console.log('Story generation failed');
    }
  };

  const handleCustomApiCall = async () => {
    try {
      const result = await api.call(
        () => apiService.someCustomMethod(),
        {
          showErrorAlert: false,
          customErrorHandler: (error) => {
            // Custom error handling
            console.log('Custom error handler:', error);
          }
        }
      );
    } catch (error) {
      // Handle error
    }
  };

  return (
    // Your component JSX
  );
}
*/