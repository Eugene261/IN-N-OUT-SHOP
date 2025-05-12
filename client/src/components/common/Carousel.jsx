import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Carousel = ({ children, slidesToShow = 4, autoplay = false, autoplaySpeed = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const totalSlides = React.Children.count(children);
  const carouselRef = useRef(null);
  const autoplayTimerRef = useRef(null);

  // Determine how many slides to show based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate actual slides to show based on screen size
  const actualSlidesToShow = isMobile ? 1 : 
                            window.innerWidth < 768 ? 2 : 
                            window.innerWidth < 1024 ? 3 : 
                            slidesToShow;

  // Calculate max index
  const maxIndex = Math.max(0, totalSlides - actualSlidesToShow);

  // Handle autoplay
  useEffect(() => {
    if (autoplay && totalSlides > actualSlidesToShow) {
      autoplayTimerRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => 
          prevIndex >= maxIndex ? 0 : prevIndex + 1
        );
      }, autoplaySpeed);
    }
    
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [autoplay, autoplaySpeed, maxIndex, actualSlidesToShow, totalSlides]);

  // Handle navigation
  const next = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Loop back to the beginning
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(maxIndex); // Loop to the end
    }
  };

  // Touch events for swipe on mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left
      next();
    }

    if (touchStart - touchEnd < -50) {
      // Swipe right
      prev();
    }
  };

  // Calculate translation percentage
  const translateX = -currentIndex * (100 / actualSlidesToShow);

  // Style for the carousel track
  const trackStyle = {
    transform: `translateX(${translateX}%)`,
    display: 'flex',
    transition: 'transform 0.5s ease',
    width: `${(totalSlides / actualSlidesToShow) * 100}%`,
  };

  // Style for individual slides
  const slideStyle = {
    flex: `0 0 ${100 / totalSlides}%`,
    boxSizing: 'border-box',
    padding: '0 8px',
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Navigation Buttons */}
      {totalSlides > actualSlidesToShow && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div 
        className="overflow-hidden"
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={trackStyle}>
          {React.Children.map(children, (child, index) => (
            <div style={slideStyle} className="carousel-slide">
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {totalSlides > actualSlidesToShow && (
        <div className="flex justify-center mt-4 gap-1">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex ? 'bg-black' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
