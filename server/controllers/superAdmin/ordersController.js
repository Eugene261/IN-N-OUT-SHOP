const Order = require('../../models/Order.js');
const User = require('../../models/User.js');
const Product = require('../../models/Products.js');

// Get all orders for superAdmin
const getAllOrders = async (req, res) => {
  try {
    // Check if user is superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    // Get all orders with populated data
    const orders = await Order.find()
      .populate('user', 'userName email')
      .populate({
        path: 'items.product',
        select: 'title price images createdBy',
        populate: {
          path: 'createdBy',
          select: 'userName email'
        }
      })
      .populate({
        path: 'cartItems.productId',
        select: 'title price images createdBy',
        model: 'Product',
        populate: {
          path: 'createdBy',
          select: 'userName email'
        }
      })
      .sort({ createdAt: -1 });

    // Process orders to handle both new and legacy structures
    const processedOrders = orders.map(order => {
      const orderObj = order.toObject();

      // Handle missing user data
      if (orderObj.userId && !orderObj.user) {
        orderObj.user = { _id: orderObj.userId };
      }

      // Convert cartItems to items if needed
      if (orderObj.cartItems && orderObj.cartItems.length > 0 && (!orderObj.items || orderObj.items.length === 0)) {
        orderObj.items = orderObj.cartItems.map((item, index) => {
          // CRITICAL FIX: Preserve the populated createdBy data from cartItems.productId
          const productData = {
            _id: item.productId?._id || item.productId,
            title: item.title,
            price: parseFloat(item.price) || 0,
            image: item.image
          };
          
          // If productId was populated, preserve the createdBy data
          if (item.productId && typeof item.productId === 'object' && item.productId.createdBy) {
            productData.createdBy = item.productId.createdBy;
          }
          
          return {
            product: productData,
            quantity: item.quantity,
            price: parseFloat(item.price) || 0
          };
        });
      }

      // Normalize status field
      if (!orderObj.status && orderObj.orderStatus) {
        const status = orderObj.orderStatus.toLowerCase();
        if (status.includes('pending')) orderObj.status = 'pending';
        else if (status.includes('process')) orderObj.status = 'processing';
        else if (status.includes('confirm')) orderObj.status = 'confirmed';
        else if (status.includes('ship') || status.includes('transit')) orderObj.status = 'shipped';
        else if (status.includes('deliver') || status.includes('complete')) orderObj.status = 'delivered';
        else if (status.includes('cancel') || status.includes('reject')) orderObj.status = 'cancelled';
        else orderObj.status = orderObj.orderStatus;
      }

      // Calculate shipping fee for this order
      let orderShippingFee = 0;
      
      // First try to use the actual shipping fee stored in the order
      if (orderObj.shippingFee && orderObj.shippingFee > 0) {
        orderShippingFee = parseFloat(orderObj.shippingFee);
      }
      // Only use stored adminShippingFees data if no order-level shipping fee exists
      else if (orderObj.adminShippingFees && Object.keys(orderObj.adminShippingFees).length > 0) {
        // Sum up all admin shipping fees for this order
        Object.values(orderObj.adminShippingFees).forEach(adminFeeData => {
          if (typeof adminFeeData === 'object' && adminFeeData !== null && adminFeeData.fee) {
            orderShippingFee += parseFloat(adminFeeData.fee) || 0;
          } else if (typeof adminFeeData === 'number' || typeof adminFeeData === 'string') {
            orderShippingFee += parseFloat(adminFeeData) || 0;
          }
        });
      }
      // No fallback calculations - only use real data
      
      orderObj.shippingFee = orderShippingFee;

      return orderObj;
    });

    res.status(200).json({
      success: true,
      orders: processedOrders
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get orders by admin
const getOrdersByAdmin = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    const { adminId } = req.params;

    // If adminId is 'null', return all orders
    if (adminId === 'null') {
      return getAllOrders(req, res);
    }

    // Check if adminId is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(adminId);

    let admin;
    if (isValidObjectId) {
      admin = await User.findById(adminId);
    } else {
      admin = await User.findOne({
        userName: { $regex: new RegExp(adminId, 'i') },
        role: 'admin'
      });
    }

    // Handle specific hardcoded admins for demo purposes
    if (!admin && ['eugene', 'lindy mann'].includes(adminId.toLowerCase())) {
      admin = {
        _id: adminId,
        userName: adminId.charAt(0).toUpperCase() + adminId.slice(1),
        role: 'admin'
      };
    } else if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Find all orders
    const orders = await Order.find()
      .populate('user', 'userName email')
      .populate({
        path: 'items.product',
        select: 'title price images createdBy',
        populate: { path: 'createdBy', select: 'userName email' }
      })
      .populate({
        path: 'cartItems.productId',
        select: 'title price images createdBy',
        model: 'Product',
        populate: { path: 'createdBy', select: 'userName email' }
      })
      .sort({ createdAt: -1 });

    // Process orders to handle both new and legacy structures
    const processedOrders = orders.map(order => {
      const orderObj = order.toObject();

      if (orderObj.userId && !orderObj.user) {
        orderObj.user = { _id: orderObj.userId };
      }

      if (orderObj.cartItems && orderObj.cartItems.length > 0 && (!orderObj.items || orderObj.items.length === 0)) {
        orderObj.items = orderObj.cartItems.map((item, index) => {
          // CRITICAL FIX: Preserve the populated createdBy data from cartItems.productId
          const productData = {
            _id: item.productId?._id || item.productId,
            title: item.title,
            price: parseFloat(item.price) || 0,
            image: item.image
          };
          
          // If productId was populated, preserve the createdBy data
          if (item.productId && typeof item.productId === 'object' && item.productId.createdBy) {
            productData.createdBy = item.productId.createdBy;
          }
          
          return {
            product: productData,
            quantity: item.quantity,
            price: parseFloat(item.price) || 0
          };
        });
      }

      if (!orderObj.status && orderObj.orderStatus) {
        const status = orderObj.orderStatus.toLowerCase();
        if (status.includes('pending')) orderObj.status = 'pending';
        else if (status.includes('process')) orderObj.status = 'processing';
        else if (status.includes('confirm')) orderObj.status = 'confirmed';
        else if (status.includes('ship') || status.includes('transit')) orderObj.status = 'shipped';
        else if (status.includes('deliver') || status.includes('complete')) orderObj.status = 'delivered';
        else if (status.includes('cancel') || status.includes('reject')) orderObj.status = 'cancelled';
        else orderObj.status = orderObj.orderStatus;
      }

      // Calculate shipping fee for this order
      let orderShippingFee = 0;
      
      // First try to use the actual shipping fee stored in the order
      if (orderObj.shippingFee && orderObj.shippingFee > 0) {
        orderShippingFee = parseFloat(orderObj.shippingFee);
      }
      // Only use stored adminShippingFees data if no order-level shipping fee exists
      else if (orderObj.adminShippingFees && Object.keys(orderObj.adminShippingFees).length > 0) {
        // Sum up all admin shipping fees for this order
        Object.values(orderObj.adminShippingFees).forEach(adminFeeData => {
          if (typeof adminFeeData === 'object' && adminFeeData !== null && adminFeeData.fee) {
            orderShippingFee += parseFloat(adminFeeData.fee) || 0;
          } else if (typeof adminFeeData === 'number' || typeof adminFeeData === 'string') {
            orderShippingFee += parseFloat(adminFeeData) || 0;
          }
        });
      }
      // No fallback calculations - only use real data
      
      orderObj.shippingFee = orderShippingFee;

      return orderObj;
    });

    console.log(`Returning ${processedOrders.length} orders for admin ${adminId}`);

    res.status(200).json({
      success: true,
      orders: processedOrders
    });
  } catch (error) {
    console.error('Error in getOrdersByAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    // Use aggregation pipeline for better performance
    const orderStats = await Order.aggregate([
      {
        $facet: {
          'totalStats': [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: { $toDouble: '$totalAmount' } },
                totalShippingFees: { $sum: { $toDouble: '$shippingFee' } },
                totalOrders: { $sum: 1 }
              }
            }
          ],
          'ordersByStatus': [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Get total products count
    const totalProducts = await Product.countDocuments();

    // Format the response
    const stats = {
      totalRevenue: orderStats[0].totalStats[0]?.totalRevenue || 0,
      totalShippingFees: orderStats[0].totalStats[0]?.totalShippingFees || 0,
      totalOrders: orderStats[0].totalStats[0]?.totalOrders || 0,
      platformFees: (orderStats[0].totalStats[0]?.totalRevenue || 0) * 0.05, // 5% platform fee
      netRevenue: (orderStats[0].totalStats[0]?.totalRevenue || 0) * 0.95, // After platform fees
      totalProducts: totalProducts,
      ordersByStatus: orderStats[0].ordersByStatus.reduce((acc, curr) => {
        acc[curr._id || 'pending'] = curr.count;
        return acc;
      }, {
      pending: 0,
      processing: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
      })
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in getOrderStats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllOrders,
  getOrdersByAdmin,
  getOrderStats
};