const Wishlist = require('../models/wishlist');
const Product = require('../models/Products');
const mongoose = require('mongoose');

// Helper function to safely format wishlist items
const formatWishlistItems = (items) => {
  return items
    .filter(item => item.productId !== null) // Filter out null product references
    .map(item => ({
      _id: item._id,
      productId: item.productId._id,
      title: item.productId.title,
      price: item.productId.price,
      salePrice: item.productId.salePrice,
      image: item.productId.image,
      brand: item.productId.brand,
      totalStock: item.productId.totalStock
    }));
};

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
      // Check if product is already in wishlist
      const productExists = wishlist.products.some(
        item => item.productId && item.productId.toString() === productId
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

    // Fetch the updated wishlist with product details
    const updatedWishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'products.productId',
        select: 'title price salePrice image brand totalStock'
      });

    // Format the response data using the helper function
    const formattedData = formatWishlistItems(updatedWishlist.products);

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: formattedData
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

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
      item => item.productId && item.productId.toString() !== productId
    );

    await wishlist.save();

    // Fetch the updated wishlist with product details
    const updatedWishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'products.productId',
        select: 'title price salePrice image brand totalStock'
      });

    // Format the response data using the helper function
    const formattedData = formatWishlistItems(updatedWishlist.products);

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: formattedData
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

    // Find the user's wishlist
    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'products.productId',
        select: 'title price salePrice image brand totalStock'
      });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: 'No wishlist found for this user',
        data: []
      });
    }

    // Format the response data using the helper function
    const formattedData = formatWishlistItems(wishlist.products);

    return res.status(200).json({
      success: true,
      message: 'Wishlist retrieved successfully',
      data: formattedData
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
