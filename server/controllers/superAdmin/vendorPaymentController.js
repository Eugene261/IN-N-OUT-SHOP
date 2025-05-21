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
        const skip = (page - 1) * limit;
        
        const filter = {};
        
        // Add filter for specific vendor if provided
        if (req.query.vendorId) {
            filter.vendorId = req.query.vendorId;
        }
        
        // Add filter for payment status if provided
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        // Add date range filter if provided
        if (req.query.startDate && req.query.endDate) {
            filter.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }
        
        const payments = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('vendorId', 'name email shopName');
        
        const total = await Transaction.countDocuments(filter);
        
        res.json({
            payments,
            pagination: {
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalItems: total
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
        const payment = await Transaction.findById(req.params.paymentId)
            .populate('vendorId', 'name email shopName')
            .populate('orderId');
        
        if (!payment) {
            res.status(404);
            throw new Error('Payment not found');
        }
        
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
 * @desc    Get vendor payment summary
 * @route   GET /api/superAdmin/vendor-payments/summary
 * @access  Super Admin
 */
const getVendorPaymentSummary = async (req, res) => {
    try {
        // Filter options
        const filter = {};
        
        // Add date range filter if provided
        if (req.query.startDate && req.query.endDate) {
            filter.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }
        
        // Total amount paid to vendors
        const totalPaid = await Transaction.aggregate([
            { $match: { ...filter, status: 'completed', transactionType: 'payment' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        // Pending payments amount
        const totalPending = await Transaction.aggregate([
            { $match: { ...filter, status: 'pending', transactionType: 'payment' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        // Total platform fee collected
        const totalPlatformFee = await Transaction.aggregate([
            { $match: { ...filter, transactionType: 'order' } },
            { $group: { _id: null, total: { $sum: '$platformFee' } } }
        ]);
        
        // Group payments by vendor
        const paymentsByVendor = await Transaction.aggregate([
            { $match: { ...filter, status: 'completed', transactionType: 'payment' } },
            { $group: { _id: '$vendorId', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'vendor' } },
            { $unwind: '$vendor' },
            {
                $project: {
                    _id: 1,
                    vendorName: '$vendor.name',
                    shopName: '$vendor.shopName',
                    total: 1
                }
            }
        ]);
        
        // Recent payments
        const recentPayments = await Transaction.find({
            ...filter,
            transactionType: 'payment'
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('vendorId', 'name shopName');
        
        res.json({
            totalPaid: totalPaid.length > 0 ? totalPaid[0].total : 0,
            totalPending: totalPending.length > 0 ? totalPending[0].total : 0,
            totalPlatformFee: totalPlatformFee.length > 0 ? totalPlatformFee[0].total : 0,
            paymentsByVendor,
            recentPayments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllVendorPayments,
    getVendorPaymentDetails,
    createVendorPayment,
    updatePaymentStatus,
    getVendorPaymentSummary
};
