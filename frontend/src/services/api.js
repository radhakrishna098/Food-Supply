import axios from 'axios';

/**
 * Resolves and normalizes the API Base URL.
 * - In local development: defaults to '/api' using the Vite proxy to http://localhost:5000.
 * - In production: uses import.meta.env.VITE_API_BASE_URL (e.g. 'https://foodloop-backend.onrender.com/api').
 * - Safely handles trailing slashes and ensures standard '/api' routing convention.
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || !envUrl.trim()) {
    return '/api';
  }

  let normalized = envUrl.trim().replace(/\/+$/, '');
  if (!normalized.endsWith('/api')) {
    normalized = `${normalized}/api`;
  }
  return normalized;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('foodloop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized responses and network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Clear token if expired or invalid
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          localStorage.removeItem('foodloop_token');
          localStorage.removeItem('foodloop_user');
          // Avoid repeated redirects or infinite reload loops
          if (!window.__foodloop_auth_redirecting) {
            window.__foodloop_auth_redirecting = true;
            window.location.href = '/login?expired=true';
          }
        }
      }
    } else if (error.request) {
      console.warn('[FoodLoop API Warning]: Network connection error or backend service unavailable.');
    }
    return Promise.reject(error);
  }
);

export default api;
