import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Package, 
  Star, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown 
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '@/store/auth-slice';
import NotificationBell from '../ui/notification-bell';

const SuperAdminNavbar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const handleLogout = () => {
    dispatch(logoutUser());
  };
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const navLinks = [
    {
      name: 'Dashboard',
      path: '/super-admin/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      name: 'Users',
      path: '/super-admin/users',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Orders',
      path: '/super-admin/orders',
      icon: <ShoppingBag className="h-5 w-5" />
    },
    {
      name: 'Products',
      path: '/super-admin/products',
      icon: <Package className="h-5 w-5" />
    },
    {
      name: 'Featured',
      path: '/super-admin/featured',
      icon: <Star className="h-5 w-5" />
    }
  ];
  
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/super-admin/dashboard" className="text-xl font-bold text-blue-600">
                SuperAdmin
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive(link.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } transition-colors`}
                >
                  {link.icon}
                  <span className="ml-2">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* User Menu and Mobile Menu Button */}
          <div className="flex items-center">
            {/* Notification Bell */}
            <NotificationBell className="mr-3" />
            
            {/* User Menu */}
            <div className="ml-3 relative">
              <div>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {user?.userName?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <span className="ml-2 text-gray-700 font-medium hidden sm:block">
                    {user?.userName || 'Super Admin'}
                  </span>
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
                </button>
              </div>
              
              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                >
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <p className="font-medium">{user?.userName || 'Super Admin'}</p>
                      <p className="text-gray-500 text-xs mt-1">{user?.email || 'admin@example.com'}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="ml-3 sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
          className="sm:hidden"
        >
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-4 py-2 text-base font-medium ${
                  isActive(link.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                } transition-colors`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.icon}
                <span className="ml-3">{link.name}</span>
              </Link>
            ))}
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Sign out</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SuperAdminNavbar;
