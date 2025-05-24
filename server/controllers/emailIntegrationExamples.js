const emailService = require('../services/emailService');
const User = require('../models/User');

/*
 * EMAIL INTEGRATION EXAMPLES
 * 
 * These examples show how to integrate the new email service into your existing controllers.
 * Copy the relevant code snippets into your actual controllers.
 */

// ========================================
// ORDER CONTROLLER INTEGRATION EXAMPLES
// ========================================

/**
 * Example: Add to your createOrder function in orderController
 */
const createOrderWithEmailExample = async (req, res) => {
  try {
    // ... your existing order creation logic ...
    
    // After successfully creating the order
    const orderDetails = {
      orderId: newOrder._id,
      orderDate: newOrder.orderDate,
      totalAmount: newOrder.totalAmount,
      paymentMethod: newOrder.paymentMethod,
      estimatedDelivery: '3-5 business days',
      items: newOrder.cartItems.map(item => ({
        title: item.title,
        image: item.image,
        quantity: item.quantity,
        price: item.price
      })),
      shippingAddress: newOrder.addressInfo
    };
    
    // Send order confirmation email to customer
    try {
      await emailService.sendOrderConfirmationEmail(
        newOrder.userId.email,
        newOrder.userId.userName,
        orderDetails
      );
      console.log('Order confirmation email sent to customer');
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }
    
    // Send product sold notifications to admins/vendors
    for (const item of newOrder.cartItems) {
      try {
        // Find the admin who owns this product
        const product = await Product.findById(item.productId).populate('adminId');
        if (product && product.adminId) {
          await emailService.sendProductSoldNotificationEmail(
            product.adminId.email,
            product.adminId.userName,
            {
              id: product._id,
              title: product.title,
              image: product.image,
              salePrice: item.price,
              category: product.category,
              sku: product.sku
            },
            {
              orderId: newOrder._id,
              customerName: newOrder.userId.userName,
              orderDate: newOrder.orderDate,
              quantity: item.quantity,
              status: 'confirmed'
            }
          );
          console.log(`Product sold notification sent to admin: ${product.adminId.email}`);
        }
      } catch (emailError) {
        console.error('Failed to send product sold notification:', emailError);
      }
    }
    
    // ... rest of your order creation response logic ...
    
  } catch (error) {
    // ... your error handling ...
  }
};

/**
 * Example: Add to your updateOrderStatus function in orderController
 */
const updateOrderStatusWithEmailExample = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;
    
    // ... your existing order update logic ...
    
    // After successfully updating the order
    const updatedOrder = await Order.findById(orderId).populate('userId');
    
    const orderDetails = {
      orderId: updatedOrder._id,
      orderDate: updatedOrder.orderDate,
      totalAmount: updatedOrder.totalAmount,
      trackingNumber: trackingNumber || updatedOrder.trackingNumber,
      estimatedDelivery: updatedOrder.estimatedDelivery || '2-3 business days'
    };
    
    // Send order status update email to customer
    try {
      await emailService.sendOrderStatusUpdateEmail(
        updatedOrder.userId.email,
        updatedOrder.userId.userName,
        orderDetails,
        status
      );
      console.log(`Order status update email sent: ${status}`);
    } catch (emailError) {
      console.error('Failed to send order status update email:', emailError);
    }
    
    // ... rest of your response logic ...
    
  } catch (error) {
    // ... your error handling ...
  }
};

// ========================================
// PRODUCT CONTROLLER INTEGRATION EXAMPLES
// ========================================

/**
 * Example: Add to your addProduct function in admin/productsController
 */
const addProductWithEmailExample = async (req, res) => {
  try {
    // ... your existing product creation logic ...
    
    // After successfully creating the product
    const newProduct = await Product.create(productData);
    
    // Send notification to SuperAdmin
    try {
      // Get all superAdmins
      const superAdmins = await User.find({ role: 'superAdmin' });
      
      for (const superAdmin of superAdmins) {
        await emailService.sendProductAddedNotificationEmail(
          superAdmin.email,
          {
            userName: req.user.userName,
            email: req.user.email,
            shopName: req.user.shopName,
            createdAt: req.user.createdAt
          },
          {
            id: newProduct._id,
            title: newProduct.title,
            description: newProduct.description,
            price: newProduct.price,
            category: newProduct.category,
            brand: newProduct.brand,
            totalStock: newProduct.totalStock,
            image: newProduct.image
          }
        );
      }
      console.log('Product added notifications sent to SuperAdmins');
    } catch (emailError) {
      console.error('Failed to send product added notifications:', emailError);
    }
    
    // ... rest of your response logic ...
    
  } catch (error) {
    // ... your error handling ...
  }
};

/**
 * Example: Add to your updateProduct function for stock monitoring
 */
const updateProductWithStockMonitoringExample = async (req, res) => {
  try {
    // ... your existing product update logic ...
    
    const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });
    
    // Check if stock is low and send alert
    if (updatedProduct.totalStock <= 5 && updatedProduct.totalStock > 0) {
      try {
        const admin = await User.findById(updatedProduct.adminId);
        if (admin) {
          await emailService.sendLowStockAlert(
            admin.email,
            admin.userName,
            {
              id: updatedProduct._id,
              title: updatedProduct.title,
              price: updatedProduct.price,
              totalStock: updatedProduct.totalStock,
              image: updatedProduct.image
            }
          );
          console.log(`Low stock alert sent for product: ${updatedProduct.title}`);
        }
      } catch (emailError) {
        console.error('Failed to send low stock alert:', emailError);
      }
    }
    
    // ... rest of your response logic ...
    
  } catch (error) {
    // ... your error handling ...
  }
};

// ========================================
// USER CONTROLLER INTEGRATION EXAMPLES
// ========================================

/**
 * Example: Add to your createAdmin function in superAdmin/userController
 */
const createAdminWithEmailExample = async (req, res) => {
  try {
    // ... your existing admin creation logic ...
    
    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8);
    
    // Create the admin user
    const newAdmin = await User.create({
      ...adminData,
      password: await bcrypt.hash(temporaryPassword, 12)
    });
    
    // Send welcome email with credentials
    try {
      await emailService.sendNewAdminWelcomeEmail(
        newAdmin.email,
        newAdmin.userName,
        temporaryPassword
      );
      console.log('Welcome email sent to new admin');
    } catch (emailError) {
      console.error('Failed to send welcome email to new admin:', emailError);
    }
    
    // ... rest of your response logic ...
    
  } catch (error) {
    // ... your error handling ...
  }
};

// ========================================
// SCHEDULED EMAIL EXAMPLES
// ========================================

/**
 * Example: Monthly report email (could be run via cron job)
 */
const sendMonthlyReportsExample = async () => {
  try {
    // Get all admins
    const admins = await User.find({ role: 'admin' });
    
    for (const admin of admins) {
      // Calculate admin's monthly stats
      const reportData = await calculateAdminMonthlyStats(admin._id);
      
      try {
        await emailService.sendMonthlyReportEmail(
          admin.email,
          admin.userName,
          reportData
        );
        console.log(`Monthly report sent to: ${admin.email}`);
      } catch (emailError) {
        console.error(`Failed to send monthly report to ${admin.email}:`, emailError);
      }
    }
  } catch (error) {
    console.error('Error sending monthly reports:', error);
  }
};

/**
 * Example: Abandoned cart reminder (could be run via cron job)
 */
const sendAbandonedCartRemindersExample = async () => {
  try {
    // Get abandoned carts (older than 1 hour, no recent order)
    const abandonedCarts = await getAbandonedCarts();
    
    for (const cart of abandonedCarts) {
      try {
        const user = await User.findById(cart.userId);
        if (user) {
          await emailService.sendAbandonedCartEmail(
            user.email,
            user.userName,
            cart.items
          );
          console.log(`Abandoned cart email sent to: ${user.email}`);
        }
      } catch (emailError) {
        console.error(`Failed to send abandoned cart email:`, emailError);
      }
    }
  } catch (error) {
    console.error('Error sending abandoned cart reminders:', error);
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Helper function to calculate monthly stats for an admin
 */
const calculateAdminMonthlyStats = async (adminId) => {
  // This is a placeholder - implement based on your data models
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  
  // Example calculations (adjust based on your models)
  const orders = await Order.find({
    adminId: adminId,
    orderDate: { $gte: startOfMonth, $lte: endOfMonth }
  });
  
  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const earnings = totalSales * 0.8; // Assuming 80% commission
  
  // Get top products
  const productSales = {};
  orders.forEach(order => {
    order.cartItems.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          title: item.title,
          image: item.image,
          unitsSold: 0,
          revenue: 0
        };
      }
      productSales[item.productId].unitsSold += item.quantity;
      productSales[item.productId].revenue += item.price * item.quantity;
    });
  });
  
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  
  return {
    totalSales: totalSales.toFixed(2),
    totalOrders,
    earnings: earnings.toFixed(2),
    productsSold: orders.reduce((sum, order) => 
      sum + order.cartItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
    growth: Math.floor(Math.random() * 20) - 5, // Placeholder - calculate actual growth
    avgOrderValue: totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0,
    returnRate: Math.floor(Math.random() * 5), // Placeholder
    satisfaction: 95 + Math.floor(Math.random() * 5), // Placeholder
    topProducts
  };
};

/**
 * Helper function to get abandoned carts
 */
const getAbandonedCarts = async () => {
  // This is a placeholder - implement based on your cart model
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Example implementation (adjust based on your cart model)
  const abandonedCarts = await Cart.find({
    updatedAt: { $lt: oneHourAgo },
    items: { $exists: true, $not: { $size: 0 } }
  }).populate('userId');
  
  return abandonedCarts.map(cart => ({
    userId: cart.userId._id,
    items: cart.items.map(item => ({
      title: item.title,
      image: item.image,
      quantity: item.quantity,
      price: item.price
    }))
  }));
};

module.exports = {
  createOrderWithEmailExample,
  updateOrderStatusWithEmailExample,
  addProductWithEmailExample,
  updateProductWithStockMonitoringExample,
  createAdminWithEmailExample,
  sendMonthlyReportsExample,
  sendAbandonedCartRemindersExample
}; 