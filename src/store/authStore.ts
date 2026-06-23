import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types/user.types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAuthority: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:    null,
      token:   null,
      isLoading: false,
      setUser:    (user)  => set({ user }),
      setToken:   (token) => set({ token }),
      setLoading: (v)     => set({ isLoading: v }),
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('janseva_token');
      },
      isAuthenticated: () => !!get().user,
      isAuthority: () => {
        const role = get().user?.role;
        return role === 'Authority' || role === 'Admin';
      },
    }),
    { name: 'janseva_auth', partialize: (s) => ({ user: s.user, token: s.token }) },
  ),
);
