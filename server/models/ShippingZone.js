const mongoose = require('mongoose');

const shippingZoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    region: {
        type: String,
        required: true,
        trim: true
    },
    baseRate: {
        type: Number,
        required: false,
        min: 0,
        default: 0
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vendorRegion: {
        type: String,
        trim: true
    },
    sameRegionCapFee: {
        type: Number,
        min: 0
    },
    additionalRates: [{
        type: { 
            type: String, 
            enum: ['weight', 'price'],
            required: true
        },
        threshold: { 
            type: Number, 
            required: true 
        },
        additionalFee: { 
            type: Number, 
            required: true,
            min: 0
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('ShippingZone', shippingZoneSchema); 