const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    }
  }],
}, { timestamps: true });

// Create a compound index to ensure a user can only add a product once
wishlistSchema.index({ userId: 1, 'products.productId': 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
