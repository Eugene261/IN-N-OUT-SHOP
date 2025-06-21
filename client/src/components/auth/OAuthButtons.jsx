import React from 'react';
import { motion } from 'framer-motion';
import { Chrome, Facebook, Twitter } from 'lucide-react';

const OAuthButtons = ({ onOAuthLogin }) => {
  // Use fallback API URL for development if environment variable is not set
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleGoogleLogin = () => {
    if (onOAuthLogin) {
      onOAuthLogin('google');
    }
    // Redirect to Google OAuth
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleFacebookLogin = () => {
    if (onOAuthLogin) {
      onOAuthLogin('facebook');
    }
    // Redirect to Facebook OAuth
    window.location.href = `${apiUrl}/auth/facebook`;
  };

  const handleTwitterLogin = () => {
    if (onOAuthLogin) {
      onOAuthLogin('twitter');
    }
    // Redirect to Twitter OAuth
    window.location.href = `${apiUrl}/auth/twitter`;
  };

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-1 gap-3">
        {/* Google OAuth Button */}
        <motion.button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Chrome className="w-5 h-5 mr-3 text-blue-500" />
          Sign in with Google
        </motion.button>

        {/* Facebook OAuth Button */}
        <motion.button
          type="button"
          onClick={handleFacebookLogin}
          className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Facebook className="w-5 h-5 mr-3 text-blue-600" />
          Sign in with Facebook
        </motion.button>

        {/* Twitter OAuth Button */}
        <motion.button
          type="button"
          onClick={handleTwitterLogin}
          className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Twitter className="w-5 h-5 mr-3 text-sky-500" />
          Sign in with Twitter
        </motion.button>
      </div>
    </div>
  );
};

export default OAuthButtons; 