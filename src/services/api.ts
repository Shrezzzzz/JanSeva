import axios from 'axios';
import env from '../config/env';

const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('janseva_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('janseva_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  },
);

export default api;
