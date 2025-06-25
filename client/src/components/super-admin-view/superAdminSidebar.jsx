import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {   LayoutDashboard,   Users,   ShoppingBag,   Package,   Star,   LogOut,   X,  DollarSign,  Crown,  FolderTree,  Video, CheckCircle, MessageSquare} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/auth-slice';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/super-admin/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />
  },
  {
    id: 'users',
    label: 'Users',
    path: '/super-admin/users',
    icon: <Users className="h-5 w-5" />
  },
  {
    id: 'orders',
    label: 'Orders',
    path: '/super-admin/orders',
    icon: <ShoppingBag className="h-5 w-5" />
  },
  {
    id: 'products',
    label: 'Products',
    path: '/super-admin/products',
    icon: <Package className="h-5 w-5" />
  },
  {
    id: 'product-approval',
    label: 'Product Approval',
    path: '/super-admin/product-approval',
    icon: <CheckCircle className="h-5 w-5" />
  },
  {
    id: 'featured',
    label: 'Featured',
    path: '/super-admin/featured',
    icon: <Star className="h-5 w-5" />
  },
  {
    id: 'videos',
    label: 'Videos',
    path: '/super-admin/videos',
    icon: <Video className="h-5 w-5" />
  },
  {
    id: 'taxonomy',
    label: 'Taxonomy',
    path: '/super-admin/taxonomy',
    icon: <FolderTree className="h-5 w-5" />
  },
  {
    id: 'messaging',
    label: 'Messages',
    path: '/super-admin/messaging',
    icon: <MessageSquare className="h-5 w-5" />
  },
  {
    id: 'vendor-payments',
    label: 'Vendor Payments',
    path: '/super-admin/vendor-payments',
    icon: <DollarSign className="h-5 w-5" />
  }
];

function SuperAdminSidebar({ onItemClick, onClose }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const handleLogout = () => {
    dispatch(logoutUser());
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    hover: {
      scale: 1.02,
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  const closeButtonVariants = {
    hover: { 
      scale: 1.1,
      rotate: 90,
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.9 }
  };

  const userInfoVariants = {
    hover: {
      backgroundColor: "rgba(59, 130, 246, 0.05)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  // Check if profile page is active
  const isProfileActive = location.pathname.includes('/super-admin/profile');

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 text-gray-900 relative overflow-hidden">
      {/* Close button - only visible on mobile */}
      <motion.button
        className="lg:hidden absolute top-4 right-4 p-1.5 rounded-full text-gray-500 hover:text-black z-10"
        onClick={onClose}
        whileHover="hover"
        whileTap="tap"
        variants={closeButtonVariants}
        aria-label="Close sidebar"
      >
        <X className="h-5 w-5" />
      </motion.button>
      
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <Link to="/super-admin/dashboard" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center"
          >
            <svg 
              className="h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </motion.div>
          <span className="text-lg font-semibold text-blue-600">
            SuperAdmin
          </span>
        </Link>
      </div>
      
      {/* User info - Fixed */}
      <motion.div 
        className="flex-shrink-0 p-4 border-b border-gray-200"
        whileHover="hover"
        whileTap="tap"
        variants={userInfoVariants}
      >
        <Link 
          to="/super-admin/profile" 
          onClick={() => onItemClick && onItemClick()}
          className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer relative ${
            isProfileActive 
              ? 'bg-yellow-50 border border-yellow-200' 
              : 'hover:bg-blue-50'
          }`}
        >
          {isProfileActive && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-r"></div>
          )}
          
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-medium relative">
            {user?.userName?.charAt(0).toUpperCase() || 'S'}
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
              <Crown className="h-3 w-3 text-yellow-500" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${
              isProfileActive ? 'text-yellow-800' : 'text-gray-900'
            }`}>
              {user?.userName || 'Super Admin'}
            </p>
            <p className={`text-xs truncate ${
              isProfileActive ? 'text-yellow-600' : 'text-gray-500'
            }`}>
              {user?.email || 'admin@example.com'}
            </p>
            <p className="text-xs text-yellow-600 font-medium">
              Click to view profile
            </p>
          </div>
          
          {isProfileActive && (
            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
          )}
        </Link>
      </motion.div>
      
      {/* Scrollable Menu Section */}
      <motion.div 
        className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {menuItems.map(item => {
          const isActive = location.pathname.includes(item.id);
          
          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              className="px-3"
            >
              <Link
                to={item.path}
                onClick={() => onItemClick && onItemClick()}
                className={`flex items-center px-3 py-3 rounded-lg relative overflow-hidden ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                
                <div className={`${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.icon}
                </div>
                
                <span className="ml-3 font-medium">{item.label}</span>
                
                {isActive && (
                  <motion.div 
                    className="absolute right-2 h-2 w-2 rounded-full bg-blue-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
        
        {/* Logout button */}
        <motion.div
          variants={itemVariants}
          whileHover="hover"
          whileTap="tap"
          className="px-3 mt-4"
        >
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3 font-medium">Sign out</span>
          </button>
        </motion.div>
      </motion.div>
      
      {/* Footer - Fixed */}
      <motion.div 
        className="flex-shrink-0 p-4 text-center text-xs text-gray-500 border-t border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        SuperAdmin Portal © {new Date().getFullYear()}
      </motion.div>
    </div>
  );
}

export default SuperAdminSidebar;
