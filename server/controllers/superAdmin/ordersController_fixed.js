const Order = require('../../models/Order.js');
const User = require('../../models/User.js');

// Get all orders for superAdmin
const getAllOrders = async (req, res) => {
  try {
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    // First, try to find orders with the new structure
    let orders = await Order.find()
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
    
    console.log(`Found ${orders.length} orders`);
    
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
    
    // Filter orders to only include those with items created by this admin
    const adminOrders = processedOrders.filter(order => {
      // Check items array for products created by this admin
      if (order.items && order.items.length > 0) {
        return order.items.some(item => 
          item.product && 
          item.product.createdBy && 
          item.product.createdBy._id && 
          item.product.createdBy._id.toString() === adminId
        );
      }
      
      // Check cartItems array for products created by this admin
      if (order.cartItems && order.cartItems.length > 0) {
        const hasAdminCartItems = order.cartItems.some(item => {
          // Check if we have the admin ID directly on the cart item
          if (item.adminId && item.adminId === adminId) {
            return true;
          }
          
          // Check if we have a populated productId with createdBy information
          if (item.productId && typeof item.productId === 'object' && 
              item.productId.createdBy && 
              item.productId.createdBy._id && 
              item.productId.createdBy._id.toString() === adminId) {
            return true;
          }
          
          return false;
        });
        
        if (hasAdminCartItems) {
          return true;
        }
      }
      
      return false;
    });
    
    console.log(`Filtered to ${adminOrders.length} orders for admin ${adminId}`);
    
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
    // Check if the requester is a superAdmin
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
      });
    
    // Calculate total revenue
    let totalRevenue = 0;
    
    // Track revenue by admin
    const adminRevenue = {};
    
    // Process each order
    orders.forEach(order => {
      // Add to total revenue
      totalRevenue += parseFloat(order.totalAmount) || 0;
      
      // Get items from the order (handle both structures)
      const orderItems = order.items || [];
      const cartItems = order.cartItems || [];
      
      // Process modern order structure
      orderItems.forEach(item => {
        if (item.product && item.product.createdBy) {
          const adminId = item.product.createdBy._id.toString();
          const adminName = item.product.createdBy.userName || 'Unknown Admin';
          const itemRevenue = item.quantity * (parseFloat(item.price) || 0);
          
          if (!adminRevenue[adminId]) {
            adminRevenue[adminId] = {
              adminId,
              adminName,
              revenue: 0,
              itemsSold: 0,
              orderCount: 0,
              platformFees: 0,  // Initialize platform fees
              netRevenue: 0     // Initialize net revenue
            };
          }
          
          // Add the revenue from this item
          const itemPrice = parseFloat(item.price) || 0;
          const itemQuantity = parseInt(item.quantity) || 1;
          const itemPlatformFee = itemPrice * itemQuantity * 0.05; // Calculate 5% platform fee
          
          // Update admin revenue statistics
          adminRevenue[adminId].revenue += itemRevenue;
          adminRevenue[adminId].platformFees += itemPlatformFee;
          adminRevenue[adminId].netRevenue = adminRevenue[adminId].revenue - adminRevenue[adminId].platformFees;
          adminRevenue[adminId].itemsSold += itemQuantity;
          
          // Count this order for this admin if not already counted
          if (!order._adminOrderCounted) {
            order._adminOrderCounted = new Set();
          }
          if (!order._adminOrderCounted.has(adminId)) {
            adminRevenue[adminId].orderCount++;
            order._adminOrderCounted.add(adminId);
          }
        }
      });
      
      // Process legacy order structure (cartItems)
      if (orderItems.length === 0 && cartItems.length > 0) {
        cartItems.forEach(item => {
          // For legacy items, we need to find the admin from the product ID
          // This is a simplified approach - in a real system you'd query the DB
          const adminId = item.adminId || 'unknown';
          const adminName = item.adminName || 'Unknown Admin';
          const itemRevenue = item.quantity * (parseFloat(item.price) || 0);
          
          if (adminId !== 'unknown') {
            if (!adminRevenue[adminId]) {
              adminRevenue[adminId] = {
                adminId,
                adminName,
                revenue: 0,
                itemsSold: 0,
                orderCount: 0,
                platformFees: 0,  // Initialize platform fees
                netRevenue: 0     // Initialize net revenue
              };
            }
            
            // Add the revenue from this item
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseInt(item.quantity) || 1;
            const itemPlatformFee = itemPrice * itemQuantity * 0.05; // Calculate 5% platform fee
            
            // Update admin revenue statistics
            adminRevenue[adminId].revenue += itemRevenue;
            adminRevenue[adminId].platformFees += itemPlatformFee;
            adminRevenue[adminId].netRevenue = adminRevenue[adminId].revenue - adminRevenue[adminId].platformFees;
            adminRevenue[adminId].itemsSold += itemQuantity;
            
            // Count this order for this admin if not already counted
            if (!order._adminOrderCounted) {
              order._adminOrderCounted = new Set();
            }
            if (!order._adminOrderCounted.has(adminId)) {
              adminRevenue[adminId].orderCount++;
              order._adminOrderCounted.add(adminId);
            }
          }
        });
      }
    });
    
    // Convert to array for easier consumption by the frontend
    const adminRevenueArray = Object.values(adminRevenue);
    
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
        // If status doesn't match any predefined status, count as processing
        ordersByStatus.processing++;
      }
    });
    
    // Calculate platform fees (5% of total revenue)
    const platformFees = totalRevenue * 0.05;
    const netRevenue = totalRevenue - platformFees;
    
    // Calculate average order value
    const totalItemsSold = orders.reduce((total, order) => total + (order.items ? order.items.length : 0), 0);
    const averageOrderValue = totalRevenue / orders.length;
    
    res.status(200).json({
      success: true,
      stats: {
        totalOrders: orders.length,
        totalRevenue,
        platformFees,
        netRevenue,
        averageOrderValue,
        totalItemsSold,
        ordersByStatus,
        adminRevenue: adminRevenueArray
      }
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
