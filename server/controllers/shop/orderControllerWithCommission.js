const Order = require('../../models/Order.js');
const Cart = require('../../models/cart.js');
const Product = require('../../models/Products.js');
const User = require('../../models/User.js');

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

        // Process items
        let processedItems = [];

        // Process each item to add vendor information
        for (const item of cartItems) {
            try {
                // Get product details to find the vendor
                const product = await Product.findById(item.productId);
                
                if (!product) {
                    console.warn(`Product not found: ${item.productId}`);
                    // Add item without vendor info
                    processedItems.push({
                        product: item.productId,
                        quantity: item.quantity,
                        price: parseFloat(item.price),
                        status: 'processing',
                        productId: item.productId,
                        title: item.title,
                        image: item.image
                    });
                    continue;
                }

                // Add processed item with vendor
                processedItems.push({
                    product: item.productId,
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                    status: 'processing',
                    vendor: product.createdBy,
                    productId: item.productId,
                    title: item.title,
                    image: item.image
                });
            } catch (error) {
                console.error(`Error processing item ${item.productId}:`, error);
                // Add item without vendor info
                processedItems.push({
                    product: item.productId,
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                    status: 'processing',
                    productId: item.productId,
                    title: item.title,
                    image: item.image
                });
            }
        }

        // Create a new order
        const newlyCreatedOrder = new Order({
            user: userId, 
            userId,
            items: processedItems,
            cartItems, // Keep original cart items for backward compatibility
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
        console.log(`Created order ${newlyCreatedOrder._id} with total ${totalAmount}`);

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
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Only update if not already completed
        if (order.paymentStatus !== 'completed' && order.paymentStatus !== 'success') {
            // Update order status
            order.paymentStatus = 'completed';
            order.status = 'processing';
            order.orderUpdateDate = new Date();
            
            // Save the updated order
            await order.save();
            console.log(`Updated order ${orderId} payment status to completed`);
        }

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Payment verified and order updated successfully',
            order
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while verifying payment',
            error: error.message
        });
    }
}

// Get all orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching orders',
            error: error.message
        });
    }
}

// Get orders by user ID
const getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const orders = await Order.find({ 
            $or: [
                { user: userId },
                { userId: userId }
            ]
        }).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching user orders',
            error: error.message
        });
    }
}

// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }
        
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the order',
            error: error.message
        });
    }
}

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Update the order status
        order.status = status;
        order.orderUpdateDate = new Date();
        
        await order.save();
        
        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating order status',
            error: error.message
        });
    }
}

module.exports = {
    createOrder,
    verifyAndUpdateOrder,
    getAllOrders,
    getOrdersByUser,
    getOrderById,
    updateOrderStatus
};
