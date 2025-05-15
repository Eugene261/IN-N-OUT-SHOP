import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMessage, setShowMessage] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('good'); // 'good', 'weak', 'offline'

  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Event listeners for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      checkConnectionQuality();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
      setShowMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up periodic connection quality checks
    const intervalId = setInterval(checkConnectionQuality, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  const checkConnection = () => {
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      checkConnectionQuality();
    } else {
      setConnectionQuality('offline');
      setShowMessage(true);
    }
  };

  const checkConnectionQuality = async () => {
    if (!navigator.onLine) {
      setConnectionQuality('offline');
      setShowMessage(true);
      return;
    }

    try {
      // Use performance API to measure connection speed
      const startTime = Date.now();
      const response = await fetch('/vite.svg', { 
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'pragma': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Determine connection quality based on response time
      if (duration > 1000) { // More than 1 second
        setConnectionQuality('weak');
        setShowMessage(true);
      } else {
        setConnectionQuality('good');
        // If we were previously showing a message for bad connection, keep it visible for a moment
        setTimeout(() => setShowMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setConnectionQuality('weak');
      setShowMessage(true);
    }
  };

  const handleClose = () => {
    setShowMessage(false);
  };

  return (
    <AnimatePresence>
      {showMessage && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-0 left-0 right-0 z-50 p-3 flex justify-center items-center ${
            connectionQuality === 'offline' 
              ? 'bg-red-500' 
              : connectionQuality === 'weak' 
                ? 'bg-amber-500' 
                : 'bg-green-500'
          }`}
        >
          <div className="flex items-center justify-between w-full max-w-4xl text-white">
            <div className="flex items-center gap-2">
              {connectionQuality === 'offline' ? (
                <>
                  <WifiOff className="w-5 h-5" />
                  <span className="font-medium">You are offline. Please check your internet connection.</span>
                </>
              ) : connectionQuality === 'weak' ? (
                <>
                  <Wifi className="w-5 h-5" />
                  <span className="font-medium">Your internet connection is weak. Some features may not work properly.</span>
                </>
              ) : (
                <>
                  <Wifi className="w-5 h-5" />
                  <span className="font-medium">Your internet connection has been restored.</span>
                </>
              )}
            </div>
            <button 
              onClick={handleClose}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionStatus;
