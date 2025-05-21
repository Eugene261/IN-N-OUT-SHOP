/**
 * Script to fix missing adminId in cart items
 * This will update all cart items to include the correct adminId from each product's createdBy field
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('../models/cart');
const Product = require('../models/Products');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

async function fixCartAdminIds() {
  try {
    console.log('Starting cart adminId fix...');
    
    // Get all carts
    const carts = await Cart.find();
    console.log(`Found ${carts.length} carts to process`);
    
    let updatedItemCount = 0;
    let missingProductCount = 0;
    
    // Process each cart
    for (const cart of carts) {
      console.log(`Processing cart for user ${cart.userId} (${cart.items.length} items)`);
      let cartUpdated = false;
      
      // Process each item in the cart
      for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i];
        
        // Skip if the item already has a valid adminId
        if (item.adminId && mongoose.Types.ObjectId.isValid(item.adminId)) {
          console.log(`  Item ${i + 1} already has an adminId: ${item.adminId}`);
          continue;
        }
        
        try {
          // Look up the product to get the createdBy/adminId
          const product = await Product.findById(item.productId);
          
          if (product && product.createdBy) {
            // Update the cart item with the adminId
            cart.items[i].adminId = product.createdBy.toString();
            console.log(`  Updated item ${i + 1} (${item.title}) with adminId: ${product.createdBy}`);
            updatedItemCount++;
            cartUpdated = true;
          } else {
            console.log(`  Product not found for item ${i + 1}`);
            missingProductCount++;
          }
        } catch (error) {
          console.error(`  Error processing item ${i + 1}:`, error.message);
        }
      }
      
      // Save the updated cart
      if (cartUpdated) {
        await cart.save();
        console.log(`  Saved updated cart for user ${cart.userId}`);
      }
    }
    
    console.log('\nFix complete!');
    console.log(`Updated ${updatedItemCount} cart items with adminId`);
    console.log(`${missingProductCount} items had missing products`);
    
    mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing cart adminIds:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the fix
fixCartAdminIds(); 