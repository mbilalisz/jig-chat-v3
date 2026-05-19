import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  clearAuth: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : state.user })),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      logout: async () => {
        const token = get().token;
        if (token) {
          try {
            // Import here to avoid circular dependency with api/client
            const { default: apiClient } = await import('../api/client');
            await apiClient.post('/auth/logout');
          } catch {
            // proceed with local logout even if the request fails
          }
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
