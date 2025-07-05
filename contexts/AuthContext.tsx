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
  const [loading, setLoading] = useState(true);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        try {
          await verifyToken(storedToken);
        } catch (error) {
          console.log('Stored token invalid, clearing auth');
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (tokenToVerify: string) => {
    const response = await apiService.verifyToken(tokenToVerify);
    return response;
  };

  const storeAuth = async (authToken: string, userData: User) => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  const clearAuth = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    setToken(null);
    setUser(null);
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Signing in user:', email);
      
      const response = await apiService.signIn(email, password);

      if (response.success && response.firebase_token) {
        console.log('✅ Sign in successful');
        
        // Get user profile
        const profileResponse = await apiService.getUserProfile(response.firebase_token);
        
        if (profileResponse.success && profileResponse.profile) {
          const userData: User = {
            uid: profileResponse.user_info?.uid || response.user_info?.localId || '',
            email: email,
            childName: profileResponse.profile.child?.name || '',
            childAge: profileResponse.profile.child?.age || 0,
            childInterests: profileResponse.profile.child?.interests || [],
            storyPrompt: profileResponse.profile.system_prompt || '',
            createdAt: profileResponse.profile.created_at || new Date().toISOString(),
            updatedAt: profileResponse.profile.updated_at || new Date().toISOString(),
          };
          
          await storeAuth(response.firebase_token, userData);
        } else {
          throw new Error('Failed to fetch user profile');
        }
      } else {
        throw new Error(response.message || 'Sign in failed');
      }
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      console.log('📝 Creating new user with register endpoint:', email);
      
      // Use the /auth/register endpoint directly since it creates both account and profile
      const registerResponse = await apiService.registerUser({
        firebase_token: 'temp_token', // Your server might not need this for register
        parent: {
          name: userData.childName ? `${userData.childName}'s Parent` : 'Parent',
          email: email,
        },
        child: {
          name: userData.childName || '',
          age: userData.childAge || 0,
          interests: userData.childInterests || [],
        },
        system_prompt: userData.storyPrompt || `Create magical stories for ${userData.childName}, age ${userData.childAge}.`,
      });

      if (registerResponse.success) {
        // Since registration worked, now try to sign in
        console.log('✅ Registration successful, now signing in...');
        
        const signInResponse = await apiService.signIn(email, password);
        
        if (signInResponse.success && signInResponse.firebase_token) {
          const newUser: User = {
            uid: signInResponse.user_info?.uid || signInResponse.user_info?.localId || '',
            email: email,
            childName: userData.childName || '',
            childAge: userData.childAge || 0,
            childInterests: userData.childInterests || [],
            storyPrompt: userData.storyPrompt || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          await storeAuth(signInResponse.firebase_token, newUser);
        } else {
          throw new Error('Registration successful but sign in failed');
        }
      } else {
        throw new Error(registerResponse.message || 'Registration failed');
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

      if (userData.childName !== undefined || userData.childAge !== undefined || userData.childInterests !== undefined) {
        updateData.child = {
          name: userData.childName ?? user?.childName ?? '',
          age: userData.childAge ?? user?.childAge ?? 0,
          interests: userData.childInterests ?? user?.childInterests ?? [],
        };
      }

      if (userData.storyPrompt !== undefined) {
        updateData.system_prompt = userData.storyPrompt;
      }

      const response = await apiService.updateUserProfile(updateData, token);

      if (response.success && response.profile) {
        const updatedUser: User = {
          ...user!,
          childName: response.profile.child?.name || user?.childName || '',
          childAge: response.profile.child?.age || user?.childAge || 0,
          childInterests: response.profile.child?.interests || user?.childInterests || [],
          storyPrompt: response.profile.system_prompt || user?.storyPrompt || '',
          updatedAt: new Date().toISOString(),
        };
        
        await storeAuth(token, updatedUser);
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    if (!token) {
      throw new Error('No token to refresh');
    }

    try {
      const response = await apiService.refreshToken(token);

      if (response.success && response.firebase_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.firebase_token);
        setToken(response.firebase_token);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await clearAuth();
      throw error;
    }
  };

  // Auto-refresh token every 50 minutes
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        refreshToken().catch(console.error);
      }, 50 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}