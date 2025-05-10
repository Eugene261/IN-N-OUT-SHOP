import { StarIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';

function StarRatingComponent({ initialRating = 0, onRatingChange }) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  // Add this useEffect to handle initialRating changes from parent
  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const handleRatingChange = (starValue) => {
    setRating(starValue);
    if (onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <div className="flex items-center gap-2" role="radiogroup">
      {[1, 2, 3, 4, 5].map((starValue) => (
        <button
          key={starValue}
          type="button" // Explicitly set button type to prevent form submission
          onClick={() => handleRatingChange(starValue)}
          onMouseEnter={() => setHover(starValue)}
          onMouseLeave={() => setHover(0)}
          className="relative p-1 outline-none focus:ring-2 focus:ring-yellow-300 rounded-full"
          role="radio"
          aria-checked={starValue <= rating}
          aria-label={`${starValue} star rating`}
        >
          <div className="relative">
            {/* Base star */}
            <StarIcon
              className={`w-8 h-8 transition-colors duration-150 ${
                starValue <= (hover || rating) 
                  ? 'stroke-yellow-400'
                  : 'stroke-gray-200'
              }`}
            />
            
            {/* Filled overlay */}
            <div 
              className={`absolute inset-0 transition-all duration-300 ${
                starValue <= (hover || rating) 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-95'
              }`}
            >
              <StarIcon
                className="w-8 h-8 fill-yellow-400 stroke-yellow-500"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </button>
      ))}
      
      {/* Rating text display */}
      <span className="text-lg font-medium text-gray-600">
        {rating > 0 && `${rating}/5`}
      </span>
    </div>
  );
}

export default StarRatingComponent;