import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Package, 
  Star, 
  LogOut, 
  X 
} from 'lucide-react';
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
    id: 'featured',
    label: 'Featured',
    path: '/super-admin/featured',
    icon: <Star className="h-5 w-5" />
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

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 text-gray-900 relative">
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
      
      <div className="p-4 border-b border-gray-200">
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
      
      {/* User info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
            {user?.userName?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.userName || 'Super Admin'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
          </div>
        </div>
      </div>
      
      <motion.div 
        className="flex-1 py-4 space-y-1"
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
            className="flex items-center w-full px-3 py-3 rounded-lg text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3 font-medium">Sign out</span>
          </button>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="p-4 text-center text-xs text-gray-500 border-t border-gray-200"
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
