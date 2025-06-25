import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { api } from '@/utils/api';
import { socketService } from '@/utils/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Partial<User>, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  checkAuthState: () => Promise<void>;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      token: null,
      refreshToken: null,
      
      setTokens: async (accessToken: string | null, refreshToken: string | null) => {
        try {
          if (accessToken && refreshToken) {
            await AsyncStorage.multiSet([
              ['auth_token', accessToken],
              ['refresh_token', refreshToken]
            ]);
            set({ token: accessToken, refreshToken, isAuthenticated: true });
          } else {
            await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
            set({ token: null, refreshToken: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Error setting tokens:', error);
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('AuthStore: Starting login process for email:', email);
          const response = await api.login(email.trim(), password.trim());
          
          console.log('AuthStore: Login response:', {
            success: response.success,
            hasData: !!response.data,
            message: response.message
          });

          if (!response.success || !response.data) {
            throw new Error(response.message || 'Login failed');
          }

          const { user: userData, accessToken, refreshToken } = response.data;
          
          if (!userData || !accessToken || !refreshToken) {
            console.error('AuthStore: Invalid login response structure:', {
              hasUser: !!userData,
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken
            });
            throw new Error('Invalid login response');
          }

          const user: User = {
            _id: userData._id || userData.id,
            id: userData._id || userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            profileImageUrl: userData.profileImageUrl,
            bio: userData.bio,
            department: userData.department,
            graduationYear: userData.graduationYear || userData.batch,
            company: userData.currentCompany || userData.company,
            position: userData.designation || userData.position,
            isVerified: userData.isVerified,
          };
          
          console.log('AuthStore: Setting tokens and user data');
          await get().setTokens(accessToken, refreshToken);
          set({ user, isLoading: false, error: null });
          socketService.connect();
          
          console.log('AuthStore: Login successful for user:', user.email);
        } catch (error) {
          console.error('AuthStore: Login error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred during login', 
            isLoading: false,
            user: null
          });
          throw error;
        }
      },
      
      signup: async (userData, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const signupData: any = {
            name: userData.name,
            email: userData.email,
            password,
            role: userData.role,
          };
          if (userData.role === 'student') {
            signupData.prn = userData.prn;
            signupData.department = userData.department;
            signupData.batch = userData.batch;
          } else if (userData.role === 'alumni') {
            signupData.alumniId = userData.alumniId;
          }
          const response = await api.signup(signupData);
          
          if (response.success && response.data) {
            const { user: userData, accessToken, refreshToken } = response.data;
            const user: User = {
              _id: userData._id,
              id: userData._id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              profileImageUrl: userData.profileImageUrl,
              bio: userData.bio,
              isVerified: userData.isVerified,
            };
            
            await get().setTokens(accessToken, refreshToken);
            set({ user, isLoading: false });
          } else {
            throw new Error(response.message || 'Signup failed');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      logout: async () => {
        try {
          socketService.disconnect();
          await api.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          await get().setTokens(null, null);
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        }
      },

      checkAuthState: async () => {
        if (!get().isLoading) {
          set({ isLoading: true });
        }
        
        try {
          const token = get().token || await AsyncStorage.getItem('auth_token');
          
          if (!token) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          const response = await api.getMe();
          
          if (response.success && response.data) {
            const userData = response.data;
            const user: User = {
              _id: userData._id || userData.id,
              id: userData._id || userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              profileImageUrl: userData.profileImageUrl,
              bio: userData.bio,
              department: userData.department,
              graduationYear: userData.graduationYear || userData.batch,
              company: userData.currentCompany || userData.company,
              position: userData.designation || userData.position,
              isVerified: userData.isVerified,
            };
            
            set({ user, isAuthenticated: true, isLoading: false, error: null });
            socketService.connect();
          } else {
            await get().logout();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          await get().logout();
        }
      },
      
      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('User not authenticated');
          }

          const response = await api.updateUserProfile(currentUser.id, userData);
          
          if (response.success && response.data) {
            const updatedUserData = response.data;
            const updatedUser: User = {
              _id: updatedUserData._id,
              id: updatedUserData._id,
              name: updatedUserData.name,
              email: updatedUserData.email,
              role: updatedUserData.role,
              profileImageUrl: updatedUserData.profileImageUrl,
              bio: updatedUserData.bio,
              department: updatedUserData.department,
              graduationYear: updatedUserData.graduationYear || updatedUserData.batch,
              company: updatedUserData.currentCompany || updatedUserData.company,
              position: updatedUserData.designation || updatedUserData.position,
              isVerified: updatedUserData.isVerified,
            };
            
            set({ user: updatedUser, isLoading: false });
          } else {
            throw new Error(response.message || 'Profile update failed');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'An error occurred', 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'connectu-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken
      }),
    }
  )
);