const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userName : {
        type : String,
        required : true,
        unique : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    role : {
        type : String,
        enum: ['user', 'admin', 'superAdmin'],
        default : 'user'
    },
    // Vendor shipping information
    baseRegion: {
        type: String,
        trim: true,
        default: ''
    },
    baseCity: {
        type: String,
        trim: true,
        default: ''
    },
    // Financial tracking
    balance: {
        type: Number,
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    totalEarningsWithdrawn: {
        type: Number,
        default: 0
    },
    totalShippingFees: {
        type: Number,
        default: 0
    },
    platformFees: {
        type: Number,
        default: 0
    },
    // Shop information
    shopName: {
        type: String,
        trim: true,
        default: ''
    },
    // Store additional shipping preferences
    shippingPreferences: {
        defaultBaseRate: {
            type: Number,
            default: 40 // Default base rate in GHS
        },
        defaultOutOfRegionRate: {
            type: Number,
            default: 70 // Default out-of-region rate in GHS
        },
        enableRegionalRates: {
            type: Boolean,
            default: true
        }
    }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;