const ProductReview = require('../../models/review');
const Product = require('../../models/Products');
const Order = require('../../models/Order');

// Add a new review
const addProductReview = async (req, res) => {
  try {
    const {
      productId,
      userId,
      userName,
      reviewMessage,
      reviewValue
    } = req.body;

    // Validate input
    if (!productId || !userId || !userName || !reviewMessage || !reviewValue) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify purchase - FIXED: Check for all valid order statuses
    const order = await Order.findOne({
      userId,
      'cartItems.productId': productId,
      orderStatus: { $in: ['paid', 'confirmed', 'shipped', 'delivered', 'processing'] }
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'You need to purchase this product to review it.'
      });
    }

    // Check for existing review
    const checkExistingReview = await ProductReview.findOne({ productId, userId });

    if (checkExistingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product!'
      });
    }

    // Create new review
    const newReview = new ProductReview({
      productId,
      userId,
      userName,
      reviewMessage,
      reviewValue
    });

    await newReview.save();

    // Update product average review score
    const reviews = await ProductReview.find({ productId });
    const totalReviewsLength = reviews.length;

    const averageReview = reviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) / totalReviewsLength;

    await Product.findByIdAndUpdate(productId, { 
      averageReview,
      totalReviews: totalReviewsLength 
    });

    res.status(201).json({
      success: true,
      data: newReview
    });

  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding the review',
      error: error.message
    });
  }
};

// Get all product reviews without pagination
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get all reviews sorted by newest first
    const reviews = await ProductReview.find({ productId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
      totalReviews: reviews.length
    });

  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching reviews',
      error: error.message
    });
  }
};

module.exports = {
  addProductReview,
  getProductReviews,
};