import { useCallback } from 'react';
import { login, register, logout as svcLogout, getMe } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import type { LoginRequest, RegisterRequest } from '../types/api.types';

export function useAuth() {
  const { user, isAuthenticated, isAuthority, setUser, setToken, logout: storeLogout } = useAuthStore();
  const { addToast, closeLogin, closeRegister } = useUIStore();

  const signIn = useCallback(async (payload: LoginRequest) => {
    const res = await login(payload);
    setUser(res.user);
    setToken(res.token);
    closeLogin();
    addToast({ type: 'success', title: `Welcome back, ${res.user.name}!` });
    return res;
  }, [setUser, setToken, closeLogin, addToast]);

  const signUp = useCallback(async (payload: RegisterRequest) => {
    const res = await register(payload);
    setUser(res.user);
    setToken(res.token);
    closeRegister();
    addToast({ type: 'success', title: 'Account created!', message: 'Welcome to JanSeva.' });
    return res;
  }, [setUser, setToken, closeRegister, addToast]);

  const signOut = useCallback(() => {
    svcLogout();
    storeLogout();
    addToast({ type: 'info', title: 'Signed out successfully.' });
  }, [storeLogout, addToast]);

  const refreshUser = useCallback(async () => {
    try {
      const u = await getMe();
      setUser({
        id: u.id,
        citizenId: u.citizenId,
        name: u.name,
        email: u.email,
        role: u.role,
        ward: u.ward,
        avatarUrl: u.avatarUrl,
        xp: u.xp,
        level: u.level,
        activeCharacter: u.activeCharacter,
      });
    } catch { /* token invalid — ignore */ }
  }, [setUser]);

  return { user, isAuthenticated: isAuthenticated(), isAuthority: isAuthority(), signIn, signUp, signOut, refreshUser };
}
