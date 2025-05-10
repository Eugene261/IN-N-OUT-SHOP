import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getReviews } from '../../store/shop/review-slice/index';
import { StarIcon } from 'lucide-react';

// Helper function to generate stars
const Stars = ({ rating }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`w-5 h-5 ${
            star <= rating
              ? 'fill-yellow-400 stroke-yellow-500'
              : 'stroke-gray-300'
          }`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
};

function ReviewsDisplay({ productId }) {
  const dispatch = useDispatch();
  const { reviews, isLoading, error } = useSelector((state) => state.shopReview);

  useEffect(() => {
    if (productId) {
      dispatch(getReviews(productId));
    }
  }, [dispatch, productId]);

  if (isLoading) {
    return <div className="text-center py-6">Loading reviews...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-600">
        {error}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No reviews yet. Be the first to review this product!
      </div>
    );
  }

  // Calculate average rating
  const averageRating = 
    reviews.reduce((sum, review) => sum + review.reviewValue, 0) / reviews.length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>
        <div className="flex items-center gap-2">
          <Stars rating={Math.round(averageRating)} />
          <span className="text-lg font-medium">
            {averageRating.toFixed(1)} out of 5
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review._id} className="border-b pb-4 last:border-0">
            <div className="flex justify-between mb-2">
              <div className="font-medium">{review.userName}</div>
              <div className="text-gray-500 text-sm">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="mb-2">
              <Stars rating={review.reviewValue} />
            </div>
            <p className="text-gray-700">{review.reviewMessage}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReviewsDisplay;