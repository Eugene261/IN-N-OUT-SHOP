const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log("MongoDB connected successfully");
        
    } catch (error) {
        console.error("MongoDB connection failed", error);
        process.exit(1);
    }
};



module.exports = connectDB;