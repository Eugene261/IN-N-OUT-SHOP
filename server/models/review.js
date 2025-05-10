const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  reviewMessage: {
    type: String,
    required: true
  },
  reviewValue: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index to ensure a user can only review a product once
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const ProductReviewSchema = mongoose.model('Review', reviewSchema);

module.exports = ProductReviewSchema;