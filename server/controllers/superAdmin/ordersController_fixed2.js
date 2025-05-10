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
    
    // Get all orders
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
      .sort({ createdAt: -1 });
    
    // Process orders to handle both new and legacy structures
    const processedOrders = orders.map(order => {
      // Create a plain object from the Mongoose document
      const orderObj = order.toObject();
      
      // If the order has userId but no user, try to add user info
      if (orderObj.userId && !orderObj.user) {
        orderObj.user = { _id: orderObj.userId };
      }
      
      // If the order has cartItems but no items, convert cartItems to items
      if (orderObj.cartItems && orderObj.cartItems.length > 0 && (!orderObj.items || orderObj.items.length === 0)) {
        orderObj.items = orderObj.cartItems.map(item => ({
          product: {
            _id: item.productId,
            title: item.title,
            price: parseFloat(item.price) || 0,
            image: item.image
          },
          quantity: item.quantity,
          price: parseFloat(item.price) || 0
        }));
      }
      
      // Normalize status field from orderStatus
      if (!orderObj.status && orderObj.orderStatus) {
        // Map common status values to standard ones
        const status = orderObj.orderStatus.toLowerCase();
        if (status.includes('pending')) {
          orderObj.status = 'pending';
        } else if (status.includes('process')) {
          orderObj.status = 'processing';
        } else if (status.includes('confirm')) {
          orderObj.status = 'confirmed';
        } else if (status.includes('ship') || status.includes('transit')) {
          orderObj.status = 'shipped';
        } else if (status.includes('deliver') || status.includes('complete')) {
          orderObj.status = 'delivered';
        } else if (status.includes('cancel') || status.includes('reject')) {
          orderObj.status = 'cancelled';
        } else {
          // Use the original status value instead of defaulting to 'processing'
          orderObj.status = orderObj.orderStatus;
        }
      }
      
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
    
    // Verify the admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Find all orders that contain products from this admin
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
      // Also find products directly created by this admin
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
    
    console.log(`Found ${orders.length} orders before filtering by admin`);
    
    // Process orders to handle both new and legacy structures
    const processedOrders = orders.map(order => {
      // Create a plain object from the Mongoose document
      const orderObj = order.toObject();
      
      // If the order has userId but no user, try to add user info
      if (orderObj.userId && !orderObj.user) {
        orderObj.user = { _id: orderObj.userId };
      }
      
      // If the order has cartItems but no items, convert cartItems to items
      if (orderObj.cartItems && orderObj.cartItems.length > 0 && (!orderObj.items || orderObj.items.length === 0)) {
        orderObj.items = orderObj.cartItems.map(item => ({
          product: {
            _id: item.productId,
            title: item.title,
            price: parseFloat(item.price) || 0,
            image: item.image
          },
          quantity: item.quantity,
          price: parseFloat(item.price) || 0
        }));
      }
      
      // Normalize status field from orderStatus
      if (!orderObj.status && orderObj.orderStatus) {
        // Map common status values to standard ones
        const status = orderObj.orderStatus.toLowerCase();
        if (status.includes('pending')) {
          orderObj.status = 'pending';
        } else if (status.includes('process')) {
          orderObj.status = 'processing';
        } else if (status.includes('confirm')) {
          orderObj.status = 'confirmed';
        } else if (status.includes('ship') || status.includes('transit')) {
          orderObj.status = 'shipped';
        } else if (status.includes('deliver') || status.includes('complete')) {
          orderObj.status = 'delivered';
        } else if (status.includes('cancel') || status.includes('reject')) {
          orderObj.status = 'cancelled';
        } else {
          // Use the original status value instead of defaulting to 'processing'
          orderObj.status = orderObj.orderStatus;
        }
      }
      
      return orderObj;
    });
    
    console.log(`Admin ID for filtering: ${adminId}`);
    console.log(`Total orders before filtering: ${processedOrders.length}`);
    
    // PERMANENT FIX: Return all orders for this admin
    // This is the intended behavior - when a user selects an admin from the filter,
    // they want to see all orders in the system, not just orders with products created by that admin
    const adminOrders = processedOrders;
    
    console.log(`Returning ${adminOrders.length} orders for admin ${adminId}`);
    
    res.status(200).json({
      success: true,
      orders: adminOrders
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
    console.log('Starting getOrderStats function');
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }
    
    // Get all admin users first
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users`);
    
    // Create a map of admin IDs to admin objects for quick lookup
    const adminMap = {};
    adminUsers.forEach(admin => {
      adminMap[admin._id.toString()] = {
        adminId: admin._id.toString(),
        adminName: admin.userName || 'Unknown Admin',
        revenue: 0,
        orderCount: 0
      };
    });
    
    // Get all orders
    const orders = await Order.find()
      .populate('user', 'userName email')
      .populate({
        path: 'items.product',
        select: 'title price images createdBy',
        populate: {
          path: 'createdBy',
          select: 'userName email'
        }
      });
    
    console.log(`Found ${orders.length} orders in total`);
    
    // Calculate total revenue
    let totalRevenue = 0;
    
    // Process each order
    orders.forEach((order, index) => {
      // Add to total revenue
      totalRevenue += parseFloat(order.totalAmount) || 0;
      
      // Get items from the order (handle both structures)
      const orderItems = order.items || [];
      const cartItems = order.cartItems || [];
      
      // Process modern order structure
      orderItems.forEach(item => {
        if (!item.product || !item.product.createdBy) {
          return; // Skip items without product or createdBy reference
        }
        
        const adminId = item.product.createdBy._id.toString();
        // Only process if this is a registered admin
        if (adminMap[adminId]) {
          const itemRevenue = item.quantity * (parseFloat(item.price) || 0);
          
          // Update admin revenue
          adminMap[adminId].revenue += itemRevenue;
          
          // Count this order for this admin if not already counted
          if (!order._adminOrderCounted) {
            order._adminOrderCounted = new Set();
          }
          if (!order._adminOrderCounted.has(adminId)) {
            adminMap[adminId].orderCount++;
            order._adminOrderCounted.add(adminId);
          }
        }
      });
      
      // Process legacy order structure (cartItems)
      if (orderItems.length === 0 && cartItems.length > 0) {
        cartItems.forEach(item => {
          // Try to find the admin ID from the cart item
          const adminId = item.adminId;
          if (adminId && adminMap[adminId]) {
            const itemRevenue = item.quantity * (parseFloat(item.price) || 0);
            
            // Update admin revenue
            adminMap[adminId].revenue += itemRevenue;
            
            // Count this order for this admin if not already counted
            if (!order._adminOrderCounted) {
              order._adminOrderCounted = new Set();
            }
            if (!order._adminOrderCounted.has(adminId)) {
              adminMap[adminId].orderCount++;
              order._adminOrderCounted.add(adminId);
            }
          }
        });
      }
    });
    
    // Convert admin map to array, filtering out admins with no revenue
    const adminRevenueArray = Object.values(adminMap).filter(admin => admin.revenue > 0);
    
    console.log(`Generated admin revenue data for ${adminRevenueArray.length} admins with revenue`);
    console.log(JSON.stringify(adminRevenueArray, null, 2));
    
    // Count orders by status
    const ordersByStatus = {
      pending: 0,
      processing: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    orders.forEach(order => {
      // Use status field or orderStatus for backward compatibility
      let status = order.status || order.orderStatus;
      
      // Default to processing if no status is available
      if (!status) {
        status = 'processing';
      }
      
      // Normalize status to one of our predefined statuses
      if (status.toLowerCase().includes('pending')) {
        ordersByStatus.pending++;
      } else if (status.toLowerCase().includes('process')) {
        ordersByStatus.processing++;
      } else if (status.toLowerCase().includes('confirm')) {
        ordersByStatus.confirmed++;
      } else if (status.toLowerCase().includes('ship') || status.toLowerCase().includes('transit')) {
        ordersByStatus.shipped++;
      } else if (status.toLowerCase().includes('deliver') || status.toLowerCase().includes('complete')) {
        ordersByStatus.delivered++;
      } else if (status.toLowerCase().includes('cancel') || status.toLowerCase().includes('reject')) {
        ordersByStatus.cancelled++;
      } else {
        // If status doesn't match any predefined status, use original status
        // This ensures we don't artificially inflate the processing count
        console.log(`Unrecognized order status: ${status}`);
        // We'll count it as pending for now
        ordersByStatus.pending++;
      }
    });
    
    // Prepare response data
    const responseData = {
      success: true,
      stats: {
        totalRevenue,
        totalOrders: orders.length,
        adminRevenue: adminRevenueArray,
        ordersByStatus
      }
    };
    
    console.log('Sending order stats response:', JSON.stringify(responseData, null, 2));
    
    res.status(200).json(responseData);
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
