const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Product = require('../../models/Products');

// Helper function to calculate admin's actual financial data using the same logic as revenue dashboard
const calculateAdminFinancials = async (adminId) => {
    try {
        // Find all products created by this admin (same as revenue dashboard)
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

        // Calculate revenue statistics (same logic as revenue dashboard)
        let totalRevenue = 0;
        let totalPlatformFees = 0;
        let totalShippingFees = 0;

        adminOrders.forEach(order => {
            // Only count revenue from admin's products in each order
            const adminItemsInOrder = order.cartItems.filter(item => 
                adminProductIds.includes(item.productId)
            );
            
            // Calculate revenue from admin's products in this order
            const orderRevenue = adminItemsInOrder.reduce((sum, item) => 
                sum + (parseFloat(item.price) * item.quantity), 0
            );
            
            // Calculate platform fees (5% of product value) - same as dashboard
            const orderPlatformFees = orderRevenue * 0.05;
            totalPlatformFees += orderPlatformFees;
            totalRevenue += orderRevenue;

            // Add shipping fees (using admin-specific calculation from dashboard)
            let adminShippingFee = 0;
            
            // Use admin-specific shipping fees from adminShippingFees if available
            if (order.adminShippingFees && order.adminShippingFees[adminId]) {
                const adminFeeData = order.adminShippingFees[adminId];
                
                if (typeof adminFeeData === 'object' && adminFeeData !== null) {
                    adminShippingFee = parseFloat(adminFeeData.fee) || 0;
                } else {
                    adminShippingFee = parseFloat(adminFeeData) || 0;
                }
            } else if (order.shippingFee && adminItemsInOrder.length > 0) {
                // Fallback: proportional shipping based on admin's items
                const adminItemRatio = adminItemsInOrder.length / order.cartItems.length;
                adminShippingFee = parseFloat(order.shippingFee) * adminItemRatio;
            }
            
            totalShippingFees += adminShippingFee;
        });

        // Get total withdrawn (payments made to admin)
        const completedPayments = await Transaction.find({
            vendorId: adminId,
            transactionType: 'payment',
            status: 'completed'
        });

        const totalWithdrawn = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const currentBalance = totalRevenue - totalPlatformFees - totalWithdrawn;

        return {
            totalEarnings: totalRevenue,
            platformFees: totalPlatformFees,
            totalWithdrawn,
            currentBalance: Math.max(0, currentBalance), // Ensure non-negative balance
            totalShippingFees
        };
    } catch (error) {
        console.error('Error calculating admin financials:', error);
        return {
            totalEarnings: 0,
            platformFees: 0,
            totalWithdrawn: 0,
            currentBalance: 0,
            totalShippingFees: 0
        };
    }
};

// Get payment history for the logged-in admin
const getPaymentHistory = async (req, res) => {
    try {
        const adminId = req.user.id || req.user._id;
        console.log('Admin fetching payments - User ID:', adminId);
        console.log('Admin fetching payments - User object:', req.user);
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Find payments for this admin/vendor
        const payments = await Transaction.find({
            vendorId: adminId,
            transactionType: 'payment'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'userName email');
        
        console.log('Found payments for admin:', payments.length);
        payments.forEach(payment => {
            console.log(`Payment: ${payment._id}, Amount: ${payment.amount}, VendorId: ${payment.vendorId}`);
        });
        
        const totalCount = await Transaction.countDocuments({
            vendorId: adminId,
            transactionType: 'payment'
        });
        
        console.log('Total count:', totalCount);
        
        const totalPages = Math.ceil(totalCount / limit);
        
        res.status(200).json({
            success: true,
            count: payments.length,
            totalCount,
            totalPages,
            currentPage: page,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment history',
            error: error.message
        });
    }
};

// Get details of a specific payment
const getPaymentDetails = async (req, res) => {
    try {
        const adminId = req.user.id || req.user._id;
        const { paymentId } = req.params;
        
        // Find the payment and verify it belongs to this admin
        const payment = await Transaction.findOne({
            _id: paymentId,
            vendorId: adminId,
            transactionType: 'payment'
        }).populate('createdBy', 'userName email');
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found or access denied'
            });
        }
        
        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment details',
            error: error.message
        });
    }
};

// Get payment summary (totals, etc.)
const getPaymentSummary = async (req, res) => {
    try {
        const adminId = req.user.id || req.user._id;
        console.log('Admin fetching summary - User ID:', adminId);
        
        // Get admin's user profile for balance and earnings info
        const adminUser = await User.findById(adminId).select('balance totalEarnings totalEarningsWithdrawn platformFees');
        
        if (!adminUser) {
            return res.status(404).json({
                success: false,
                message: 'Admin user not found'
            });
        }
        
        // Calculate actual financial data from orders and transactions
        const calculatedFinancials = await calculateAdminFinancials(adminId);
        
        // Get all payments for this admin
        const allPayments = await Transaction.find({
            vendorId: adminId,
            transactionType: 'payment'
        });
        
        console.log('Found payments for summary:', allPayments.length);
        console.log('Admin user stored data:', {
            balance: adminUser.balance,
            totalEarnings: adminUser.totalEarnings,
            totalEarningsWithdrawn: adminUser.totalEarningsWithdrawn,
            platformFees: adminUser.platformFees
        });
        console.log('Calculated financial data:', calculatedFinancials);
        
        // Calculate payment statistics
        const completedPayments = allPayments.filter(p => p.status === 'completed');
        const pendingPayments = allPayments.filter(p => p.status === 'pending');
        
        const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Get latest payment
        const latestPayment = allPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        // Use calculated data if user profile data is empty, otherwise use stored data
        const useCalculated = adminUser.totalEarnings === 0 && calculatedFinancials.totalEarnings > 0;
        
        const summary = {
            // Financial summary - use calculated if stored data is empty
            totalEarnings: useCalculated ? calculatedFinancials.totalEarnings : (adminUser.totalEarnings || 0),
            platformFees: useCalculated ? calculatedFinancials.platformFees : (adminUser.platformFees || 0),
            totalWithdrawn: useCalculated ? calculatedFinancials.totalWithdrawn : (adminUser.totalEarningsWithdrawn || 0),
            currentBalance: useCalculated ? calculatedFinancials.currentBalance : (adminUser.balance || 0),
            
            // Payment statistics
            totalPaid,
            pendingAmount,
            paymentCount: completedPayments.length,
            pendingCount: pendingPayments.length,
            lastPaymentDate: latestPayment?.createdAt || null,
            lastPaymentAmount: latestPayment?.amount || 0,
            totalPayments: allPayments.length,
            
            // Recent payments for display
            recentPayments: completedPayments.slice(0, 5) // Last 5 completed payments
        };
        
        console.log('Final summary:', summary);
        
        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error fetching payment summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment summary',
            error: error.message
        });
    }
};

module.exports = {
    getPaymentHistory,
    getPaymentDetails,
    getPaymentSummary
}; 