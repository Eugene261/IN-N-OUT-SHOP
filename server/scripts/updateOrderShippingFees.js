const mongoose = require('mongoose');
const Order = require('../models/Order');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to update shipping fees for existing orders
async function updateOrderShippingFees() {
  try {
    console.log('Searching for orders with zero shipping fees...');
    
    // Find all orders with zero shipping fee but with admin shipping fees
    const orders = await Order.find({
      shippingFee: { $eq: 0 },
      adminShippingFees: { $exists: true, $ne: {} }
    });
    
    console.log(`Found ${orders.length} orders to update`);
    
    let updatedCount = 0;
    
    for (const order of orders) {
      // Check if adminShippingFees exists
      if (order.adminShippingFees && Object.keys(order.adminShippingFees).length > 0) {
        // Calculate total shipping fee from all vendors
        const totalShippingFee = Object.entries(order.adminShippingFees)
          .reduce((sum, [adminId, fee]) => {
            // Handle different fee formats
            const feeValue = typeof fee === 'object' ? (fee.fee || 0) : (fee || 0);
            return sum + feeValue;
          }, 0);
        
        // If we calculated a non-zero shipping fee, update the order
        if (totalShippingFee > 0) {
          order.shippingFee = totalShippingFee;
          await order.save();
          console.log(`Updated order ${order._id} with shipping fee ${totalShippingFee}`);
          updatedCount++;
        }
      }
      // If adminShippingFees doesn't exist but we have cart items with vendors
      else if (order.cartItems && order.cartItems.length > 0) {
        // Group items by admin
        const adminGroups = {};
        
        order.cartItems.forEach(item => {
          const adminId = item.adminId || 'unknown';
          if (!adminGroups[adminId]) {
            adminGroups[adminId] = {
              adminId,
              items: []
            };
          }
          adminGroups[adminId].items.push(item.productId || item._id);
        });
        
        // Calculate default shipping fee
        const city = (order.addressInfo?.city || '').toLowerCase();
        const region = (order.addressInfo?.region || '').toLowerCase();
        const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
        
        const adminShippingFees = {};
        Object.keys(adminGroups).forEach(adminId => {
          // Default to 0 to avoid unexpected charges when vendor rates aren't configured
          adminShippingFees[adminId] = 0;
        });
        
        // Calculate total shipping fee
        const totalShippingFee = Object.values(adminShippingFees).reduce((sum, fee) => sum + fee, 0);
        
        // Update the order
        order.adminShippingFees = adminShippingFees;
        order.shippingFee = totalShippingFee;
        order.adminGroups = Object.values(adminGroups);
        
        await order.save();
        console.log(`Updated order ${order._id} with shipping fee ${totalShippingFee} (calculated from cart items)`);
        updatedCount++;
      }
    }
    
    console.log(`Updated shipping fees for ${updatedCount} orders`);
    console.log('Shipping fee update complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating shipping fees:', error);
    process.exit(1);
  }
}

// Run the update function
updateOrderShippingFees();
