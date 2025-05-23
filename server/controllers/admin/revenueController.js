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
        let totalPlatformFees = 0;  // Track total platform fees
        let totalShippingFees = 0;  // Track total shipping fees
        
        // Track shipping fees by region for analytics
        let shippingFeesByRegion = {
            accra: 0,
            other: 0
        };
        
        adminOrders.forEach(order => {
            // Only count revenue from admin's products in each order
            const adminItemsInOrder = order.cartItems.filter(item => 
                adminProductIds.includes(item.productId)
            );
            
            // Calculate revenue from admin's products in this order
            const orderRevenue = adminItemsInOrder.reduce((sum, item) => 
                sum + (parseFloat(item.price) * item.quantity), 0
            );
            
            // Calculate platform fees (5% of product value)
            const orderPlatformFees = orderRevenue * 0.05;
            totalPlatformFees += orderPlatformFees;
            
            // CRITICAL FIX: Use the admin-specific shipping fees from adminShippingFees
            let adminShippingFee = 0;
            
            // First check if there's a specific shipping fee for this admin in adminShippingFees
            if (order.adminShippingFees && order.adminShippingFees[adminId]) {
                // Handle both object and primitive formats for adminShippingFees
                const adminFeeData = order.adminShippingFees[adminId];
                
                if (typeof adminFeeData === 'object' && adminFeeData !== null) {
                    // Modern format: object with fee property
                    adminShippingFee = parseFloat(adminFeeData.fee) || 0;
                } else {
                    // Legacy format: direct number/string value
                    adminShippingFee = parseFloat(adminFeeData) || 0;
                }
                
                console.log(`Order ${order._id}: Using stored admin shipping fee: ${adminShippingFee} GHS`);
                totalShippingFees += adminShippingFee;
            } 
            // Fall back to the apportioned shipping fee method if no admin-specific fee is stored
            else if (order.shippingFee) {
                let totalShippingFee = 0;
                
                // Parse the shipping fee value
                if (typeof order.shippingFee === 'number') {
                    totalShippingFee = order.shippingFee;
                } else if (typeof order.shippingFee === 'string') {
                    totalShippingFee = parseFloat(order.shippingFee) || 0;
                }
                
                // Only proceed if we have a valid shipping fee
                if (totalShippingFee > 0) {
                    // Calculate the total order value
                    const totalOrderValue = order.cartItems.reduce((total, item) => 
                        total + (parseFloat(item.price || 0) * (item.quantity || 1)), 0
                    );
                    
                    // Calculate admin's percentage of the order
                    if (totalOrderValue > 0) {
                        const adminPercentageOfOrder = orderRevenue / totalOrderValue;
                        
                        // Apportion shipping fee based on admin's percentage
                        adminShippingFee = totalShippingFee * adminPercentageOfOrder;
                        
                        // Add this admin's portion of the shipping fee
                        totalShippingFees += adminShippingFee;
                        
                        console.log(`Order ${order._id}: Admin gets ${(adminPercentageOfOrder*100).toFixed(2)}% (${adminShippingFee.toFixed(2)} GHS) of total shipping fee: ${totalShippingFee.toFixed(2)} GHS`);
                    }
                }
            }
            
            // Only add shipping fees if we have real data from adminShippingFees or proportional calculation
            // DO NOT use hardcoded fallback rates - this ensures we only show real collected fees
            
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
        
        // Calculate net revenue after platform fees
        const netRevenue = totalRevenue - totalPlatformFees;
        
        console.log('===== ADMIN REVENUE SUMMARY =====');
        console.log(`Admin ID: ${adminId}`);
        console.log(`Total Revenue: ${totalRevenue}`);
        console.log(`Total Shipping Fees: ${totalShippingFees}`);
        console.log(`Shipping Fees by Region: `, shippingFeesByRegion);
        console.log(`Total Orders: ${adminOrders.length}`);
        console.log('Detailed Order Information:');
        adminOrders.forEach(order => {
            console.log(`  Order ID: ${order._id}`);
            console.log(`    Shipping Fee: ${order.shippingFee || 0}`);
            console.log(`    Type of shippingFee: ${typeof order.shippingFee}`);
            console.log(`    Address Info:`, order.addressInfo || 'N/A');
            console.log(`    Product Count: ${order.cartItems?.length || 0}`);
        });
        console.log('================================');
        
        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                netRevenue,
                totalPlatformFees,
                totalShippingFees,
                shippingFeesByRegion,
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

/**
 * Get admin revenue data by time period (daily, weekly, monthly, yearly)
 */
const getAdminRevenueByTime = async (req, res) => {
    try {
        const adminId = req.user.id;
        const timeUnit = req.params.timeUnit;
        
        if (!['daily', 'weekly', 'monthly', 'yearly'].includes(timeUnit)) {
            return res.status(400).json({
                success: false,
                message: `Invalid time unit: ${timeUnit}. Must be one of: daily, weekly, monthly, yearly`
            });
        }
        
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
        
        // Group orders by time period and calculate revenue
        const revenueByTime = {};
        
        adminOrders.forEach(order => {
            // Only count revenue from admin's products in each order
            const adminItemsInOrder = order.cartItems.filter(item => 
                adminProductIds.includes(item.productId)
            );
            
            // Calculate revenue from admin's products in this order
            const orderRevenue = adminItemsInOrder.reduce((sum, item) => 
                sum + (parseFloat(item.price) * item.quantity), 0
            );
            
            // Skip if no revenue from admin's products
            if (orderRevenue <= 0) return;
            
            // Calculate platform fees (5% of revenue)
            const orderPlatformFees = orderRevenue * 0.05;
            const orderNetRevenue = orderRevenue - orderPlatformFees;
            
            // Calculate admin-specific shipping fee using the same approach as the main dashboard
            let shippingFees = 0;
            
            // First try to get admin-specific shipping fee if available
            if (order.adminShippingFees && order.adminShippingFees[adminId]) {
                // Handle both object and primitive formats for adminShippingFees
                const adminFeeData = order.adminShippingFees[adminId];
                
                if (typeof adminFeeData === 'object' && adminFeeData !== null) {
                    // Modern format: object with fee property
                    shippingFees = parseFloat(adminFeeData.fee) || 0;
                } else {
                    // Legacy format: direct number/string value
                    shippingFees = parseFloat(adminFeeData) || 0;
                }
            }
            // Then try apportioning the total shipping fee
            else if (order.shippingFee) {
                const totalShippingFee = parseFloat(order.shippingFee) || 0;
                
                if (totalShippingFee > 0) {
                    // Calculate total order value
                    const totalOrderValue = order.cartItems.reduce((total, item) => 
                        total + (parseFloat(item.price || 0) * (item.quantity || 1)), 0
                    );
                    
                    // Calculate admin's percentage of the order
                    if (totalOrderValue > 0) {
                        const adminPercentageOfOrder = orderRevenue / totalOrderValue;
                        // Apportion shipping fee based on admin's percentage
                        shippingFees = totalShippingFee * adminPercentageOfOrder;
                    }
                }
            }
            
            // REMOVED: Hardcoded shipping fee fallbacks
            // Only use real shipping fees from adminShippingFees or proportional calculations
            // DO NOT add hardcoded fallback rates to ensure accuracy
            
            const orderDate = new Date(order.createdAt);
            let timeKey;
            let displayDate;
            
            // Format the time key based on the requested time unit
            switch (timeUnit) {
                case 'daily':
                    timeKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    displayDate = orderDate.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                    break;
                    
                case 'weekly':
                    // Get the week number and year
                    const oneJan = new Date(orderDate.getFullYear(), 0, 1);
                    const weekNum = Math.ceil((((orderDate - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
                    timeKey = `${orderDate.getFullYear()}-W${weekNum}`;
                    
                    // Calculate the start and end of the week
                    const startOfWeek = new Date(orderDate);
                    startOfWeek.setDate(orderDate.getDate() - orderDate.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    
                    displayDate = `Week ${weekNum}: ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                    break;
                    
                case 'monthly':
                    timeKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
                    displayDate = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                    break;
                    
                case 'yearly':
                    timeKey = `${orderDate.getFullYear()}`;
                    displayDate = `${orderDate.getFullYear()}`;
                    break;
                    
                default:
                    timeKey = orderDate.toISOString().split('T')[0]; // Default to daily
                    displayDate = orderDate.toLocaleDateString();
            }
            
            // Initialize the time period if it doesn't exist
            if (!revenueByTime[timeKey]) {
                revenueByTime[timeKey] = {
                    date: orderDate,
                    displayDate,
                    dateString: timeKey,
                    totalRevenue: 0,
                    platformFees: 0,
                    netRevenue: 0,
                    shippingFees: 0,
                    orderCount: 0
                };
            }
            
            // Add the order revenue to the time period
            revenueByTime[timeKey].totalRevenue += orderRevenue;
            revenueByTime[timeKey].platformFees += orderPlatformFees;
            revenueByTime[timeKey].netRevenue += orderNetRevenue;
            revenueByTime[timeKey].shippingFees += shippingFees;
            revenueByTime[timeKey].orderCount += 1;
        });
        
        // Convert to array and sort by date (most recent first)
        const revenueData = Object.values(revenueByTime)
            .sort((a, b) => b.date - a.date);
        
        return res.status(200).json(revenueData);
        
    } catch (error) {
        console.error(`Error getting admin ${req.params.timeUnit} revenue:`, error);
        return res.status(500).json({
            success: false,
            message: `Error getting ${req.params.timeUnit} revenue data`,
            error: error.message
        });
    }
};

/**
 * Get all revenue data for the logged-in admin in a single API call
 * Includes daily, weekly, monthly, and yearly revenue data
 */
const getAllAdminRevenueData = async (req, res) => {
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
        
        // Calculate revenue for different time periods
        const dailyRevenue = calculateRevenueByTime(adminOrders, adminProductIds, 'daily');
        const weeklyRevenue = calculateRevenueByTime(adminOrders, adminProductIds, 'weekly');
        const monthlyRevenue = calculateRevenueByTime(adminOrders, adminProductIds, 'monthly');
        const yearlyRevenue = calculateRevenueByTime(adminOrders, adminProductIds, 'yearly');
        
        res.status(200).json({
            success: true,
            dailyRevenue,
            weeklyRevenue,
            monthlyRevenue,
            yearlyRevenue
        });
    } catch (error) {
        console.error('Error fetching all admin revenue data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue data',
            error: error.message
        });
    }
};

/**
 * Helper function to calculate revenue by time period
 */
const calculateRevenueByTime = (orders, adminProductIds, timePeriod) => {
    // Group orders by time period
    const revenueByTime = {};
    
    orders.forEach(order => {
        // Get order date
        const orderDate = new Date(order.createdAt);
        
        // Skip orders without valid dates
        if (!orderDate || isNaN(orderDate.getTime())) {
            return;
        }
        
        // Determine the time key based on the period
        let timeKey;
        let displayDate;
        
        switch (timePeriod) {
            case 'daily':
                // Format: YYYY-MM-DD
                timeKey = orderDate.toISOString().split('T')[0];
                displayDate = orderDate;
                break;
                
            case 'weekly':
                // Get the week number and year
                const weekNumber = getWeekNumber(orderDate);
                timeKey = `${orderDate.getFullYear()}-W${weekNumber}`;
                displayDate = orderDate;
                break;
                
            case 'monthly':
                // Format: YYYY-MM
                timeKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
                displayDate = orderDate;
                break;
                
            case 'yearly':
                // Format: YYYY
                timeKey = `${orderDate.getFullYear()}`;
                displayDate = orderDate;
                break;
                
            default:
                // Default to daily
                timeKey = orderDate.toISOString().split('T')[0];
                displayDate = orderDate;
        }
        
        // Initialize time period if it doesn't exist
        if (!revenueByTime[timeKey]) {
            revenueByTime[timeKey] = {
                timeKey,
                date: displayDate,
                totalRevenue: 0,
                platformFees: 0,
                netRevenue: 0,
                shippingFees: 0,
                orderCount: 0
            };
        }
        
        // Only count revenue from admin's products in each order
        const adminItemsInOrder = order.cartItems.filter(item => 
            adminProductIds.includes(item.productId)
        );
        
        // Calculate revenue from admin's products in this order
        const orderRevenue = adminItemsInOrder.reduce((sum, item) => 
            sum + (parseFloat(item.price) * item.quantity), 0
        );
        
        // Calculate platform fees (5% of revenue)
        const platformFees = orderRevenue * 0.05;
        const netRevenue = orderRevenue - platformFees;
        
        // Get shipping fees if available
        const shippingFees = order.shippingFee ? parseFloat(order.shippingFee) : 0;
        
        // Update revenue and order count for this time period
        revenueByTime[timeKey].totalRevenue += orderRevenue;
        revenueByTime[timeKey].platformFees += platformFees;
        revenueByTime[timeKey].netRevenue += netRevenue;
        revenueByTime[timeKey].shippingFees += shippingFees;
        revenueByTime[timeKey].orderCount += 1;
    });
    
    // Convert to array and sort by date (newest first)
    return Object.values(revenueByTime)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
};

/**
 * Helper function to get the week number of a date
 */
const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

module.exports = {
    getAdminRevenue,
    getAdminOrders,
    getAdminRevenueByTime,
    getAllAdminRevenueData
};
