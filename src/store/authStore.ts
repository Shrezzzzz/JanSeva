import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types/user.types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  /** Session-scoped ward for the shared Ward Officer account.
   *  Null means the officer hasn't picked their ward yet this session. */
  activeWard: string | null;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (v: boolean) => void;
  setActiveWard: (ward: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAuthority: () => boolean;
  /** Returns the effective ward for the current user:
   *  - For the shared Ward Officer account: the session-selected activeWard
   *  - For all other users: user.ward from the DB */
  effectiveWard: () => string | null | undefined;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:       null,
      token:      null,
      isLoading:  false,
      activeWard: null,
      setUser:       (user)  => set({ user }),
      setToken:      (token) => set({ token }),
      setLoading:    (v)     => set({ isLoading: v }),
      setActiveWard: (ward)  => set({ activeWard: ward }),
      logout: () => {
        set({ user: null, token: null, activeWard: null });
        localStorage.removeItem('janseva_token');
      },
      isAuthenticated: () => !!get().user,
      isAuthority: () => {
        const role = get().user?.role;
        return role === 'Authority' || role === 'Admin';
      },
      effectiveWard: () => {
        const { user, activeWard } = get();
        if (!user) return null;
        // Shared Ward Officer account (officer@janseva.gov) has no DB ward —
        // use the session-selected ward instead.
        if (user.role === 'Authority' && !user.ward) return activeWard;
        return user.ward;
      },
    }),
    {
      name: 'janseva_auth',
      partialize: (s) => ({ user: s.user, token: s.token, activeWard: s.activeWard }),
    },
  ),
);
