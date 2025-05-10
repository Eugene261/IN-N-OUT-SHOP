const Order = require('../../models/Order.js');
const Product = require('../../models/Products.js');

/**
 * Get all orders that contain products created by the logged-in admin
 */
const getAllOrdersOfAllUsers = async(req, res) => {
    try {
        // Get the admin ID from the authenticated user
        const adminId = req.user.id;
        
        // Find all products created by this admin
        const adminProducts = await Product.find({ 
            createdBy: adminId 
        });
        
        // Extract product IDs
        const adminProductIds = adminProducts.map(product => product._id.toString());
        
        // Get all orders
        const allOrders = await Order.find({});
        
        // Filter and process orders to only include those with admin's products
        const adminOrders = allOrders.map(order => {
            // Check items array (newer format)
            const orderItems = order.items && order.items.length > 0 ? order.items : [];
            const adminOrderItems = orderItems.filter(item => 
                item.product && 
                adminProductIds.includes(item.product.toString())
            );
            
            // Check cartItems array (older format)
            const cartItems = order.cartItems && order.cartItems.length > 0 ? order.cartItems : [];
            const adminCartItems = cartItems.filter(item => 
                adminProductIds.includes(item.productId)
            );
            
            // If no items belong to this admin, skip this order
            if (adminOrderItems.length === 0 && adminCartItems.length === 0) {
                return null;
            }
            
            // Calculate the total amount for just this admin's items
            let adminTotalAmount = 0;
            
            // Add up prices from items array
            adminOrderItems.forEach(item => {
                const itemPrice = item.price || 0;
                const itemQuantity = item.quantity || 1;
                adminTotalAmount += (itemPrice * itemQuantity);
            });
            
            // Add up prices from cartItems array
            adminCartItems.forEach(item => {
                const itemPrice = parseFloat(item.price) || 0;
                const itemQuantity = item.quantity || 1;
                adminTotalAmount += (itemPrice * itemQuantity);
            });
            
            // Create a new order object with only the admin's items and correct total
            return {
                ...order.toObject(),
                items: adminOrderItems,
                cartItems: adminCartItems,
                // Update the total amount to reflect only this admin's items
                adminTotalAmount: adminTotalAmount,
                // Keep original totalAmount for reference
                originalTotalAmount: order.totalAmount,
                _adminFiltered: true // Flag to indicate this order has been filtered
            };
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
};

/**
 * Get details of a specific order, but only show products created by the logged-in admin
 */
const getOrdersDetailsForAdmin = async(req, res) => {
    try {
        // Get the admin ID from the authenticated user
        const adminId = req.user.id;
        const { id } = req.params;

        // Find the order
        const order = await Order.findById(id);

        if(!order){
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Find all products created by this admin
        const adminProducts = await Product.find({ 
            createdBy: adminId 
        });
        
        // Extract product IDs
        const adminProductIds = adminProducts.map(product => product._id.toString());
        
        // Check items array (newer format)
        const orderItems = order.items && order.items.length > 0 ? order.items : [];
        const adminOrderItems = orderItems.filter(item => 
            item.product && 
            adminProductIds.includes(item.product.toString())
        );
        
        // Check cartItems array (older format)
        const cartItems = order.cartItems && order.cartItems.length > 0 ? order.cartItems : [];
        const adminCartItems = cartItems.filter(item => 
            adminProductIds.includes(item.productId)
        );
        
        // If no items belong to this admin, deny access
        if (adminOrderItems.length === 0 && adminCartItems.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this order'
            });
        }
        
        // Calculate the total amount for just this admin's items
        let adminTotalAmount = 0;
        
        // Add up prices from items array
        adminOrderItems.forEach(item => {
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 1;
            adminTotalAmount += (itemPrice * itemQuantity);
        });
        
        // Add up prices from cartItems array
        adminCartItems.forEach(item => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = item.quantity || 1;
            adminTotalAmount += (itemPrice * itemQuantity);
        });
        
        // Create a filtered order with only the admin's items and correct total
        const adminOrder = {
            ...order.toObject(),
            items: adminOrderItems,
            cartItems: adminCartItems,
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
};

/**
 * Update the status of products in an order, but only for products created by the logged-in admin
 */
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
        
        // Find the order
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Find all products created by this admin
        const adminProducts = await Product.find({ 
            createdBy: adminId 
        });
        
        // Extract product IDs
        const adminProductIds = adminProducts.map(product => product._id.toString());
        
        // Track if we found any products to update
        let updatedAnyProducts = false;
        
        // Create a copy of the order to modify
        const orderToUpdate = order.toObject();
        
        // Update items array (newer format)
        if (orderToUpdate.items && orderToUpdate.items.length > 0) {
            orderToUpdate.items = orderToUpdate.items.map(item => {
                // Check if this item belongs to the admin
                if (item.product && 
                    adminProductIds.includes(item.product.toString())) {
                    updatedAnyProducts = true;
                    // Update the status for this item
                    return { ...item, status: status.toLowerCase() };
                }
                return item;
            });
        }
        
        // Update cartItems array (older format)
        if (orderToUpdate.cartItems && orderToUpdate.cartItems.length > 0) {
            orderToUpdate.cartItems = orderToUpdate.cartItems.map(item => {
                // Check if this item belongs to the admin
                if (adminProductIds.includes(item.productId)) {
                    updatedAnyProducts = true;
                    // Update the status for this item
                    return { ...item, status: status.toLowerCase() };
                }
                return item;
            });
        }
        
        // If no items belong to this admin, deny access
        if (!updatedAnyProducts) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this order'
            });
        }
        
        // Calculate the overall order status based on the status of all items
        // This is a bit complex as we need to determine the "dominant" status
        // For simplicity, we'll use a priority system:
        // cancelled > delivered > shipped > confirmed > processing > pending
        const allItems = [...(orderToUpdate.items || []), ...(orderToUpdate.cartItems || [])];
        let overallStatus = 'processing'; // Default
        
        if (allItems.some(item => item.status === 'cancelled')) {
            overallStatus = 'cancelled';
        } else if (allItems.every(item => item.status === 'delivered')) {
            overallStatus = 'delivered';
        } else if (allItems.some(item => item.status === 'shipped') && !allItems.some(item => ['pending', 'processing', 'confirmed'].includes(item.status))) {
            overallStatus = 'shipped';
        } else if (allItems.some(item => item.status === 'confirmed') && !allItems.some(item => ['pending', 'processing'].includes(item.status))) {
            overallStatus = 'confirmed';
        } else if (allItems.some(item => item.status === 'processing')) {
            overallStatus = 'processing';
        } else if (allItems.every(item => item.status === 'pending')) {
            overallStatus = 'pending';
        }
        
        try {
            // Use a simpler approach to update the order
            // First, update the overall status
            await Order.findByIdAndUpdate(
                id, 
                { 
                    orderStatus: overallStatus,
                    status: overallStatus // Update the overall status field
                }
            );
            
            // For items array, use the positional $ operator to update only matching items
            if (orderToUpdate.items && orderToUpdate.items.length > 0) {
                for (const adminProductId of adminProductIds) {
                    await Order.updateMany(
                        { 
                            _id: id,
                            "items.product": adminProductId 
                        },
                        { 
                            $set: { "items.$[elem].status": status.toLowerCase() } 
                        },
                        {
                            arrayFilters: [{ "elem.product": adminProductId }]
                        }
                    );
                }
            }
            
            // For cartItems array, use the positional $ operator to update only matching items
            if (orderToUpdate.cartItems && orderToUpdate.cartItems.length > 0) {
                for (const adminProductId of adminProductIds) {
                    await Order.updateMany(
                        { 
                            _id: id,
                            "cartItems.productId": adminProductId 
                        },
                        { 
                            $set: { "cartItems.$[elem].status": status.toLowerCase() } 
                        },
                        {
                            arrayFilters: [{ "elem.productId": adminProductId }]
                        }
                    );
                }
            }
                
            // Get the updated order
            const updatedOrder = await Order.findById(id);
            
            // Check items array (newer format)
            const orderItems = updatedOrder.items && updatedOrder.items.length > 0 ? updatedOrder.items : [];
            const adminOrderItems = orderItems.filter(item => 
                item.product && 
                adminProductIds.includes(item.product.toString())
            );
            
            // Check cartItems array (older format)
            const cartItems = updatedOrder.cartItems && updatedOrder.cartItems.length > 0 ? updatedOrder.cartItems : [];
            const adminCartItems = cartItems.filter(item => 
                adminProductIds.includes(item.productId)
            );
            
            // Calculate the total amount for just this admin's items
            let adminTotalAmount = 0;
            
            // Add up prices from items array
            adminOrderItems.forEach(item => {
                const itemPrice = item.price || 0;
                const itemQuantity = item.quantity || 1;
                adminTotalAmount += (itemPrice * itemQuantity);
            });
            
            // Add up prices from cartItems array
            adminCartItems.forEach(item => {
                const itemPrice = parseFloat(item.price) || 0;
                const itemQuantity = item.quantity || 1;
                adminTotalAmount += (itemPrice * itemQuantity);
            });
        
            // Calculate admin-specific status based on the status of admin's products only
            let adminOrderStatus = 'pending'; // Default status
            
            // Define status priority (higher index = higher priority)
            const statusPriority = {
                'pending': 0,
                'processing': 1,
                'confirmed': 2,
                'shipped': 3,
                'delivered': 4,
                'cancelled': 5 // Cancelled has highest priority
            };
            
            // Determine the status based on admin's products only
            const allAdminItems = [...adminOrderItems, ...adminCartItems];
            if (allAdminItems.length > 0) {
                // Start with the first item's status
                adminOrderStatus = allAdminItems[0].status || 'pending';
                
                // Compare with other items to find the dominant status
                for (const item of allAdminItems) {
                    const itemStatus = item.status || 'pending';
                    if (statusPriority[itemStatus.toLowerCase()] > statusPriority[adminOrderStatus.toLowerCase()]) {
                        adminOrderStatus = itemStatus;
                    }
                }
            }
            
            // Create a filtered response with only the admin's items and correct total
            const adminOrder = {
                ...updatedOrder.toObject(),
                items: adminOrderItems,
                cartItems: adminCartItems,
                // Update the total amount to reflect only this admin's items
                adminTotalAmount: adminTotalAmount,
                // Keep original totalAmount for reference
                originalTotalAmount: updatedOrder.totalAmount,
                // Add admin-specific status based on admin's products only
                adminOrderStatus: adminOrderStatus,
                // Keep the original order status for reference
                originalOrderStatus: updatedOrder.orderStatus || updatedOrder.status,
                // Override the orderStatus to show admin-specific status in the dashboard
                orderStatus: adminOrderStatus,
                _adminFiltered: true // Flag to indicate this order has been filtered
            };
            
            res.status(200).json({
                success: true,
                message: 'Order status updated successfully',
                data: adminOrder
            });
        } catch (error) {
            console.error('Error updating individual items:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while updating order status'
            });
        }
        
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
