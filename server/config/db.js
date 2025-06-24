const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Set mongoose options for better connection handling
        mongoose.set('strictQuery', false);
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000, // 45 seconds
            maxPoolSize: 10, // Maximum number of connections
            minPoolSize: 5, // Minimum number of connections
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            // Removed deprecated options that cause connection errors
        });
        
        console.log(`✅ MongoDB connected successfully to: ${conn.connection.host}`);
        
        // Connection event listeners
        mongoose.connection.on('connected', () => {
            console.log('📡 Mongoose connected to MongoDB');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('📴 Mongoose disconnected from MongoDB');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('🔄 Mongoose reconnected to MongoDB');
        });
        
        // Handle connection loss and reconnection
        mongoose.connection.on('close', () => {
            console.log('🔌 MongoDB connection closed');
        });
        
        // Handle process termination
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('🛑 MongoDB connection closed due to app termination');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error closing MongoDB connection:', error);
                process.exit(1);
            }
        });
        
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        console.error("Stack:", error.stack);
        
        // In production, try to reconnect after delay
        if (process.env.NODE_ENV === 'production') {
            console.log('🔄 Attempting to reconnect in 5 seconds...');
            setTimeout(() => {
                connectDB();
            }, 5000);
        } else {
            process.exit(1);
        }
    }
};

module.exports = connectDB;