const Product = require('../../models/Products.js');
const User = require('../../models/User.js');

// Get all products for superAdmin
const getAllProducts = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    const products = await Product.find()
      .populate('createdBy', 'userName email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get products by admin
const getProductsByAdmin = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    const { adminId } = req.params;
    
    // Verify the admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const products = await Product.find({ createdBy: adminId })
      .populate('createdBy', 'userName email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error in getProductsByAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get product statistics
const getProductStats = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    // Get all products
    const products = await Product.find().populate('createdBy', 'userName email');
    
    console.log(`Found ${products.length} products`);
    
    // Calculate total products
    const totalProducts = products.length;
    
    // Calculate products by admin
    const adminProducts = {};
    products.forEach(product => {
      if (product.createdBy) {
        const adminId = product.createdBy._id.toString();
        const adminName = product.createdBy.userName || 'Unknown Admin';
        
        if (!adminProducts[adminId]) {
          adminProducts[adminId] = {
            adminId,
            adminName,
            productCount: 0,
            totalStock: 0,
            lowStockCount: 0,
            outOfStockCount: 0
          };
        }
        
        adminProducts[adminId].productCount++;
        
        // Use totalStock field or default to 0
        const stockValue = typeof product.totalStock === 'number' ? product.totalStock : 0;
        adminProducts[adminId].totalStock += stockValue;
        
        // Count low stock (less than 10 items)
        if (stockValue > 0 && stockValue < 10) {
          adminProducts[adminId].lowStockCount++;
        }
        
        // Count out of stock
        if (stockValue === 0) {
          adminProducts[adminId].outOfStockCount++;
        }
      }
    });
    
    // Convert to array for easier consumption by the frontend
    const adminProductsArray = Object.values(adminProducts);
    
    // Calculate overall stock statistics
    const totalStock = products.reduce((total, product) => {
      const stockValue = typeof product.totalStock === 'number' ? product.totalStock : 0;
      return total + stockValue;
    }, 0);
    
    const lowStockCount = products.filter(product => {
      const stockValue = typeof product.totalStock === 'number' ? product.totalStock : 0;
      return stockValue > 0 && stockValue < 10;
    }).length;
    
    const outOfStockCount = products.filter(product => {
      const stockValue = typeof product.totalStock === 'number' ? product.totalStock : 0;
      return stockValue === 0;
    }).length;
    
    // If no products or admins are found, provide default stats
    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalProducts: 0,
          totalStock: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          adminProducts: []
        }
      });
    }
    
    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalStock,
        lowStockCount,
        outOfStockCount,
        adminProducts: adminProductsArray
      }
    });
  } catch (error) {
    console.error('Error in getProductStats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all products for the featured products management page, sorted by newest first
const getFeaturedProducts = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    // Get all products, sorted by creation date (newest first)
    const allProducts = await Product.find()
      .populate('createdBy', 'userName email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${allProducts.length} products for featured management`);
    
    res.status(200).json({
      success: true,
      products: allProducts
    });
  } catch (error) {
    console.error('Error in getFeaturedProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllProducts,
  getProductsByAdmin,
  getProductStats,
  getFeaturedProducts
};
