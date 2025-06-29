const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    // Main product image
    image: String,
    // Additional product images
    additionalImages: {
        type: [String],
        default: []
    },
    title: String,
    description: String,
    category: String,
    subCategory: String,
    brand: String,
    price: Number,
    salePrice: Number,
    totalStock: Number,
    // Adding size and color fields
    sizes: {
        type: [String],
        default: []
    },
    colors: {
        type: [String],
        default: []
    },
    // Adding missing fields for bestseller and new arrival functionality
    isBestseller: {
        type: Boolean,
        default: false
    },
    isNewArrival: {
        type: Boolean,
        default: false
    },
    // Add reference to the admin who created this product
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // ========================================
    // FLEXIBLE ATTRIBUTES SYSTEM
    // ========================================
    
    // Store custom attributes as key-value pairs for flexibility
    customAttributes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Track which fields are actually required for this product type
    fieldRequirements: {
        sizes: { type: Boolean, default: false },
        colors: { type: Boolean, default: true },  // Most products have colors
        brand: { type: Boolean, default: true },   // Most products have brands
        gender: { type: Boolean, default: false }, // Not all products have gender targeting
        customFields: { type: [String], default: [] } // List of required custom field names
    },
    
    // Product-specific metadata for enhanced categorization
    productType: {
        type: String,
        enum: ['physical', 'digital', 'service', 'subscription', 'bundle'],
        default: 'physical'
    },
    

    
    // ========================================
    // PRODUCT APPROVAL SYSTEM FIELDS
    // ========================================
    
    // Product approval status
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: function() {
            // PRODUCTION SAFETY: Default to 'approved' to maintain backward compatibility
            // New products will be set to 'pending' in the controller if approval is enabled
            return process.env.DEFAULT_PRODUCT_STATUS || 'approved';
        }
    },
    
    // Comments from SuperAdmin during approval/rejection
    approvalComments: {
        type: String,
        default: '',
        maxlength: 1000
    },
    
    // Reference to SuperAdmin who approved/rejected
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Timestamps for approval workflow
    submittedAt: {
        type: Date,
        default: Date.now
    },
    
    approvedAt: {
        type: Date,
        default: null
    },
    
    rejectedAt: {
        type: Date,
        default: null
    },
    
    // Track product quality issues (for future enhancement)
    qualityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 85 // Default good score for existing products
    },
    
    // Migration tracking (for production safety)
    migrationInfo: {
        migratedAt: Date,
        version: String,
        autoApproved: {
            type: Boolean,
            default: false
        }
    }
}, { timestamps: true });

// ========================================
// VIRTUAL FIELDS
// ========================================

// Virtual field to check if product is visible to customers
ProductSchema.virtual('isVisibleToCustomers').get(function() {
    // PRODUCTION SAFETY: If approval system is disabled, all products are visible
    const approvalEnabled = process.env.PRODUCT_APPROVAL_ENABLED === 'true';
    
    if (!approvalEnabled) {
        return true; // All products visible when approval is disabled
    }
    
    return this.approvalStatus === 'approved';
});

// Virtual field for admin-friendly status display
ProductSchema.virtual('statusDisplay').get(function() {
    const status = this.approvalStatus || 'approved';
    const statusMap = {
        'pending': '⏳ Pending Review',
        'approved': '✅ Approved',
        'rejected': '❌ Rejected'
    };
    return statusMap[status] || status;
});

// ========================================
// INDEXES FOR PERFORMANCE
// ========================================

// Index for approval status queries (performance optimization)
ProductSchema.index({ approvalStatus: 1, createdAt: -1 });

// Index for admin's products with approval status
ProductSchema.index({ createdBy: 1, approvalStatus: 1 });

// Index for customer-facing product queries
ProductSchema.index({ approvalStatus: 1, category: 1, isBestseller: 1 });

// ========================================
// MIDDLEWARE
// ========================================

// Pre-save middleware to set submission timestamp for new products
ProductSchema.pre('save', function(next) {
    // Only set submittedAt for new products if not already set
    if (this.isNew && !this.submittedAt) {
        this.submittedAt = new Date();
    }
    
    // Ensure approval status is set based on environment
    if (this.isNew && !this.approvalStatus) {
        const approvalEnabled = process.env.PRODUCT_APPROVAL_ENABLED === 'true';
        this.approvalStatus = approvalEnabled ? 'pending' : 'approved';
    }
    
    next();
});

// ========================================
// STATIC METHODS
// ========================================

// Method to get only approved products (for customer queries)
ProductSchema.statics.findApproved = function(filter = {}) {
    const approvalEnabled = process.env.PRODUCT_APPROVAL_ENABLED === 'true';
    
    if (!approvalEnabled) {
        return this.find(filter); // Return all products if approval disabled
    }
    
    return this.find({ 
        ...filter, 
        approvalStatus: 'approved' 
    });
};

// Method to get pending products for SuperAdmin
ProductSchema.statics.findPending = function(filter = {}) {
    return this.find({ 
        ...filter, 
        approvalStatus: 'pending' 
    }).populate('createdBy', 'userName email shopName');
};

// Method to get products by admin with approval status
ProductSchema.statics.findByAdminWithStatus = function(adminId, filter = {}) {
    return this.find({ 
        ...filter, 
        createdBy: adminId 
    }).select('+approvalStatus +approvalComments +approvedBy +submittedAt +approvedAt +rejectedAt');
};

module.exports = mongoose.model('Product', ProductSchema);