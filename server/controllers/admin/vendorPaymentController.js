const VendorPayment = require('../../models/VendorPayment');

// Get payment history for the logged-in admin
const getPaymentHistory = async (req, res) => {
    try {
        // For now, return dummy data
        const dummyPayments = [
            {
                _id: '1',
                amount: 1250.00,
                periodStart: new Date('2025-05-01'),
                periodEnd: new Date('2025-05-07'),
                paymentMethod: 'Bank Transfer',
                transactionId: 'TRX123456',
                status: 'completed',
                createdAt: new Date('2025-05-08'),
                processedAt: new Date('2025-05-08'),
                receiptUrl: '/uploads/receipts/receipt-123.pdf'
            },
            {
                _id: '2',
                amount: 980.50,
                periodStart: new Date('2025-04-24'),
                periodEnd: new Date('2025-04-30'),
                paymentMethod: 'Mobile Money',
                transactionId: 'TRX789012',
                status: 'completed',
                createdAt: new Date('2025-05-01'),
                processedAt: new Date('2025-05-01'),
                receiptUrl: '/uploads/receipts/receipt-124.pdf'
            },
            {
                _id: '3',
                amount: 1420.75,
                periodStart: new Date('2025-05-08'),
                periodEnd: new Date('2025-05-14'),
                paymentMethod: 'Bank Transfer',
                status: 'pending',
                createdAt: new Date('2025-05-15')
            }
        ];
        
        res.status(200).json({
            success: true,
            count: dummyPayments.length,
            totalCount: dummyPayments.length,
            totalPages: 1,
            currentPage: 1,
            data: dummyPayments
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
        // For now, return dummy data
        const dummyPayment = {
            _id: '1',
            amount: 1250.00,
            periodStart: new Date('2025-05-01'),
            periodEnd: new Date('2025-05-07'),
            paymentMethod: 'Bank Transfer',
            transactionId: 'TRX123456',
            status: 'completed',
            createdAt: new Date('2025-05-08'),
            processedAt: new Date('2025-05-08'),
            receiptUrl: '/uploads/receipts/receipt-123.pdf'
        };
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
        // For now, return dummy data
        const dummySummary = {
            totalPaid: 2230.50,
            pendingAmount: 1420.75,
            paymentCount: 2,
            pendingCount: 1,
            lastPaymentDate: new Date('2025-05-08'),
            lastPaymentAmount: 1250.00,
            unviewedCount: 1
        };
        
        res.status(200).json({
            success: true,
            data: dummySummary
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