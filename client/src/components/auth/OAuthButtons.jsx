import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chrome, Facebook, Twitter } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

const OAuthButtons = ({ onOAuthLogin }) => {
  const [availableProviders, setAvailableProviders] = useState({
    google: false,
    facebook: false,
    twitter: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check which OAuth providers are available
    const checkOAuthProviders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/oauth-providers`);
        const data = await response.json();
        
        if (data.success) {
          setAvailableProviders(data.providers);
        }
      } catch (error) {
        console.error('Failed to check OAuth providers:', error);
        // Default to false for all providers if check fails
        setAvailableProviders({ google: false, facebook: false, twitter: false });
      } finally {
        setLoading(false);
      }
    };

    checkOAuthProviders();
  }, []);

  const handleGoogleLogin = () => {
    if (onOAuthLogin) {
      onOAuthLogin('google');
    }
    // Redirect to Google OAuth
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const handleFacebookLogin = () => {
    if (onOAuthLogin) {
      onOAuthLogin('facebook');
    }
    // Redirect to Facebook OAuth
    window.location.href = `${API_BASE_URL}/api/auth/facebook`;
  };

  const handleTwitterLogin = () => {
    if (onOAuthLogin) {
      onOAuthLogin('twitter');
    }
    // Redirect to Twitter OAuth
    window.location.href = `${API_BASE_URL}/api/auth/twitter`;
  };

  // Don't render anything if no providers are available
  const hasAnyProvider = availableProviders.google || availableProviders.facebook || availableProviders.twitter;
  
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="animate-pulse text-sm text-gray-500">Checking OAuth providers...</div>
        </div>
      </div>
    );
  }

  if (!hasAnyProvider) {
    return null; // Don't render OAuth section if no providers are available
  }

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
        {availableProviders.google && (
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
        )}

        {/* Facebook OAuth Button */}
        {availableProviders.facebook && (
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
        )}

        {/* Twitter OAuth Button */}
        {availableProviders.twitter && (
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
        )}
      </div>
    </div>
  );
};

export default OAuthButtons; 