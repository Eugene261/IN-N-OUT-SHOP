import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

/**
 * TokenManager is an invisible component that ensures token synchronization
 * between cookies and localStorage. This helps with cross-browser compatibility
 * and ensures that both API methods work correctly.
 */
const TokenManager = () => {
  const auth = useSelector(state => state.auth || {});
  
  useEffect(() => {
    // Check if user is authenticated according to Redux state
    if (auth.isAuthenticated && auth.user) {
      syncTokens();
    }
  }, [auth.isAuthenticated, auth.user]);
  
  // Function to ensure token is in both localStorage and cookie
  const syncTokens = () => {
    try {
      // First check localStorage
      const localStorageToken = localStorage.getItem('token');
      
      // Then check cookies
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
      const cookieToken = tokenCookie ? tokenCookie.split('=')[1] : null;
      
      // If token is in localStorage but not in cookie
      if (localStorageToken && !cookieToken) {
        console.log('Setting cookie from localStorage token');
        document.cookie = `token=${localStorageToken}; path=/; max-age=${24 * 60 * 60}`;
      }
      
      // If token is in cookie but not in localStorage
      if (cookieToken && !localStorageToken) {
        console.log('Setting localStorage from cookie token');
        localStorage.setItem('token', cookieToken);
      }
      
      // If tokens are different, prefer the newest one (usually localStorage)
      if (localStorageToken && cookieToken && localStorageToken !== cookieToken) {
        console.log('Tokens differ, syncing both to localStorage version');
        document.cookie = `token=${localStorageToken}; path=/; max-age=${24 * 60 * 60}`;
      }
    } catch (error) {
      console.error('Error syncing tokens:', error);
    }
  };
  
  // This component doesn't render anything
  return null;
};

export default TokenManager; 