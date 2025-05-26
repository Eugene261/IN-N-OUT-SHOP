import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Announcement messages to display in the sliding carousel
const announcements = [
  "Deliveries fees may vary based on the vendor and your location",
  "New arrivals every week - Check back often!",
  "5-day returns on all purchases",
  "Sign up for our newsletter and get 10% off your first order"
];

const Topbar = () => {
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-rotate through announcements
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentAnnouncementIndex((prevIndex) => 
          prevIndex === announcements.length - 1 ? 0 : prevIndex + 1
        );
        setIsAnimating(false);
      }, 500); // Match this with the exit animation duration
    }, 5000); // Change announcement every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='bg-gradient-to-r from-blue-900 to-indigo-900 py-2 overflow-hidden'>
      <div className='container mx-auto px-4 lg:px-8'>
        <div className='relative h-6 overflow-hidden'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentAnnouncementIndex}
              className='absolute inset-0 flex items-center justify-center text-white text-sm font-medium'
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {announcements[currentAnnouncementIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Topbar;