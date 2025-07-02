// Enhanced Error Handler for API Responses
export const handleApiError = (error) => {
  console.log('🔍 Error Handler Analysis:', {
    hasResponse: !!error.response,
    status: error.response?.status,
    code: error.code,
    message: error.message
  });

  // Network/Connection Errors (no response from server)
  if (!error.response) {
    if (error.code === 'ECONNREFUSED') {
      return {
        type: 'CONNECTION_ERROR',
        message: 'Server is not running or unreachable',
        userMessage: 'Unable to connect to server. Please check if the server is running.',
        technical: 'Connection refused - server may be down'
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        type: 'TIMEOUT_ERROR',
        message: 'Request timed out',
        userMessage: 'Request took too long. The server may be experiencing high load.',
        technical: 'Request timeout - server response too slow'
      };
    }
    
    return {
      type: 'NETWORK_ERROR',
      message: 'Network error occurred',
      userMessage: 'Network connection failed. Please check your internet connection.',
      technical: error.message
    };
  }

  // Server Response Errors (we got a response)
  const status = error.response.status;
  const data = error.response.data;

  switch (status) {
    case 401:
      return {
        type: 'AUTHENTICATION_ERROR',
        message: 'Authentication required',
        userMessage: 'You need to log in to access this feature.',
        technical: data?.message || 'Unauthorized access',
        action: 'LOGIN_REQUIRED'
      };

    case 403:
      return {
        type: 'AUTHORIZATION_ERROR', 
        message: 'Access denied',
        userMessage: 'You don\'t have permission to perform this action.',
        technical: data?.message || 'Forbidden access',
        action: 'INSUFFICIENT_PERMISSIONS'
      };

    case 404:
      return {
        type: 'NOT_FOUND_ERROR',
        message: 'Resource not found',
        userMessage: 'The requested resource was not found.',
        technical: data?.message || 'Endpoint not found'
      };

    case 409:
      return {
        type: 'CONFLICT_ERROR',
        message: 'Data conflict',
        userMessage: data?.message || 'A conflict occurred with existing data.',
        technical: 'Resource conflict'
      };

    case 422:
      return {
        type: 'VALIDATION_ERROR',
        message: 'Invalid data provided',
        userMessage: data?.message || 'Please check your input and try again.',
        technical: 'Validation failed'
      };

    case 429:
      return {
        type: 'RATE_LIMIT_ERROR',
        message: 'Too many requests',
        userMessage: 'You\'ve made too many requests. Please wait and try again.',
        technical: 'Rate limit exceeded'
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: 'SERVER_ERROR',
        message: 'Server error occurred',
        userMessage: 'An internal server error occurred. Please try again later.',
        technical: data?.message || `HTTP ${status} - Server error`
      };

    default:
      return {
        type: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        userMessage: data?.message || 'An unexpected error occurred. Please try again.',
        technical: `HTTP ${status} - ${data?.message || 'Unknown error'}`
      };
  }
};

// Enhanced error display utility
export const displayError = (error, notificationFn) => {
  const errorInfo = handleApiError(error);
  
  console.group('🚨 API Error Details');
  console.log('Type:', errorInfo.type);
  console.log('User Message:', errorInfo.userMessage);
  console.log('Technical:', errorInfo.technical);
  if (errorInfo.action) {
    console.log('Suggested Action:', errorInfo.action);
  }
  console.groupEnd();

  // Show user-friendly message
  if (notificationFn) {
    notificationFn({
      type: 'error',
      message: errorInfo.userMessage,
      description: errorInfo.type === 'AUTHENTICATION_ERROR' 
        ? 'Please log in again to continue.' 
        : 'If this problem persists, please contact support.'
    });
  }

  return errorInfo;
};

// Authentication-specific error handler
export const handleAuthError = (error) => {
  const errorInfo = handleApiError(error);
  
  if (errorInfo.type === 'AUTHENTICATION_ERROR') {
    // Clear invalid tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to login if not already there
    if (window.location.pathname !== '/auth/login') {
      console.log('🔄 Redirecting to login due to authentication failure');
      window.location.href = '/auth/login';
    }
  }
  
  return errorInfo;
}; 