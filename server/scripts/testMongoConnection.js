require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoConnection() {
    console.log('🔍 MongoDB Connection Diagnostic');
    console.log('================================');
    
    // Check environment variables
    console.log('1. Environment Variables Check:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   MONGODB_URI configured:', !!process.env.MONGODB_URI);
    if (process.env.MONGODB_URI) {
        // Hide sensitive parts of the URI
        const uri = process.env.MONGODB_URI;
        const maskedUri = uri.replace(/:([^:@]+)@/, ':***@');
        console.log('   MONGODB_URI (masked):', maskedUri);
    }
    
    console.log('\n2. Testing MongoDB Connection:');
    
    try {
        // Test basic connection
        console.log('   Attempting to connect...');
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            socketTimeoutMS: 15000, // 15 seconds socket timeout
            connectTimeoutMS: 10000, // 10 seconds connection timeout
            maxPoolSize: 1, // Single connection for testing
            minPoolSize: 1,
            retryWrites: true,
            w: 'majority'
        });
        
        console.log('   ✅ Connection successful!');
        console.log('   Database:', conn.connection.name);
        console.log('   Host:', conn.connection.host);
        console.log('   Port:', conn.connection.port);
        console.log('   ReadyState:', conn.connection.readyState);
        
        // Test a simple query
        console.log('\n3. Testing Database Operations:');
        
        // Test listing collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('   Available collections:', collections.map(c => c.name));
        
        // Test a simple query on users collection
        const User = require('../models/User');
        const userCount = await User.countDocuments({});
        console.log('   User count:', userCount);
        
        // Test products collection
        const Product = require('../models/Products');
        const productCount = await Product.countDocuments({});
        console.log('   Product count:', productCount);
        
        console.log('\n✅ All tests passed! Database is working correctly.');
        
    } catch (error) {
        console.log('\n❌ Connection failed!');
        console.log('   Error type:', error.constructor.name);
        console.log('   Error message:', error.message);
        
        if (error.code) {
            console.log('   Error code:', error.code);
        }
        
        if (error.codeName) {
            console.log('   Error codeName:', error.codeName);
        }
        
        // Specific error analysis
        if (error.message.includes('ETIMEOUT')) {
            console.log('\n🔧 Diagnosis: Network timeout issue');
            console.log('   Possible causes:');
            console.log('   - MongoDB cluster is down or unreachable');
            console.log('   - Network connectivity issues');
            console.log('   - Firewall blocking the connection');
            console.log('   - Incorrect MongoDB URI or credentials');
        }
        
        if (error.message.includes('authentication')) {
            console.log('\n🔧 Diagnosis: Authentication issue');
            console.log('   Possible causes:');
            console.log('   - Incorrect username/password');
            console.log('   - Database user doesn\'t have required permissions');
            console.log('   - Database name is incorrect');
        }
        
        if (error.message.includes('querySrv')) {
            console.log('\n🔧 Diagnosis: DNS resolution issue');
            console.log('   Possible causes:');
            console.log('   - MongoDB cluster hostname is incorrect');
            console.log('   - DNS resolution problems');
            console.log('   - Network connectivity issues');
        }
        
        console.log('\n   Full error stack:');
        console.log(error.stack);
    }
    
    try {
        await mongoose.connection.close();
        console.log('\n🔌 Connection closed');
    } catch (closeError) {
        console.log('\n❌ Error closing connection:', closeError.message);
    }
    
    process.exit(0);
}

// Run the diagnostic
testMongoConnection(); 