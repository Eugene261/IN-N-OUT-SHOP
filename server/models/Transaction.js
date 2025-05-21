const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor ID is required']
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: function() {
        return this.transactionType === 'order';
      }
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    platformFee: {
      type: Number,
      default: 0,
      min: [0, 'Platform fee cannot be negative']
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    transactionType: {
      type: String,
      enum: ['order', 'payment', 'refund', 'adjustment'],
      required: [true, 'Transaction type is required']
    },
    paymentMethod: {
      type: String,
      enum: ['bank', 'mobile_money', 'cash', 'paystack', 'manual', 'other'],
      default: 'manual'
    },
    paymentDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      mobileNumber: String,
      provider: String,
      reference: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Calculate net amount (amount - platformFee)
transactionSchema.virtual('netAmount').get(function() {
  return this.amount - this.platformFee;
});

// Index for better query performance
transactionSchema.index({ vendorId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionType: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
