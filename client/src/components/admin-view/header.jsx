import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlignJustify, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { logoutUser } from '@/store/auth-slice';

function AdminHeader({ onMenuToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/auth/login');
  };

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
        
        {/* Logout Button */}
        <motion.button 
          onClick={handleLogout}
          className="p-2 px-4 rounded-lg bg-white text-gray-700 border border-gray-200
          flex items-center gap-2 focus:outline-none relative overflow-hidden cursor-pointer"
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
        >
          <motion.div 
            className="absolute inset-0 bg-gray-200 opacity-0 "
            initial={{ x: "100%" }}
            whileHover={{ x: 0, opacity: 1, transition: { duration: 0.3 } }}
          />
          <LogOut className="h-5 w-5 relative z-10 " />
          <span className="relative z-10 hidden sm:inline ">Logout</span>
        </motion.button>
      </div>
    </header>
  );
}

export default AdminHeader;