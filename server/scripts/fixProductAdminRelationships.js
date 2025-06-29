/**
 * Fix Product-Admin Relationships Script
 * 
 * This script ensures all products have proper adminId relationships
 * so vendor notifications work correctly
 * 
 * Usage: node scripts/fixProductAdminRelationships.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Products');
const User = require('../models/User');

console.log('🔧 Starting Product-Admin Relationship Fix...');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ MongoDB connected');
  runFix();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const runFix = async () => {
  try {
    console.log('\n📊 Analyzing product-admin relationships...\n');
    
    // Get all products
    const allProducts = await Product.find({});
    console.log(`Found ${allProducts.length} total products`);
    
    // Check products without adminId
    const productsWithoutAdmin = await Product.find({
      $or: [
        { adminId: { $exists: false } },
        { adminId: null },
        { adminId: '' }
      ]
    });
    
    console.log(`Found ${productsWithoutAdmin.length} products without adminId`);
    
    // Get all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users`);
    
    if (adminUsers.length === 0) {
      console.log('⚠️ No admin users found. Creating a default admin...');
      
      // Create a default admin if none exists
      const defaultAdmin = new User({
        userName: 'Default Store Admin',
        email: 'admin@in-nd-out.com',
        password: 'temppassword123',
        role: 'admin'
      });
      
      await defaultAdmin.save();
      adminUsers.push(defaultAdmin);
      console.log('✅ Default admin created');
    }
    
    // Fix products without adminId
    let fixedCount = 0;
    const defaultAdmin = adminUsers[0]; // Use first admin as default
    
    for (const product of productsWithoutAdmin) {
      try {
        console.log(`🔧 Fixing product: ${product.title} (${product._id})`);
        
        product.adminId = defaultAdmin._id;
        await product.save();
        
        fixedCount++;
        console.log(`✅ Fixed: ${product.title} → assigned to ${defaultAdmin.userName}`);
      } catch (error) {
        console.error(`❌ Failed to fix product ${product._id}:`, error.message);
      }
    }
    
    console.log(`\n📈 Fixed ${fixedCount} products`);
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    
    const remainingProblems = await Product.find({
      $or: [
        { adminId: { $exists: false } },
        { adminId: null },
        { adminId: '' }
      ]
    });
    
    console.log(`Remaining products without adminId: ${remainingProblems.length}`);
    
    // Test product population
    console.log('\n🧪 Testing product population...');
    
    const testProducts = await Product.find({})
      .populate('adminId')
      .limit(5);
    
    for (const product of testProducts) {
      console.log(`📱 ${product.title}:`);
      console.log(`   Admin ID: ${product.adminId?._id || 'Missing'}`);
      console.log(`   Admin Email: ${product.adminId?.email || 'Not populated'}`);
      console.log(`   Admin Name: ${product.adminId?.userName || 'Not populated'}`);
      
      if (product.adminId?.email) {
        console.log(`   ✅ Can send notifications to: ${product.adminId.email}`);
      } else {
        console.log(`   ❌ Cannot send notifications - missing admin info`);
      }
    }
    
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Fixed ${fixedCount} products`);
    console.log(`📊 Total products: ${allProducts.length}`);
    console.log(`👤 Available admins: ${adminUsers.length}`);
    console.log(`❌ Remaining issues: ${remainingProblems.length}`);
    
    if (remainingProblems.length === 0) {
      console.log('\n🎉 All products now have proper admin relationships!');
      console.log('✅ Vendor notifications should now work correctly');
    } else {
      console.log('\n⚠️ Some issues remain. Manual intervention may be required.');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    console.log('\n🔚 Product-admin relationship fix completed');
    process.exit(0);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('\n📡 MongoDB connection closed');
    process.exit(0);
  });
}); 