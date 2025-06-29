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
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  ArrowRight,
  ShoppingBag,
  Sparkles
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

function FeaturedVideos() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { featuredVideos, isLoading, videoLikes } = useSelector(state => state.shopVideos);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [videosPerSlide, setVideosPerSlide] = useState(3);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [maximizedVideo, setMaximizedVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hoveredVideo, setHoveredVideo] = useState(null);
  
  const videoRefs = useRef({});
  const maximizedVideoRef = useRef(null);

  useEffect(() => {
    dispatch(fetchFeaturedVideos({ limit: 8 }));
  }, [dispatch]);

  // Handle responsive videos per slide
  useEffect(() => {
    const updateVideosPerSlide = () => {
      if (window.innerWidth >= 1024) {
        setVideosPerSlide(3);
      } else if (window.innerWidth >= 768) {
        setVideosPerSlide(2);
      } else {
        setVideosPerSlide(1);
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
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  };

  const handleVideoPlay = async (video, videoRef) => {
    // Track view
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

  const handleLike = async (e, videoId) => {
    e.stopPropagation();
    
    try {
      const guestId = !isAuthenticated ? getGuestId() : null;
      await dispatch(toggleVideoLike({ videoId, guestId }));
    } catch (error) {
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
      <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20"></div>
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 lg:mb-16"
          >
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-yellow-400 mr-2" />
              <span className="text-yellow-400 font-medium tracking-wider uppercase text-sm">
                Exclusive Content
              </span>
              <Sparkles className="h-6 w-6 text-yellow-400 ml-2" />
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-4">
              Featured
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent ml-3">
                Reels
              </span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Discover the latest trends through exclusive videos from our featured vendors and creators
            </p>
          </motion.div>

          {/* Video Carousel */}
          <div className="relative">
            {/* Navigation Arrows */}
            {maxSlides > 1 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 shadow-lg h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300"
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 shadow-lg h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300"
                  onClick={nextSlide}
                  disabled={currentSlide === maxSlides - 1}
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </motion.button>
              </>
            )}

            {/* Video Grid */}
            <div className="px-8 lg:px-16">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                layout
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {currentVideos.map((video, index) => {
                  const videoLike = videoLikes[video._id];
                  const isLiked = videoLike?.isLiked || false;
                  const likeCount = videoLike?.count || video.likeCount || 0;
                  const isPlaying = playingVideo === video._id;

                  return (
                    <motion.div
                      key={video._id}
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ y: -10, scale: 1.02 }}
                      className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 shadow-2xl"
                      onMouseEnter={() => setHoveredVideo(video._id)}
                      onMouseLeave={() => setHoveredVideo(null)}
                    >
                      {/* Video Container */}
                      <div className="relative aspect-[9/16] max-h-96 overflow-hidden rounded-t-2xl">
                        <video
                          ref={(el) => videoRefs.current[video._id] = el}
                          src={video.videoUrl}
                          poster={video.thumbnailUrl}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loop
                          playsInline
                          muted={isMuted}
                          onEnded={() => setPlayingVideo(null)}
                        />
                        
                        {/* Video Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        
                        {/* Play/Pause Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`${
                              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                            } transition-all duration-300 bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 rounded-full p-4 shadow-xl`}
                            onClick={() => {
                              const videoRef = videoRefs.current[video._id];
                              if (isPlaying) {
                                handleVideoPause(video._id, videoRef);
                              } else {
                                handleVideoPlay(video, videoRef);
                              }
                            }}
                          >
                            {isPlaying ? (
                              <Pause className="h-8 w-8 text-white fill-current" />
                            ) : (
                              <Play className="h-8 w-8 text-white fill-current ml-1" />
                            )}
                          </motion.button>
                        </div>
                        
                        {/* Top Controls */}
                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                          <div className="flex gap-2">
                            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              LIVE
                            </div>
                            <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
                              {video.category?.toUpperCase()}
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full p-2 transition-all duration-300"
                            onClick={() => handleMaximize(video)}
                          >
                            <Maximize2 className="h-4 w-4 text-white" />
                          </motion.button>
                        </div>
                        
                        {/* Bottom Controls */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded border border-white/20 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(video.duration)}
                              </div>
                              <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded border border-white/20 flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {formatViews(video.views)}
                              </div>
                            </div>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => handleLike(e, video._id)}
                              className={`p-2 rounded-full border transition-all duration-300 ${
                                isLiked 
                                  ? 'bg-red-500 text-white border-red-500 scale-110' 
                                  : 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      {/* Video Info - Clickable for vendor */}
                      <motion.div 
                        className="p-6 cursor-pointer transition-all duration-300 hover:bg-white/5"
                        onClick={() => handleVendorClick(video)}
                        whileHover={{ scale: 1.02 }}
                      >
                        <h3 className="font-bold text-white mb-3 line-clamp-2 text-lg leading-tight group-hover:text-yellow-400 transition-colors">
                          {video.title}
                        </h3>
                        
                        {video.description && (
                          <p className="text-gray-300 mb-4 line-clamp-2 text-sm leading-relaxed">
                            {video.description}
                          </p>
                        )}
                        
                        {/* Vendor Info */}
                        {video.vendorId && (
                          <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {video.vendorId.shopName || video.vendorId.userName}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  Click to visit store
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                          </div>
                        )}

                        {/* Stats & Tags */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatViews(video.views)}
                            </span>
                          </div>
                          
                          {video.tags && video.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {video.tags.slice(0, 2).map(tag => (
                                <span
                                  key={tag}
                                  className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded-full border border-white/20"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Slide Indicators */}
            {maxSlides > 1 && (
              <div className="flex justify-center mt-12 space-x-3">
                {Array.from({ length: maxSlides }, (_, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-3 w-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-white w-8 shadow-lg' 
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20"
              onClick={() => navigate('/shop/videos')}
            >
              <span className="flex items-center gap-2">
                View All Videos
                <ArrowRight className="h-5 w-5" />
              </span>
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
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
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

export default FeaturedVideos; 