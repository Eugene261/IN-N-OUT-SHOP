import React, { useState, useEffect } from 'react';

/**
 * LazyImage component for optimized image loading
 * 
 * Features:
 * - Lazy loading with placeholder
 * - Blur-up effect when image loads
 * - Fallback for failed image loads
 * - Support for responsive images
 */
const LazyImage = ({
  src,
  alt,
  className = '',
  placeholderSrc = '',
  fallbackSrc = '',
  width,
  height,
  eager = false,
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Determine which image source to use
  const imageSrc = error && fallbackSrc ? fallbackSrc : src;
  
  // Reset state when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);
  
  // Handle successful image load
  const handleLoad = (e) => {
    setLoaded(true);
    onLoad(e);
  };
  
  // Handle image load error
  const handleError = (e) => {
    setError(true);
    if (!fallbackSrc) {
      console.error(`Failed to load image: ${src}`);
    }
    onError(e);
  };
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder or background while loading */}
      {!loaded && (
        <div 
          className="absolute inset-0 bg-gray-200"
          style={{
            backgroundImage: placeholderSrc ? `url(${placeholderSrc})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: placeholderSrc ? 'blur(10px)' : undefined,
            transform: placeholderSrc ? 'scale(1.1)' : undefined
          }}
        />
      )}
      
      {/* Actual image */}
      <img
        src={imageSrc}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: loaded ? 10 : 1
        }}
        {...props}
      />
      
      {/* Error state overlay */}
      {error && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <div className="text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-center">Image not available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
