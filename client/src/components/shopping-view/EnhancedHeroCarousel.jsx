import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Enhanced Media Component with Loading States (supports both images and videos)
const HeroMedia = ({ media, alt, isActive }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const handleMediaLoad = () => {
    setMediaLoaded(true);
  };

  const handleMediaError = () => {
    setMediaError(true);
  };

  const mediaUrl = media?.mediaUrl || media?.image; // Support both new and old format
  const mediaType = media?.mediaType || 'image'; // Default to image for backwards compatibility

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Loading skeleton */}
      {!mediaLoaded && !mediaError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>
      )}
      
      {/* Actual media */}
      {mediaType === 'video' ? (
        <video
          src={mediaUrl}
          className={`w-full h-full object-cover object-center transition-all duration-700 ${
            mediaLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          onLoadedData={handleMediaLoad}
          onError={handleMediaError}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={mediaUrl}
          alt={alt}
          className={`w-full h-full object-cover object-center transition-all duration-700 ${
            mediaLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          onLoad={handleMediaLoad}
          onError={handleMediaError}
          loading={isActive ? "eager" : "lazy"}
        />
      )}
      
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      
      {/* Content overlay if title or description exists */}
      {(media?.title || media?.description) && (
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {media.title && (
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-2 sm:mb-4">
                {media.title}
              </h2>
            )}
            {media.description && (
              <p className="text-lg sm:text-xl lg:text-2xl opacity-90 max-w-2xl">
                {media.description}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Empty State Component
const EmptyHeroState = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center text-gray-500 max-w-md mx-auto px-6"
    >
      <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h3 className="text-xl font-semibold mb-2">No Hero Media</h3>
      <p className="text-gray-600">
        Upload images or videos from the super admin panel to create an engaging hero section
      </p>
      <div className="flex items-center justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          <span>Images</span>
        </div>
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4" />
          <span>Videos</span>
        </div>
      </div>
    </motion.div>
  </div>
);

const EnhancedHeroCarousel = ({ FeatureImageList, isLoading }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();

  // Only use uploaded media - no default banners
  const mediaToUse = FeatureImageList && FeatureImageList.length > 0 
    ? FeatureImageList.filter(media => media.isActive !== false).map(media => ({ ...media, id: media._id }))
    : [];

  // Auto-advance slides only if there are multiple media items
  useEffect(() => {
    if (mediaToUse.length > 1) {
      const interval = setInterval(() => {
        setDirection(1);
        setCurrentSlide(prev => (prev + 1) % mediaToUse.length);
      }, 8000); // Longer interval for videos
      
      return () => clearInterval(interval);
    }
  }, [mediaToUse.length]);

  const goToNextSlide = () => {
    if (mediaToUse && mediaToUse.length > 0) {
      setDirection(1);
      setCurrentSlide(prevSlide => (prevSlide + 1) % mediaToUse.length);
    }
  };

  const goToPrevSlide = () => {
    if (mediaToUse && mediaToUse.length > 0) {
      setDirection(-1);
      setCurrentSlide(prevSlide => (prevSlide - 1 + mediaToUse.length) % mediaToUse.length);
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

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[80vh] max-h-[800px] overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>
      </div>
    );
  }

  // If no media, show empty state
  if (mediaToUse.length === 0) {
    return (
      <div className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[80vh] max-h-[800px] overflow-hidden">
        <EmptyHeroState />
      </div>
    );
  }

  return (
    <motion.div 
      className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[80vh] max-h-[800px] overflow-hidden bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Main Slider */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={`slide-${currentSlide}-${mediaToUse[currentSlide]?.id}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <HeroMedia
            media={mediaToUse[currentSlide]}
            alt={`Hero media ${currentSlide + 1}`}
            isActive={true}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {mediaToUse.length > 1 && (
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
      {mediaToUse.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2 sm:space-x-3">
          {mediaToUse.map((media, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1);
                setCurrentSlide(index);
              }}
              className={`h-2 rounded-full transition-all overflow-hidden relative flex items-center`}
              whileHover={{ scale: 1.1 }}
              animate={{ 
                backgroundColor: index === currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                width: index === currentSlide ? '32px' : '8px'
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Small icon indicator for media type */}
              {index === currentSlide && media.mediaType === 'video' && (
                <Video className="w-3 h-3 text-gray-800 ml-1" />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Media type indicator */}
      {mediaToUse.length > 0 && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-black/30 backdrop-blur-sm rounded-full p-2">
            {mediaToUse[currentSlide]?.mediaType === 'video' ? (
              <Video className="w-4 h-4 text-white" />
            ) : (
              <ImageIcon className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedHeroCarousel; 