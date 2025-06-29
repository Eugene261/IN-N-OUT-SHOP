/**
 * Profile Data Recovery Script
 * 
 * This script helps diagnose and fix profile data loading issues
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.js');

console.log('🔧 Profile Data Recovery & Diagnostic Tool');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ MongoDB connected');
  await runDiagnostic();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const runDiagnostic = async () => {
  try {
    console.log('\n🔍 PROFILE DATA DIAGNOSTIC');
    console.log('==================================================');
    
    // Find the user with email eugene@example.com
    const user = await User.findOne({ email: 'eugene@example.com' }).select('-password');
    
    if (!user) {
      console.log('❌ User not found with email: eugene@example.com');
      process.exit(1);
    }
    
    console.log('✅ User found in database');
    console.log('\n📊 COMPLETE USER DATA:');
    console.log('─────────────────────────────────────────────────');
    console.log(`ID: ${user._id}`);
    console.log(`Username: ${user.userName}`);
    console.log(`First Name: ${user.firstName || 'NOT SET'}`);
    console.log(`Last Name: ${user.lastName || 'NOT SET'}`);
    console.log(`Email: ${user.email}`);
    console.log(`Phone: ${user.phone || 'NOT SET'}`);
    console.log(`Date of Birth: ${user.dateOfBirth || 'NOT SET'}`);
    console.log(`Avatar: ${user.avatar || 'NOT SET'}`);
    console.log(`Role: ${user.role}`);
    console.log(`Base Region: ${user.baseRegion || 'NOT SET'}`);
    console.log(`Base City: ${user.baseCity || 'NOT SET'}`);
    console.log(`Shop Name: ${user.shopName || 'NOT SET'}`);
    console.log(`Shop Description: ${user.shopDescription || 'NOT SET'}`);
    console.log(`Shop Category: ${user.shopCategory || 'NOT SET'}`);
    console.log(`Shop Website: ${user.shopWebsite || 'NOT SET'}`);
    console.log(`Shop Logo: ${user.shopLogo || 'NOT SET'}`);
    console.log(`Shop Banner: ${user.shopBanner || 'NOT SET'}`);
    console.log(`Shop Established: ${user.shopEstablished || 'NOT SET'}`);
    console.log(`Created At: ${user.createdAt}`);
    console.log(`Updated At: ${user.updatedAt}`);
    
    // Test the API response format
    console.log('\n🔧 TESTING API RESPONSE FORMAT:');
    console.log('─────────────────────────────────────────────────');
    
    const shopApiResponse = {
      success: true,
      shop: user,
      stats: {
        totalProducts: 20,
        totalOrders: 0,
        totalEarnings: 0,
        shopRating: user.shopRating || 0,
        reviewCount: user.shopReviewCount || 0
      }
    };
    
    console.log('✅ Shop API Response Structure (what fetchAdminProfile should return):');
    console.log(JSON.stringify(shopApiResponse, null, 2));
    
    // Check if required fields are present
    console.log('\n✅ REQUIRED FIELDS CHECK:');
    console.log('─────────────────────────────────────────────────');
    const requiredFields = [
      'firstName', 'lastName', 'email', 'userName', 
      'baseRegion', 'baseCity', 'shopName'
    ];
    
    let missingFields = [];
    requiredFields.forEach(field => {
      if (!user[field]) {
        missingFields.push(field);
        console.log(`❌ Missing: ${field}`);
      } else {
        console.log(`✅ Present: ${field} = "${user[field]}"`);
      }
    });
    
    if (missingFields.length === 0) {
      console.log('\n🎉 ALL REQUIRED FIELDS ARE PRESENT!');
      console.log('The issue is likely in the frontend data loading.');
    } else {
      console.log(`\n⚠️  Missing ${missingFields.length} required fields.`);
    }
    
    // Provide recovery instructions
    console.log('\n🛠️  RECOVERY INSTRUCTIONS:');
    console.log('─────────────────────────────────────────────────');
    console.log('1. Your data exists in the database ✅');
    console.log('2. Check browser console for fetchAdminProfile errors');
    console.log('3. Verify localStorage is being updated with user data');
    console.log('4. Clear browser cache and localStorage');
    console.log('5. Try refreshing the profile page');
    
    console.log('\n🌐 FRONTEND DEBUGGING STEPS:');
    console.log('─────────────────────────────────────────────────');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Console tab');
    console.log('3. Look for these log messages:');
    console.log('   - "Auth slice - fetchAdminProfile fulfilled"');
    console.log('   - "User data changed, updating form data"');
    console.log('4. Check localStorage: localStorage.getItem("user")');
    console.log('5. Check Redux state in Redux DevTools');
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  } finally {
    process.exit(0);
  }
}; 