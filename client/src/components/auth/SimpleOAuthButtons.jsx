import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

const SimpleOAuthButtons = ({ onOAuthLogin }) => {
  const [availableProviders, setAvailableProviders] = useState({
    google: false,
    facebook: false,
    twitter: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkOAuthProviders = async () => {
      try {
        console.log('🔍 Checking OAuth providers at:', `${API_BASE_URL}/api/auth/oauth-providers`);
        const response = await fetch(`${API_BASE_URL}/api/auth/oauth-providers`);
        console.log('📡 OAuth providers response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ OAuth providers data:', data);
        
        if (data.success) {
          setAvailableProviders(data.providers);
          console.log('🎯 Available providers set to:', data.providers);
        } else {
          console.warn('⚠️ OAuth providers API returned success=false:', data);
          setError('OAuth service not available');
        }
      } catch (error) {
        console.error('❌ Failed to check OAuth providers:', error);
        setError(error.message);
        // For debugging: temporarily enable buttons even if API fails
        setAvailableProviders({ google: true, facebook: true, twitter: false });
      } finally {
        setLoading(false);
      }
    };

    checkOAuthProviders();
  }, []);

  const handleGoogleLogin = () => {
    console.log('🚀 Google login clicked');
    try {
      if (onOAuthLogin) {
        onOAuthLogin('google');
      }
      const url = `${API_BASE_URL}/api/auth/google`;
      console.log('📍 Redirecting to:', url);
      window.location.href = url;
    } catch (error) {
      console.error('❌ Google login error:', error);
    }
  };

  const handleFacebookLogin = () => {
    console.log('🚀 Facebook login clicked');
    try {
      if (onOAuthLogin) {
        onOAuthLogin('facebook');
      }
      const url = `${API_BASE_URL}/api/auth/facebook`;
      console.log('📍 Redirecting to:', url);
      window.location.href = url;
    } catch (error) {
      console.error('❌ Facebook login error:', error);
    }
  };

  const handleTwitterLogin = () => {
    console.log('🚀 Twitter login clicked');
    try {
      if (onOAuthLogin) {
        onOAuthLogin('twitter');
      }
      const url = `${API_BASE_URL}/api/auth/twitter`;
      console.log('📍 Redirecting to:', url);
      window.location.href = url;
    } catch (error) {
      console.error('❌ Twitter login error:', error);
    }
  };

  const hasAnyProvider = availableProviders.google || availableProviders.facebook || availableProviders.twitter;
  
  console.log('🔍 OAuth Debug:', {
    loading,
    error,
    availableProviders,
    hasAnyProvider,
    API_BASE_URL
  });
  
  if (loading) {
    return (
      <div className="text-center">
        <div className="text-sm text-gray-400">Loading OAuth providers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-sm text-red-500 mb-2">OAuth Error: {error}</div>
        <div className="text-xs text-gray-400">Check console for details</div>
      </div>
    );
  }

  if (!hasAnyProvider) {
    return (
      <div className="text-center">
        <div className="text-sm text-gray-400">No OAuth providers available</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {availableProviders.google && (
        <button
          type="button"
          onClick={(e) => {
            console.log('🎯 BUTTON CLICKED - Google', e);
            e.preventDefault();
            e.stopPropagation();
            handleGoogleLogin();
          }}
          className="w-full h-14 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium rounded-lg flex items-center justify-center gap-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue With Google
        </button>
      )}

      {availableProviders.facebook && (
        <button
          type="button"
          onClick={(e) => {
            console.log('🎯 BUTTON CLICKED - Facebook', e);
            e.preventDefault();
            e.stopPropagation();
            handleFacebookLogin();
          }}
          className="w-full h-14 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium rounded-lg flex items-center justify-center gap-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          <svg className="w-5 h-5" fill="#1877f2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Continue With Facebook
        </button>
      )}


    </div>
  );
};

export default SimpleOAuthButtons; 