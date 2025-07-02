const User = require('../../models/User.js');
const bcrypt = require('bcryptjs');
const emailService = require('../../services/emailService.js');
const roleNotificationService = require('../../services/roleNotificationService.js');
const Order = require('../../models/Order.js');
const Product = require('../../models/Products.js');
const ShippingZone = require('../../models/ShippingZone.js');

// HIGHLY OPTIMIZED: Get all users with minimal fields and pagination
const getAllUsers = async (req, res) => {
  try {
    console.log('🔍 getAllUsers: Super admin', req.user.id, 'fetching all users');
    
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Limit to 50 users per page
    const skip = (page - 1) * limit;
    
    // CRITICAL OPTIMIZATION: Use minimal fields only
    const users = await User.find({}, { 
      _id: 1,
      userName: 1,
      email: 1,
      role: 1,
      isActive: 1,
      lastLogin: 1,
      createdAt: 1
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .maxTimeMS(10000); // 10 second timeout
    
    // Get total count for pagination (use countDocuments for better performance)
    const totalUsers = await User.countDocuments({});
    
    console.log(`✅ getAllUsers: Found ${users.length} users (page ${page}, total: ${totalUsers})`);
    
    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// HIGHLY OPTIMIZED: Get users by role with minimal fields
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    console.log('🔍 getUsersByRole: Fetching users with role:', role, 'for super admin:', req.user.id);
    
    if (!role || !['user', 'admin', 'superAdmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified: '${role}'. Valid roles are: user, admin, superAdmin`
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Smaller limit for role filtering
    const skip = (page - 1) * limit;

    // CRITICAL OPTIMIZATION: Use minimal fields and efficient query
    const users = await User.find(
      { role }, 
      { 
        _id: 1,
        userName: 1,
        email: 1,
        role: 1,
        isActive: 1,
        lastLogin: 1,
        createdAt: 1
      }
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .maxTimeMS(5000); // 5 second timeout for role queries
    
    // Get count for this specific role
    const totalUsers = await User.countDocuments({ role });
    
    console.log(`✅ getUsersByRole: Found ${users.length} users with role: ${role} (page ${page}, total: ${totalUsers})`);
    
    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error in getUsersByRole:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add a new user (admin or superAdmin)
const addUser = async (req, res) => {
  try {
    console.log('addUser: Super admin', req.user.id, 'adding new user');

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

    // OPTIMIZED: Check if user exists with minimal fields
    const existingUser = await User.findOne({ email }, { _id: 1 }).lean();
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

    await newUser.save();
    
    // Send welcome email for admin users (async, don't wait)
    if (role === 'admin') {
      emailService.sendNewAdminWelcomeEmail(email, userName, password)
        .then(() => console.log('Welcome email sent to new admin:', email))
        .catch(err => console.error('Failed to send welcome email:', err));
    }

    // 🔔 NEW: Send SuperAdmin role notifications if creating a superAdmin
    if (role === 'superAdmin') {
      try {
        const actionBy = await User.findById(req.user.id).select('_id userName email role');
        await roleNotificationService.notifySuperAdminRoleChange(newUser, 'created', actionBy);
        console.log(`✅ SuperAdmin role notifications sent for new user: ${newUser.userName}`);
      } catch (notificationError) {
        console.error('❌ Error sending SuperAdmin role notifications:', notificationError);
        // Don't fail the user creation if notifications fail
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
        role: newUser.role
      }
    });
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
    console.log('updateUserRole: Super admin', req.user.id, 'updating user role');

    const { userId } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!['user', 'admin', 'superAdmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Get the current user data to check previous role
    const currentUser = await User.findById(userId).select('_id userName email role');
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldRole = currentUser.role;

    // OPTIMIZED: Update directly without full fetch
    const updateResult = await User.findByIdAndUpdate(
      userId, 
      { role }, 
      { 
        new: true, 
        runValidators: true,
        select: '_id userName email role'
      }
    ).lean();
    
    if (!updateResult) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 🔔 NEW: Send SuperAdmin role notifications if promoting to superAdmin
    if (roleNotificationService.shouldNotifyRoleChange(oldRole, role)) {
      try {
        const actionBy = await User.findById(req.user.id).select('_id userName email role');
        // Use the updateResult data for the notification
        const userForNotification = {
          _id: updateResult._id,
          userName: updateResult.userName,
          email: updateResult.email,
          role: updateResult.role
        };
        await roleNotificationService.notifySuperAdminRoleChange(userForNotification, 'promoted', actionBy);
        console.log(`✅ SuperAdmin role notifications sent for promoted user: ${updateResult.userName}`);
      } catch (notificationError) {
        console.error('❌ Error sending SuperAdmin role notifications:', notificationError);
        // Don't fail the role update if notifications fail
      }
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: updateResult
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
    console.log('deleteUser: Super admin', req.user.id, 'deleting user');

    const { userId } = req.params;
    
    // OPTIMIZED: Delete directly with exists check
    const deleteResult = await User.findByIdAndDelete(userId);
    
    if (!deleteResult) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
    console.log('getAdminProfile: Super admin', req.user.id, 'accessing admin profile');

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
