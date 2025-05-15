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
                required : true
            },
            color : {
                type : String,
                required : true
            },
            // Added fields for direct price storage
            price : {
                type : Number,
                default: 0
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
            }
        }
    ]
}, {
    timestamps : true
})




module.exports = mongoose.model('Cart', cartSchema);