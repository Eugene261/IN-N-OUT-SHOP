import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bannerOne from '../../assets/banner-1.webp';
import bannerTwo from '../../assets/banner-2.webp';
import bannerThree from '../../assets/banner-3.webp';

// Default banner images with content
const DEFAULT_BANNERS = [
  {
    id: 'default-1',
    image: bannerOne,
    title: 'Welcome to IN-N-OUT Store',
    subtitle: 'Discover Premium Products at Unbeatable Prices'
  },
  {
    id: 'default-2', 
    image: bannerTwo,
    title: 'Quality You Can Trust',
    subtitle: 'Shop with Confidence - Fast & Secure Delivery'
  },
  {
    id: 'default-3',
    image: bannerThree,
    title: 'New Arrivals Every Week',
    subtitle: 'Stay Updated with Latest Trends & Collections'
  }
];

// Enhanced Image Component with Loading States
const HeroImage = ({ src, alt, isActive }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Loading skeleton */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover object-center transition-all duration-700 ${
          imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={isActive ? "eager" : "lazy"}
      />
      
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  );
};

const EnhancedHeroCarousel = ({ FeatureImageList, isLoading }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();

  // Determine which images to use (featured or default)
  const imagesToUse = FeatureImageList && FeatureImageList.length > 0 
    ? FeatureImageList.map(img => ({ ...img, id: img._id }))
    : DEFAULT_BANNERS;

  // Auto-advance slides
  useEffect(() => {
    if (imagesToUse.length > 1) {
      const interval = setInterval(() => {
        setDirection(1);
        setCurrentSlide(prev => (prev + 1) % imagesToUse.length);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [imagesToUse.length]);

  const goToNextSlide = () => {
    if (imagesToUse && imagesToUse.length > 0) {
      setDirection(1);
      setCurrentSlide(prevSlide => (prevSlide + 1) % imagesToUse.length);
    }
  };

  const goToPrevSlide = () => {
    if (imagesToUse && imagesToUse.length > 0) {
      setDirection(-1);
      setCurrentSlide(prevSlide => (prevSlide - 1 + imagesToUse.length) % imagesToUse.length);
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.6 }
      }
    },
    exit: (direction) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.6 }
      }
    })
  };

  return (
    <motion.div 
      className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] max-h-[500px] overflow-hidden bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Main Slider */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={`slide-${currentSlide}-${imagesToUse[currentSlide]?.id}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <HeroImage
            src={imagesToUse[currentSlide]?.image}
            alt={`Banner ${currentSlide + 1}`}
            isActive={true}
          />
          
          {/* Hero Content Overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <motion.div 
              className="text-center text-white px-4 max-w-4xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <motion.button
                onClick={() => navigate('/shop/listing')}
                className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Shop Now
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {imagesToUse.length > 1 && (
        <>
          <motion.button
            onClick={goToPrevSlide}
            className='absolute top-1/2 left-2 sm:left-6 z-20 transform -translate-y-1/2 p-2 sm:p-3
            rounded-full bg-white/20 backdrop-blur-md shadow-lg border border-white/30
            hover:bg-white/30 transition-all'
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
          </motion.button>

          <motion.button 
            onClick={goToNextSlide}
            className='absolute top-1/2 right-2 sm:right-6 z-20 transform -translate-y-1/2 p-2 sm:p-3
            rounded-full bg-white/20 backdrop-blur-md shadow-lg border border-white/30
            hover:bg-white/30 transition-all'
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
          </motion.button>
        </>
      )}

      {/* Slide Indicators */}
      {imagesToUse.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2 sm:space-x-3">
          {imagesToUse.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1);
                setCurrentSlide(index);
              }}
              className={`h-2 rounded-full transition-all overflow-hidden relative`}
              whileHover={{ scale: 1.1 }}
              animate={{ 
                backgroundColor: index === currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                width: index === currentSlide ? '32px' : '8px'
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedHeroCarousel; 