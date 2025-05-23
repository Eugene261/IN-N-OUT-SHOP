const mongoose = require('mongoose');
const Cart = require('../models/cart');
const Product = require('../models/Products');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Ensure environment variable is set
    if (!process.env.MONGODB_URI) {
      console.error('ERROR: MONGODB_URI environment variable is not set!');
      console.error('Please set MONGODB_URI in your .env file');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB...`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const updateCartItems = async () => {
  try {
    console.log('Starting cart items price update...');
    
    // Get all carts
    const carts = await Cart.find({});
    console.log(`Found ${carts.length} carts to process`);
    
    let updatedCarts = 0;
    let updatedItems = 0;
    
    // Process each cart
    for (const cart of carts) {
      let cartUpdated = false;
      
      // Process each item in the cart
      for (const item of cart.items) {
        if (!item.productId) continue;
        
        // Fetch the product to get the current prices
        const product = await Product.findById(item.productId);
        if (!product) continue;
        
        // Get the current prices
        const productPrice = product.price || 0;
        const productSalePrice = product.salePrice || 0;
        
        // Determine the effective price - use sale price only if it's lower than regular price
        const effectivePrice = (productSalePrice && productSalePrice > 0 && productSalePrice < productPrice) 
          ? productSalePrice 
          : productPrice;
        
        // Update the item if needed
        if (item.price !== effectivePrice || !item.regularPrice) {
          console.log(`Updating cart item ${item.productId} for user ${cart.userId}:`);
          console.log(`  Old price: ${item.price}, Sale price: ${productSalePrice}, Regular price: ${productPrice}`);
          console.log(`  New effective price: ${effectivePrice}`);
          
          // Update the item
          item.price = effectivePrice;
          item.regularPrice = productPrice;
          item.salePrice = productSalePrice;
          
          cartUpdated = true;
          updatedItems++;
        }
      }
      
      // Save the cart if it was updated
      if (cartUpdated) {
        await cart.save();
        updatedCarts++;
      }
    }
    
    console.log(`Updated ${updatedItems} items in ${updatedCarts} carts`);
    
  } catch (error) {
    console.error('Error updating cart items:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the migration
connectDB()
  .then(() => updateCartItems())
  .catch(console.error); 