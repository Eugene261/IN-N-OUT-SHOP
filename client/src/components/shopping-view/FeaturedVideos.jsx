import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeaturedVideos, toggleVideoLike, trackVideoView } from '@/store/shop/video-slice/index.js';
import { Button } from '../ui/button';
import { Play, Heart, Eye, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  const { featuredVideos, isLoading, videoLikes } = useSelector(state => state.shopVideos);
  const { isAuthenticated } = useSelector(state => state.auth);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [videosPerSlide, setVideosPerSlide] = useState(3);

  useEffect(() => {
    dispatch(fetchFeaturedVideos({ limit: 6 }));
  }, [dispatch]);

  // Handle responsive videos per slide
  useEffect(() => {
    const updateVideosPerSlide = () => {
      if (window.innerWidth >= 1024) {
        setVideosPerSlide(3); // lg: 3 videos
      } else if (window.innerWidth >= 768) {
        setVideosPerSlide(2); // md: 2 videos
      } else {
        setVideosPerSlide(1); // sm: 1 video
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

  const handleVideoClick = async (video) => {
    // Track view
    try {
      await dispatch(trackVideoView(video._id));
    } catch (error) {
      console.error('Error tracking view:', error);
    }

    // For now, just open the video URL in a new tab
    // Later this can be replaced with a video modal
    window.open(video.videoUrl, '_blank');
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

  const nextSlide = () => {
    const maxSlides = Math.ceil(featuredVideos.length / videosPerSlide);
    setCurrentSlide(prev => (prev + 1) % maxSlides);
  };

  const prevSlide = () => {
    const maxSlides = Math.ceil(featuredVideos.length / videosPerSlide);
    setCurrentSlide(prev => (prev - 1 + maxSlides) % maxSlides);
  };

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  if (isLoading || !featuredVideos || featuredVideos.length === 0) {
    return null; // Don't show anything if no videos
  }

  const maxSlides = Math.ceil(featuredVideos.length / videosPerSlide);
  const startIndex = currentSlide * videosPerSlide;
  const currentVideos = featuredVideos.slice(startIndex, startIndex + videosPerSlide);

  return (
    <section className="py-12 lg:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 lg:mb-12"
        >
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
            Featured Vendor Reels
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the latest trends and products through exclusive videos from our featured vendors
          </p>
        </motion.div>

        {/* Video Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          {maxSlides > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-lg h-10 w-10 rounded-full"
                onClick={prevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-lg h-10 w-10 rounded-full"
                onClick={nextSlide}
                disabled={currentSlide === maxSlides - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Video Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            layout
            transition={{ duration: 0.3 }}
          >
            {currentVideos.map((video, index) => {
              const videoLike = videoLikes[video._id];
              const isLiked = videoLike?.isLiked || false;
              const likeCount = videoLike?.count || video.likeCount || 0;

              return (
                <motion.div
                  key={video._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => handleVideoClick(video)}
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-[9/16] max-h-80 overflow-hidden">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 rounded-full p-3">
                        <Play className="h-6 w-6 text-black fill-current" />
                      </div>
                    </div>
                    
                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatDuration(video.duration)}
                    </div>
                    
                    {/* Like Button */}
                    <button
                      onClick={(e) => handleLike(e, video._id)}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
                        isLiked 
                          ? 'bg-red-500 text-white scale-110' 
                          : 'bg-white/80 text-gray-700 hover:bg-white hover:scale-110'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {video.title}
                    </h3>
                    
                    {video.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {formatViews(video.views)}
                        </span>
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {likeCount}
                        </span>
                      </div>
                      
                      {video.vendorId && (
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>{video.vendorId.userName || 'Vendor'}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {video.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {video.tags.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{video.tags.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Slide Indicators */}
          {maxSlides > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: maxSlides }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-200 ${
                    index === currentSlide 
                      ? 'bg-blue-600 w-6' 
                      : 'bg-gray-300 hover:bg-gray-400'
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
          className="text-center mt-8"
        >
          <Button
            variant="outline"
            className="px-8 py-2 hover:bg-black hover:text-white transition-colors"
            onClick={() => {
              // Navigate to videos page - implement routing as needed
              console.log('Navigate to videos page');
            }}
          >
            View All Videos
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturedVideos; 