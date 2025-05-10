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
    // Original cart item fields for backward compatibility
    productId: String,
    title: String,
    image: String
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
            }
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


