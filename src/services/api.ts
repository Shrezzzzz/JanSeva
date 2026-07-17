import axios from 'axios';
import env from '../config/env';

const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

function friendlyErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) return 'Something went wrong. Please try again.';

  if (!err.response) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  const serverMessage = err.response.data?.error || err.response.data?.message;
  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage;
  }

  switch (err.response.status) {
    case 400:
      return 'Please check the details and try again.';
    case 401:
      return 'Invalid email or password.';
    case 403:
      return 'You do not have permission to access this page.';
    case 404:
      return 'We could not find what you were looking for.';
    case 409:
      return 'This action could not be completed because the item has changed.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

// Retry once on network errors (no response received — server unreachable, ECONNRESET, etc.)
// Does NOT retry on 4xx/5xx — those are application errors, not transient network failures.
const MAX_RETRIES = 1;
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config as typeof err.config & { _retryCount?: number };
    if (!err.response && config && (config._retryCount ?? 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return api(config);
    }
    return Promise.reject(err);
  },
);

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
      // Only hard-redirect on 401 if the user was previously authenticated
      // (i.e. a token existed). This avoids booting the user to the landing
      // page when, for example, a login attempt itself fails with 401.
      const hadToken = !!localStorage.getItem('janseva_token');
      localStorage.removeItem('janseva_token');
      if (hadToken) {
        // Redirect authority users back to authority login, everyone else to citizen home.
        const isAuthorityRoute = window.location.pathname.startsWith('/authority');
        window.location.href = isAuthorityRoute ? '/authority/login' : '/citizen';
      }
    }
    if (axios.isAxiosError(err)) {
      err.message = friendlyErrorMessage(err);
    }
    return Promise.reject(err);
  },
);

export default api;
