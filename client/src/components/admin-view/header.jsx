import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlignJustify, LogOut, User, Settings, Shield, Crown, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '@/store/auth-slice';

function AdminHeader({ onMenuToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isSuperAdmin = user?.role === 'superAdmin';
  
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/auth/login');
  };

  const handleProfileNavigation = () => {
    navigate('/admin/profile');
    setIsProfileDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Button animations
  const buttonVariants = {
    hover: { 
      scale: 1.05,
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tap: { 
      scale: 0.95,
      backgroundColor: "rgba(0, 0, 0, 0.1)"
    }
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.1
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Menu Toggle Button */}
        <motion.button
          onClick={onMenuToggle}
          className="p-2 rounded-md bg-white text-gray-700 border border-gray-200
                     lg:hidden relative overflow-hidden"
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
          aria-label="Toggle Menu"
        >
          <motion.div 
            className="absolute inset-0 bg-gray-200 opacity-0"
            initial={{ y: "100%" }}
            whileHover={{ y: 0, opacity: 1, transition: { duration: 0.3 } }}
          />
          <AlignJustify className="h-5 w-5 relative z-10" />
        </motion.button>
        
        {/* Dashboard Title */}
        <h1 className="text-xl font-semibold text-gray-900 tracking-wide">
          Admin Dashboard
        </h1>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-3 p-2 rounded-lg bg-white text-gray-700 border border-gray-200
                       hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 relative overflow-hidden"
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
          >
            <motion.div 
              className="absolute inset-0 bg-gray-200 opacity-0"
              initial={{ x: "100%" }}
              whileHover={{ x: 0, opacity: 1, transition: { duration: 0.3 } }}
            />
            
            {/* User Avatar */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200">
                    <span className="text-sm font-bold text-white">
                      {(user?.firstName || user?.userName || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-gray-200">
                  {isSuperAdmin ? (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  ) : (
                    <Shield className="h-3 w-3 text-blue-500" />
                  )}
                </div>
              </div>
              
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.userName || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">
                  {isSuperAdmin ? 'Super Admin' : 'Administrator'}
                </p>
              </div>
              
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </div>
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isProfileDropdownOpen && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={dropdownVariants}
                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.userName || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    isSuperAdmin 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isSuperAdmin ? (
                      <>
                        <Crown className="mr-1 h-3 w-3" />
                        Super Administrator
                      </>
                    ) : (
                      <>
                        <Shield className="mr-1 h-3 w-3" />
                        Administrator
                      </>
                    )}
                  </span>
                </div>
                
                <button
                  onClick={handleProfileNavigation}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <User className="mr-3 h-4 w-4" />
                  View Profile
                </button>
                
                <button
                  onClick={() => {
                    navigate('/admin/settings');
                    setIsProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </button>
                
                <div className="border-t border-gray-100 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;