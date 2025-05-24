import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTestimonials, fetchTestimonialStats } from '../../store/shop/testimonials-slice/index';

const CustomerTestimonials = () => {
  const dispatch = useDispatch();
  const { testimonials, testimonialStats, isLoading, error } = useSelector(state => state.testimonials);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch real testimonials and stats on component mount
  useEffect(() => {
    dispatch(fetchTestimonials());
    dispatch(fetchTestimonialStats());
  }, [dispatch]);

  // Use real testimonials or fallback data
  const testimonialsData = testimonials && testimonials.length > 0 ? testimonials : [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Fashion Enthusiast",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b743?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "Amazing quality products and super fast delivery! I've been shopping here for months and never been disappointed. The customer service is exceptional.",
      location: "Accra, Ghana"
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Tech Professional",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The variety of brands and the quality of products exceeded my expectations. Great prices and excellent customer support made this my go-to store.",
      location: "Kumasi, Ghana"
    },
    {
      id: 3,
      name: "Emma Williams",
      role: "Business Owner",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "Love the modern interface and how easy it is to find what I'm looking for. The wishlist feature is fantastic and the checkout process is seamless.",
      location: "Takoradi, Ghana"
    },
    {
      id: 4,
      name: "David Asante",
      role: "Student",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "Best online shopping experience I've had in Ghana! Fast shipping, quality products, and great prices. Highly recommend to everyone!",
      location: "Tamale, Ghana"
    }
  ];

  // Use real stats or fallback data
  const statsData = testimonialStats ? [
    { number: `${testimonialStats.totalReviews}+`, label: "Happy Customers" },
    { number: `${testimonialStats.averageRating}/5`, label: "Average Rating" },
    { number: `${testimonialStats.satisfactionPercentage}%`, label: "Customer Satisfaction" }
  ] : [
    { number: "10,000+", label: "Happy Customers" },
    { number: "4.9/5", label: "Average Rating" },
    { number: "99%", label: "Customer Satisfaction" }
  ];

  useEffect(() => {
    if (testimonialsData.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonialsData.length);
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [testimonialsData.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonialsData.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (error) {
    console.error('Testimonials loading error:', error);
    // Still show the section with fallback data if there's an error
  }

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
              <div className="h-12 bg-gray-300 rounded w-96 mx-auto mb-8"></div>
              <div className="h-96 bg-gray-300 rounded-2xl max-w-4xl mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-gradient-to-br from-blue-50/30 to-purple-50/20"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="testimonials-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#testimonials-grid)" />
          </svg>
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-bold tracking-widest uppercase text-gray-500 mb-3">
            Customer Reviews
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
            What Our Customers Say
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-black to-gray-400 rounded-full mx-auto"></div>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Navigation buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 p-3 rounded-full bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 hover:bg-white hover:text-black transition-all shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 p-3 rounded-full bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 hover:bg-white hover:text-black transition-all shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Testimonial cards */}
          <div className="relative h-96 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-gray-200 shadow-2xl h-full flex flex-col">
                  <div className="flex-1">
                    <Quote className="w-12 h-12 text-blue-500 mb-6 opacity-80" />
                    
                    <p className="text-xl text-gray-700 leading-relaxed mb-8 italic">
                      "{testimonialsData[currentIndex]?.text}"
                    </p>
                    
                    <div className="flex items-center mb-6">
                      {renderStars(testimonialsData[currentIndex]?.rating || 5)}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-0.5 mr-4">
                      <img
                        src={testimonialsData[currentIndex]?.avatar}
                        alt={testimonialsData[currentIndex]?.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">
                        {testimonialsData[currentIndex]?.name}
                      </h4>
                      <p className="text-gray-600">
                        {testimonialsData[currentIndex]?.role}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {testimonialsData[currentIndex]?.location}
                      </p>
                      {testimonialsData[currentIndex]?.productTitle && (
                        <p className="text-blue-500 text-xs mt-1">
                          Purchased: {testimonialsData[currentIndex].productTitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonialsData.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-blue-500 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20"
        >
          {statsData.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 text-lg">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default CustomerTestimonials; 