// hooks/useTokenManager.tsx - FIXED WITH CORRECT EXTENSION
import React, { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/apiService';
import { Alert, AppState } from 'react-native';

interface UseTokenManagerOptions {
  checkOnAppForeground?: boolean;
  autoRefreshBeforeExpiry?: boolean;
  showExpirationAlert?: boolean;
}

export function useTokenManager(options: UseTokenManagerOptions = {}) {
  const {
    checkOnAppForeground = true,
    autoRefreshBeforeExpiry = true,
    showExpirationAlert = true,
  } = options;

  const { token, refreshToken, verifyToken, refreshAuthToken, signOut } = useAuth();
  const verificationTimeoutRef = useRef<NodeJS.Timeout>();
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const lastVerificationRef = useRef<number>(0);

  // Verify token validity
  const verifyCurrentToken = useCallback(async (): Promise<boolean> => {
    if (!token) {
      console.log('🔍 No token to verify');
      return false;
    }

    try {
      console.log('🔍 Verifying current token...');
      const isValid = await verifyToken();
      
      if (isValid) {
        console.log('✅ Token is valid');
        lastVerificationRef.current = Date.now();
        return true;
      } else {
        console.log('❌ Token is invalid');
        return false;
      }
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return false;
    }
  }, [token, verifyToken]);

  // Attempt to refresh token
  const attemptTokenRefresh = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
      console.log('🔄 No refresh token available');
      return false;
    }

    try {
      console.log('🔄 Attempting to refresh token...');
      await refreshAuthToken();
      console.log('✅ Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }, [refreshToken, refreshAuthToken]);

  // Handle token expiration
  const handleTokenExpiration = useCallback(async () => {
    console.log('⚠️ Handling token expiration...');

    // Try to refresh the token first
    const refreshSuccess = await attemptTokenRefresh();
    
    if (refreshSuccess) {
      console.log('✅ Token refreshed, continuing session');
      return;
    }

    // If refresh fails, show alert and sign out
    if (showExpirationAlert) {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please sign in again.',
        [
          {
            text: 'Sign In',
            onPress: () => {
              signOut();
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      await signOut();
    }
  }, [attemptTokenRefresh, showExpirationAlert, signOut]);

  // Check token status and handle accordingly
  const checkTokenStatus = useCallback(async () => {
    if (!token) return;

    // Don't check too frequently (minimum 30 seconds between checks)
    const now = Date.now();
    if (now - lastVerificationRef.current < 30000) {
      return;
    }

    const isValid = await verifyCurrentToken();
    
    if (!isValid) {
      await handleTokenExpiration();
    }
  }, [token, verifyCurrentToken, handleTokenExpiration]);

  // Set up automatic token refresh (50 minutes interval)
  useEffect(() => {
    if (!token || !refreshToken || !autoRefreshBeforeExpiry) return;

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Set up automatic refresh 10 minutes before expected expiry (50 minutes)
    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('🔄 Auto-refreshing token before expiry...');
      const success = await attemptTokenRefresh();
      
      if (!success) {
        console.log('❌ Auto-refresh failed, will handle on next API call');
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [token, refreshToken, autoRefreshBeforeExpiry, attemptTokenRefresh]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    if (!checkOnAppForeground) return;

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active, checking token status...');
        
        // Debounce token check when app becomes active
        if (verificationTimeoutRef.current) {
          clearTimeout(verificationTimeoutRef.current);
        }

        verificationTimeoutRef.current = setTimeout(() => {
          checkTokenStatus();
        }, 1000); // Wait 1 second after app becomes active
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, [checkOnAppForeground, checkTokenStatus]);

  // API call wrapper with automatic token refresh
  const apiCallWithTokenRefresh = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    try {
      // Attempt the API call
      return await apiCall();
    } catch (error: any) {
      // Check if error is related to token expiry
      const errorMessage = error.message?.toLowerCase() || '';
      const isTokenError = errorMessage.includes('token') || 
                          errorMessage.includes('unauthorized') || 
                          errorMessage.includes('expired') ||
                          error.status === 401;

      if (isTokenError) {
        console.log('🔄 API call failed with token error, attempting refresh...');
        
        const refreshSuccess = await attemptTokenRefresh();
        
        if (refreshSuccess) {
          console.log('✅ Token refreshed, retrying API call...');
          // Retry the API call with the new token
          return await apiCall();
        } else {
          console.log('❌ Token refresh failed, handling expiration...');
          await handleTokenExpiration();
          throw error;
        }
      }

      // If not a token error, re-throw the original error
      throw error;
    }
  }, [attemptTokenRefresh, handleTokenExpiration]);

  // Manual token verification (for UI components)
  const manualTokenCheck = useCallback(async (): Promise<boolean> => {
    return await verifyCurrentToken();
  }, [verifyCurrentToken]);

  // Force token refresh (for UI components)
  const forceTokenRefresh = useCallback(async (): Promise<boolean> => {
    return await attemptTokenRefresh();
  }, [attemptTokenRefresh]);

  return {
    // Status
    hasToken: !!token,
    hasRefreshToken: !!refreshToken,
    
    // Actions
    checkTokenStatus,
    manualTokenCheck,
    forceTokenRefresh,
    apiCallWithTokenRefresh,
    
    // Utils
    isTokenValid: verifyCurrentToken,
    handleExpiration: handleTokenExpiration,
  };
}

// Higher-order component for automatic token management
export function withTokenManagement<P extends object>(
  Component: React.ComponentType<P>,
  options?: UseTokenManagerOptions
) {
  return function TokenManagedComponent(props: P) {
    useTokenManager(options);
    return <Component {...props} />;
  };
}