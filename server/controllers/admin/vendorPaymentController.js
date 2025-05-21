const VendorPayment = require('../../models/VendorPayment');

// Get payment history for the logged-in admin
const getPaymentHistory = async (req, res) => {
    try {
        // Get the admin ID from the authenticated user
        const adminId = req.user.id;
        
        // Get query parameters for filtering
        const { status, startDate, endDate, limit = 10, page = 1 } = req.query;
        
        // Build filter
        const filter = { vendor: adminId };
        
        if (status) {
            filter.status = status;
        }
        
        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get payment history
        const payments = await VendorPayment.find(filter)
            .populate('processedBy', 'userName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get total count for pagination
        const totalCount = await VendorPayment.countDocuments(filter);
        
        // Mark unviewed payments as viewed
        const unviewedPayments = payments.filter(p => !p.viewedAt);
        if (unviewedPayments.length > 0) {
            await Promise.all(unviewedPayments.map(payment => {
                payment.viewedAt = new Date();
                return payment.save();
            }));
        }
        
        res.status(200).json({
            success: true,
            count: payments.length,
            totalCount,
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            currentPage: parseInt(page),
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
        // Get the admin ID from the authenticated user
        const adminId = req.user.id;
        const { paymentId } = req.params;
        
        // Find the payment and verify it belongs to this admin
        const payment = await VendorPayment.findOne({
            _id: paymentId,
            vendor: adminId
        }).populate('processedBy', 'userName');
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found or access denied'
            });
        }
        
        // Mark as viewed if not already
        if (!payment.viewedAt) {
            payment.viewedAt = new Date();
            await payment.save();
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
        // Get the admin ID from the authenticated user
        const adminId = req.user.id;
        
        // Get query parameters
        const { year, month } = req.query;
        
        // Build date filter
        let dateFilter = {};
        if (year && month) {
            // For specific month
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0);
            dateFilter = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            };
        } else if (year) {
            // For entire year
            const startDate = new Date(parseInt(year), 0, 1);
            const endDate = new Date(parseInt(year), 11, 31);
            dateFilter = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            };
        }
        
        // Calculate total paid
        const completedPayments = await VendorPayment.find({
            vendor: adminId,
            status: 'completed',
            ...dateFilter
        });
        
        const totalPaid = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Calculate pending payments
        const pendingPayments = await VendorPayment.find({
            vendor: adminId,
            status: { $ne: 'completed' },
            ...dateFilter
        });
        
        const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Get most recent payment
        const latestPayment = await VendorPayment.findOne({
            vendor: adminId,
            status: 'completed'
        }).sort({ processedAt: -1 });
        
        // Count unviewed payments
        const unviewedCount = await VendorPayment.countDocuments({
            vendor: adminId,
            viewedAt: null
        });
        
        res.status(200).json({
            success: true,
            data: {
                totalPaid,
                pendingAmount,
                paymentCount: completedPayments.length,
                pendingCount: pendingPayments.length,
                lastPaymentDate: latestPayment ? latestPayment.processedAt : null,
                lastPaymentAmount: latestPayment ? latestPayment.amount : 0,
                unviewedCount
            }
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