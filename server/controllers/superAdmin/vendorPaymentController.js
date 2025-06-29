const User = require('../../models/User.js');
const Transaction = require('../../models/Transaction.js');
const multer = require('multer');
const path = require('path');

// Configure multer for receipt uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/receipts/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only images and PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit - INCREASED FROM 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

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
        
        // Build query filters
        let query = { transactionType: 'payment' };
        
        if (req.query.status && req.query.status !== 'all') {
            query.status = req.query.status;
        }
        
        if (req.query.vendor) {
            query.vendorId = req.query.vendor;
        }
        
        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};
            if (req.query.startDate) {
                query.createdAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query.createdAt.$lte = new Date(req.query.endDate);
            }
        }
        
        // Get payments with vendor information
        const payments = await Transaction.find(query)
            .populate('vendorId', 'userName email shopName balance')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        // Transform the data to match frontend expectations
        const transformedPayments = payments.map(payment => ({
            ...payment.toObject(),
            vendorId: payment.vendorId ? {
                ...payment.vendorId.toObject(),
                name: payment.vendorId.userName, // Map userName to name for frontend
                shopName: payment.vendorId.shopName || payment.vendorId.userName + "'s Shop"
            } : null
        }));
        
        // Get total count for pagination
        const totalCount = await Transaction.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        
        res.status(200).json({
            success: true,
            data: transformedPayments,
            pagination: {
                totalPages,
                currentPage: page,
                totalItems: totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching vendor payments:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
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
        
        const payment = await Transaction.findById(paymentId)
            .populate('vendorId', 'userName email shopName balance')
            .populate('createdBy', 'userName email');
            
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        
        // Transform the data to match frontend expectations
        const transformedPayment = {
            ...payment.toObject(),
            vendorId: payment.vendorId ? {
                ...payment.vendorId.toObject(),
                name: payment.vendorId.userName, // Map userName to name for frontend
                shopName: payment.vendorId.shopName || payment.vendorId.userName + "'s Shop"
            } : null
        };
        
        res.status(200).json({
            success: true,
            data: transformedPayment
        });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * @desc    Create a new vendor payment with receipt
 * @route   POST /api/superAdmin/vendor-payments
 * @access  Super Admin
 */
const createVendorPayment = async (req, res) => {
    try {
        const { vendorId, amount, description, paymentMethod, transactionId } = req.body;
        
        console.log('Creating payment with data:', {
            vendorId,
            amount,
            description,
            paymentMethod,
            transactionId
        });
        
        if (!vendorId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Vendor ID and amount are required'
            });
        }
        
        const vendor = await User.findById(vendorId);
        
        console.log('Found vendor:', vendor ? {
            id: vendor._id,
            userName: vendor.userName,
            email: vendor.email,
            role: vendor.role
        } : 'null');
        
        if (!vendor || vendor.role !== 'admin') {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        // Handle receipt file if uploaded
        let receiptUrl = null;
        let receiptName = null;
        if (req.file) {
            receiptUrl = `/uploads/receipts/${req.file.filename}`;
            receiptName = req.file.originalname;
        }
        
        const payment = await Transaction.create({
            vendorId,
            amount: parseFloat(amount),
            description: description || 'Manual payment from super admin',
            paymentMethod: paymentMethod || 'manual',
            transactionId: transactionId || null,
            status: 'completed',
            transactionType: 'payment',
            platformFee: 0,
            receiptUrl,
            receiptName,
            createdBy: req.user._id
        });
        
        console.log('Created payment:', payment);
        
        // Update vendor balance
        vendor.balance = (vendor.balance || 0) - parseFloat(amount);
        vendor.totalEarningsWithdrawn = (vendor.totalEarningsWithdrawn || 0) + parseFloat(amount);
        await vendor.save();
        
        // Send payment notification email to vendor
        try {
            const emailService = require('../../services/emailService');
            await emailService.sendVendorPaymentNotificationEmail(
                vendor.email,
                vendor.userName,
                {
                    amount: parseFloat(amount),
                    paymentMethod: paymentMethod || 'manual',
                    transactionId: transactionId || payment._id,
                    paymentDate: new Date(),
                    period: description || 'Manual payment',
                    description: description,
                    currentBalance: vendor.balance,
                    totalEarnings: vendor.totalEarningsWithdrawn
                }
            );
            console.log(`Payment notification email sent to vendor: ${vendor.email}`);
        } catch (emailError) {
            console.error('Failed to send payment notification email:', emailError);
            // Don't fail the payment creation if email fails
        }
        
        // Populate the payment with vendor information before returning
        const populatedPayment = await Transaction.findById(payment._id)
            .populate('vendorId', 'userName email shopName balance');
            
        // Transform the data to match frontend expectations
        const transformedPayment = {
            ...populatedPayment.toObject(),
            vendorId: populatedPayment.vendorId ? {
                ...populatedPayment.vendorId.toObject(),
                name: populatedPayment.vendorId.userName,
                shopName: populatedPayment.vendorId.shopName || populatedPayment.vendorId.userName + "'s Shop"
            } : null
        };
        
        console.log('Returning transformed payment:', transformedPayment);
        
        res.status(201).json({
            success: true,
            message: 'Payment created successfully',
            data: transformedPayment
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * @desc    Upload receipt for existing payment
 * @route   POST /api/superAdmin/vendor-payments/:paymentId/receipt
 * @access  Super Admin
 */
const uploadReceipt = async (req, res) => {
    try {
        const paymentId = req.params.paymentId;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        const payment = await Transaction.findById(paymentId);
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        
        // Update payment with receipt info
        payment.receiptUrl = `/uploads/receipts/${req.file.filename}`;
        payment.receiptName = req.file.originalname;
        await payment.save();
        
        res.status(200).json({
            success: true,
            message: 'Receipt uploaded successfully',
            data: {
                receiptUrl: payment.receiptUrl,
                receiptName: payment.receiptName
            }
        });
    } catch (error) {
        console.error('Error uploading receipt:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
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
        // Get all payments
        const allPayments = await Transaction.find({ transactionType: 'payment' });
        
        // Calculate summary statistics
        const completedPayments = allPayments.filter(p => p.status === 'completed');
        const pendingPayments = allPayments.filter(p => p.status === 'pending');
        const paymentsWithReceipts = allPayments.filter(p => p.receiptUrl);
        const paymentsWithoutReceipts = allPayments.filter(p => !p.receiptUrl);
        
        const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalWithReceipts = paymentsWithReceipts.reduce((sum, p) => sum + p.amount, 0);
        const totalWithoutReceipts = paymentsWithoutReceipts.reduce((sum, p) => sum + p.amount, 0);
        
        // Get latest payment
        const latestPayment = await Transaction.findOne({ transactionType: 'payment' })
            .sort({ createdAt: -1 });
            
        const summary = {
            totalPaid,
            pendingAmount,
            completedCount: completedPayments.length,
            pendingCount: pendingPayments.length,
            latestPaymentDate: latestPayment?.createdAt || null,
            latestPaymentAmount: latestPayment?.amount || 0,
            totalWithReceipts,
            totalWithoutReceipts
        };
        
        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error fetching payment summary:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
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
            'userName email role balance totalEarningsWithdrawn' // Include balance info
        ).sort({ role: 1, userName: 1 });

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
    uploadReceipt,
    updatePaymentStatus,
    getVendorPaymentSummary,
    getAdminsAndVendors,
    upload // Export multer middleware
};
