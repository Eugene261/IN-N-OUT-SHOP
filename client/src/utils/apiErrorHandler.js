/**
 * Utility functions for handling API errors consistently across the application
 */

import { toast } from 'sonner';

/**
 * Handle API errors consistently
 * @param {Error} error - The error object from axios or other sources
 * @param {Object} options - Additional options for error handling
 * @param {string} options.context - Context where the error occurred (e.g., 'login', 'checkout')
 * @param {boolean} options.showToast - Whether to show a toast notification
 * @param {Function} options.onError - Optional callback for custom error handling
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error, options = {}) => {
  const { 
    context = 'operation', 
    showToast = true, 
    onError = null 
  } = options;
  
  // Extract error message from various error formats
  let errorMessage = 'An unexpected error occurred';
  let statusCode = null;
  
  if (error.response) {
    // Server responded with an error status code
    statusCode = error.response.status;
    
    // Try to get error message from response data
    if (error.response.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      }
    }
    
    // Add status code context for certain errors
    if (statusCode === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (statusCode === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (statusCode === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (statusCode === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = 'No response from server. Please check your connection.';
  } else if (error.message) {
    // Error setting up the request
    errorMessage = error.message;
  }
  
  // Log error for debugging
  console.error(`API Error in ${context}:`, error);
  
  // Show toast if enabled
  if (showToast) {
    toast.error(errorMessage, {
      description: `Error during ${context}`,
      duration: 5000,
    });
  }
  
  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    onError(errorMessage, statusCode);
  }
  
  // Return standardized error object
  return {
    message: errorMessage,
    statusCode,
    originalError: error,
    context
  };
};

export default {
  handleApiError
};
