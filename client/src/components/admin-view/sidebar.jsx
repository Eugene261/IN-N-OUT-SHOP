import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Star, X, Truck, Settings, DollarSign, User, CheckCircle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationBadge from '../ui/notification-badge';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />
  },
  {
    id: 'products',
    label: 'Products',
    path: '/admin/products',
    icon: <Package className="h-5 w-5" />
  },
  {
    id: 'product-status',
    label: 'Product Status',
    path: '/admin/product-status',
    icon: <CheckCircle className="h-5 w-5" />
  },
  {
    id: 'orders',
    label: 'Orders',
    path: '/admin/orders',
    icon: <ShoppingCart className="h-5 w-5" />
  },
  {
    id: 'shipping-settings',
    label: 'Shipping Settings',
    path: '/admin/shipping-settings',
    icon: <Truck className="h-5 w-5" />
  },
  {
    id: 'vendor-payments',
    label: 'Earnings',
    path: '/admin/vendor-payments',
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    id: 'messaging',
    label: 'Messages',
    path: '/admin/messaging',
    icon: <MessageSquare className="h-5 w-5" />,
    hasNotification: true
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/admin/profile',
    icon: <User className="h-5 w-5" />
  }
];

function AdminSidebar({ onItemClick, onClose }) {
  const location = useLocation();
  
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
        <Link to="/admin/dashboard" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center"
          >
            <svg 
              className="h-6 w-6 text-black group-hover:text-gray-600 transition-colors" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </motion.div>
          <span className="text-lg font-semibold text-black">
            Admin Panel
          </span>
        </Link>
      </div>
      
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
                className={`flex items-center px-3 py-3 rounded-lg relative overflow-hidden transition-colors ${
                  isActive 
                    ? 'bg-gray-100 text-black' 
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                
                <div className={`${isActive ? 'text-black' : 'text-gray-500'}`}>
                  {item.icon}
                </div>
                
                <span className="ml-3 font-medium">{item.label}</span>
                
                {/* Notification badge for messaging */}
                {item.hasNotification && (
                  <NotificationBadge className="ml-auto mr-2" />
                )}
                
                {isActive && (
                  <motion.div 
                    className="absolute right-2 h-2 w-2 rounded-full bg-black"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Footer - Fixed */}
      <motion.div 
        className="flex-shrink-0 p-4 text-center text-xs text-gray-500 border-t border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Admin Portal © {new Date().getFullYear()}
      </motion.div>
    </div>
  );
}

export default AdminSidebar;