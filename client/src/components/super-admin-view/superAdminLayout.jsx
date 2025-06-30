import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import SuperAdminSidebar from './superAdminSidebar';
import { Menu, Crown, User, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutUser } from '@/store/auth-slice';
import NotificationBell from '../ui/notification-bell';
import FloatingMessageButton from '../common/messaging/FloatingMessageButton';
import MessageWidget from '../common/messaging/MessageWidget';

const SuperAdminLayout = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messageWidgetOpen, setMessageWidgetOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const sidebarRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Check if we're on the messages page
  const isOnMessagesPage = location.pathname.includes('/messages');
  
  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleMessageWidget = () => {
    // Check screen size
    const isDesktop = window.innerWidth >= 1024; // lg breakpoint
    
    if (isDesktop) {
      // On desktop, navigate to full page messaging
      navigate('/super-admin/messages');
    } else {
      // On mobile, use widget
      setMessageWidgetOpen(prev => !prev);
    }
  };

  const closeMessageWidget = () => {
    setMessageWidgetOpen(false);
  };

  const handleProfileNavigation = () => {
    navigate('/super-admin/profile');
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/auth/login');
    setIsProfileDropdownOpen(false);
  };

  // Animation variants
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
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}
      
      {/* Mobile sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
      >
        <SuperAdminSidebar 
          onItemClick={closeSidebar} 
          onClose={closeSidebar}
        />
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 bg-white border-r border-gray-200">
          <SuperAdminSidebar />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="bg-white border-b border-gray-200 lg:hidden flex-shrink-0 shadow-sm sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </button>
            <div className="text-lg font-semibold text-blue-600">SuperAdmin</div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              
              {/* Mobile Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="relative flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="relative">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.userName || 'Super Admin'}
                        className="h-8 w-8 rounded-full object-cover border-2 border-yellow-200 flex-shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-medium flex-shrink-0 shadow-sm border-2 border-yellow-200">
                        {(user?.firstName || user?.userName || 'S').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-yellow-200">
                      <Crown className="h-3 w-3 text-yellow-500" />
                    </div>
                  </div>
                  <ChevronDown 
                    className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${
                      isProfileDropdownOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Mobile Dropdown Menu */}
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
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.userName || 'Super Admin'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-yellow-100 text-yellow-800">
                          <Crown className="mr-1 h-3 w-3" />
                          Super Administrator
                        </span>
                      </div>
                      
                      <button
                        onClick={handleProfileNavigation}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="mr-3 h-4 w-4" />
                        View Profile
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
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden lg:block bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">Super Admin Dashboard</div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              
              {/* Desktop Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.userName || 'Super Admin'}
                    </div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <div className="relative">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.userName || 'Super Admin'}
                        className="h-10 w-10 rounded-full object-cover border-2 border-yellow-200 flex-shrink-0 shadow-sm group-hover:border-yellow-300 transition-colors"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-medium flex-shrink-0 shadow-sm border-2 border-yellow-200 group-hover:border-yellow-300 transition-colors">
                        {(user?.firstName || user?.userName || 'S').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-yellow-200">
                      <Crown className="h-4 w-4 text-yellow-500" />
                    </div>
                  </div>
                  <ChevronDown 
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      isProfileDropdownOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Desktop Dropdown Menu */}
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={dropdownVariants}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.userName || 'Super Admin'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-yellow-100 text-yellow-800">
                          <Crown className="mr-1 h-3 w-3" />
                          Super Administrator
                        </span>
                      </div>
                      
                      <button
                        onClick={handleProfileNavigation}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="mr-3 h-4 w-4" />
                        View Profile
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
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-hidden bg-gray-50 min-h-0">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Message Widget - Only show when NOT on messages page */}
      {!isOnMessagesPage && (
        <FloatingMessageButton 
          isOpen={messageWidgetOpen}
          onClick={toggleMessageWidget}
        />
      )}
      {/* Only show widget on mobile and when not on messages page */}
      {!isOnMessagesPage && window.innerWidth < 1024 && (
        <MessageWidget 
          isOpen={messageWidgetOpen}
          onClose={closeMessageWidget}
        />
      )}
    </div>
  );
};

export default SuperAdminLayout;
