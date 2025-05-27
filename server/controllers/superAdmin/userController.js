const User = require('../../models/User.js');const bcrypt = require('bcryptjs');const emailService = require('../../services/emailService.js');
const Order = require('../../models/Order.js');
const Product = require('../../models/Products.js');
const ShippingZone = require('../../models/ShippingZone.js');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    const users = await User.find({}, { password: 0 }); // Exclude password field
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get users by role
const getUsersByRole = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    const { role } = req.params;
    
    if (!['user', 'admin', 'superAdmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const users = await User.find({ role }, { password: 0 }); // Exclude password field
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error in getUsersByRole:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add a new user (admin or superAdmin)
const addUser = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can add users.'
      });
    }

    const { userName, email, password, role } = req.body;
    
    // Validate input
    if (!userName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate role
    if (!['admin', 'superAdmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Only admin or superAdmin roles can be created.'
      });
    }

    // Check email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const newUser = new User({
      userName,
      email,
      password: hashPassword,
      role
    });

        await newUser.save();        // Send welcome email with credentials for admin users    if (role === 'admin') {      try {        await emailService.sendNewAdminWelcomeEmail(          email,          userName,          password // Send the original password since it's temporary        );        console.log('Welcome email sent to new admin:', email);      } catch (emailError) {        console.error('Failed to send welcome email to new admin:', emailError);        // Don't fail the user creation if email fails      }    }    res.status(201).json({      success: true,      message: 'User created successfully',      user: {        id: newUser._id,        userName: newUser.userName,        email: newUser.email,        role: newUser.role      }    });
  } catch (error) {
    console.error('Error in addUser:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can update user roles.'
      });
    }

    const { userId } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!['user', 'admin', 'superAdmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can delete users.'
      });
    }

    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get detailed admin profile (SuperAdmin only)
const getAdminProfile = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    const { adminId } = req.params;
    
    // Get admin user details
    const admin = await User.findById(adminId).select('-password -resetPasswordToken');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Only allow viewing admin and superAdmin profiles
    if (!['admin', 'superAdmin'].includes(admin.role)) {
      return res.status(400).json({
        success: false,
        message: 'Profile can only be viewed for admin and superAdmin users'
      });
    }

    // Get admin's products
    const adminProducts = await Product.find({ 
      createdBy: adminId 
    }).select('title price salePrice totalStock images category brand createdAt');

    // Get admin's shipping zones
    const shippingZones = await ShippingZone.find({ 
      vendorId: adminId 
    }).select('name region baseRate isDefault vendorRegion sameRegionCapFee additionalRates createdAt updatedAt');

    // Calculate revenue analytics
    const revenueAnalytics = await calculateAdminRevenueAnalytics(adminId);

    // Get recent orders for this admin
    const recentOrders = await getAdminRecentOrders(adminId);

    // Calculate additional statistics
    const statistics = {
      totalProducts: adminProducts.length,
      activeProducts: adminProducts.filter(p => p.totalStock > 0).length,
      outOfStockProducts: adminProducts.filter(p => p.totalStock === 0).length,
      totalShippingZones: shippingZones.length,
      defaultShippingZones: shippingZones.filter(z => z.isDefault).length,
      averageProductPrice: adminProducts.length > 0 
        ? adminProducts.reduce((sum, p) => sum + (p.salePrice || p.price), 0) / adminProducts.length 
        : 0,
      accountAge: Math.floor((Date.now() - new Date(admin.createdAt).getTime()) / (1000 * 60 * 60 * 24)), // days
      lastLoginDays: admin.lastLogin 
        ? Math.floor((Date.now() - new Date(admin.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
        : null
    };

    // Prepare response
    const profileData = {
      // Personal Information
      personalInfo: {
        id: admin._id,
        userName: admin.userName,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        avatar: admin.avatar,
        dateOfBirth: admin.dateOfBirth,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      },

      // Shop Configuration
      shopConfig: {
        shopName: admin.shopName,
        shopDescription: admin.shopDescription,
        shopLogo: admin.shopLogo,
        shopBanner: admin.shopBanner,
        shopCategory: admin.shopCategory,
        shopWebsite: admin.shopWebsite,
        shopRating: admin.shopRating,
        shopReviewCount: admin.shopReviewCount,
        shopEstablished: admin.shopEstablished,
        shopPolicies: admin.shopPolicies,
        baseRegion: admin.baseRegion,
        baseCity: admin.baseCity
      },

      // Financial Information
      financialInfo: {
        balance: admin.balance,
        totalEarnings: admin.totalEarnings,
        totalEarningsWithdrawn: admin.totalEarningsWithdrawn,
        totalShippingFees: admin.totalShippingFees,
        platformFees: admin.platformFees,
        shippingPreferences: admin.shippingPreferences
      },

      // Products
      products: adminProducts,

      // Shipping Configuration
      shippingZones: shippingZones,

      // Revenue Analytics
      revenueAnalytics: revenueAnalytics,

      // Recent Orders
      recentOrders: recentOrders,

      // Statistics
      statistics: statistics
    };

    res.status(200).json({
      success: true,
      profile: profileData
    });

  } catch (error) {
    console.error('Error in getAdminProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to calculate admin revenue analytics
const calculateAdminRevenueAnalytics = async (adminId) => {
  try {
    // Find all products created by this admin
    const adminProducts = await Product.find({ createdBy: adminId });
    const adminProductIds = adminProducts.map(product => product._id.toString());

    // Find all orders containing admin's products
    const allOrders = await Order.find({});
    
    // Filter orders that contain at least one product from this admin
    const adminOrders = allOrders.filter(order => {
      return order.cartItems.some(item => 
        adminProductIds.includes(item.productId)
      );
    });

    // Calculate analytics for different time periods
    const now = new Date();
    const periods = {
      today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      thisWeek: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      thisMonth: new Date(now.getFullYear(), now.getMonth(), 1),
      thisYear: new Date(now.getFullYear(), 0, 1),
      allTime: new Date(0)
    };

    const analytics = {};

    for (const [periodName, startDate] of Object.entries(periods)) {
      const periodOrders = adminOrders.filter(order => 
        new Date(order.createdAt) >= startDate
      );

      let totalRevenue = 0;
      let totalItemsSold = 0;
      let totalOrders = periodOrders.length;
      let totalShippingFees = 0;
      let totalPlatformFees = 0;

      periodOrders.forEach(order => {
        // Calculate revenue from admin's products in this order
        const adminItemsInOrder = order.cartItems.filter(item => 
          adminProductIds.includes(item.productId)
        );

        const orderRevenue = adminItemsInOrder.reduce((sum, item) => 
          sum + (parseFloat(item.price) * item.quantity), 0
        );

        const orderItemsSold = adminItemsInOrder.reduce((sum, item) => 
          sum + item.quantity, 0
        );

        totalRevenue += orderRevenue;
        totalItemsSold += orderItemsSold;
        totalPlatformFees += orderRevenue * 0.05; // 5% platform fee

        // Add shipping fees (proportional to admin's items in the order)
        if (order.shippingFee && adminItemsInOrder.length > 0) {
          const adminItemRatio = adminItemsInOrder.length / order.cartItems.length;
          totalShippingFees += parseFloat(order.shippingFee) * adminItemRatio;
        }
      });

      analytics[periodName] = {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalItemsSold,
        totalOrders,
        totalShippingFees: Math.round(totalShippingFees * 100) / 100,
        totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
        netRevenue: Math.round((totalRevenue - totalPlatformFees) * 100) / 100,
        averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0
      };
    }

    return analytics;

  } catch (error) {
    console.error('Error calculating admin revenue analytics:', error);
    return {};
  }
};

// Helper function to get admin's recent orders
const getAdminRecentOrders = async (adminId, limit = 10) => {
  try {
    // Find all products created by this admin
    const adminProducts = await Product.find({ createdBy: adminId });
    const adminProductIds = adminProducts.map(product => product._id.toString());

    // Find recent orders containing admin's products
    const allOrders = await Order.find({})
      .populate('user', 'userName email')
      .sort({ createdAt: -1 })
      .limit(50); // Get more orders to filter from

    // Filter orders that contain admin's products and limit results
    const adminOrders = allOrders
      .filter(order => {
        return order.cartItems.some(item => 
          adminProductIds.includes(item.productId)
        );
      })
      .slice(0, limit);

    // Format orders for response
    const formattedOrders = adminOrders.map(order => {
      const adminItems = order.cartItems.filter(item => 
        adminProductIds.includes(item.productId)
      );

      const adminRevenue = adminItems.reduce((sum, item) => 
        sum + (parseFloat(item.price) * item.quantity), 0
      );

      return {
        orderId: order._id,
        customerName: order.user?.userName || order.customerName || 'Unknown',
        customerEmail: order.user?.email || order.customerEmail || '',
        totalAmount: order.totalAmount,
        adminRevenue: Math.round(adminRevenue * 100) / 100,
        adminItemsCount: adminItems.length,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        addressInfo: order.addressInfo
      };
    });

    return formattedOrders;

  } catch (error) {
    console.error('Error getting admin recent orders:', error);
    return [];
  }
};

module.exports = {
  getAllUsers,
  getUsersByRole,
  addUser,
  updateUserRole,
  deleteUser,
  getAdminProfile
};
