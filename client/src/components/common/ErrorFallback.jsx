import React from 'react';

/**
 * Error Fallback component for displaying when API requests fail
 * 
 * @param {Object} props - Component props
 * @param {Function} props.retryFunction - Function to call to retry the failed operation
 * @param {string} props.message - Custom error message to display
 * @param {string} props.description - Additional description text
 * @returns {JSX.Element} Error fallback UI component
 */
const ErrorFallback = ({ 
  retryFunction, 
  message = 'Something went wrong', 
  description = 'We couldn\'t load the data you requested.' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-red-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{message}</h3>
      <p className="text-gray-600 text-center mb-4">{description}</p>
      {retryFunction && (
        <button 
          onClick={retryFunction}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorFallback;
