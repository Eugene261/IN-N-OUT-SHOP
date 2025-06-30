import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2 } from 'lucide-react';
import MessagingDashboard from './MessagingDashboard';

const MessageWidget = ({ isOpen, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Close with Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when widget is open on mobile only
  useEffect(() => {
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const widgetVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      x: 100,
      y: 100,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      }
    },
    minimized: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: 100,
      y: 100,
      transition: {
        duration: 0.2
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - only on mobile */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Widget Container - Desktop Only */}
          <motion.div
            className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden hidden lg:block"
            style={{
              bottom: '80px',
              right: '16px',
              width: '700px',
              height: isMinimized ? '60px' : '750px',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 100px)'
            }}
            variants={widgetVariants}
            initial="hidden"
            animate={isMinimized ? "minimized" : "visible"}
            exit="exit"
          >
            {/* Header */}
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="font-semibold text-sm">Messages</h3>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-blue-700 rounded transition-colors"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-blue-700 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="flex-1 bg-gray-50 overflow-hidden">
                <MessagingDashboard isWidget={true} />
              </div>
            )}
          </motion.div>

          {/* Mobile Full Screen on Small Devices */}
          <motion.div
            className="fixed inset-0 z-50 bg-white lg:hidden flex flex-col"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Mobile Header */}
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between border-b flex-shrink-0">
              <h3 className="font-semibold">Messages</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 bg-gray-50 overflow-hidden">
              <MessagingDashboard isWidget={true} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MessageWidget; 