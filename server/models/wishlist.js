const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Now optional to support guest users
  },
  guestId: {
    type: String,
    required: false // For guest users - stored as UUID or session ID
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    }
  }],
  // Add expiry for guest wishlists
  expiresAt: {
    type: Date,
    default: null // Only set for guest wishlists
  }
}, { timestamps: true });

// Create a compound index to ensure a user can only add a product once
// Modified to handle both authenticated and guest users
wishlistSchema.index({ userId: 1, 'products.productId': 1 }, { 
  unique: true, 
  sparse: true, // Allows multiple null values for userId
  partialFilterExpression: { userId: { $exists: true } }
});

// Index for guest users
wishlistSchema.index({ guestId: 1, 'products.productId': 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { guestId: { $exists: true } }
});

// TTL index for guest wishlist expiration (30 days)
wishlistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure at least one identifier exists (userId or guestId)
wishlistSchema.pre('save', function(next) {
  if (!this.userId && !this.guestId) {
    return next(new Error('Either userId or guestId must be provided'));
  }
  
  // Set expiry for guest wishlists
  if (this.guestId && !this.userId && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  
  next();
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
