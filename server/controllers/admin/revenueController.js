const Order = require('../../models/Order.js');
const Product = require('../../models/Products.js');

/**
 * Get revenue statistics for the logged-in admin
 * Includes total revenue, items sold, pending deliveries, and confirmed payments
 */
const getAdminRevenue = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        // Find all products created by this admin
        const adminProducts = await Product.find({ 
            $or: [
                { createdBy: adminId },
                { createdBy: { $exists: false } }, // Include legacy products
                { createdBy: null }
            ]
        });
        
        // Extract product IDs
        const adminProductIds = adminProducts.map(product => product._id.toString());
        
        // Find all orders that contain admin's products
        const allOrders = await Order.find({});
        
        // Filter orders that contain at least one product from this admin
        const adminOrders = allOrders.filter(order => {
            return order.cartItems.some(item => 
                adminProductIds.includes(item.productId)
            );
        });
        
        // Calculate revenue statistics
        let totalRevenue = 0;
        let totalItemsSold = 0;
        let pendingDeliveries = 0;
        let confirmedPayments = 0;
        
        adminOrders.forEach(order => {
            // Only count revenue from admin's products in each order
            const adminItemsInOrder = order.cartItems.filter(item => 
                adminProductIds.includes(item.productId)
            );
            
            // Calculate revenue from admin's products in this order
            const orderRevenue = adminItemsInOrder.reduce((sum, item) => 
                sum + (parseFloat(item.price) * item.quantity), 0
            );
            
            // Calculate total items sold
            const orderItemsSold = adminItemsInOrder.reduce((sum, item) => 
                sum + item.quantity, 0
            );
            
            totalRevenue += orderRevenue;
            totalItemsSold += orderItemsSold;
            
            // Count confirmed payments
            if (order.paymentStatus === 'paid') {
                confirmedPayments++;
            }
            
            // Count pending deliveries (confirmed, processing, shipped but not delivered)
            // Normalize status to lowercase for consistent comparison
            const orderStatus = order.orderStatus ? order.orderStatus.toLowerCase() : '';
            const paymentStatus = order.paymentStatus ? order.paymentStatus.toLowerCase() : '';
            
            if (['confirmed', 'processing', 'shipped'].includes(orderStatus) && 
                paymentStatus === 'paid') {
                pendingDeliveries++;
                console.log('Pending delivery:', order._id, 'Status:', orderStatus);
            }
        });
        
        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalItemsSold,
                pendingDeliveries,
                confirmedPayments,
                totalOrders: adminOrders.length,
                adminProducts: adminProducts.length
            }
        });
        
    } catch (error) {
        console.error('Error in getAdminRevenue:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching revenue data'
        });
    }
};

/**
 * Get orders that contain products created by the logged-in admin
 */
const getAdminOrders = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        // Find all products created by this admin
        const adminProducts = await Product.find({ 
            $or: [
                { createdBy: adminId },
                { createdBy: { $exists: false } }, // Include legacy products
                { createdBy: null }
            ]
        });
        
        // Extract product IDs
        const adminProductIds = adminProducts.map(product => product._id.toString());
        
        // Find all orders
        const allOrders = await Order.find({});
        
        // Process orders to include only admin's products and calculate correct totals
        const adminOrders = allOrders.map(order => {
            // Filter cart items to only include admin's products
            const adminItems = order.cartItems.filter(item => 
                adminProductIds.includes(item.productId)
            );
            
            // If no items belong to this admin, skip this order
            if (adminItems.length === 0) {
                return null;
            }
            
            // Calculate the total amount for just this admin's items
            const adminTotalAmount = adminItems.reduce((total, item) => {
                const itemPrice = parseFloat(item.price) || 0;
                const itemQuantity = item.quantity || 1;
                return total + (itemPrice * itemQuantity);
            }, 0);
            
            // Calculate admin-specific status based on the status of admin's products
            // This ensures each admin sees their own product status in the dashboard
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
            if (adminItems.length > 0) {
                // Start with the first item's status
                adminOrderStatus = adminItems[0].status || 'pending';
                
                // Compare with other items to find the dominant status
                for (const item of adminItems) {
                    const itemStatus = item.status || 'pending';
                    if (statusPriority[itemStatus.toLowerCase()] > statusPriority[adminOrderStatus.toLowerCase()]) {
                        adminOrderStatus = itemStatus;
                    }
                }
            }
            
            // Create a new order object with only the admin's items, correct total, and admin-specific status
            return {
                ...order.toObject(),
                cartItems: adminItems,
                // Update the total amount to reflect only this admin's items
                adminTotalAmount: adminTotalAmount,
                // Keep original totalAmount for reference
                originalTotalAmount: order.totalAmount,
                // Add admin-specific status based on admin's products only
                adminOrderStatus: adminOrderStatus,
                // Keep the original order status for reference
                originalOrderStatus: order.orderStatus || order.status,
                // Override the orderStatus to show admin-specific status in the dashboard
                orderStatus: adminOrderStatus,
                _adminFiltered: true // Flag to indicate this order has been filtered
            };
        }).filter(Boolean); // Remove null entries
        
        res.status(200).json({
            success: true,
            data: adminOrders
        });
        
    } catch (error) {
        console.error('Error in getAdminOrders:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching admin orders'
        });
    }
};

module.exports = {
    getAdminRevenue,
    getAdminOrders
};
