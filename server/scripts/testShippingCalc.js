/**
 * Test Shipping Fee Calculation Script
 * 
 * This script helps test the shipping fee calculation logic with different scenarios
 * Run with: node scripts/testShippingCalc.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { calculateShippingFees } = require('../services/shippingService');
const ShippingZone = require('../models/ShippingZone');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('MongoDB connected');
  runTests();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Test scenarios
const testScenarios = [
  {
    name: 'Customer in Greater Accra, Vendor in Greater Accra',
    addressInfo: {
      city: 'Accra',
      region: 'Greater Accra'
    }
  },
  {
    name: 'Customer in Kumasi, Vendor in Greater Accra',
    addressInfo: {
      city: 'Kumasi',
      region: 'Ashanti'
    }
  },
  {
    name: 'Customer in Greater Accra, Vendor in Ashanti',
    addressInfo: {
      city: 'Accra',
      region: 'Greater Accra'
    },
    vendorRegionOverride: 'Ashanti'
  },
  {
    name: 'Customer in Ashanti, Vendor in Ashanti (Same Region)',
    addressInfo: {
      city: 'Kumasi',
      region: 'Ashanti'
    },
    vendorRegionOverride: 'Ashanti'
  }
];

// Cart items for testing
const testCart = [
  {
    productId: '5f9d88b9b39f2d001f8d56e4', // Example product ID
    adminId: 'admin1', // Will be replaced with actual admin ID
    quantity: 2,
    price: 100,
    title: 'Test Product 1'
  },
  {
    productId: '5f9d88b9b39f2d001f8d56e5', // Example product ID
    adminId: 'admin2', // Will be replaced with actual admin ID
    quantity: 1,
    price: 150,
    title: 'Test Product 2'
  }
];

// Run the test scenarios
const runTests = async () => {
  try {
    // Find admin users for testing
    const admins = await User.find({ role: 'admin' }).limit(2);
    
    if (admins.length < 1) {
      console.error('Error: Need at least one admin user for testing');
      process.exit(1);
    }
    
    // Get the first admin for our tests
    const admin1 = admins[0];
    const admin2 = admins.length > 1 ? admins[1] : admins[0];
    
    console.log(`Using admin1: ${admin1.userName} (${admin1._id}), baseRegion: ${admin1.baseRegion || 'not set'}`);
    if (admin2._id !== admin1._id) {
      console.log(`Using admin2: ${admin2.userName} (${admin2._id}), baseRegion: ${admin2.baseRegion || 'not set'}`);
    }
    
    // Update cart items with real admin IDs
    testCart[0].adminId = admin1._id.toString();
    testCart[1].adminId = admin2._id.toString();
    
    // Print shipping zones for these admins
    console.log('\nShipping Zones:');
    const zones = await ShippingZone.find({ 
      vendorId: { $in: [admin1._id, admin2._id] }
    });
    
    zones.forEach(zone => {
      const isAdmin1 = zone.vendorId.toString() === admin1._id.toString();
      console.log(`  - ${zone.name} (${isAdmin1 ? 'admin1' : 'admin2'}): region=${zone.region}, baseRate=${zone.baseRate}, vendorRegion=${zone.vendorRegion || 'not set'}, sameRegionCapFee=${zone.sameRegionCapFee || 'not set'}`);
    });
    
    // Run each test scenario
    console.log('\n====== RUNNING TEST SCENARIOS ======');
    for (const scenario of testScenarios) {
      console.log(`\n${scenario.name}:`);
      console.log(`  Customer address: ${scenario.addressInfo.city}, ${scenario.addressInfo.region}`);
      
      // If there's a vendor region override, temporarily update the admin's baseRegion
      if (scenario.vendorRegionOverride) {
        const originalRegion = admin1.baseRegion;
        console.log(`  Temporarily setting vendor region to: ${scenario.vendorRegionOverride}`);
        admin1.baseRegion = scenario.vendorRegionOverride;
        await admin1.save();
        
        // Also update any zones
        const adminZones = await ShippingZone.find({ vendorId: admin1._id });
        for (const zone of adminZones) {
          zone.vendorRegion = scenario.vendorRegionOverride;
          await zone.save();
        }
      }
      
      // Calculate shipping fees
      const result = await calculateShippingFees(testCart, scenario.addressInfo);
      
      // Display results
      console.log('  Results:');
      console.log(`  - Total shipping fee: GHS ${result.totalShippingFee.toFixed(2)}`);
      console.log('  - Admin shipping fees:');
      
      for (const [adminId, fee] of Object.entries(result.adminShippingFees)) {
        const isAdmin1 = adminId === admin1._id.toString();
        const adminName = isAdmin1 ? admin1.userName : (adminId === admin2._id.toString() ? admin2.userName : 'Unknown');
        console.log(`    - ${adminName}: GHS ${typeof fee === 'object' ? fee.fee.toFixed(2) : parseFloat(fee).toFixed(2)}`);
      }
      
      // Reset vendor region if it was overridden
      if (scenario.vendorRegionOverride) {
        console.log(`  Resetting vendor region to original value`);
        admin1.baseRegion = admin1.originalRegion;
        await admin1.save();
      }
    }
    
    console.log('\n====== TESTS COMPLETED ======');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
}); 