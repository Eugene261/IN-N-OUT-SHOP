import React, { useState } from 'react';

const RenderImage = ({ src, alt, className, onClick, enableZoom = false }) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  if (imgError || !src) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <span className="text-gray-500">Image not available</span>
      </div>
    );
  }

  const imageClasses = `
    ${className}
    ${isLoading ? 'opacity-0' : 'opacity-100'}
    ${enableZoom ? 'transform transition-transform duration-300 hover:scale-110' : ''}
    transition-opacity duration-300
  `;

  return (
    <div className={`relative ${enableZoom ? 'overflow-hidden' : ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={imageClasses}
        onError={() => {
          setImgError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
        onClick={onClick}
      />
    </div>
  );
};

export default RenderImage; 