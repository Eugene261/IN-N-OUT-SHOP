const Order = require('../../models/Order.js');
const Cart = require('../../models/cart.js');
const Product = require('../../models/Products.js');

const createOrder = async(req, res) => {
    try {
        const {
            userId, 
            cartItems,
            addressInfo,
            orderStatus, 
            paymentMethod,
            paymentStatus,
            totalAmount,
            orderDate,
            orderUpdateDate,
            paymentId
        } = req.body;

        // Basic validation
        if (!userId || !cartItems || !addressInfo || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required order information'
            });
        }

        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart items must be a non-empty array'
            });
        }

        // Create a new order for Paystack payment
        const newlyCreatedOrder = new Order({
            user: userId, 
            userId, 
            cartItems,
            addressInfo,
            orderStatus: orderStatus || 'pending', 
            paymentMethod: paymentMethod || 'paystack',
            paymentStatus: paymentStatus || 'pending',
            totalAmount,
            orderDate: orderDate || new Date(),
            orderUpdateDate: orderUpdateDate || new Date(),
            paymentId
        });

        // Save the order
        await newlyCreatedOrder.save();

        // Return success response with order ID
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            orderId: newlyCreatedOrder._id
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the order',
            error: error.message
        });
    }
}


const verifyAndUpdateOrder = async(req, res) => {
    try {
        const { reference, orderId } = req.body;

        // Validate required params
        if (!reference || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment parameters (reference and orderId)'
            });
        }

        // Find the order
        let order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update order status
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.paymentId = reference;
        
        // Update product inventory
        for (let item of order.cartItems) {
            let product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.title}`
                });
            }
            
            // Reduce inventory
            product.totalStock -= item.quantity;
            await product.save();
        }

        // IMPORTANT: Clear the user's cart completely
        // This is the key fix for the cart persistence issue
        if (order.userId) {
            // Find the user's cart
            const cart = await Cart.findOne({ userId: order.userId });
            if (cart) {
                // Delete the entire cart document
                await Cart.findByIdAndDelete(cart._id);
                console.log(`Cart for user ${order.userId} has been deleted after successful payment`);
            }
        }

        // Save the updated order
        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Payment verified and order confirmed',
            data: order
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while verifying payment',
            error: error.message
        });
    }
}


const getAllOrdersByUser = async(req, res) => {

    try {
        
        const {userId} = req.params;

        const orders = await Order.find({userId})

        if(!orders.length){
            return res.status(404).json({
                success : false,
                message : 'No orders found'
            })
        }

        res.status(200).json({
            success : true,
            data : orders
        })


    } catch (error) {
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'An error occured'
        })
    }
}


const getOrdersDetails = async(req, res) => {

    try {

        const { id }  = req.params;

        const order = await Order.findById(id)

        if(!order){
            return res.status(404).json({
                success : false,
                message : 'Order not found'
            })
        }


        res.status(200).json({
            success : true,
            data : order
        })
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success : false,
            message : 'An error occured'
        })
    }
}






module.exports = {
    createOrder,
    verifyAndUpdateOrder,
    getAllOrdersByUser,
    getOrdersDetails
};