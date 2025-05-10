import React from 'react';
import { motion } from 'framer-motion';

export default function ShoppingLoader({ className = '' }) {
  // Define the animation for each letter
  const letterVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: [0.3, 1, 0.3],
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  // Stagger the animation of each letter
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center h-full ${className}`}>
      <motion.div
        className="flex items-center justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* IN-N-OUT text with animation */}
        <div className="text-center">
          <div className="flex items-center justify-center">
            {['I', 'N', '-', 'N', '-', 'O', 'U', 'T'].map((letter, index) => (
              <motion.span
                key={index}
                variants={letterVariants}
                className={`text-3xl font-bold ${letter === '-' ? 'text-gray-500' : 'text-black'}`}
                style={{ display: 'inline-block' }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}