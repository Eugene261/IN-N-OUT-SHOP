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
  console.log('getWishlist called with userId:', req.params.userId);
  try {
    const { userId } = req.params;

    if (!userId) {
      console.log('No userId provided');
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid userId format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID'
      });
    }

    console.log('Calling getFormattedWishlistItems for userId:', userId);
    // Get formatted wishlist items
    try {
      const wishlistItems = await getFormattedWishlistItems(userId);
      console.log('Successfully got wishlist items:', wishlistItems);

      return res.status(200).json({
        success: true,
        message: 'Wishlist retrieved successfully',
        data: wishlistItems
      });
    } catch (innerError) {
      console.error('Error in getFormattedWishlistItems:', innerError);
      throw innerError;
    }
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
  console.log('getFormattedWishlistItems called with userId:', userId);
  try {
    // Find the user's wishlist
    console.log('Finding wishlist for userId:', userId);
    const wishlist = await Wishlist.findOne({ userId });
    console.log('Wishlist found:', wishlist ? 'Yes' : 'No');
    
    if (!wishlist) {
      console.log('No wishlist found for userId:', userId);
      return [];
    }
    
    console.log('Wishlist products:', wishlist.products ? wishlist.products.length : 'null');
    
    if (!wishlist.products || !Array.isArray(wishlist.products) || wishlist.products.length === 0) {
      console.log('No products in wishlist or invalid products array');
      return [];
    }

    // Log each product in the wishlist for debugging
    wishlist.products.forEach((item, index) => {
      console.log(`Wishlist item ${index}:`, {
        exists: !!item,
        hasProductId: item ? !!item.productId : false,
        productId: item && item.productId ? item.productId.toString() : 'null',
        isValidObjectId: item && item.productId ? mongoose.Types.ObjectId.isValid(item.productId) : false
      });
    });

    // Clean up any invalid product references
    const validProductIds = wishlist.products
      .filter(item => {
        const isValid = item && item.productId && mongoose.Types.ObjectId.isValid(item.productId);
        if (!isValid) console.log('Filtering out invalid product reference:', item);
        return isValid;
      })
      .map(item => item.productId);

    console.log('Valid product IDs count:', validProductIds.length);

    // Fetch all products in one query
    console.log('Fetching products from database...');
    const products = await Product.find({
      _id: { $in: validProductIds }
    }).select('title price salePrice image brand totalStock');

    console.log('Products found in database:', products.length);

    // Create a map for quick lookup
    const productMap = {};
    products.forEach(product => {
      productMap[product._id.toString()] = product;
    });

    // Update wishlist to remove references to deleted products
    const validWishlistItems = wishlist.products.filter(item => {
      const isValid = item && 
                      item.productId && 
                      mongoose.Types.ObjectId.isValid(item.productId) && 
                      productMap[item.productId.toString()];
      if (!isValid) console.log('Filtering out wishlist item with invalid/deleted product:', item);
      return isValid;
    });

    console.log('Valid wishlist items count:', validWishlistItems.length);

    // If we found invalid items, update the wishlist
    if (validWishlistItems.length !== wishlist.products.length) {
      console.log('Updating wishlist to remove invalid product references');
      wishlist.products = validWishlistItems;
      await wishlist.save();
      console.log('Wishlist updated successfully');
    }

    // Format the response data
    console.log('Formatting response data...');
    const formattedItems = validWishlistItems.map((item, index) => {
      try {
        const product = productMap[item.productId.toString()];
        if (!product) {
          console.log(`Item ${index}: No product found in map for ID ${item.productId}`);
          return null;
        }
        
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
      } catch (err) {
        console.error(`Error formatting item ${index}:`, err);
        return null;
      }
    }).filter(Boolean); // Remove any null items

    console.log('Final formatted items count:', formattedItems.length);
    return formattedItems;
  } catch (error) {
    console.error('Error getting formatted wishlist items:', error);
    return [];
  }
}
