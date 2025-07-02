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
        required : function() {
            // Password is required only if no OAuth provider is used
            return !this.googleId && !this.facebookId;
        }
    },
    // OAuth provider fields
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true
    },
    provider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local'
    },
    role : {
        type : String,
        enum: ['user', 'admin', 'superAdmin'],
        default : 'user'
    },
    // Additional profile information
    firstName: {
        type: String,
        trim: true,
        default: ''
    },
    lastName: {
        type: String,
        trim: true,
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    // Online status tracking
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    lastHeartbeat: {
        type: Date,
        default: null
    },
    // Security tracking fields
    lastIpAddress: {
        type: String
    },
    lastUserAgent: {
        type: String
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
    shopDescription: {
        type: String,
        trim: true,
        default: '',
        maxlength: 500
    },
    shopLogo: {
        type: String,
        default: ''
    },
    shopBanner: {
        type: String,
        default: ''
    },
    shopCategory: {
        type: String,
        trim: true,
        default: 'Other'
    },
    shopWebsite: {
        type: String,
        trim: true,
        default: ''
    },
    shopRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    shopReviewCount: {
        type: Number,
        default: 0
    },
    shopEstablished: {
        type: Date,
        default: null
    },
    shopPolicies: {
        returnPolicy: {
            type: String,
            default: ''
        },
        shippingPolicy: {
            type: String,
            default: ''
        },
        warrantyPolicy: {
            type: String,
            default: ''
        }
    },
    // Store additional shipping preferences (fallback rates when no specific zones are configured)
    shippingPreferences: {
        zones: [{
            name: String,
            regions: [String],
            fee: Number
        }],
        defaultFee: {
            type: Number,
            default: 0
        }
    },
    // Password reset fields
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add method to check if account is local (not OAuth)
UserSchema.methods.isLocalAccount = function() {
  return !this.googleId && !this.facebookId;
};

// Add database indexes for performance optimization
UserSchema.index({ role: 1 }); // For role-based queries
UserSchema.index({ role: 1, createdAt: -1 }); // For sorted role queries
UserSchema.index({ email: 1 }); // For email lookup
UserSchema.index({ isActive: 1 }); // For active user queries
UserSchema.index({ isOnline: 1, lastSeen: -1 }); // For online status
UserSchema.index({ createdAt: -1 }); // For general sorting

const User = mongoose.model('User', UserSchema);
module.exports = User;