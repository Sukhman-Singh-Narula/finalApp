// contexts/AuthContext.tsx - UPDATED VERSION
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { apiService } from '../services/apiService';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Auto-refresh token every 50 minutes
  useEffect(() => {
    if (token && refreshToken) {
      const interval = setInterval(() => {
        refreshAuthToken().catch(console.error);
      }, 50 * 60 * 1000); // 50 minutes

      return () => clearInterval(interval);
    }
  }, [token, refreshToken]);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        try {
          const isValid = await verifyToken(storedToken);
          if (!isValid) {
            console.log('Stored token invalid, clearing auth');
            await clearAuth();
          }
        } catch (error) {
          console.log('Token verification failed, clearing auth');
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (tokenToVerify?: string): Promise<boolean> => {
    try {
      const currentToken = tokenToVerify || token;
      if (!currentToken) return false;

      const response = await apiService.verifyToken(currentToken);
      return response.success && response.valid;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  const storeAuth = async (authToken: string, refreshToken: string | null, userData: User) => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authToken);
    if (refreshToken) {
      await AsyncStorage.setItem('refresh_token', refreshToken);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userData));
    
    setToken(authToken);
    setRefreshToken(refreshToken);
    setUser(userData);
  };

  const clearAuth = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Signing in user:', email);
      
      // Step 1: Sign in with server
      const signInResponse = await apiService.signIn(email, password);

      if (signInResponse.success && signInResponse.firebase_token) {
        console.log('✅ Sign in successful, fetching profile...');
        
        // Step 2: Get user profile
        const profileResponse = await apiService.getUserProfile(signInResponse.firebase_token);
        
        if (profileResponse.success && profileResponse.profile) {
          // Convert server profile to app user format
          const profile = profileResponse.profile;
          const userData: User = {
            uid: signInResponse.user_info?.uid || profileResponse.user_id || '',
            email: email,
            childName: profile.child?.name || '',
            childAge: profile.child?.age || 0,
            childInterests: profile.child?.interests || [],
            parentName: profile.parent?.name || '',
            parentPhone: profile.parent?.phone_number || '',
            storyPrompt: profile.system_prompt || '',
            createdAt: profile.created_at || new Date().toISOString(),
            updatedAt: profile.updated_at || new Date().toISOString(),
          };
          
          await storeAuth(
            signInResponse.firebase_token, 
            signInResponse.refresh_token || null, 
            userData
          );
        } else {
          throw new Error('Failed to fetch user profile');
        }
      } else {
        throw new Error(signInResponse.message || 'Sign in failed');
      }
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      console.log('📝 Creating new user account:', email);
      
      // Step 1: Create Firebase account
      const signUpResponse = await apiService.signUp(email, password, userData.childName);

      if (signUpResponse.success && signUpResponse.firebase_token) {
        console.log('✅ Firebase account created, creating profile...');
        
        // Step 2: Create user profile
        const registerData = {
          firebase_token: signUpResponse.firebase_token,
          parent: {
            name: userData.parentName || `${userData.childName}'s Parent`,
            email: email,
            phone_number: userData.parentPhone || undefined,
          },
          child: {
            name: userData.childName || '',
            age: userData.childAge || 0,
            interests: userData.childInterests || [],
          },
          system_prompt: userData.storyPrompt || `Create magical stories for ${userData.childName}, age ${userData.childAge}.`,
        };

        const registerResponse = await apiService.registerUserProfile(registerData);

        if (registerResponse.success) {
          console.log('✅ User profile created successfully');
          
          // Convert to app user format
          const newUser: User = {
            uid: signUpResponse.user_info?.uid || registerResponse.user_id || '',
            email: email,
            childName: userData.childName || '',
            childAge: userData.childAge || 0,
            childInterests: userData.childInterests || [],
            parentName: userData.parentName || `${userData.childName}'s Parent`,
            parentPhone: userData.parentPhone || '',
            storyPrompt: userData.storyPrompt || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          await storeAuth(
            signUpResponse.firebase_token, 
            signUpResponse.refresh_token || null, 
            newUser
          );
        } else {
          throw new Error(registerResponse.message || 'Profile creation failed');
        }
      } else {
        throw new Error(signUpResponse.message || 'Account creation failed');
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await apiService.signOut(token);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      await clearAuth();
    }
  };

  const updateUserProfile = async (userData: Partial<User>) => {
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      console.log('📝 Updating user profile...');
      
      const updateData: any = {
        firebase_token: token,
      };

      // Handle child updates
      if (userData.childName !== undefined || userData.childAge !== undefined || userData.childInterests !== undefined) {
        updateData.child = {
          name: userData.childName ?? user?.childName ?? '',
          age: userData.childAge ?? user?.childAge ?? 0,
          interests: userData.childInterests ?? user?.childInterests ?? [],
        };
      }

      // Handle parent updates
      if (userData.parentName !== undefined || userData.parentPhone !== undefined) {
        updateData.parent = {
          name: userData.parentName ?? user?.parentName ?? '',
          email: user?.email ?? '',
          phone_number: userData.parentPhone ?? user?.parentPhone ?? undefined,
        };
      }

      // Handle system prompt updates
      if (userData.storyPrompt !== undefined) {
        updateData.system_prompt = userData.storyPrompt;
      }

      const response = await apiService.updateUserProfile(updateData);

      if (response.success && response.profile) {
        const profile = response.profile;
        const updatedUser: User = {
          ...user!,
          childName: profile.child?.name || user?.childName || '',
          childAge: profile.child?.age || user?.childAge || 0,
          childInterests: profile.child?.interests || user?.childInterests || [],
          parentName: profile.parent?.name || user?.parentName || '',
          parentPhone: profile.parent?.phone_number || user?.parentPhone || '',
          storyPrompt: profile.system_prompt || user?.storyPrompt || '',
          updatedAt: new Date().toISOString(),
        };
        
        await storeAuth(token, refreshToken, updatedUser);
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
  };

  const refreshAuthToken = async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.refreshToken(refreshToken);

      if (response.success && response.firebase_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.firebase_token);
        if (response.refresh_token) {
          await AsyncStorage.setItem('refresh_token', response.refresh_token);
          setRefreshToken(response.refresh_token);
        }
        setToken(response.firebase_token);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await clearAuth();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    refreshAuthToken,
    verifyToken: () => verifyToken(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}