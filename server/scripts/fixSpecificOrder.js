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

// Function to fix a specific order
async function fixSpecificOrder() {
  try {
    // The specific order ID from your data
    const orderId = '682dd06bfbe1ede980b1da88';
    
    console.log(`Attempting to fix order: ${orderId}`);
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error('Order not found!');
      process.exit(1);
    }
    
    console.log('Order found, processing shipping fees...');
    
    // Check if we have cart items
    if (order.cartItems && order.cartItems.length > 0) {
      // Group items by admin
      const adminGroups = {};
      
      order.cartItems.forEach(item => {
        // Try to get adminId from item or assign to default
        const adminId = item.adminId || 'default-vendor';
        
        if (!adminGroups[adminId]) {
          adminGroups[adminId] = {
            adminId,
            adminName: item.adminName || 'Vendor',
            items: [],
            itemCount: 0,
            shippingFee: 0,
            status: 'processing'
          };
        }
        
        adminGroups[adminId].items.push(item.productId || item._id);
        adminGroups[adminId].itemCount = (adminGroups[adminId].itemCount || 0) + item.quantity;
      });
      
      // Calculate shipping fees based on location
      const city = (order.addressInfo?.city || '').toLowerCase();
      const region = (order.addressInfo?.region || '').toLowerCase();
      const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
      
      // Set shipping fees for each vendor
      const adminShippingFees = {};
      
      Object.keys(adminGroups).forEach(adminId => {
        const fee = isAccra ? 40 : 70;
        adminShippingFees[adminId] = fee;
        adminGroups[adminId].shippingFee = fee;
      });
      
      // Calculate total shipping fee
      const totalShippingFee = Object.values(adminShippingFees).reduce((sum, fee) => sum + fee, 0);
      
      console.log(`Calculated shipping fee: ${totalShippingFee} GHS`);
      console.log(`Admin groups created: ${Object.keys(adminGroups).length}`);
      
      // Update the order
      order.adminShippingFees = adminShippingFees;
      order.shippingFee = totalShippingFee;
      order.adminGroups = Object.values(adminGroups);
      
      // Save the updated order
      await order.save();
      
      console.log('Order successfully updated!');
      console.log(`Order now has shippingFee: ${order.shippingFee} GHS`);
      console.log(`Order now has ${order.adminGroups.length} admin groups`);
    } else {
      console.log('No cart items found in the order. Cannot calculate shipping fees.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating order:', error);
    process.exit(1);
  }
}

// Run the fix function
fixSpecificOrder();
