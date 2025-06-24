const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    
    // Video files
    videoUrl: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String,
        required: true
    },
    
    // Video metadata
    duration: {
        type: Number, // in seconds
        required: true
    },
    fileSize: {
        type: Number, // in bytes
        required: true
    },
    resolution: {
        type: String,
        default: '720p'
    },
    
    // Content management
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Optional - for vendor-specific content
    },
    category: {
        type: String,
        enum: ['unboxing', 'haul', 'tutorial', 'review', 'showcase', 'other'],
        default: 'showcase'
    },
    tags: {
        type: [String],
        default: []
    },
    
    // Engagement metrics
    views: {
        type: Number,
        default: 0
    },
    likes: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        guestId: String, // For non-authenticated users
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        guestId: String,
        text: {
            type: String,
            required: true,
            maxlength: 500
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        isApproved: {
            type: Boolean,
            default: true
        }
    }],
    
    // Product integration
    taggedProducts: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        timestamp: Number, // When product appears in video (seconds)
        position: {
            x: Number, // Click hotspot coordinates
            y: Number
        }
    }],
    
    // Publishing controls
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'published', 'archived'],
        default: 'draft'
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Number,
        default: 0 // Higher numbers = higher priority
    },
    
    // Analytics (computed fields updated by background jobs)
    analytics: {
        watchTime: {
            type: Number,
            default: 0 // Total watch time in seconds
        },
        completionRate: {
            type: Number,
            default: 0 // Percentage who watched till end
        },
        clickThroughRate: {
            type: Number,
            default: 0 // Percentage who clicked products
        },
        conversionRate: {
            type: Number,
            default: 0 // Percentage who purchased
        }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
VideoSchema.index({ status: 1, publishDate: -1 });
VideoSchema.index({ isFeatured: 1, priority: -1 });
VideoSchema.index({ uploadedBy: 1 });
VideoSchema.index({ vendorId: 1 });
VideoSchema.index({ category: 1 });
VideoSchema.index({ tags: 1 });

// Virtual for like count
VideoSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
VideoSchema.virtual('commentCount').get(function() {
    return this.comments ? this.comments.filter(comment => comment.isApproved).length : 0;
});

// Instance method to check if user liked the video
VideoSchema.methods.isLikedBy = function(userId, guestId) {
    if (!this.likes) return false;
    
    if (userId) {
        return this.likes.some(like => like.userId && like.userId.toString() === userId.toString());
    }
    
    if (guestId) {
        return this.likes.some(like => like.guestId === guestId);
    }
    
    return false;
};

// Static method to get published videos
VideoSchema.statics.getPublished = function() {
    return this.find({
        status: 'published',
        publishDate: { $lte: new Date() }
    }).sort({ isFeatured: -1, priority: -1, publishDate: -1 });
};

// Static method to get featured videos
VideoSchema.statics.getFeatured = function(limit = 6) {
    return this.find({
        status: 'published',
        isFeatured: true,
        publishDate: { $lte: new Date() }
    })
    .sort({ priority: -1, publishDate: -1 })
    .limit(limit)
    .populate('uploadedBy', 'userName')
    .populate('vendorId', 'userName shopName')
    .populate('taggedProducts.productId', 'title price salePrice image');
};

module.exports = mongoose.model('Video', VideoSchema); 