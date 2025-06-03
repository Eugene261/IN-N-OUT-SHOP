/**
 * API configuration for the application
 * This file defines the base URL for API requests.
 */

// Define the base URL for API requests using environment variables
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

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server may be slow');
    } else if (error.response?.status === 404) {
      console.error('API endpoint not found:', error.config?.url);
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.status);
    }
    return Promise.reject(error);
  }
); 