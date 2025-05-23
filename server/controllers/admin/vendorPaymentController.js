const Transaction = require('../../models/Transaction');

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
        
        // Get all payments for this admin
        const allPayments = await Transaction.find({
            vendorId: adminId,
            transactionType: 'payment'
        });
        
        console.log('Found payments for summary:', allPayments.length);
        allPayments.forEach(payment => {
            console.log(`Summary Payment: ${payment._id}, Amount: ${payment.amount}, Status: ${payment.status}, VendorId: ${payment.vendorId}`);
        });
        
        // Calculate summary statistics
        const completedPayments = allPayments.filter(p => p.status === 'completed');
        const pendingPayments = allPayments.filter(p => p.status === 'pending');
        
        const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Get latest payment
        const latestPayment = allPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        const summary = {
            totalPaid,
            pendingAmount,
            paymentCount: completedPayments.length,
            pendingCount: pendingPayments.length,
            lastPaymentDate: latestPayment?.createdAt || null,
            lastPaymentAmount: latestPayment?.amount || 0,
            totalPayments: allPayments.length
        };
        
        console.log('Calculated summary:', summary);
        
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