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
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [videosPerSlide, setVideosPerSlide] = useState(3);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [maximizedVideo, setMaximizedVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [doubleTapTimers, setDoubleTapTimers] = useState({});
  
  const videoRefs = useRef({});
  const maximizedVideoRef = useRef(null);

  useEffect(() => {
    dispatch(fetchFeaturedVideos({ limit: 8 }));
  }, [dispatch]);

  // Handle responsive videos per slide
  useEffect(() => {
    const updateVideosPerSlide = () => {
      if (window.innerWidth >= 1024) {
        setVideosPerSlide(3); // Show 3 on large screens with bigger cards
      } else if (window.innerWidth >= 768) {
        setVideosPerSlide(2); // Show 2 on medium screens
      } else {
        setVideosPerSlide(2); // Show 2 on small screens (as requested)
      }
    };

    updateVideosPerSlide();
    window.addEventListener('resize', updateVideosPerSlide);
    return () => window.removeEventListener('resize', updateVideosPerSlide);
  }, []);

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

      await dispatch(toggleVideoLike(payload)).unwrap();
      toast.success('Video liked!', { duration: 1500 });
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to update like status');
    }
  };

  // Handle double tap for mobile devices
  const handleVideoTap = (e, videoId) => {
    const isMobile = window.innerWidth < 1024; // Consider tablet and mobile as mobile
    
    if (!isMobile) return; // Only handle double tap on mobile/tablet
    
    e.preventDefault();
    
    if (doubleTapTimers[videoId]) {
      // Second tap - execute like
      clearTimeout(doubleTapTimers[videoId]);
      setDoubleTapTimers(prev => ({ ...prev, [videoId]: null }));
      handleLike(null, videoId);
    } else {
      // First tap - set timer
      const timer = setTimeout(() => {
        setDoubleTapTimers(prev => ({ ...prev, [videoId]: null }));
      }, 300); // 300ms window for double tap
      
      setDoubleTapTimers(prev => ({ ...prev, [videoId]: timer }));
    }
  };

  const handleVendorClick = (video) => {
    if (video.vendorId) {
      navigate(`/shop/listing?vendor=${video.vendorId._id}`);
    } else {
      toast.info('This is general content - no specific vendor');
    }
  };

  const nextSlide = () => {
    const maxSlides = Math.ceil(featuredVideos.length / videosPerSlide);
    setCurrentSlide(prev => (prev + 1) % maxSlides);
  };

  const prevSlide = () => {
    const maxSlides = Math.ceil(featuredVideos.length / videosPerSlide);
    setCurrentSlide(prev => (prev - 1 + maxSlides) % maxSlides);
  };

  if (isLoading || !featuredVideos || featuredVideos.length === 0) {
    return null;
  }

  const maxSlides = Math.ceil(featuredVideos.length / videosPerSlide);
  const startIndex = currentSlide * videosPerSlide;
  const currentVideos = featuredVideos.slice(startIndex, startIndex + videosPerSlide);

  return (
    <>
      <section className="py-12 lg:py-16 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 lg:mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Play className="h-4 w-4 text-white fill-current" />
                </div>
                <span className="text-gray-600 font-medium tracking-wider uppercase text-sm">
                  Featured Content
                </span>
              </div>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              Featured Vendor Reels
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover the latest trends through exclusive videos from our featured vendors and creators
            </p>
            
            {/* Global Mute/Unmute Button */}
            <div className="flex justify-center mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                  isMuted 
                    ? 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200' 
                    : 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isMuted ? 'Enable Sound' : 'Mute Sound'}
                </span>
              </motion.button>
            </div>
          </motion.div>

          {/* Navigation Arrows */}
          {maxSlides > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-50 border border-gray-200 shadow-lg h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300"
                onClick={prevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-50 border border-gray-200 shadow-lg h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300"
                onClick={nextSlide}
                disabled={currentSlide === maxSlides - 1}
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </motion.button>
            </>
          )}

          {/* Video Grid */}
          <div className="px-4 lg:px-8">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8"
              layout
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {currentVideos.map((video, index) => {
                const videoLike = videoLikes[video._id];
                const isLiked = videoLike?.isLiked || false;
                const likeCount = videoLike?.count || video.likeCount || 0;
                const isPlaying = playingVideo === video._id;
                const isLargeDevice = window.innerWidth >= 1024;

                return (
                  <motion.div
                    key={video._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300"
                  >
                    {/* Video Container - Instagram reels style aspect ratio */}
                    <div 
                      className="relative aspect-[4/5] overflow-hidden cursor-pointer"
                      onClick={(e) => handleVideoTap(e, video._id)}
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
                          } transition-all duration-300 bg-white/90 hover:bg-white rounded-full p-4 shadow-lg`}
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
                            <Pause className="h-6 w-6 text-gray-700 fill-current" />
                          ) : (
                            <Play className="h-6 w-6 text-gray-700 fill-current ml-0.5" />
                          )}
                        </motion.button>
                      </div>
                      
                      {/* Top Controls */}
                      <div className="absolute top-2 left-2 right-2 flex items-start justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex gap-1">
                          <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                            LIVE
                          </div>
                          {video.category && (
                            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                              {video.category?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          {/* Like Button - Always visible on large devices */}
                          {isLargeDevice && (
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
                              <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
                            </motion.button>
                          )}
                          
                          {/* Mute/Unmute Button for individual video */}
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
                              <VolumeX className="h-3 w-3 text-gray-700" />
                            ) : (
                              <Volume2 className="h-3 w-3 text-gray-700" />
                            )}
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMaximize(video);
                            }}
                          >
                            <Maximize2 className="h-3 w-3 text-gray-700" />
                          </motion.button>
                        </div>
                      </div>
                      
                      {/* Double-tap indicator for mobile */}
                      {!isLargeDevice && (
                        <div className="absolute top-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          Double tap ❤️
                        </div>
                      )}
                      
                      {/* Video Info - Single location at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                        <h3 className="font-semibold text-white mb-2 text-sm leading-tight line-clamp-2">
                          {video.title}
                        </h3>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-sm text-gray-300 gap-4">
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {formatViews(video.views)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDuration(video.duration)}
                            </span>
                          </div>
                        </div>
                        
                        {video.vendorId && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="text-sm text-white/90 hover:text-white flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVendorClick(video);
                            }}
                          >
                            <User className="h-4 w-4" />
                            {video.vendorId.shopName || video.vendorId.userName}
                            <ArrowRight className="h-4 w-4" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Slide Indicators */}
          {maxSlides > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: maxSlides }, (_, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-gray-800 w-6' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('/shop/videos')}
            >
              Load More Reels
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
                className="w-full h-full object-contain"
                controls
                autoPlay
                muted={isMuted}
                onPlay={() => setPlayingVideo(maximizedVideo._id)}
                onPause={() => setPlayingVideo(null)}
              />

              {/* Video Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default EnhancedFeaturedVideos; 