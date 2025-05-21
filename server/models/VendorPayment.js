const mongoose = require('mongoose');

const vendorPaymentSchema = new mongoose.Schema({
    // Reference to the admin user (vendor) receiving payment
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Payment amount
    amount: {
        type: Number,
        required: true
    },
    // Payment period (e.g., "May 1-7, 2023" or "May 2023")
    periodStart: {
        type: Date,
        required: true
    },
    periodEnd: {
        type: Date,
        required: true
    },
    // Payment frequency preference (stored here for reference)
    paymentFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        default: 'weekly'
    },
    // Payment method
    paymentMethod: {
        type: String,
        required: true
    },
    // Transaction ID or reference
    transactionId: {
        type: String
    },
    // Receipt file URL
    receiptUrl: {
        type: String
    },
    // Status of payment
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    // Notes about the payment
    notes: {
        type: String
    },
    // Who processed this payment (typically a superAdmin)
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // When the payment was processed
    processedAt: {
        type: Date
    },
    // When the payment was viewed by the vendor
    viewedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('VendorPayment', vendorPaymentSchema); 