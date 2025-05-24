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
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);