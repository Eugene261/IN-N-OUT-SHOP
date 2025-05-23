const mongoose = require('mongoose');
require('dotenv').config();

async function debugShippingFees() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('ERROR: MONGODB_URI environment variable is not set!');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Order = require('./models/Order');
    const User = require('./models/User');
    
    console.log('\n=== DEBUGGING SHIPPING FEES ===');
    
    // Get all orders
    const orders = await Order.find({}).populate('user', 'userName email').sort({createdAt: -1});
    console.log(`\nFound ${orders.length} total orders`);
    
    let totalShippingFeesFromOrders = 0;
    let ordersWithShippingFees = 0;
    
    // Check each order for shipping fee data
    orders.forEach((order, index) => {
      console.log(`\n--- Order ${index + 1}: ${order._id} ---`);
      console.log(`Customer: ${order.user?.userName || order.customerName || 'Unknown'}`);
      console.log(`Total Amount: ${order.totalAmount || 0}`);
      console.log(`Order Shipping Fee: ${order.shippingFee || 0}`);
      console.log(`Type of shippingFee: ${typeof order.shippingFee}`);
      
      if (order.shippingFee && order.shippingFee > 0) {
        totalShippingFeesFromOrders += parseFloat(order.shippingFee);
        ordersWithShippingFees++;
      }
      
      console.log(`Admin Shipping Fees:`, order.adminShippingFees || 'None');
      
      if (order.adminShippingFees) {
        const adminTotal = Object.values(order.adminShippingFees).reduce((sum, fee) => {
          const feeValue = typeof fee === 'object' ? (fee.fee || 0) : (parseFloat(fee) || 0);
          return sum + feeValue;
        }, 0);
        console.log(`Admin shipping fees total: ${adminTotal}`);
      }
      
      console.log(`Address Info:`, order.addressInfo || 'None');
      console.log(`Cart Items Count: ${order.cartItems?.length || 0}`);
      console.log(`Order Status: ${order.status || order.orderStatus || 'Unknown'}`);
      console.log(`Payment Status: ${order.paymentStatus || 'Unknown'}`);
      console.log(`Created: ${order.createdAt}`);
      
      if (order.metadata?.shippingDetails) {
        console.log(`Metadata Shipping Details:`, order.metadata.shippingDetails);
      }
    });
    
    console.log(`\n=== SHIPPING FEES SUMMARY ===`);
    console.log(`Orders with shipping fees: ${ordersWithShippingFees}/${orders.length}`);
    console.log(`Total shipping fees from orders: ${totalShippingFeesFromOrders}`);
    
    // Now let's simulate what the admin revenue controller is calculating
    console.log(`\n=== SIMULATING ADMIN REVENUE CALCULATION ===`);
    
    // Get all admin users
    const adminUsers = await User.find({role: {$in: ['admin', 'superAdmin']}});
    
    for (const admin of adminUsers) {
      console.log(`\n--- Admin: ${admin.userName} (${admin._id}) ---`);
      
      // Find all products created by this admin (simulate what the controller does)
      const Product = require('./models/Products');
      const adminProducts = await Product.find({ 
        $or: [
          { createdBy: admin._id },
          { createdBy: { $exists: false } }, // Include legacy products
          { createdBy: null }
        ]
      });
      
      const adminProductIds = adminProducts.map(product => product._id.toString());
      console.log(`Admin has ${adminProducts.length} products`);
      
      // Filter orders that contain at least one product from this admin
      const adminOrders = orders.filter(order => {
        return order.cartItems.some(item => 
          adminProductIds.includes(item.productId)
        );
      });
      
      console.log(`Admin has ${adminOrders.length} orders with their products`);
      
      let adminTotalShippingFees = 0;
      let shippingFeesByRegion = { accra: 0, other: 0 };
      
      adminOrders.forEach(order => {
        console.log(`  Processing order ${order._id}:`);
        
        // Only count revenue from admin's products in each order
        const adminItemsInOrder = order.cartItems.filter(item => 
          adminProductIds.includes(item.productId)
        );
        
        console.log(`    Admin has ${adminItemsInOrder.length}/${order.cartItems.length} items in this order`);
        
        if (adminItemsInOrder.length === 0) {
          console.log(`    Skipping - no admin items in order`);
          return;
        }
        
        let adminShippingFee = 0;
        
        // CRITICAL: Check how shipping fees are calculated (this is what the controller does)
        if (order.adminShippingFees && order.adminShippingFees[admin._id]) {
          // Handle both object and primitive formats for adminShippingFees
          const adminFeeData = order.adminShippingFees[admin._id];
          
          if (typeof adminFeeData === 'object' && adminFeeData !== null) {
            // Modern format: object with fee property
            adminShippingFee = parseFloat(adminFeeData.fee) || 0;
          } else {
            // Legacy format: direct number/string value
            adminShippingFee = parseFloat(adminFeeData) || 0;
          }
          
          console.log(`    Using stored admin shipping fee: ${adminShippingFee} GHS`);
        } 
        else if (order.shippingFee) {
          // Calculate proportional shipping fee
          const orderRevenue = adminItemsInOrder.reduce((sum, item) => 
            sum + (parseFloat(item.price) * item.quantity), 0
          );
          
          const totalOrderValue = order.cartItems.reduce((total, item) => 
            total + (parseFloat(item.price || 0) * (item.quantity || 1)), 0
          );
          
          if (totalOrderValue > 0) {
            const adminPercentageOfOrder = orderRevenue / totalOrderValue;
            adminShippingFee = parseFloat(order.shippingFee) * adminPercentageOfOrder;
            console.log(`    Calculated proportional shipping fee: ${adminShippingFee.toFixed(2)} GHS (${(adminPercentageOfOrder*100).toFixed(2)}% of ${order.shippingFee} GHS)`);
          }
        }
        
        // Track region counts regardless
        if (order.addressInfo) {
          const city = (order.addressInfo.city || '').toLowerCase();
          const region = (order.addressInfo.region || '').toLowerCase();
          
          if (city.includes('accra') || region.includes('accra') || region.includes('greater accra')) {
            shippingFeesByRegion.accra++;
            // If no shipping fee was calculated but we have items, add standard fee
            if (adminShippingFee <= 0) {
              adminShippingFee = 40;
              console.log(`    No shipping fee found, adding standard Accra fee: ${adminShippingFee} GHS`);
            }
          } else {
            shippingFeesByRegion.other++;
            // If no shipping fee was calculated but we have items, add standard fee
            if (adminShippingFee <= 0) {
              adminShippingFee = 70;
              console.log(`    No shipping fee found, adding standard other region fee: ${adminShippingFee} GHS`);
            }
          }
        }
        
        adminTotalShippingFees += adminShippingFee;
        console.log(`    Admin shipping fee for this order: ${adminShippingFee} GHS`);
      });
      
      console.log(`  Total shipping fees for ${admin.userName}: ${adminTotalShippingFees} GHS`);
      console.log(`  Shipping fees by region:`, shippingFeesByRegion);
      console.log(`  This is what should appear in the admin dashboard for ${admin.userName}`);
    }
    
    console.log(`\n=== END DEBUG ===`);
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugShippingFees(); 