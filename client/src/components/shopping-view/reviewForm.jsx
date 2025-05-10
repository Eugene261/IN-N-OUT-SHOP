import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import StarRatingComponent from '../common/startRating'
import { addReview } from '../../store/shop/review-slice/index';

function ReviewForm({ productId, userId, userName }) {
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewValue, setReviewValue] = useState(0);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting review:', { productId, userId, userName, reviewMessage, reviewValue });
    
    // Create the review data object
    const reviewData = {
      productId,
      userId,
      userName,
      reviewMessage,
      reviewValue
    };
    
    // Reset form errors/success
    setFormError('');
    setFormSuccess('');
    
    // Validate review data
    if (!reviewMessage.trim()) {
      setFormError('Please enter a review message');
      return;
    }
    
    if (reviewValue === 0) {
      setFormError('Please select a rating');
      return;
    }
    
    // Submit the review
    const resultAction = await dispatch(addReview(reviewData));
    console.log('Result action:', resultAction);
    
    if (addReview.fulfilled.match(resultAction)) {
      console.log('Review submitted successfully');
      setFormSuccess('Your review has been submitted successfully!');
      // Reset form
      setReviewMessage('');
      setReviewValue(0);
    } else {
      console.log('Review submission failed:', resultAction.payload || 'Failed to submit review. Please try again.');
      setFormError(resultAction.payload || 'Failed to submit review. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
      
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {formError}
        </div>
      )}
      
      {formSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {formSuccess}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Your Rating</label>
          <StarRatingComponent 
            initialRating={reviewValue} 
            onRatingChange={setReviewValue} 
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="reviewMessage" className="block text-gray-700 mb-2">
            Your Review
          </label>
          <textarea
            id="reviewMessage"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
            focus:ring-2 focus:ring-blue-500"
            rows="4"
            value={reviewMessage}
            onChange={(e) => setReviewMessage(e.target.value)}
            placeholder="Share your experience with this product..."
          ></textarea>
        </div>
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
          focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit Review
        </button>
      </form>
    </div>
  );
}

export default ReviewForm;