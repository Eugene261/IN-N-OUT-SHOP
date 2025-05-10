const Wishlist = require('../models/wishlist');
const Product = require('../models/Products');
const mongoose = require('mongoose');

// Add a product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Product ID are required'
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID or Product ID'
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
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      // Create new wishlist if it doesn't exist
      wishlist = new Wishlist({
        userId,
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

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: [productDetails] // Return just the added product
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
      error: error.message
    });
  }
};

// Remove a product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Product ID are required'
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID or Product ID'
      });
    }

    // Find the user's wishlist
    const wishlist = await Wishlist.findOne({ userId });

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
    const updatedWishlistItems = await getFormattedWishlistItems(userId);

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

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID'
      });
    }

    // Get formatted wishlist items
    const wishlistItems = await getFormattedWishlistItems(userId);

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

// Helper function to get formatted wishlist items
async function getFormattedWishlistItems(userId) {
  try {
    // Find the user's wishlist
    const wishlist = await Wishlist.findOne({ userId });
    
    if (!wishlist || !wishlist.products || !Array.isArray(wishlist.products) || wishlist.products.length === 0) {
      return [];
    }

    // Clean up any invalid product references
    const validProductIds = wishlist.products
      .filter(item => item && item.productId && mongoose.Types.ObjectId.isValid(item.productId))
      .map(item => item.productId);

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
    const validWishlistItems = wishlist.products.filter(item => 
      item && 
      item.productId && 
      mongoose.Types.ObjectId.isValid(item.productId) && 
      productMap[item.productId.toString()]
    );

    // If we found invalid items, update the wishlist
    if (validWishlistItems.length !== wishlist.products.length) {
      wishlist.products = validWishlistItems;
      await wishlist.save();
    }

    // Format the response data
    return validWishlistItems.map(item => {
      const product = productMap[item.productId.toString()];
      if (!product) return null;
      
      return {
        _id: item._id,
        productId: product._id,
        title: product.title,
        price: product.price,
        salePrice: product.salePrice,
        image: product.image,
        brand: product.brand,
        totalStock: product.totalStock
      };
    }).filter(Boolean); // Remove any null items
  } catch (error) {
    console.error('Error getting formatted wishlist items:', error);
    return [];
  }
}
