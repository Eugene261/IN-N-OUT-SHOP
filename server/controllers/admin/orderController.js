const Order = require('../../models/Order.js');
const Product = require('../../models/Products.js');




const getAllOrdersOfAllUsers = async(req, res) => {

    try {
        // Get the admin ID from the authenticated user
        const adminId = req.user.id;
        
        // Get all orders
        const allOrders = await Order.find({}).populate({
            path: 'items.product',
            select: 'createdBy title image price'
        });
        
        if(!allOrders.length){
            return res.status(404).json({
                success: false,
                message: 'No orders found'
            });
        }
        
        // Filter orders to only include those with products created by this admin
        const adminOrders = allOrders.map(order => {
            // For backward compatibility, check both items and cartItems
            const orderItems = order.items && order.items.length > 0 ? order.items : [];
            const cartItems = order.cartItems && order.cartItems.length > 0 ? order.cartItems : [];
            
            // Filter items that belong to this admin
            const adminItems = orderItems.filter(item => 
                item.product && item.product.createdBy && 
                item.product.createdBy.toString() === adminId.toString()
            );
            
            // If no items belong to this admin, return null
            if (adminItems.length === 0) {
                return null;
            }
            
            // Calculate the total amount for just this admin's items
            const adminTotalAmount = adminItems.reduce((total, item) => {
                // Use item.price and item.quantity if available, otherwise try to find from cartItems
                const itemPrice = item.price || 0;
                const itemQuantity = item.quantity || 1;
                return total + (itemPrice * itemQuantity);
            }, 0);
            
            // Create a new order object with only the admin's items and correct total
            const adminOrder = {
                ...order.toObject(),
                items: adminItems,
                // Update the total amount to reflect only this admin's items
                adminTotalAmount: adminTotalAmount,
                // Keep original totalAmount for reference
                originalTotalAmount: order.totalAmount,
                // Keep original cartItems for backward compatibility
                _adminFiltered: true // Flag to indicate this order has been filtered
            };
            
            return adminOrder;
        }).filter(Boolean); // Remove null entries
        
        if(!adminOrders.length){
            return res.status(404).json({
                success: false,
                message: 'No orders found for your products'
            });
        }

        res.status(200).json({
            success: true,
            data: adminOrders
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching orders'
        });
    }
}


const getOrdersDetailsForAdmin = async(req, res) => {

    try {
        // Get the admin ID from the authenticated user
        const adminId = req.user.id;
        const { id } = req.params;

        // Find the order and populate product details
        const order = await Order.findById(id).populate({
            path: 'items.product',
            select: 'createdBy title image price'
        });
        
        // Also find all products created by this admin for cartItems check
        const adminProducts = await Product.find({ 
            createdBy: adminId
        });
        
        // Extract product IDs
        const adminProductIds = adminProducts.map(product => product._id.toString());

        if(!order){
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if this order contains any products created by this admin
        // First check items array (populated products)
        const orderItems = order.items && order.items.length > 0 ? order.items : [];
        const adminItems = orderItems.filter(item => 
            item.product && item.product.createdBy && 
            item.product.createdBy.toString() === adminId.toString()
        );
        
        // Then check cartItems array (for backward compatibility)
        const cartItems = order.cartItems && order.cartItems.length > 0 ? order.cartItems : [];
        const adminCartItems = cartItems.filter(item => 
            adminProductIds.includes(item.productId)
        );
        
        // If no items belong to this admin in either array, deny access
        if (adminItems.length === 0 && adminCartItems.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this order'
            });
        }
        
        // Combine both types of items for the admin
        const allAdminItems = [...adminItems, ...adminCartItems];

        // Calculate the total amount for just this admin's items
        const adminTotalAmount = adminItems.reduce((total, item) => {
            // Use item.price and item.quantity if available, otherwise try to find from cartItems
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 1;
            return total + (itemPrice * itemQuantity);
        }, 0);
        
        // Create a filtered order with only the admin's items and correct total
        const adminOrder = {
            ...order.toObject(),
            items: adminItems,
            cartItems: adminCartItems,  // Only include cart items for this admin
            // Update the total amount to reflect only this admin's items
            adminTotalAmount: adminTotalAmount,
            // Keep original totalAmount for reference
            originalTotalAmount: order.totalAmount,
            _adminFiltered: true // Flag to indicate this order has been filtered
        };

        res.status(200).json({
            success: true,
            data: adminOrder
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching order details'
        });
    }
}


const updateOrderStatus = async(req, res) => {
    try {
        // Get the admin ID from the authenticated user
        const adminId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }
        
        // Find the order and populate product details
        const order = await Order.findById(id).populate({
            path: 'items.product',
            select: 'createdBy title image price'
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Also find all products created by this admin for cartItems check
        const adminProducts = await Product.find({ 
            $or: [
                { createdBy: adminId },
                { createdBy: { $exists: false } }, // Include legacy products
                { createdBy: null }
            ]
        });
        
        // Extract product IDs
        const adminProductIds = adminProducts.map(product => product._id.toString());
        
        // Check if this order contains any products created by this admin
        // First check items array (populated products)
        const orderItems = order.items && order.items.length > 0 ? order.items : [];
        const adminItems = orderItems.filter(item => 
            item.product && item.product.createdBy && 
            item.product.createdBy.toString() === adminId.toString()
        );
        
        // Then check cartItems array (for Paystack orders and backward compatibility)
        const cartItems = order.cartItems && order.cartItems.length > 0 ? order.cartItems : [];
        const adminCartItems = cartItems.filter(item => 
            adminProductIds.includes(item.productId && item.productId.toString ? item.productId.toString() : item.productId)
        );
        
        console.log('Order ID:', id, 'Admin ID:', adminId);
        console.log('Admin Items:', adminItems.length, 'Admin Cart Items:', adminCartItems.length);
        
        // If no items belong to this admin in either array, deny access
        if (adminItems.length === 0 && adminCartItems.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this order'
            });
        }
        
        // Update the order status - update both status fields for compatibility
        const updatedOrder = await Order.findByIdAndUpdate(
            id, 
            { 
                orderStatus: status,
                status: status.toLowerCase() // Also update the new status field
            },
            { new: true } // Return the updated document
        );
        
        // Calculate the total amount for just this admin's items
        const adminTotalAmount = adminItems.reduce((total, item) => {
            // Use item.price and item.quantity if available, otherwise try to find from cartItems
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 1;
            return total + (itemPrice * itemQuantity);
        }, 0);
        
        // Create a filtered response with only the admin's items and correct total
        const adminOrder = {
            ...updatedOrder.toObject(),
            items: adminItems,
            // Update the total amount to reflect only this admin's items
            adminTotalAmount: adminTotalAmount,
            // Keep original totalAmount for reference
            originalTotalAmount: updatedOrder.totalAmount,
            // Keep original cartItems for backward compatibility
            _adminFiltered: true // Flag to indicate this order has been filtered
        };
        
        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: adminOrder
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating order status'
        });
    }
};






module.exports = {
    getAllOrdersOfAllUsers,
    getOrdersDetailsForAdmin,
    updateOrderStatus
};