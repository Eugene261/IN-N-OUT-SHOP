const User = require('../../models/User.js');
const Transaction = require('../../models/Transaction.js');

/**
 * @desc    Get all vendor payments
 * @route   GET /api/superAdmin/vendor-payments
 * @access  Super Admin
 */
const getAllVendorPayments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        // Create dummy data for testing
        const dummyPayments = [
            {
                _id: '1',
                vendorId: {
                    _id: '101',
                    name: 'Fashion Vendor',
                    email: 'fashion@example.com',
                    shopName: 'Fashion Store'
                },
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
                vendorId: {
                    _id: '102',
                    name: 'Electronics Vendor',
                    email: 'electronics@example.com',
                    shopName: 'Gadget World'
                },
                amount: 980.50,
                periodStart: new Date('2025-05-01'),
                periodEnd: new Date('2025-05-07'),
                paymentMethod: 'PayPal',
                transactionId: 'PP987654',
                status: 'pending',
                createdAt: new Date('2025-05-10'),
                processedAt: null,
                receiptUrl: null
            },
            {
                _id: '3',
                vendorId: {
                    _id: '103',
                    name: 'Home Decor Vendor',
                    email: 'homedecor@example.com',
                    shopName: 'Home Luxe'
                },
                amount: 750.00,
                periodStart: new Date('2025-04-01'),
                periodEnd: new Date('2025-04-30'),
                paymentMethod: 'Bank Transfer',
                transactionId: 'TRX789012',
                status: 'completed',
                createdAt: new Date('2025-05-02'),
                processedAt: new Date('2025-05-02'),
                receiptUrl: '/uploads/receipts/receipt-456.pdf'
            }
        ];
        
        // Return the dummy data with pagination
        res.status(200).json({
            success: true,
            data: dummyPayments,
            pagination: {
                totalPages: 1,
                currentPage: page,
                totalItems: dummyPayments.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get details of a specific vendor payment
 * @route   GET /api/superAdmin/vendor-payments/:paymentId
 * @access  Super Admin
 */
const getVendorPaymentDetails = async (req, res) => {
    try {
        const paymentId = req.params.paymentId;
        
        // Return dummy payment details for testing
        const dummyPaymentDetails = {
            _id: paymentId,
            vendorId: {
                _id: '101',
                name: 'Fashion Vendor',
                email: 'fashion@example.com',
                shopName: 'Fashion Store'
            },
            amount: 1250.00,
            periodStart: new Date('2025-05-01'),
            periodEnd: new Date('2025-05-07'),
            paymentMethod: 'Bank Transfer',
            transactionId: 'TRX123456',
            status: 'completed',
            createdAt: new Date('2025-05-08'),
            processedAt: new Date('2025-05-08'),
            receiptUrl: '/uploads/receipts/receipt-123.pdf',
            notes: 'Regular monthly payment for sales period',
            orderId: {
                _id: 'order123',
                orderNumber: 'ORD-2025-123',
                totalAmount: 1500.00,
                items: [
                    { name: 'Product 1', price: 500.00, quantity: 2 },
                    { name: 'Product 2', price: 250.00, quantity: 2 }
                ]
            }
        };
        
        res.status(200).json({
            success: true,
            data: dummyPaymentDetails
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * @desc    Create a new vendor payment
 * @route   POST /api/superAdmin/vendor-payments
 * @access  Super Admin
 */
const createVendorPayment = async (req, res) => {
    try {
        const { vendorId, amount, description, paymentMethod } = req.body;
        
        if (!vendorId || !amount) {
            res.status(400);
            throw new Error('Vendor ID and amount are required');
        }
        
        const vendor = await User.findById(vendorId);
        
        if (!vendor || vendor.role !== 'admin') {
            res.status(404);
            throw new Error('Vendor not found');
        }
        
        const payment = await Transaction.create({
            vendorId,
            amount,
            description: description || 'Manual payment from super admin',
            paymentMethod: paymentMethod || 'manual',
            status: 'completed',
            transactionType: 'payment',
            platformFee: 0, // No platform fee for manual payments
            createdBy: req.user._id
        });
        
        // Update vendor balance
        vendor.balance -= amount;
        vendor.totalEarningsWithdrawn += amount;
        await vendor.save();
        
        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update payment status
 * @route   PATCH /api/superAdmin/vendor-payments/:paymentId/status
 * @access  Super Admin
 */
const updatePaymentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            res.status(400);
            throw new Error('Status is required');
        }
        
        const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            res.status(400);
            throw new Error('Invalid status');
        }
        
        const payment = await Transaction.findById(req.params.paymentId);
        
        if (!payment) {
            res.status(404);
            throw new Error('Payment not found');
        }
        
        // If payment status is changing from something else to completed
        if (payment.status !== 'completed' && status === 'completed') {
            const vendor = await User.findById(payment.vendorId);
            
            if (!vendor) {
                res.status(404);
                throw new Error('Vendor not found');
            }
            
            // Update vendor balance only when payment is completed
            vendor.balance -= payment.amount;
            vendor.totalEarningsWithdrawn += payment.amount;
            await vendor.save();
        }
        
        payment.status = status;
        payment.updatedAt = Date.now();
        payment.updatedBy = req.user._id;
        await payment.save();
        
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get payment summary statistics
 * @route   GET /api/superAdmin/vendor-payments/summary
 * @access  Super Admin
 */
const getVendorPaymentSummary = async (req, res) => {
    try {
        // Return dummy summary data for testing
        const dummySummary = {
            totalPaid: 2000.50,
            pendingAmount: 980.50,
            completedCount: 2,
            pendingCount: 1,
            latestPaymentDate: new Date('2025-05-08'),
            latestPaymentAmount: 1250.00
        };
        
        res.status(200).json({
            success: true,
            data: dummySummary
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all admins and vendors for dropdown
 * @route   GET /api/superAdmin/vendor-payments/admins-vendors
 * @access  Super Admin
 */
const getAdminsAndVendors = async (req, res) => {
    try {
        // Find all admin users from the database
        const users = await User.find(
            { role: { $in: ['admin', 'superAdmin'] } },
            'userName email role' // Only return necessary fields from actual schema
        ).sort({ role: 1, userName: 1 }); // Sort by role then by userName

        console.log('Fetched users:', users);

        return res.status(200).json({
            success: true,
            vendors: users
        });
    } catch (error) {
        console.error('Error fetching admins and vendors:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching admins and vendors',
            error: error.message
        });
    }
};

module.exports = {
    getAllVendorPayments,
    getVendorPaymentDetails,
    createVendorPayment,
    updatePaymentStatus,
    getVendorPaymentSummary,
    getAdminsAndVendors
};
