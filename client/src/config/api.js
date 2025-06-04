/**
 * API configuration for the application
 * This file defines the base URL for API requests.
 */

// API Base URL - Use environment variable or fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Export a configured axios instance
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout for slow networks
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 API Request: Adding Bearer token to', config.url);
    } else {
      console.warn('⚠️ API Request: No token found for', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', response.config.url, response.status);
    return response;
  },
  (error) => {
    const url = error.config?.url;
    const status = error.response?.status;
    
    console.error('❌ API Response Error:', url, status, error.response?.data);
    
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout - server may be slow');
    } else if (status === 404) {
      console.error('🔍 API endpoint not found:', url);
    } else if (status === 401) {
      console.error('🚫 Unauthorized - clearing auth data');
      // Handle token expiration
      const isTokenExpired = error.response?.data?.tokenExpired;
      if (isTokenExpired) {
        console.log('🕒 Token expired - redirecting to login');
        // Clear auth data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Redirect to login page
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      } else {
        console.log('🔑 Invalid token - redirecting to login');
        // Also clear for other 401 errors
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    } else if (status >= 500) {
      console.error('🔥 Server error:', status);
    }
    return Promise.reject(error);
  }
); 