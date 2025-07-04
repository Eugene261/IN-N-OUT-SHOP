// Debug server startup script
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 DEBUG SERVER STARTUP');
console.log('========================');

// Check environment variables
console.log('\n📋 ENVIRONMENT VARIABLES:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || '5000 (default)');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ configured' : '❌ MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ configured' : '❌ MISSING');

// Test database connection
const testDatabase = async () => {
  console.log('\n🔌 TESTING DATABASE CONNECTION:');
  
  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI not configured - cannot test database');
    return false;
  }
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections in database`);
    
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
};

// Test basic server functionality
const testServer = async () => {
  console.log('\n🚀 TESTING SERVER STARTUP:');
  
  try {
    const express = require('express');
    const app = express();
    
    // Add a simple test route
    app.get('/test', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`✅ Test server started on port ${PORT}`);
      
      // Test the endpoint
      setTimeout(async () => {
        try {
          const response = await fetch(`http://localhost:${PORT}/test`);
          const data = await response.json();
          console.log('✅ Test endpoint responded:', data);
          
          server.close(() => {
            console.log('✅ Test server closed');
            process.exit(0);
          });
        } catch (error) {
          console.log('❌ Test endpoint failed:', error.message);
          server.close(() => process.exit(1));
        }
      }, 1000);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is already in use`);
      } else {
        console.log('❌ Server error:', error.message);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.log('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

// Run all tests
const runDiagnostics = async () => {
  console.log('Starting diagnostics...\n');
  
  const dbOk = await testDatabase();
  
  if (!dbOk) {
    console.log('\n⚠️ Database issues detected - check MONGODB_URI');
  }
  
  if (!process.env.JWT_SECRET) {
    console.log('\n⚠️ JWT_SECRET missing - authentication will fail');
  }
  
  await testServer();
};

runDiagnostics().catch(error => {
  console.log('💥 Diagnostics failed:', error.message);
  process.exit(1);
}); 