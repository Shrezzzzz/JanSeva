import api from './api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/api.types';
import type { ApiResponse } from '../types/api.types';
import type { User } from '../types/user.types';

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  const { token } = res.data.data;
  localStorage.setItem('janseva_token', token);
  return res.data.data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload);
  const { token } = res.data.data;
  localStorage.setItem('janseva_token', token);
  return res.data.data;
}

export function logout(): void {
  localStorage.removeItem('janseva_token');
}

export async function getMe(): Promise<User> {
  const res = await api.get<ApiResponse<User>>('/auth/me');
  return res.data.data;
}

export function getStoredToken(): string | null {
  return localStorage.getItem('janseva_token');
}
