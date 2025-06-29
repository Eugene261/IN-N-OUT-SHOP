import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchFeaturedVideos, toggleVideoLike, trackVideoView } from '@/store/shop/video-slice/index.js';
import { 
  Play, 
  Pause, 
  Heart, 
  Eye, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  X, 
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

// Helper function to generate guest ID
const getGuestId = () => {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
};

function EnhancedFeaturedVideos() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { featuredVideos, isLoading, videoLikes } = useSelector(state => state.shopVideos);
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  const [playingVideo, setPlayingVideo] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [maximizedVideo, setMaximizedVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  
  const videoRefs = useRef({});
  const maximizedVideoRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchFeaturedVideos({ limit: 8 }));
  }, [dispatch]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  const handleVideoPlay = async (video, videoRef) => {
    try {
      await dispatch(trackVideoView(video._id));
    } catch (error) {
      console.error('Error tracking view:', error);
    }

    // Stop other playing videos
    Object.values(videoRefs.current).forEach(ref => {
      if (ref && ref !== videoRef && !ref.paused) {
        ref.pause();
      }
    });

    setPlayingVideo(video._id);
    if (videoRef) {
      videoRef.muted = isMuted;
      videoRef.play();
    }
  };

  const handleVideoPause = (videoId, videoRef) => {
    setPlayingVideo(null);
    if (videoRef) {
      videoRef.pause();
    }
  };

  const handleMaximize = (video) => {
    setMaximizedVideo(video);
    setIsMaximized(true);
    setPlayingVideo(video._id);
  };

  const handleMinimize = () => {
    setIsMaximized(false);
    setMaximizedVideo(null);
    setPlayingVideo(null);
    if (maximizedVideoRef.current) {
      maximizedVideoRef.current.pause();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // Update all video refs
    Object.values(videoRefs.current).forEach(ref => {
      if (ref) {
        ref.muted = !isMuted;
      }
    });
    
    // Update maximized video ref
    if (maximizedVideoRef.current) {
      maximizedVideoRef.current.muted = !isMuted;
    }
    
    toast.success(isMuted ? 'Sound enabled' : 'Sound muted', { duration: 1000 });
  };

  const handleLike = async (e, videoId) => {
    if (e) e.stopPropagation();
    
    try {
      const payload = { videoId };
      
      if (isAuthenticated && user) {
        payload.userId = user.id || user._id;
      } else {
        payload.guestId = getGuestId();
      }

      const result = await dispatch(toggleVideoLike(payload)).unwrap();
      
      if (result.isLiked) {
        toast.success('Video liked!', { duration: 1500 });
      } else {
        toast.success('Like removed', { duration: 1500 });
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleVendorClick = (video) => {
    if (video.vendorId) {
      // Navigate to listing page filtered by vendor's shop
      const shopName = video.vendorId.shopName || video.vendorId.userName;
      if (shopName) {
        navigate(`/shop/listing?shop=${encodeURIComponent(shopName)}`);
      } else {
        toast.info('Vendor information not complete');
      }
    } else {
      toast.info('This is general content - no specific vendor');
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth >= 1024 ? 400 : 320; // Larger scroll for taller cards
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading || !featuredVideos || featuredVideos.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-8 lg:py-12 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          {/* Enhanced Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <span className="inline-block text-sm font-bold tracking-widest uppercase text-gray-500 mb-2">Trending Now</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Featured Vendor Reels</h2>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => scroll('left')}
                className="p-1.5 sm:p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-1.5 sm:p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>
          </motion.div>

          {/* Horizontal Scrolling Video Container */}
          <div className="relative">
            <div 
              ref={scrollContainerRef}
              className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {featuredVideos.map((video, index) => {
                const videoLike = videoLikes[video._id];
                const isLiked = videoLike?.isLiked || false;
                const likeCount = videoLike?.count ?? video.likeCount ?? 0;
                const isPlaying = playingVideo === video._id;
                const isLargeDevice = window.innerWidth >= 1024;

                return (
                  <motion.div
                    key={video._id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex-none group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 w-72 lg:w-80"
                  >
                    {/* Video Container - Responsive dimensions */}
                    <div 
                      className="relative aspect-[3/4] lg:aspect-[3/4] overflow-hidden"
                    >
                      <video
                        ref={(el) => videoRefs.current[video._id] = el}
                        src={video.videoUrl}
                        poster={video.thumbnailUrl}
                        className="w-full h-full object-cover"
                        loop
                        playsInline
                        muted={isMuted}
                        onEnded={() => setPlayingVideo(null)}
                      />
                      
                      {/* Video Overlay */}
                      <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
                        isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`} />
                      
                      {/* Play/Pause Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`${
                            isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                          } transition-all duration-300 bg-white/90 hover:bg-white rounded-full p-3 lg:p-4 shadow-lg`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const videoRef = videoRefs.current[video._id];
                            if (isPlaying) {
                              handleVideoPause(video._id, videoRef);
                            } else {
                              handleVideoPlay(video, videoRef);
                            }
                          }}
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5 lg:h-6 lg:w-6 text-gray-700 fill-current" />
                          ) : (
                            <Play className="h-5 w-5 lg:h-6 lg:w-6 text-gray-700 fill-current ml-0.5" />
                          )}
                        </motion.button>
                      </div>
                      
                      {/* Top Controls - Always visible on mobile, hover on desktop */}
                      <div className={`absolute top-2 left-2 right-2 flex items-start justify-between transition-opacity duration-300 ${
                        isLargeDevice ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                      }`}>
                        <div className="flex gap-1">
                          <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                            FEATURED
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          {/* Like Button - Always visible on all devices */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(e, video._id);
                            }}
                            className={`p-1.5 rounded-full shadow-lg transition-all duration-300 backdrop-blur-sm ${
                              isLiked 
                                ? 'bg-red-500 text-white scale-110' 
                                : 'bg-white/80 text-gray-700 hover:bg-white'
                            }`}
                          >
                            <Heart className={`h-3 w-3 lg:h-4 lg:w-4 ${isLiked ? 'fill-current' : ''}`} />
                          </motion.button>
                          
                          {/* Mute/Unmute Button on each card */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMute();
                            }}
                          >
                            {isMuted ? (
                              <VolumeX className="h-3 w-3 lg:h-4 lg:w-4 text-gray-700" />
                            ) : (
                              <Volume2 className="h-3 w-3 lg:h-4 lg:w-4 text-gray-700" />
                            )}
                          </motion.button>
                          
                          {/* Expand Button - Now visible on all devices */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMaximize(video);
                            }}
                          >
                            <Maximize2 className="h-3 w-3 lg:h-4 lg:w-4 text-gray-700" />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Video Info - Responsive design */}
                    <div className="p-3 lg:p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 lg:mb-2 text-sm lg:text-base leading-tight line-clamp-1">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs lg:text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <span className="flex items-center gap-1">
                            <Heart className={`h-3 w-3 lg:h-4 lg:w-4 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                            {likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                            {formatViews(video.views)}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 lg:h-4 lg:w-4" />
                          {formatDuration(video.duration)}
                        </span>
                      </div>
                      
                      {video.vendorId && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="text-xs lg:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 lg:gap-2 bg-gray-50 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full w-full justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVendorClick(video);
                          }}
                        >
                          <User className="h-3 w-3 lg:h-4 lg:w-4" />
                          {video.vendorId.shopName || video.vendorId.userName}
                          <ArrowRight className="h-3 w-3 lg:h-4 lg:w-4" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Load More Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-start mt-6"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-black hover:bg-gray-900 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              onClick={() => {
                dispatch(fetchFeaturedVideos({ limit: featuredVideos.length + 8 }));
                toast.success('Loading more reels...', { duration: 1500 });
              }}
            >
              <Sparkles className="h-4 w-4" />
              Load More Reels
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Maximized Video Modal */}
      <AnimatePresence>
        {isMaximized && maximizedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleMinimize}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 z-30 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full p-3 transition-all duration-300"
                onClick={handleMinimize}
              >
                <X className="h-6 w-6 text-white" />
              </motion.button>

              {/* Minimize Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-20 z-30 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full p-3 transition-all duration-300"
                onClick={handleMinimize}
              >
                <Minimize2 className="h-6 w-6 text-white" />
              </motion.button>

              {/* Video Player */}
              <video
                ref={maximizedVideoRef}
                src={maximizedVideo.videoUrl}
                poster={maximizedVideo.thumbnailUrl}
                className="w-full h-full object-contain bg-black"
                controls
                autoPlay
                muted={isMuted}
                onPlay={() => setPlayingVideo(maximizedVideo._id)}
                onPause={() => setPlayingVideo(null)}
              />

              {/* Video Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                {/* Hide title, description, and vendor info on mobile to reduce crowding */}
                <div className="hidden md:block">
                  <h3 className="text-white text-2xl font-bold mb-2">{maximizedVideo.title}</h3>
                  {maximizedVideo.description && (
                    <p className="text-gray-300 mb-4">{maximizedVideo.description}</p>
                  )}
                  
                  {maximizedVideo.vendorId && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-lg p-3 transition-all duration-300 flex items-center gap-3"
                      onClick={() => {
                        handleMinimize();
                        handleVendorClick(maximizedVideo);
                      }}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">
                          {maximizedVideo.vendorId.shopName || maximizedVideo.vendorId.userName}
                        </p>
                        <p className="text-gray-400 text-sm">Visit Store</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </motion.button>
                  )}
                </div>
                
                {/* On mobile, show minimal info in top-right corner instead */}
                <div className="md:hidden absolute top-4 right-4">
                  {maximizedVideo.vendorId && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full p-2 transition-all duration-300"
                      onClick={() => {
                        handleMinimize();
                        handleVendorClick(maximizedVideo);
                      }}
                    >
                      <User className="h-4 w-4 text-white" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default EnhancedFeaturedVideos; 