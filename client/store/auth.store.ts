import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, AuthResponse } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'patient';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      login: async (email, password) => {
        try {
          const response = await authService.login({ email, password });
          get().setUser(response.user as User);
        } catch (error) {
          get().clearAuth();
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          get().clearAuth();
        }
      },

      checkAuth: async () => {
        try {
          const response = await authService.getProfile();
          get().setUser(response.user as User);
        } catch (error) {
          try {
            const refreshResponse = await authService.refresh();
            get().setUser(refreshResponse.user as User);
          } catch (refreshError) {
            get().clearAuth();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
