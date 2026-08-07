import axios from 'axios';

// Safe localStorage wrapper
export const safeStorage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore
    }
  }
};

// Get base URL from localStorage safely
export const getBaseUrl = () => safeStorage.get('komga-base-url');

export const getImageUrl = (path: string) => {
  const baseUrl = getBaseUrl();
  return baseUrl ? `${baseUrl}/api/v1${path}` : `/api/v1${path}`;
};

export const api = axios.create({
  baseURL: getBaseUrl() + '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to dynamically set baseURL in case it changes
api.interceptors.request.use((config) => {
  const baseUrl = getBaseUrl();
  config.baseURL = baseUrl ? `${baseUrl}/api/v1` : '/api/v1';
  return config;
});
