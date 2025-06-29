const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },
    items : [
        {
            productId : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'Product',
                required : true
            },
            quantity : {
                type : Number,
                required : true,
                min : 1
            },
            size : {
                type : String,
                required : false  // Make optional - only required for products that have size variants
            },
            color : {
                type : String,
                required : false  // Make optional - only required for products that have color variants
            },
            // Added fields for direct price storage
            price : {
                type : Number,
            },
            // Vendor information fields
            adminId : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'User'
            },
            adminName : {
                type : String,
                default: 'Vendor'
            },
            salePrice : {
                type : Number,
                default: 0
            },
            title : {
                type : String,
                default: ''
            },
            image : {
                type : String,
                default: ''
            },
            // Effective calculated price (original price minus any applicable discount)
            effectivePrice: {
                type: Number,
                required: false  // This will be calculated
            }
        }
    ],
    // Abandoned cart tracking
    lastReminderStage1: {
        type: Date
    },
    lastReminderStage2: {
        type: Date
    },
    lastReminderStage3: {
        type: Date
    }
}, {
    timestamps : true
})




module.exports = mongoose.model('Cart', cartSchema);