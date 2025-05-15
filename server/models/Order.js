const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    // Status for individual product in order
    status: {
        type: String,
        enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'processing'
    },
    // Vendor who created this product
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Admin ID for shipping fee calculation
    adminId: String,
    // Original cart item fields for backward compatibility
    productId: String,
    title: String,
    image: String
});

// Schema for admin groups in an order
const adminGroupSchema = new mongoose.Schema({
    adminId: String,
    items: [String], // array of product IDs
    itemCount: Number,
    shippingFee: Number,
    status: {
        type: String,
        enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'processing'
    }
});

const orderSchema = new mongoose.Schema({
    // Reference to the user who placed the order
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Items in the order
    items: [orderItemSchema],
    // Original cart items for backward compatibility
    cartItems: [
        {
            productId: String,
            title: String,
            image: String,
            price: String,
            quantity: Number,
            status: {
                type: String,
                enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
                default: 'processing'
            },
            adminId: String // Admin ID for shipping fee calculation
        }
    ],
    // Shipping address
    addressInfo: {
        addressId: String,
        region: String,
        address: String,
        city: String,
        phone: String,
        notes: String,
    },
    // Order status (pending, processing, confirmed, shipped, delivered, cancelled)
    status: {
        type: String,
        enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'processing'
    },
    // Total shipping fee amount
    shippingFee: {
        type: Number,
        default: 0
    },
    // Per-admin shipping fees
    adminShippingFees: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Admin groups for order tracking and shipping management
    adminGroups: [adminGroupSchema],
    // Legacy field for backward compatibility
    orderStatus: String,
    paymentMethod: String,
    paymentStatus: String,
    totalAmount: Number,
    // Original fields for backward compatibility
    userId: String,
    cartId: String,
    orderDate: Date,
    orderUpdateDate: Date,
    paymentId: String,
    payerId: String
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);


