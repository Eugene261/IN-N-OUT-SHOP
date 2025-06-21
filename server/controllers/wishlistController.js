const Wishlist = require('../models/wishlist');
const Product = require('../models/Products');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Utility function to generate or get guest ID
const getGuestId = (req) => {
  if (!req.session.guestId) {
    req.session.guestId = uuidv4();
  }
  return req.session.guestId;
};

// Helper function to get formatted wishlist items (moved to top)
async function getFormattedWishlistItems(userIdentifier) {
  try {
    // Find the wishlist
    const wishlist = await Wishlist.findOne(userIdentifier);
    
    if (!wishlist) {
      return [];
    }
    
    if (!wishlist.products || !Array.isArray(wishlist.products) || wishlist.products.length === 0) {
      return [];
    }

    // Clean up any invalid product references
    const validProductIds = wishlist.products
      .filter(item => {
        return item && item.productId && mongoose.Types.ObjectId.isValid(item.productId);
      })
      .map(item => item.productId);

    if (validProductIds.length === 0) {
      return [];
    }

    // Fetch all products in one query
    const products = await Product.find({
      _id: { $in: validProductIds }
    }).select('title price salePrice image brand totalStock');

    // Create a map for quick lookup
    const productMap = {};
    products.forEach(product => {
      productMap[product._id.toString()] = product;
    });

    // Update wishlist to remove references to deleted products
    const validWishlistItems = wishlist.products.filter(item => {
      return item && 
             item.productId && 
             mongoose.Types.ObjectId.isValid(item.productId) && 
             productMap[item.productId.toString()];
    });

    // If we found invalid items, update the wishlist
    if (validWishlistItems.length !== wishlist.products.length) {
      wishlist.products = validWishlistItems;
      await wishlist.save();
    }

    // Format the response data
    const formattedItems = validWishlistItems.map((item) => {
      const product = productMap[item.productId.toString()];
      
      return {
        _id: item._id,
        productId: product._id,
        title: product.title || 'Unknown',
        price: product.price || 0,
        salePrice: product.salePrice || 0,
        image: product.image || '',
        brand: product.brand || '',
        totalStock: product.totalStock || 0
      };
    });

    return formattedItems;
  } catch (error) {
    console.error('Error getting formatted wishlist items:', error);
    return [];
  }
}

// Add a product to wishlist (supports both authenticated and guest users)
const addToWishlist = async (req, res) => {
  try {
    const { userId, productId, guestId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Determine user identification - prefer userId if available, otherwise use guestId
    let userIdentifier = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userIdentifier.userId = userId;
    } else {
      // For guest users, use provided guestId or generate/get from session
      const guestIdentifier = guestId || getGuestId(req);
      userIdentifier.guestId = guestIdentifier;
    }

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Product ID'
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

    // Find the user's wishlist or create a new one
    let wishlist = await Wishlist.findOne(userIdentifier);

    if (!wishlist) {
      // Create new wishlist
      wishlist = new Wishlist({
        ...userIdentifier,
        products: [{ productId }]
      });
    } else {
      // Clean up any null product references first
      wishlist.products = wishlist.products.filter(item => 
        item && item.productId && mongoose.Types.ObjectId.isValid(item.productId)
      );
      
      // Check if product is already in wishlist
      const productExists = wishlist.products.some(
        item => item.productId.toString() === productId
      );

      if (productExists) {
        return res.status(400).json({
          success: false,
          message: 'Product already in wishlist'
        });
      }

      // Add product to wishlist
      wishlist.products.push({ productId });
    }

    await wishlist.save();

    // Get product details for response
    const productDetails = {
      _id: product._id,
      title: product.title,
      price: product.price,
      salePrice: product.salePrice,
      image: product.image,
      brand: product.brand,
      totalStock: product.totalStock
    };

    // Return guest ID in response if this is a guest user
    const responseData = {
      success: true,
      message: 'Product added to wishlist',
      data: [productDetails]
    };

    if (userIdentifier.guestId) {
      responseData.guestId = userIdentifier.guestId;
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
      error: error.message
    });
  }
};

// Remove a product from wishlist (supports both authenticated and guest users)
const removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { guestId } = req.query; // Guest ID passed as query parameter

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Determine user identification
    let userIdentifier = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userIdentifier.userId = userId;
    } else {
      // For guest users, use provided guestId or get from session
      const guestIdentifier = guestId || req.session.guestId;
      if (!guestIdentifier) {
        return res.status(400).json({
          success: false,
          message: 'Guest ID is required for non-authenticated users'
        });
      }
      userIdentifier.guestId = guestIdentifier;
    }

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Product ID'
      });
    }

    // Find the user's wishlist
    const wishlist = await Wishlist.findOne(userIdentifier);

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Remove product from wishlist and also clean up any null references
    wishlist.products = wishlist.products.filter(item => 
      item && 
      item.productId && 
      mongoose.Types.ObjectId.isValid(item.productId) && 
      item.productId.toString() !== productId
    );

    await wishlist.save();

    // Get the updated wishlist items
    const updatedWishlistItems = await getFormattedWishlistItems(userIdentifier);

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: updatedWishlistItems
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist',
      error: error.message
    });
  }
};

// Get user's wishlist (supports both authenticated and guest users)
const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { guestId } = req.query; // Guest ID passed as query parameter

    // Determine user identification
    let userIdentifier = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userIdentifier.userId = userId;
    } else {
      // For guest users, use provided guestId or get from session
      const guestIdentifier = guestId || req.session.guestId;
      if (!guestIdentifier) {
      return res.status(400).json({
        success: false,
          message: 'Guest ID is required for non-authenticated users'
      });
    }
      userIdentifier.guestId = guestIdentifier;
    }

    // Get formatted wishlist items
    const wishlistItems = await getFormattedWishlistItems(userIdentifier);

      return res.status(200).json({
        success: true,
        message: 'Wishlist retrieved successfully',
        data: wishlistItems
      });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
      error: error.message
    });
  }
};

// Migrate guest wishlist to user account when user logs in
const migrateGuestWishlist = async (req, res) => {
  try {
    const { userId, guestId } = req.body;

    if (!userId || !guestId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Guest ID are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID'
      });
    }

    // Find guest wishlist
    const guestWishlist = await Wishlist.findOne({ guestId });
    if (!guestWishlist || !guestWishlist.products.length) {
      return res.status(200).json({
        success: true,
        message: 'No guest wishlist found to migrate',
        data: []
      });
    }

    // Find or create user wishlist
    let userWishlist = await Wishlist.findOne({ userId });
    
    if (!userWishlist) {
      // Create new user wishlist with guest items
      userWishlist = new Wishlist({
        userId,
        products: guestWishlist.products
      });
    } else {
      // Merge guest items with user wishlist, avoiding duplicates
      const existingProductIds = userWishlist.products.map(item => 
        item.productId.toString()
      );
      
      const newProducts = guestWishlist.products.filter(item =>
        !existingProductIds.includes(item.productId.toString())
      );
      
      userWishlist.products.push(...newProducts);
    }

    await userWishlist.save();

    // Delete guest wishlist
    await Wishlist.deleteOne({ guestId });

    // Get formatted wishlist items
    const wishlistItems = await getFormattedWishlistItems({ userId });

    return res.status(200).json({
      success: true,
      message: 'Guest wishlist migrated successfully',
      data: wishlistItems
    });
  } catch (error) {
    console.error('Error migrating guest wishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to migrate guest wishlist',
      error: error.message
    });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  migrateGuestWishlist
};
