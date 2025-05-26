const Order = require('../../models/Order.js');
const User = require('../../models/User.js');
const Product = require('../../models/Products.js');

// Get time-based admin revenue data
const getAdminRevenueByTime = async (req, res) => {
  try {
    console.log('Starting getAdminRevenueByTime function');
    
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }
    
    // Get time period from query params (default to 'daily')
    const timePeriod = req.query.period || 'daily';
    
    // Get date range
    const endDate = new Date();
    let startDate = new Date();
    
    // Set start date based on time period
    switch (timePeriod) {
      case 'daily':
        // Last 7 days
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'weekly':
        // Last 4 weeks
        startDate.setDate(startDate.getDate() - 28);
        break;
      case 'monthly':
        // Last 6 months
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'yearly':
        // Last 3 years
        startDate.setFullYear(startDate.getFullYear() - 3);
        break;
      default:
        // Default to last 7 days
        startDate.setDate(startDate.getDate() - 7);
    }
    
    console.log(`Fetching admin revenue from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Get all admin users
    const adminUsers = await User.find({ role: 'admin' });
    
    // Create a map of admin ID to admin data
    const adminMap = {};
    
    // Initialize admin map with all admins
    adminUsers.forEach(admin => {
      const adminId = admin._id.toString();
      adminMap[adminId] = {
        adminId,
        adminName: admin.userName,
        email: admin.email
      };
    });
    
    // Get all products with their creators for quick lookup
    const products = await Product.find().populate('createdBy', '_id userName email');
    
    // Create a map of product ID to admin ID
    const productAdminMap = {};
    
    products.forEach(product => {
      if (product.createdBy && product.createdBy._id) {
        productAdminMap[product._id.toString()] = {
          adminId: product.createdBy._id.toString(),
          adminName: product.createdBy.userName,
          email: product.createdBy.email
        };
      }
    });
    
    // Get orders within the date range
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'items.product',
      select: 'title price images createdBy',
      populate: {
        path: 'createdBy',
        select: 'userName email'
      }
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders in the date range`);
    
    // Group orders by date based on time period
    const revenueByTime = {};
    
    // Process each order
    for (const order of orders) {
      // Get order date
      const orderDate = new Date(order.createdAt || order.date || new Date());
      
      // Create time period key based on the selected period
      let timePeriodKey;
      let displayDate;
      
      switch (timePeriod) {
        case 'daily':
          // Format: YYYY-MM-DD
          timePeriodKey = orderDate.toISOString().split('T')[0];
          displayDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          break;
        case 'weekly':
          // Format: YYYY-WW (year and week number)
          const weekNumber = getWeekNumber(orderDate);
          timePeriodKey = `${orderDate.getFullYear()}-W${weekNumber}`;
          
          // Calculate start and end of week for display
          const startOfWeek = getStartOfWeek(orderDate);
          const endOfWeek = getEndOfWeek(orderDate);
          
          displayDate = `${startOfWeek.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })} - ${endOfWeek.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}`;
          break;
        case 'monthly':
          // Format: YYYY-MM
          timePeriodKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
          displayDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
          });
          break;
        case 'yearly':
          // Format: YYYY
          timePeriodKey = `${orderDate.getFullYear()}`;
          displayDate = orderDate.getFullYear().toString();
          break;
        default:
          // Default to daily
          timePeriodKey = orderDate.toISOString().split('T')[0];
          displayDate = orderDate.toLocaleDateString();
      }
      
      // Initialize time period entry if it doesn't exist
      if (!revenueByTime[timePeriodKey]) {
        revenueByTime[timePeriodKey] = {
          timePeriodKey,
          displayDate,
          date: orderDate,
          adminRevenue: {}
        };
        
        // Initialize with all admins
        adminUsers.forEach(admin => {
          const adminId = admin._id.toString();
          revenueByTime[timePeriodKey].adminRevenue[adminId] = {
            adminId,
            adminName: admin.userName,
            revenue: 0,
            orderCount: 0,
            platformFees: 0,
            shippingFees: 0
          };
        });
      }
      
      // Get items from the order (handle both structures)
      const orderItems = order.items || [];
      const cartItems = order.cartItems || [];
      const orderTotal = parseFloat(order.totalAmount) || 0;
      
      // Get shipping fee if available
      const orderShippingFee = order.shippingFee ? parseFloat(order.shippingFee) : 0;
      
      // Track if any admin was credited for this order
      let adminCredited = false;
      
      // Process modern order structure
      if (orderItems.length > 0) {
        orderItems.forEach(item => {
          if (!item.product) return;
          
          // Try to find the admin who created this product
          let adminId;
          
          if (item.product.createdBy && item.product.createdBy._id) {
            adminId = item.product.createdBy._id.toString();
          } else if (item.product._id) {
            // Try to find admin from our product map
            const productInfo = productAdminMap[item.product._id.toString()];
            if (productInfo) {
              adminId = productInfo.adminId;
            }
          }
          
          // If we found an admin ID and it's in our map
          if (adminId && revenueByTime[timePeriodKey].adminRevenue[adminId]) {
            const itemRevenue = item.quantity * (parseFloat(item.price) || 0);
            const platformFee = itemRevenue * 0.05; // Calculate 5% platform fee
            
            // CRITICAL FIX: Use the real admin-specific shipping fees from adminShippingFees ONLY
            let shippingFeeShare = 0;
            
            // Only use admin-specific shipping fee if available in adminShippingFees
            if (order.adminShippingFees && order.adminShippingFees[adminId]) {
              // Handle both object and primitive formats for adminShippingFees
              const adminFeeData = order.adminShippingFees[adminId];
              
              if (typeof adminFeeData === 'object' && adminFeeData !== null) {
                // Modern format: object with fee property
                shippingFeeShare = parseFloat(adminFeeData.fee) || 0;
              } else {
                // Legacy format: direct number/string value
                shippingFeeShare = parseFloat(adminFeeData) || 0;
              }
              
              console.log(`Order ${order._id}: Using stored admin shipping fee for ${adminId}: ${shippingFeeShare} GHS`);
              
              // CRITICAL FIX: Only add shipping fee once per admin per order
              if (!order._adminShippingCounted) {
                order._adminShippingCounted = new Set();
              }
              
              if (!order._adminShippingCounted.has(adminId)) {
                revenueByTime[timePeriodKey].adminRevenue[adminId].shippingFees += shippingFeeShare;
                order._adminShippingCounted.add(adminId);
                console.log(`Order ${order._id}: Added ${shippingFeeShare} GHS shipping fee for ${adminId} (first time)`);
              } else {
                console.log(`Order ${order._id}: Skipping shipping fee for ${adminId} (already counted)`);
              }
            }
            // ENHANCED: Add proportional shipping fee calculation as fallback (matching admin logic)
            else if (order.shippingFee) {
              let totalShippingFee = 0;
              
              // Parse the shipping fee value
              if (typeof order.shippingFee === 'number') {
                totalShippingFee = order.shippingFee;
              } else if (typeof order.shippingFee === 'string') {
                totalShippingFee = parseFloat(order.shippingFee) || 0;
              }
              
              // Only proceed if we have a valid shipping fee
              if (totalShippingFee > 0) {
                // Calculate the total order value from all items
                const totalOrderValue = (order.items || []).reduce((total, orderItem) => {
                  return total + (parseFloat(orderItem.price || 0) * (orderItem.quantity || 1));
                }, 0);
                
                // Calculate admin's percentage of the order
                if (totalOrderValue > 0) {
                  const adminPercentageOfOrder = itemRevenue / totalOrderValue;
                  
                  // Apportion shipping fee based on admin's percentage
                  shippingFeeShare = totalShippingFee * adminPercentageOfOrder;
                  
                  console.log(`Order ${order._id}: Admin gets ${(adminPercentageOfOrder*100).toFixed(2)}% (${shippingFeeShare.toFixed(2)} GHS) of total shipping fee: ${totalShippingFee.toFixed(2)} GHS`);
                  
                  // CRITICAL FIX: Only add shipping fee once per admin per order
                  if (!order._adminShippingCounted) {
                    order._adminShippingCounted = new Set();
                  }
                  
                  if (!order._adminShippingCounted.has(adminId)) {
                    revenueByTime[timePeriodKey].adminRevenue[adminId].shippingFees += shippingFeeShare;
                    order._adminShippingCounted.add(adminId);
                    console.log(`Order ${order._id}: Added proportional ${shippingFeeShare} GHS shipping fee for ${adminId} (first time)`);
                  } else {
                    console.log(`Order ${order._id}: Skipping proportional shipping fee for ${adminId} (already counted)`);
                  }
                }
              }
            }
            
            // Update admin revenue stats
            if (!revenueByTime[timePeriodKey].adminRevenue[adminId].platformFees) {
              revenueByTime[timePeriodKey].adminRevenue[adminId].platformFees = 0;
            }
            
            if (!revenueByTime[timePeriodKey].adminRevenue[adminId].shippingFees) {
              revenueByTime[timePeriodKey].adminRevenue[adminId].shippingFees = 0;
            }
            
            revenueByTime[timePeriodKey].adminRevenue[adminId].revenue += itemRevenue;
            revenueByTime[timePeriodKey].adminRevenue[adminId].platformFees += platformFee;
            adminCredited = true;
            
            // Count this order for this admin if not already counted
            if (!order._adminOrderCounted) {
              order._adminOrderCounted = new Set();
            }
            if (!order._adminOrderCounted.has(adminId)) {
              revenueByTime[timePeriodKey].adminRevenue[adminId].orderCount++;
              order._adminOrderCounted.add(adminId);
            }
          }
        });
      }
      
      // Process legacy order structure (cartItems)
      else if (cartItems.length > 0) {
        // Process each cart item
        for (const item of cartItems) {
          let adminId = null;
          
          // Try to find the product by ID to get the admin
          if (item.productId) {
            const productInfo = productAdminMap[item.productId.toString()];
            if (productInfo) {
              adminId = productInfo.adminId;
            } else {
              // If not found in our map, try to fetch it
              try {
                const product = await Product.findById(item.productId).populate('createdBy', '_id userName');
                if (product && product.createdBy && product.createdBy._id) {
                  adminId = product.createdBy._id.toString();
                }
              } catch (err) {
                console.error(`Error finding product ${item.productId}:`, err);
              }
            }
          }
          
          // If we found an admin ID and it's in our map
          if (adminId && revenueByTime[timePeriodKey].adminRevenue[adminId]) {
            const itemRevenue = item.quantity * (parseFloat(item.price) || 0);
            const platformFee = itemRevenue * 0.05; // Calculate 5% platform fee
            
            // CRITICAL FIX: Use the real admin-specific shipping fees from adminShippingFees ONLY
            let shippingFeeShare = 0;
            
            // Only use admin-specific shipping fee if available in adminShippingFees
            if (order.adminShippingFees && order.adminShippingFees[adminId]) {
              // Handle both object and primitive formats for adminShippingFees
              const adminFeeData = order.adminShippingFees[adminId];
              
              if (typeof adminFeeData === 'object' && adminFeeData !== null) {
                // Modern format: object with fee property
                shippingFeeShare = parseFloat(adminFeeData.fee) || 0;
              } else {
                // Legacy format: direct number/string value
                shippingFeeShare = parseFloat(adminFeeData) || 0;
              }
              
              console.log(`Order ${order._id}: Using stored admin shipping fee for ${adminId}: ${shippingFeeShare} GHS`);
              
              // CRITICAL FIX: Only add shipping fee once per admin per order
              if (!order._adminShippingCounted) {
                order._adminShippingCounted = new Set();
              }
              
              if (!order._adminShippingCounted.has(adminId)) {
                revenueByTime[timePeriodKey].adminRevenue[adminId].shippingFees += shippingFeeShare;
                order._adminShippingCounted.add(adminId);
                console.log(`Order ${order._id}: Added ${shippingFeeShare} GHS shipping fee for ${adminId} (first time)`);
              } else {
                console.log(`Order ${order._id}: Skipping shipping fee for ${adminId} (already counted)`);
              }
            }
            // ENHANCED: Add proportional shipping fee calculation as fallback (matching admin logic)
            else if (order.shippingFee) {
              let totalShippingFee = 0;
              
              // Parse the shipping fee value
              if (typeof order.shippingFee === 'number') {
                totalShippingFee = order.shippingFee;
              } else if (typeof order.shippingFee === 'string') {
                totalShippingFee = parseFloat(order.shippingFee) || 0;
              }
              
              // Only proceed if we have a valid shipping fee
              if (totalShippingFee > 0) {
                // Calculate the total order value from cartItems (legacy structure)
                const totalOrderValue = (order.cartItems || []).reduce((total, cartItem) => {
                  return total + (parseFloat(cartItem.price || 0) * (cartItem.quantity || 1));
                }, 0);
                
                // Calculate admin's percentage of the order
                if (totalOrderValue > 0) {
                  const adminPercentageOfOrder = itemRevenue / totalOrderValue;
                  
                  // Apportion shipping fee based on admin's percentage
                  shippingFeeShare = totalShippingFee * adminPercentageOfOrder;
                  
                  console.log(`Order ${order._id}: Admin gets ${(adminPercentageOfOrder*100).toFixed(2)}% (${shippingFeeShare.toFixed(2)} GHS) of total shipping fee: ${totalShippingFee.toFixed(2)} GHS`);
                  
                  // CRITICAL FIX: Only add shipping fee once per admin per order
                  if (!order._adminShippingCounted) {
                    order._adminShippingCounted = new Set();
                  }
                  
                  if (!order._adminShippingCounted.has(adminId)) {
                    revenueByTime[timePeriodKey].adminRevenue[adminId].shippingFees += shippingFeeShare;
                    order._adminShippingCounted.add(adminId);
                    console.log(`Order ${order._id}: Added proportional ${shippingFeeShare} GHS shipping fee for ${adminId} (first time)`);
                  } else {
                    console.log(`Order ${order._id}: Skipping proportional shipping fee for ${adminId} (already counted)`);
                  }
                }
              }
            }
            
            // Update admin revenue stats
            if (!revenueByTime[timePeriodKey].adminRevenue[adminId].platformFees) {
              revenueByTime[timePeriodKey].adminRevenue[adminId].platformFees = 0;
            }
            
            if (!revenueByTime[timePeriodKey].adminRevenue[adminId].shippingFees) {
              revenueByTime[timePeriodKey].adminRevenue[adminId].shippingFees = 0;
            }
            
            revenueByTime[timePeriodKey].adminRevenue[adminId].revenue += itemRevenue;
            revenueByTime[timePeriodKey].adminRevenue[adminId].platformFees += platformFee;
            adminCredited = true;
            
            // Count this order for this admin if not already counted
            if (!order._adminOrderCounted) {
              order._adminOrderCounted = new Set();
            }
            if (!order._adminOrderCounted.has(adminId)) {
              revenueByTime[timePeriodKey].adminRevenue[adminId].orderCount++;
              order._adminOrderCounted.add(adminId);
            }
          }
        }
      }
      
      // If no admin was credited, distribute evenly among all admins
      if (!adminCredited && adminUsers.length > 0) {
        const revenuePerAdmin = orderTotal / adminUsers.length;
        
        adminUsers.forEach(admin => {
          const adminId = admin._id.toString();
          revenueByTime[timePeriodKey].adminRevenue[adminId].revenue += revenuePerAdmin;
          
          // Count this order for this admin if not already counted
          if (!order._adminOrderCounted) {
            order._adminOrderCounted = new Set();
          }
          if (!order._adminOrderCounted.has(adminId)) {
            revenueByTime[timePeriodKey].adminRevenue[adminId].orderCount++;
            order._adminOrderCounted.add(adminId);
          }
        });
      }
    }
    
    // Convert to array and sort by date (newest first)
    const revenueData = Object.values(revenueByTime)
      .sort((a, b) => b.date - a.date)
      .map(period => {
        const adminRevenueArray = Object.values(period.adminRevenue);
        
        // Calculate totals for this period
        const totalRevenue = adminRevenueArray.reduce((sum, admin) => sum + (admin.revenue || 0), 0);
        const totalShippingFees = adminRevenueArray.reduce((sum, admin) => sum + (admin.shippingFees || 0), 0);
        const totalPlatformFees = adminRevenueArray.reduce((sum, admin) => sum + (admin.platformFees || 0), 0);
        
        // Product revenue is the same as total revenue (revenue from products)
        const productRevenue = totalRevenue;
        
        const result = {
          ...period,
          adminRevenue: adminRevenueArray,
          totalRevenue: totalRevenue + totalShippingFees, // Total includes shipping
          productRevenue: productRevenue, // Revenue from products only
          totalShippingFees: totalShippingFees,
          totalPlatformFees: totalPlatformFees
        };
        
        console.log(`Period ${period.timePeriodKey}: Product Revenue: ${productRevenue}, Total Revenue: ${result.totalRevenue}, Shipping: ${totalShippingFees}`);
        
        return result;
      });
    
    console.log(`Generated revenue data for ${revenueData.length} time periods`);
    
    // Send response
    res.status(200).json({
      success: true,
      timePeriod,
      revenueData
    });
  } catch (error) {
    console.error('Error in getAdminRevenueByTime:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to get week number
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Helper function to get start of week
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
};

// Helper function to get end of week
const getEndOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust for Sunday
  return new Date(d.setDate(diff));
};

module.exports = {
  getAdminRevenueByTime
};
