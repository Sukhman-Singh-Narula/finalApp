// store/slices/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';
import { UserProfile } from '@/services/apiConfig';

interface UserData {
  id: string;
  childName: string;
  childAge: number;
  childInterests: string[];
  parentEmail: string;
  parentName: string;
  parentPhone: string;
  defaultSystemPrompt: string;
  firebase_token?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  firebase_token: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
  firebase_token: null,
};

// Async thunks for server communication
export const loginWithEmailPassword = createAsyncThunk(
  'auth/loginWithEmailPassword',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Step 1: Authenticate with Firebase
      const firebaseResult = await authService.signInWithEmailAndPassword(email, password);
      const firebase_token = firebaseResult.idToken;

      // Step 2: Verify token with our server
      const verifyResult = await authService.verifyToken(firebase_token);

      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Token verification failed');
      }

      // Step 3: Get user profile if they have one
      if (verifyResult.has_profile && verifyResult.profile) {
        const profile = verifyResult.profile as UserProfile;

        const userData: UserData = {
          id: profile.user_id,
          childName: profile.child.name,
          childAge: profile.child.age,
          childInterests: profile.child.interests,
          parentEmail: profile.parent.email,
          parentName: profile.parent.name,
          parentPhone: profile.parent.phone_number || '',
          defaultSystemPrompt: profile.system_prompt,
          firebase_token: firebase_token,
        };

        return { userData, firebase_token, hasProfile: true };
      } else {
        // User exists but no profile - need to complete registration
        return {
          userData: null,
          firebase_token,
          hasProfile: false,
          userInfo: verifyResult.user_info
        };
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({
    email,
    password,
    parentName,
    parentPhone,
    childName,
    childAge,
    childInterests,
    systemPrompt
  }: {
    email: string;
    password: string;
    parentName: string;
    parentPhone: string;
    childName: string;
    childAge: number;
    childInterests: string[];
    systemPrompt?: string;
  }, { rejectWithValue }) => {
    try {
      // Step 1: Create Firebase user
      const firebaseResult = await authService.createUserWithEmailAndPassword(email, password);
      const firebase_token = firebaseResult.idToken;

      // Step 2: Register with our server
      const registrationData = {
        firebase_token,
        parent: {
          name: parentName,
          email: email,
          phone_number: parentPhone,
        },
        child: {
          name: childName,
          age: childAge,
          interests: childInterests,
        },
        system_prompt: systemPrompt,
      };

      const registerResult = await authService.registerUser(registrationData);

      if (!registerResult.success) {
        throw new Error(registerResult.message || 'Registration failed');
      }

      const profile = registerResult.profile || registerResult.data;

      const userData: UserData = {
        id: profile.user_id,
        childName: profile.child.name,
        childAge: profile.child.age,
        childInterests: profile.child.interests,
        parentEmail: profile.parent.email,
        parentName: profile.parent.name,
        parentPhone: profile.parent.phone_number || '',
        defaultSystemPrompt: profile.system_prompt,
        firebase_token: firebase_token,
      };

      return { userData, firebase_token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async ({
    childName,
    childAge,
    childInterests,
    parentName,
    parentPhone,
    systemPrompt
  }: {
    childName?: string;
    childAge?: number;
    childInterests?: string[];
    parentName?: string;
    parentPhone?: string;
    systemPrompt?: string;
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const firebase_token = state.auth.firebase_token;

      if (!firebase_token) {
        throw new Error('No authentication token available');
      }

      const updateData: any = { firebase_token };

      if (childName !== undefined || childAge !== undefined || childInterests !== undefined) {
        updateData.child = {};
        if (childName !== undefined) updateData.child.name = childName;
        if (childAge !== undefined) updateData.child.age = childAge;
        if (childInterests !== undefined) updateData.child.interests = childInterests;
      }

      if (parentName !== undefined || parentPhone !== undefined) {
        updateData.parent = {};
        if (parentName !== undefined) updateData.parent.name = parentName;
        if (parentPhone !== undefined) updateData.parent.phone_number = parentPhone;
        // Email is not updatable, get from current state
        updateData.parent.email = state.auth.user?.parentEmail;
      }

      if (systemPrompt !== undefined) {
        updateData.system_prompt = systemPrompt;
      }

      const updateResult = await authService.updateUserProfile(updateData);

      if (!updateResult.success) {
        throw new Error(updateResult.message || 'Profile update failed');
      }

      const profile = updateResult.profile || updateResult.data;

      const userData: UserData = {
        id: profile.user_id,
        childName: profile.child.name,
        childAge: profile.child.age,
        childInterests: profile.child.interests,
        parentEmail: profile.parent.email,
        parentName: profile.parent.name,
        parentPhone: profile.parent.phone_number || '',
        defaultSystemPrompt: profile.system_prompt,
        firebase_token: firebase_token,
      };

      return userData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Profile update failed');
    }
  }
);

export const verifyTokenAndLoadProfile = createAsyncThunk(
  'auth/verifyTokenAndLoadProfile',
  async (firebase_token: string, { rejectWithValue }) => {
    try {
      const verifyResult = await authService.verifyToken(firebase_token);

      if (!verifyResult.success) {
        throw new Error('Token verification failed');
      }

      if (verifyResult.has_profile && verifyResult.profile) {
        const profile = verifyResult.profile as UserProfile;

        const userData: UserData = {
          id: profile.user_id,
          childName: profile.child.name,
          childAge: profile.child.age,
          childInterests: profile.child.interests,
          parentEmail: profile.parent.email,
          parentName: profile.parent.name,
          parentPhone: profile.parent.phone_number || '',
          defaultSystemPrompt: profile.system_prompt,
          firebase_token: firebase_token,
        };

        return { userData, firebase_token, hasProfile: true };
      } else {
        return { userData: null, firebase_token, hasProfile: false };
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token verification failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<UserData>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.firebase_token = null;
    },
    updateUser: (state, action: PayloadAction<Partial<UserData>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setFirebaseToken: (state, action: PayloadAction<string>) => {
      state.firebase_token = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login with email/password
    builder
      .addCase(loginWithEmailPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmailPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.firebase_token = action.payload.firebase_token;

        if (action.payload.hasProfile && action.payload.userData) {
          state.isAuthenticated = true;
          state.user = action.payload.userData;
        } else {
          // User exists but no profile - they need to complete registration
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(loginWithEmailPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.firebase_token = null;
      });

    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.userData;
        state.firebase_token = action.payload.firebase_token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify token and load profile
    builder
      .addCase(verifyTokenAndLoadProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyTokenAndLoadProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.firebase_token = action.payload.firebase_token;

        if (action.payload.hasProfile && action.payload.userData) {
          state.isAuthenticated = true;
          state.user = action.payload.userData;
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(verifyTokenAndLoadProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.firebase_token = null;
      });
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
  setFirebaseToken,
} = authSlice.actions;

export default authSlice.reducer;