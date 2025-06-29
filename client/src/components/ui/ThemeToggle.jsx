import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = "", size = 20 }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 ${className}`}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDark ? 180 : 0,
          scale: isDark ? 0.8 : 1
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {isDark ? (
          <Sun className="text-yellow-500" size={size} />
        ) : (
          <Moon className="text-gray-600 dark:text-gray-300" size={size} />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle; 