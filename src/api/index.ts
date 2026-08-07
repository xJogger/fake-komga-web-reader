import axios from 'axios';

// Get base URL from localStorage, fallback to empty string
export const getBaseUrl = () => {
  return localStorage.getItem('komga-base-url') || '';
};

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
