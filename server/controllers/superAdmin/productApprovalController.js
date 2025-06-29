const Product = require('../../models/Products');
const User = require('../../models/User');
const emailService = require('../../services/emailService');

/**
 * Get all pending products for SuperAdmin review
 */
const getPendingProducts = async (req, res) => {
  try {
    // Feature flag check - Using injected feature flags instead of direct import
    if (!req.featureFlags || !req.featureFlags.isProductApprovalEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Product approval system is currently disabled',
        featureEnabled: false
      });
    }

    // Check if user is SuperAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get pending products with admin details
    const pendingProducts = await Product.find({ 
      approvalStatus: 'pending' 
    })
    .populate('createdBy', 'userName email shopName createdAt avatar')
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Product.countDocuments({ approvalStatus: 'pending' });

    res.json({
      success: true,
      data: {
        products: pendingProducts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error getting pending products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all products with their approval status (for SuperAdmin dashboard)
 */
const getAllProductsWithStatus = async (req, res) => {
  try {
    // Feature flag check
    if (!req.featureFlags || !req.featureFlags.isProductApprovalEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Product approval system is currently disabled',
        featureEnabled: false
      });
    }

    // Check if user is SuperAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Filter by status if provided

    let filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.approvalStatus = status;
    }

    const products = await Product.find(filter)
      .populate('createdBy', 'userName email shopName')
      .populate('approvedBy', 'userName email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    // Get status counts for dashboard
    const statusCounts = await Product.aggregate([
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusSummary = {
      pending: 0,
      approved: 0,
      rejected: 0
    };

    statusCounts.forEach(item => {
      if (item._id) {
        statusSummary[item._id] = item.count;
      }
    });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          limit
        },
        statusSummary
      }
    });

  } catch (error) {
    console.error('Error getting products with status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Approve a product
 */
const approveProduct = async (req, res) => {
  try {
    // Feature flag check
    if (!req.featureFlags || !req.featureFlags.isProductApprovalEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Product approval system is currently disabled',
        featureEnabled: false
      });
    }

    // Check if user is SuperAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      });
    }

    const { productId } = req.params;
    const { comments = '' } = req.body;

    // Find the product
    const product = await Product.findById(productId).populate('createdBy', 'userName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is in pending status
    if (product.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Product is already ${product.approvalStatus}`,
        currentStatus: product.approvalStatus
      });
    }

    // Update product approval status
    product.approvalStatus = 'approved';
    product.approvalComments = comments;
    product.approvedBy = req.user.id;
    product.approvedAt = new Date();
    product.rejectedAt = null;

    await product.save();

    // Send email notification to admin
    if (product.createdBy) {
      try {
        await emailService.sendEmail({
          to: product.createdBy.email,
          subject: `✅ Product Approved: "${product.title}"`,
          html: emailService.getModernEmailTemplate({
            title: 'Product Approved!',
            headerColor: '#28a745',
            icon: '✅',
            content: `
              <div class="notification-header">
                <h2>🎉 Great News!</h2>
                <p>Hello ${product.createdBy.userName}, your product has been approved!</p>
              </div>
              
              <div class="product-details">
                <h3>📦 Product Information</h3>
                <div class="product-preview">
                  <img src="${product.image}" alt="${product.title}" class="product-image">
                  <div class="product-info">
                    <h4>${product.title}</h4>
                    <p class="product-price">Price: Gh₵${product.price}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Stock:</strong> ${product.totalStock} units</p>
                  </div>
                </div>
              </div>
              
              ${comments ? `
                <div class="message-box">
                  <h3>💬 Reviewer Comments</h3>
                  <p>${comments}</p>
                </div>
              ` : ''}
              
              <div class="next-steps">
                <h3>🎯 What's Next?</h3>
                <ul>
                  <li>✅ Your product is now live on the marketplace</li>
                  <li>📈 Customers can now discover and purchase your product</li>
                  <li>📊 Monitor your sales in the vendor dashboard</li>
                  <li>🔄 You can update product details anytime</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL}/admin/products" class="button">View My Products</a>
                <a href="${process.env.CLIENT_URL}/admin/dashboard" class="button secondary">Go to Dashboard</a>
              </div>
            `
          })
        });

        console.log('Product approval email sent to:', product.createdBy.email);
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Product approved successfully',
      data: {
        productId: product._id,
        title: product.title,
        status: 'approved',
        approvedAt: product.approvedAt,
        approvedBy: req.user.userName || req.user.email
      }
    });

  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reject a product
 */
const rejectProduct = async (req, res) => {
  try {
    // Feature flag check
    if (!req.featureFlags || !req.featureFlags.isProductApprovalEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Product approval system is currently disabled',
        featureEnabled: false
      });
    }

    // Check if user is SuperAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      });
    }

    const { productId } = req.params;
    const { comments } = req.body;

    if (!comments || comments.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required (minimum 10 characters)'
      });
    }

    // Find the product
    const product = await Product.findById(productId).populate('createdBy', 'userName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is in pending status
    if (product.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Product is already ${product.approvalStatus}`,
        currentStatus: product.approvalStatus
      });
    }

    // Update product approval status
    product.approvalStatus = 'rejected';
    product.approvalComments = comments;
    product.approvedBy = req.user.id;
    product.rejectedAt = new Date();
    product.approvedAt = null;

    await product.save();

    // Send email notification to admin
    if (product.createdBy) {
      try {
        await emailService.sendEmail({
          to: product.createdBy.email,
          subject: `❌ Product Review Required: "${product.title}"`,
          html: emailService.getModernEmailTemplate({
            title: 'Product Needs Updates',
            headerColor: '#dc3545',
            icon: '❌',
            content: `
              <div class="notification-header">
                <h2>Product Review Required</h2>
                <p>Hello ${product.createdBy.userName}, your product needs some updates before approval.</p>
              </div>
              
              <div class="product-details">
                <h3>📦 Product Information</h3>
                <div class="product-preview">
                  <img src="${product.image}" alt="${product.title}" class="product-image">
                  <div class="product-info">
                    <h4>${product.title}</h4>
                    <p class="product-price">Price: Gh₵${product.price}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Stock:</strong> ${product.totalStock} units</p>
                  </div>
                </div>
              </div>
              
              <div class="message-box" style="border-left: 4px solid #dc3545;">
                <h3>📝 Review Comments</h3>
                <p>${comments}</p>
              </div>
              
              <div class="next-steps">
                <h3>🔧 Next Steps</h3>
                <ul>
                  <li>📝 Review the feedback above</li>
                  <li>✏️ Edit your product to address the concerns</li>
                  <li>🔄 Resubmit for approval after making changes</li>
                  <li>📞 Contact support if you need help</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL}/admin/products" class="button">Edit Product</a>
                <a href="${process.env.CLIENT_URL}/contact" class="button secondary">Contact Support</a>
              </div>
            `
          })
        });

        console.log('Product rejection email sent to:', product.createdBy.email);
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Product rejected successfully',
      data: {
        productId: product._id,
        title: product.title,
        status: 'rejected',
        rejectedAt: product.rejectedAt,
        comments: product.approvalComments
      }
    });

  } catch (error) {
    console.error('Error rejecting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get approval statistics for dashboard
 */
const getApprovalStats = async (req, res) => {
  try {
    // Feature flag check
    if (!req.featureFlags || !req.featureFlags.isProductApprovalEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Product approval system is currently disabled',
        featureEnabled: false
      });
    }

    // Check if user is SuperAdmin
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. SuperAdmin privileges required.'
      });
    }

    const timeframe = req.query.timeframe || 'all'; // Show all by default
    
    // Build match condition - if timeframe is 'all', don't filter by date
    let matchCondition = {};
    if (timeframe !== 'all' && !isNaN(parseInt(timeframe))) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));
      matchCondition.submittedAt = { $gte: startDate };
    }

    // Get approval stats
    const stats = await Product.aggregate([
      {
        $match: matchCondition
      },
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 },
          avgQualityScore: { $avg: '$qualityScore' }
        }
      }
    ]);

    // Get approval time stats
    let approvalTimesMatch = {
      approvalStatus: 'approved',
      submittedAt: { $exists: true },
      approvedAt: { $exists: true }
    };
    
    // Add date filter only if timeframe is specified
    if (timeframe !== 'all' && !isNaN(parseInt(timeframe))) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));
      approvalTimesMatch.approvedAt = { $gte: startDate };
    }
    
    const approvalTimes = await Product.aggregate([
      {
        $match: approvalTimesMatch
      },
      {
        $project: {
          approvalTimeHours: {
            $divide: [
              { $subtract: ['$approvedAt', '$submittedAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgApprovalTimeHours: { $avg: '$approvalTimeHours' },
          minApprovalTimeHours: { $min: '$approvalTimeHours' },
          maxApprovalTimeHours: { $max: '$approvalTimeHours' }
        }
      }
    ]);

    // Get recent activity
    let recentActivityFilter = {};
    if (timeframe !== 'all' && !isNaN(parseInt(timeframe))) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));
      recentActivityFilter = {
        $or: [
          { approvedAt: { $gte: startDate } },
          { rejectedAt: { $gte: startDate } }
        ]
      };
    } else {
      // For 'all' timeframe, get recent activity from all approved/rejected products
      recentActivityFilter = {
        $or: [
          { approvalStatus: 'approved', approvedAt: { $exists: true } },
          { approvalStatus: 'rejected', rejectedAt: { $exists: true } }
        ]
      };
    }
    
    const recentActivity = await Product.find(recentActivityFilter)
    .populate('createdBy', 'userName email')
    .populate('approvedBy', 'userName email')
    .sort({ updatedAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        stats: {
          total: stats.reduce((sum, item) => sum + item.count, 0),
          byStatus: stats,
          approvalTimes: approvalTimes[0] || null
        },
        recentActivity,
        timeframe: timeframe === 'all' ? 'all' : parseInt(timeframe)
      }
    });

  } catch (error) {
    console.error('Error getting approval stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getPendingProducts,
  getAllProductsWithStatus,
  approveProduct,
  rejectProduct,
  getApprovalStats
}; 