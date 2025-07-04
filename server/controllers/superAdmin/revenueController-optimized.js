const Order = require('../../models/Order.js');
const User = require('../../models/User.js');
const Product = require('../../models/Products.js');

// OPTIMIZED: Get time-based admin revenue data using efficient aggregation
const getAdminRevenueByTime = async (req, res) => {
  try {
    console.log('🚀 Starting OPTIMIZED getAdminRevenueByTime function');
    
    // Check if the requester is a superAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superAdmins can access this resource.'
      });
    }
    
    const timePeriod = req.query.period || 'daily';
    const endDate = new Date();
    let startDate = new Date();
    
    // Set start date based on time period
    switch (timePeriod) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 28);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    console.log(`📅 Fetching revenue from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // OPTIMIZED: Get admin users with minimal fields using lean()
    const adminUsers = await User.find({ role: 'admin' }, { _id: 1, userName: 1, email: 1 }).lean();
    console.log(`👥 Found ${adminUsers.length} admin users`);
    
    // OPTIMIZED: Create product-admin mapping with minimal fields
    const productAdminMapping = await Product.find({ createdBy: { $exists: true, $ne: null } }, { _id: 1, createdBy: 1 }).lean();
    const productAdminMap = {};
    productAdminMapping.forEach(product => {
      productAdminMap[product._id.toString()] = product.createdBy.toString();
    });
    console.log(`🔗 Created mapping for ${Object.keys(productAdminMap).length} products`);
    
    // OPTIMIZED: Get orders with minimal fields, no population
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }, {
      _id: 1,
      createdAt: 1,
      totalAmount: 1,
      shippingFee: 1,
      adminShippingFees: 1,
      items: 1,
      cartItems: 1
    }).sort({ createdAt: -1 }).lean();
    
    console.log(`📦 Found ${orders.length} orders to process`);
    
    // Initialize revenue tracking
    const revenueByTime = {};
    
    // OPTIMIZED: Process orders efficiently
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      
      // Create time period key
      let timePeriodKey, displayDate;
      
      switch (timePeriod) {
        case 'daily':
          timePeriodKey = orderDate.toISOString().split('T')[0];
          displayDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
          });
          break;
        case 'weekly':
          const weekNumber = getWeekNumber(orderDate);
          timePeriodKey = `${orderDate.getFullYear()}-W${weekNumber}`;
          const startOfWeek = getStartOfWeek(orderDate);
          const endOfWeek = getEndOfWeek(orderDate);
          displayDate = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
          break;
        case 'monthly':
          timePeriodKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
          displayDate = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          break;
        case 'yearly':
          timePeriodKey = `${orderDate.getFullYear()}`;
          displayDate = orderDate.getFullYear().toString();
          break;
        default:
          timePeriodKey = orderDate.toISOString().split('T')[0];
          displayDate = orderDate.toLocaleDateString();
      }
      
      // Initialize time period
      if (!revenueByTime[timePeriodKey]) {
        revenueByTime[timePeriodKey] = {
          timePeriodKey,
          displayDate,
          date: orderDate,
          adminRevenue: {}
        };
        
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
      
      // Track admins credited in this order
      const adminsCredited = new Set();
      const processedItems = [...(order.items || []), ...(order.cartItems || [])];
      
      // Process all items efficiently
      processedItems.forEach(item => {
        let adminId = null;
        let itemRevenue = 0;
        
        // Handle both item structures efficiently
        if (item.product) {
          adminId = productAdminMap[item.product.toString()];
        } else if (item.productId) {
          adminId = productAdminMap[item.productId.toString()];
        }
        
        // Calculate item revenue
        itemRevenue = (item.quantity || 1) * (parseFloat(item.price) || 0);
        
        if (adminId && revenueByTime[timePeriodKey].adminRevenue[adminId]) {
          const platformFee = itemRevenue * 0.05;
          
          revenueByTime[timePeriodKey].adminRevenue[adminId].revenue += itemRevenue;
          revenueByTime[timePeriodKey].adminRevenue[adminId].platformFees += platformFee;
          
          adminsCredited.add(adminId);
        }
      });
      
      // Handle shipping fees (once per admin per order)
      adminsCredited.forEach(adminId => {
        if (!revenueByTime[timePeriodKey].adminRevenue[adminId]) return;
        
        let shippingFeeShare = 0;
        
        // Use admin-specific shipping fee if available
        if (order.adminShippingFees && order.adminShippingFees[adminId]) {
          const adminFeeData = order.adminShippingFees[adminId];
          shippingFeeShare = typeof adminFeeData === 'object' ? 
            parseFloat(adminFeeData.fee) || 0 : 
            parseFloat(adminFeeData) || 0;
        } else if (order.shippingFee && adminsCredited.size > 0) {
          // Distribute shipping fee proportionally
          shippingFeeShare = parseFloat(order.shippingFee) / adminsCredited.size;
        }
        
        revenueByTime[timePeriodKey].adminRevenue[adminId].shippingFees += shippingFeeShare;
        revenueByTime[timePeriodKey].adminRevenue[adminId].orderCount++;
      });
      
      // If no admin was credited, distribute evenly
      if (adminsCredited.size === 0 && adminUsers.length > 0) {
        const orderTotal = parseFloat(order.totalAmount) || 0;
        const revenuePerAdmin = orderTotal / adminUsers.length;
        
        adminUsers.forEach(admin => {
          const adminId = admin._id.toString();
          revenueByTime[timePeriodKey].adminRevenue[adminId].revenue += revenuePerAdmin;
          revenueByTime[timePeriodKey].adminRevenue[adminId].orderCount++;
        });
      }
    });
    
    // Convert to array and sort
    const revenueData = Object.values(revenueByTime)
      .sort((a, b) => b.date - a.date)
      .map(period => {
        const adminRevenueArray = Object.values(period.adminRevenue);
        
        const totalRevenue = adminRevenueArray.reduce((sum, admin) => sum + (admin.revenue || 0), 0);
        const totalShippingFees = adminRevenueArray.reduce((sum, admin) => sum + (admin.shippingFees || 0), 0);
        const totalPlatformFees = adminRevenueArray.reduce((sum, admin) => sum + (admin.platformFees || 0), 0);
        
        return {
          ...period,
          adminRevenue: adminRevenueArray,
          totalRevenue: totalRevenue + totalShippingFees,
          productRevenue: totalRevenue,
          totalShippingFees,
          totalPlatformFees
        };
      });
    
    console.log(`✅ Generated revenue data for ${revenueData.length} time periods`);
    
    res.status(200).json({
      success: true,
      timePeriod,
      revenueData
    });
    
  } catch (error) {
    console.error('❌ Error in getAdminRevenueByTime:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper functions
const getWeekNumber = (date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
};

const getStartOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(result.setDate(diff));
};

const getEndOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? 0 : 7);
  return new Date(result.setDate(diff));
};

module.exports = {
  getAdminRevenueByTime
}; 