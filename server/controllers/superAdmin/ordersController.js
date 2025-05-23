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
    console.log('Starting getOrderStats function');

    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }

    const adminUsers = await User.find({ role: 'admin' });

    const productCountsByAdmin = {};
    const products = await Product.find().populate('createdBy', '_id');
    products.forEach(product => {
      if (product.createdBy && product.createdBy._id) {
        const adminId = product.createdBy._id.toString();
        productCountsByAdmin[adminId] = (productCountsByAdmin[adminId] || 0) + 1;
      }
    });

    let totalRevenue = 0;
    let totalShippingFees = 0;

    const adminMap = {};
    adminUsers.forEach(admin => {
      adminMap[admin._id.toString()] = {
        adminId: admin._id.toString(),
        adminName: admin.userName,
        revenue: 0,
        orderCount: 0,
        shippingFees: 0,
        shippingFeesByRegion: { accra: 0, other: 0 }
      };
    });

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
      .exec();

    console.log(`Found ${orders.length} orders in total`);

    for (const order of orders) {
      const orderTotal = parseFloat(order.totalAmount) || 0;
      totalRevenue += orderTotal;

      // CRITICAL FIX: Use the real shipping fee from the order instead of hardcoded rates
      let orderShippingFee = 0;
      
      // First try to use the actual shipping fee stored in the order
      if (order.shippingFee && order.shippingFee > 0) {
        orderShippingFee = parseFloat(order.shippingFee);
      }
      // Only use stored adminShippingFees data if no order-level shipping fee exists
      else if (order.adminShippingFees && Object.keys(order.adminShippingFees).length > 0) {
        // Sum up all admin shipping fees for this order
        Object.values(order.adminShippingFees).forEach(adminFeeData => {
          if (typeof adminFeeData === 'object' && adminFeeData !== null && adminFeeData.fee) {
            orderShippingFee += parseFloat(adminFeeData.fee) || 0;
          } else if (typeof adminFeeData === 'number' || typeof adminFeeData === 'string') {
            orderShippingFee += parseFloat(adminFeeData) || 0;
          }
        });
      }
      // No fallback calculations - only use real data
      
      totalShippingFees += orderShippingFee;

      const orderItems = order.items || [];
      const cartItems = order.cartItems || [];

      if (orderItems.length === 0 && cartItems.length === 0 && adminUsers.length > 0) {
        const firstAdmin = adminUsers[0];
        const adminId = firstAdmin._id.toString();

        adminMap[adminId].revenue += orderTotal;
        adminMap[adminId].orderCount++;
        adminMap[adminId].shippingFees += orderShippingFee;

        if (orderShippingFee > 0) {
          adminMap[adminId].shippingFeesByRegion.accra += 1;
        } else {
          adminMap[adminId].shippingFeesByRegion.other += 1;
        }
        continue;
      }

      if (orderItems.length > 0) {
        let adminCredited = false;
        let orderItemsTotal = 0;

        orderItems.forEach(item => {
          if (item.product) {
            orderItemsTotal += item.quantity * (parseFloat(item.price) || 0);
          }
        });

        if (orderItemsTotal === 0) orderItemsTotal = 1;

        orderItems.forEach(item => {
          if (!item.product) return;

          let adminId;
          if (item.product.createdBy && item.product.createdBy._id) {
            adminId = item.product.createdBy._id.toString();
          }

          if (adminId && adminMap[adminId]) {
            const itemRevenue = item.quantity * (parseFloat(item.price) || 0);
            adminMap[adminId].revenue += itemRevenue;
            adminCredited = true;

            // CRITICAL FIX: Use the real admin-specific shipping fees from adminShippingFees
            let adminShippingFee = 0;
            
            // Only use real admin-specific shipping fees if available
            if (order.adminShippingFees && order.adminShippingFees[adminId]) {
              // Handle both object and primitive formats for adminShippingFees
              const adminFeeData = order.adminShippingFees[adminId];
              
              if (typeof adminFeeData === 'object' && adminFeeData !== null) {
                // Modern format: object with fee property
                adminShippingFee = parseFloat(adminFeeData.fee) || 0;
              } else {
                // Legacy format: direct number/string value
                adminShippingFee = parseFloat(adminFeeData) || 0;
              }
              
              console.log(`Order ${order._id}: Using stored admin shipping fee for ${adminId}: ${adminShippingFee} GHS`);
              adminMap[adminId].shippingFees += adminShippingFee;
            }
            // No fallback calculations - only use real data

            if (!order._adminOrderCounted) {
              order._adminOrderCounted = new Set();
            }
            if (!order._adminOrderCounted.has(adminId)) {
              adminMap[adminId].orderCount++;
              order._adminOrderCounted.add(adminId);
            }
          }
        });

        if (!adminCredited && adminUsers.length > 0) {
          const firstAdmin = adminUsers[0];
          const adminId = firstAdmin._id.toString();

          adminMap[adminId].revenue += orderTotal;
          adminMap[adminId].orderCount++;
          adminMap[adminId].shippingFees += orderShippingFee;

          if (orderShippingFee > 0) {
            adminMap[adminId].shippingFeesByRegion.accra += 1;
          } else {
            adminMap[adminId].shippingFeesByRegion.other += 1;
          }

          if (!order._adminOrderCounted) {
            order._adminOrderCounted = new Set();
          }
          if (!order._adminOrderCounted.has(adminId)) {
            adminMap[adminId].orderCount++;
            order._adminOrderCounted.add(adminId);
          }
        }
      } else if (cartItems.length > 0) {
        let adminCredited = false;
        let cartItemsTotal = 0;

        cartItems.forEach(item => {
          cartItemsTotal += item.quantity * (parseFloat(item.price) || 0);
        });

        if (cartItemsTotal === 0) cartItemsTotal = 1;

        // Process cartItems to find which admin created each product
        for (const item of cartItems) {
          let adminId = null;

          // Get the product to find the admin who created it
          if (item.productId) {
            try {
              const product = await Product.findById(item.productId).populate('createdBy', '_id userName');
              if (product && product.createdBy && product.createdBy._id) {
                adminId = product.createdBy._id.toString();
              }
            } catch (err) {
              console.error(`Error finding product ${item.productId}:`, err);
              continue;
            }
          }

          if (adminId && adminMap[adminId]) {
            const itemRevenue = item.quantity * (parseFloat(item.price) || 0);
            adminMap[adminId].revenue += itemRevenue;
            adminCredited = true;

            // CRITICAL FIX: Use the real admin-specific shipping fees from adminShippingFees
            let adminShippingFee = 0;
            
            // Only use real admin-specific shipping fees if available
            if (order.adminShippingFees && order.adminShippingFees[adminId]) {
              // Handle both object and primitive formats for adminShippingFees
              const adminFeeData = order.adminShippingFees[adminId];
              
              if (typeof adminFeeData === 'object' && adminFeeData !== null) {
                // Modern format: object with fee property
                adminShippingFee = parseFloat(adminFeeData.fee) || 0;
              } else {
                // Legacy format: direct number/string value
                adminShippingFee = parseFloat(adminFeeData) || 0;
              }
              
              console.log(`Order ${order._id}: Using stored admin shipping fee for ${adminId}: ${adminShippingFee} GHS`);
              
              // Only add if not already counted for this order
              if (!order._adminShippingCounted) {
                order._adminShippingCounted = new Set();
              }
              
              if (!order._adminShippingCounted.has(adminId)) {
                adminMap[adminId].shippingFees += adminShippingFee;
                order._adminShippingCounted.add(adminId);
              }
            }
            // No fallback calculations - only use real data

            if (!order._adminOrderCounted) {
              order._adminOrderCounted = new Set();
            }
            if (!order._adminOrderCounted.has(adminId)) {
              adminMap[adminId].orderCount++;
              order._adminOrderCounted.add(adminId);
            }
          }
        }

        if (!adminCredited && adminUsers.length > 0) {
          const firstAdmin = adminUsers[0];
          const adminId = firstAdmin._id.toString();

          adminMap[adminId].revenue += orderTotal;
          adminMap[adminId].orderCount++;
          adminMap[adminId].shippingFees += orderShippingFee;

          if (orderShippingFee > 0) {
            adminMap[adminId].shippingFeesByRegion.accra += 1;
          } else {
            adminMap[adminId].shippingFeesByRegion.other += 1;
          }

          if (!order._adminOrderCounted) {
            order._adminOrderCounted = new Set();
          }
          if (!order._adminOrderCounted.has(adminId)) {
            adminMap[adminId].orderCount++;
            order._adminOrderCounted.add(adminId);
          }
        }
      }
    }

    const adminRevenueArray = Object.values(adminMap);

    if (adminRevenueArray.length === 0) {
      console.log('No admins with revenue found. Adding sample data for testing.');
      adminRevenueArray.push({
        adminId: 'sample-admin-1',
        adminName: 'Kwame (Admin)',
        revenue: totalRevenue || 7012.34,
        orderCount: orders.length || 10,
        shippingFees: totalShippingFees,
        shippingFeesByRegion: { accra: 0, other: 0 }
      });
    }

    console.log(`Generated admin revenue data for ${adminRevenueArray.length} admins`);

    const ordersByStatus = {
      pending: 0,
      processing: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    if (orders.length > 0) {
      console.log('Counting orders by their actual status');
      orders.forEach(order => {
        let status = order.orderStatus || order.status || 'processing';
        status = status.toLowerCase();

        if (status.includes('pending')) ordersByStatus.pending++;
        else if (status.includes('process')) ordersByStatus.processing++;
        else if (status.includes('confirm')) ordersByStatus.confirmed++;
        else if (status.includes('ship') || status.includes('transit')) ordersByStatus.shipped++;
        else if (status.includes('deliver') || status.includes('complete')) ordersByStatus.delivered++;
        else if (status.includes('cancel') || status.includes('reject')) ordersByStatus.cancelled++;
        else {
          console.log(`Unrecognized order status: ${status}`);
          ordersByStatus.processing++;
        }
      });
      console.log('Order status counts:', ordersByStatus);
    } else {
      console.log('No orders found to count statuses');
    }

    // CRITICAL FIX: Calculate platform fees and net revenue for SuperAdmin dashboard
    // Platform fees should ONLY be calculated on product revenue, NOT on shipping fees
    const totalProductRevenue = totalRevenue - totalShippingFees; // Exclude shipping fees
    const platformFees = totalProductRevenue * 0.05; // 5% platform fee on products only
    const netRevenue = totalProductRevenue - platformFees; // Net after platform fees
    
    console.log(`Product revenue calculation: ${totalRevenue} - ${totalShippingFees} = ${totalProductRevenue} GHS`);
    console.log(`Platform fee calculation: ${totalProductRevenue} * 0.05 = ${platformFees} GHS`);
    console.log(`Net revenue calculation: ${totalProductRevenue} - ${platformFees} = ${netRevenue} GHS`);

    const responseData = {
      success: true,
      stats: {
        totalRevenue,
        totalShippingFees,
        totalOrders: orders.length,
        platformFees, // Added missing platform fees
        netRevenue,   // Added missing net revenue
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