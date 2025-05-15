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
            shippingFee,
            adminShippingFees,
            adminGroups,
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

        // Calculate total shipping fee if not provided or admin shipping fees if available
        let calculatedShippingFee = shippingFee || 0;
        let calculatedAdminShippingFees = adminShippingFees || {};
        
        // If admin shipping fees not provided but we have location info, calculate them
        if (!adminShippingFees && addressInfo) {
            const city = (addressInfo.city || '').toLowerCase();
            const region = (addressInfo.region || '').toLowerCase();
            const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
            
            // Group items by admin to calculate shipping fees
            const adminItemGroups = {};
            
            cartItems.forEach(item => {
                const adminId = item.adminId || 'unknown';
                
                if (!adminItemGroups[adminId]) {
                    adminItemGroups[adminId] = [];
                }
                
                adminItemGroups[adminId].push(item);
            });
            
            // Calculate shipping fee for each admin
            calculatedAdminShippingFees = {};
            let totalFee = 0;
            
            Object.keys(adminItemGroups).forEach(adminId => {
                const fee = isAccra ? 40 : 70; // GHS 40 for Accra/Greater Accra, GHS 70 for other regions
                calculatedAdminShippingFees[adminId] = fee;
                totalFee += fee;
            });
            
            calculatedShippingFee = totalFee;
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
            shippingFee: calculatedShippingFee,
            adminShippingFees: calculatedAdminShippingFees, // Store the per-admin shipping fees
            adminGroups: adminGroups || [], // Store admin groups if provided
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
            orderId: newlyCreatedOrder._id,
            data: newlyCreatedOrder
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
        order.paymentStatus = 'completed';
        order.orderStatus = 'confirmed';
        order.paymentId = reference;
        
        // Process items
        let processedItems = [];
        
        // Update product inventory
        for (let item of order.cartItems) {
            let product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.title}`
                });
            }
            
            // Get admin ID from product
            const adminId = product.createdBy ? product.createdBy.toString() : 'unknown';
            
            // Reduce inventory
            product.totalStock -= item.quantity;
            await product.save();
            
            // Add processed item with vendor info
            processedItems.push({
                product: product._id,
                quantity: item.quantity,
                price: parseFloat(item.price),
                status: 'processing',
                vendor: product.createdBy,
                productId: item.productId,
                title: item.title,
                image: item.image,
                adminId: adminId // Store admin ID with the item
            });
        }
        
        // Update order with processed items
        order.items = processedItems;
        
        // If admin groups and shipping fees are not already set, group items by admin
        if (!order.adminGroups || order.adminGroups.length === 0) {
            // Group items by admin
            const adminGroups = {};
            
            processedItems.forEach(item => {
                const adminId = item.adminId || item.vendor?.toString() || 'unknown';
                
                if (!adminGroups[adminId]) {
                    adminGroups[adminId] = {
                        adminId,
                        items: [],
                        itemCount: 0
                    };
                }
                
                adminGroups[adminId].items.push(item.productId);
                adminGroups[adminId].itemCount += item.quantity;
            });
            
            // Calculate shipping fee for each admin if not already set
            if (!order.adminShippingFees || Object.keys(order.adminShippingFees).length === 0) {
                const city = (order.addressInfo?.city || '').toLowerCase();
                const region = (order.addressInfo?.region || '').toLowerCase();
                const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
                
                const adminShippingFees = {};
                
                Object.keys(adminGroups).forEach(adminId => {
                    adminShippingFees[adminId] = isAccra ? 40 : 70;
                });
                
                order.adminShippingFees = adminShippingFees;
            }
            
            // Save admin groups to order
            order.adminGroups = Object.values(adminGroups);
        }
        
        // IMPORTANT: Clear the user's cart completely
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