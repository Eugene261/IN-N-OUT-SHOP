import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthTroubleshooter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState({
    cookieToken: false,
    localStorageToken: false,
    userDataInStore: false,
    serverConnection: false,
    serverAuth: false
  });
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  // Check auth status when opened
  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);

  const checkAuthStatus = async () => {
    setIsChecking(true);
    const status = {
      cookieToken: false,
      localStorageToken: false,
      userDataInStore: false,
      serverConnection: false,
      serverAuth: false
    };

    // Check cookie token
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    status.cookieToken = !!tokenCookie;

    // Check localStorage token
    const localStorageToken = localStorage.getItem('token');
    status.localStorageToken = !!localStorageToken;

    // Try to get user data from Redux store (if available)
    const userDataInStorage = localStorage.getItem('userData');
    status.userDataInStore = !!userDataInStorage;

    // Check server connection
    try {
      await axios.get('http://localhost:5000/api/health');
      status.serverConnection = true;

      // Check auth with server
      if (status.cookieToken || status.localStorageToken) {
        try {
          const token = status.cookieToken 
            ? tokenCookie.split('=')[1] 
            : localStorageToken;
          
          const response = await axios.get('http://localhost:5000/api/auth/check-auth', {
            headers: {
              Authorization: `Bearer ${token}`
            },
            withCredentials: true
          });
          
          status.serverAuth = response.data.success;
        } catch (error) {
          console.error('Auth check failed:', error);
          status.serverAuth = false;
        }
      }
    } catch (error) {
      console.error('Server connection check failed:', error);
      status.serverConnection = false;
    }

    setAuthStatus(status);
    setIsChecking(false);
  };

  const handleRelogin = () => {
    // Clear existing tokens
    localStorage.removeItem('token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Save current location to return after login
    const currentPath = window.location.pathname;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    // Redirect to login page with redirect parameter
    navigate(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleCreateTestData = async () => {
    try {
      setIsChecking(true);
      const response = await axios.get('http://localhost:5000/api/admin/create-test-data', {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        alert('Test data created successfully! Please refresh the page.');
      } else {
        alert('Failed to create test data: ' + response.data.message);
      }
    } catch (error) {
      alert('Error creating test data: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Auth Troubleshooter</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {isChecking ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span>Cookie Token:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${authStatus.cookieToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {authStatus.cookieToken ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>LocalStorage Token:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${authStatus.localStorageToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {authStatus.localStorageToken ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Server Connection:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${authStatus.serverConnection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {authStatus.serverConnection ? 'Connected' : 'Failed'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Server Authentication:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${authStatus.serverAuth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {authStatus.serverAuth ? 'Authenticated' : 'Not Authenticated'}
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button 
                  onClick={checkAuthStatus}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded text-sm"
                >
                  Refresh Status
                </button>
                <button 
                  onClick={handleRelogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
                >
                  Re-login
                </button>
                {(authStatus.cookieToken || authStatus.localStorageToken) && (
                  <button 
                    onClick={handleCreateTestData}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm"
                  >
                    Create Test Data
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthTroubleshooter; 