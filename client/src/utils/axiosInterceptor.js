import axios from 'axios';
import store from '../store/store';
import { logoutUser } from '../store/auth-slice';
import { toast } from 'sonner';

// Create axios interceptor for handling token expiration
const setupAxiosInterceptors = () => {
  // Response interceptor to handle token expiration
  axios.interceptors.response.use(
    (response) => {
      // If response is successful, just return it
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // Check if error is due to token expiration
      if (error.response?.status === 401) {
        const errorData = error.response.data;
        
        // Check if it's specifically a token expiration error
        if (errorData?.tokenExpired || 
            errorData?.message?.includes('expired') ||
            errorData?.message?.includes('Invalid token')) {
          
          console.log('Token expired, logging out user...');
          
          // Clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Clear cookies
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          // Dispatch logout action to update Redux state
          store.dispatch(logoutUser());
          
          // Show user-friendly message
          toast.error('Your session has expired. Please login again.', {
            position: 'top-center',
            duration: 4000
          });
          
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 1000);
          
          // Don't retry the original request
          return Promise.reject(error);
        }
      }
      
      // For other errors, just reject normally
      return Promise.reject(error);
    }
  );

  // Request interceptor to add token to headers
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors; 