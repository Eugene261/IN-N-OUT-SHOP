const mongoose = require('mongoose');
const User = require('../models/User.js');
require('dotenv').config();

async function optimizeDatabase() {
  try {
    console.log('🔧 Starting database optimization...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecom');
    console.log('✅ Connected to database');
    
    // Get User collection
    const userCollection = mongoose.connection.db.collection('users');
    
    console.log('📊 Current indexes:');
    const existingIndexes = await userCollection.listIndexes().toArray();
    existingIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Add essential indexes for User queries
    console.log('\n🚀 Adding optimized indexes...');
    
    // Index for role-based queries (most common in super admin)
    await userCollection.createIndex({ role: 1 }, { 
      name: 'role_index',
      background: true 
    });
    console.log('✅ Added role index');
    
    // Compound index for role + createdAt (for sorted results)
    await userCollection.createIndex({ role: 1, createdAt: -1 }, { 
      name: 'role_created_index',
      background: true 
    });
    console.log('✅ Added role + createdAt compound index');
    
    // Index for email lookup (login/auth)
    await userCollection.createIndex({ email: 1 }, { 
      name: 'email_index',
      background: true 
    });
    console.log('✅ Added email index');
    
    // Index for active users
    await userCollection.createIndex({ isActive: 1 }, { 
      name: 'active_index',
      background: true 
    });
    console.log('✅ Added isActive index');
    
    // Index for online status
    await userCollection.createIndex({ isOnline: 1, lastSeen: -1 }, { 
      name: 'online_status_index',
      background: true 
    });
    console.log('✅ Added online status index');
    
    // Index for createdAt (for general sorting)
    await userCollection.createIndex({ createdAt: -1 }, { 
      name: 'created_date_index',
      background: true 
    });
    console.log('✅ Added createdAt index');
    
    console.log('\n📊 Updated indexes:');
    const newIndexes = await userCollection.listIndexes().toArray();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Test query performance after optimization
    console.log('\n🧪 Testing query performance after optimization...');
    
    const start = Date.now();
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).limit(10);
    const end = Date.now();
    
    console.log(`✅ getAllUsers query completed in: ${end - start} ms`);
    console.log(`📈 Found ${users.length} users`);
    
    // Test role-based query
    const roleStart = Date.now();
    const adminUsers = await User.find({ role: 'admin' }, { password: 0 }).sort({ createdAt: -1 }).limit(10);
    const roleEnd = Date.now();
    
    console.log(`✅ Role-based query completed in: ${roleEnd - roleStart} ms`);
    console.log(`📈 Found ${adminUsers.length} admin users`);
    
    await mongoose.connection.close();
    console.log('\n🎉 Database optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  }
}

optimizeDatabase(); 