const cron = require('node-cron');
const emailService = require('./emailService');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Products');
const Cart = require('../models/cart');

class EmailScheduler {
  constructor() {
    this.initialized = false;
    this.jobs = [];
    this.isServerless = this.detectServerlessEnvironment();
  }

  // Detect if running in serverless environment
  detectServerlessEnvironment() {
    return !!(
      process.env.VERCEL || 
      process.env.NETLIFY || 
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.FUNCTION_NAME ||
      process.platform === 'darwin' // Often indicates serverless local testing
    );
  }

  // Initialize all scheduled email jobs
  async initialize() {
    if (this.initialized) return;

    console.log('🔄 Initializing email scheduler...');
    
    // Skip cron jobs in serverless environments
    if (this.isServerless) {
      console.log('⚠️ Serverless environment detected - skipping cron job initialization');
      console.log('📝 Email functions are available for manual triggering via API endpoints');
      this.initialized = true;
      return;
    }

    try {
      // Verify email service is available before setting up cron jobs
      if (!emailService || !emailService.transporter) {
        console.log('⚠️ Email service not configured - skipping email scheduler initialization');
        this.initialized = true;
        return;
      }

      // Abandoned cart reminders - every hour
      this.scheduleAbandonedCartReminders();
      
      // Weekly reports - every Monday at 9 AM
      this.scheduleWeeklyReports();
      
      // Monthly reports - 1st day of month at 9 AM
      this.scheduleMonthlyReports();
      
      // Review requests - every 2 hours for delivered orders
      this.scheduleReviewRequests();

      this.initialized = true;
      console.log('✅ Email scheduler initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email scheduler:', error);
      // Don't throw error - let server continue running
      this.initialized = true;
    }
  }

  // Abandoned cart reminders
  scheduleAbandonedCartReminders() {
    // Run every hour
    const job = cron.schedule('0 * * * *', async () => {
      await this.runAbandonedCartCheck();
    });

    this.jobs.push(job);
  }

  // Actual abandoned cart check logic (can be called manually)
  async runAbandonedCartCheck() {
    console.log('🛒 Running abandoned cart reminder check...');
    
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Find carts that haven't been updated recently with error handling
      const abandonedCarts = await Cart.find({
        updatedAt: { $lt: oneHourAgo },
        items: { $exists: true, $not: { $size: 0 } }
      }).populate('userId').catch(error => {
        console.error('Database error finding abandoned carts:', error);
        return [];
      });

      let processedCount = 0;
      for (const cart of abandonedCarts) {
        try {
          if (!cart.userId || !cart.userId.email) continue;

          const cartAge = now - new Date(cart.updatedAt);
          const hoursOld = cartAge / (1000 * 60 * 60);
          
          let reminderStage = 0;
          
          // Determine reminder stage
          if (hoursOld >= 72) { // 3 days
            reminderStage = 3;
          } else if (hoursOld >= 24) { // 1 day
            reminderStage = 2;
          } else if (hoursOld >= 1) { // 1 hour
            reminderStage = 1;
          }

          if (reminderStage > 0) {
            // Check if we've already sent this stage reminder
            const lastReminderField = `lastReminderStage${reminderStage}`;
            const lastReminderSent = cart[lastReminderField];
            
            if (!lastReminderSent || (now - new Date(lastReminderSent)) > 24 * 60 * 60 * 1000) {
              // Prepare cart details with error handling
              const cartDetails = {
                items: cart.items.map(item => ({
                  title: item.title || 'Product',
                  image: item.image || '',
                  quantity: item.quantity || 1,
                  price: item.price || 0
                })),
                totalAmount: cart.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)
              };

              // Send reminder email with error handling
              const emailService = require('./emailService');
              await emailService.sendAbandonedCartEmail(
                cart.userId.email,
                cart.userId.userName,
                cartDetails,
                reminderStage
              );

              // Update cart to mark this reminder as sent with error handling
              await Cart.findByIdAndUpdate(cart._id, {
                [lastReminderField]: now
              }).catch(error => {
                console.error('Error updating cart reminder timestamp:', error);
              });

              console.log(`📧 Sent abandoned cart reminder (stage ${reminderStage}) to ${cart.userId.email}`);
              processedCount++;
            }
          }
        } catch (cartError) {
          console.error('Error processing abandoned cart:', cartError);
          // Continue with next cart
        }
      }
      
      console.log(`✅ Processed ${processedCount} abandoned cart reminders`);
    } catch (error) {
      console.error('❌ Error in abandoned cart reminder job:', error);
    }
  }

  // Weekly reports
  scheduleWeeklyReports() {
    // Every Monday at 9 AM
    const job = cron.schedule('0 9 * * 1', async () => {
      console.log('📊 Running weekly reports...');
      
      try {
        const admins = await User.find({ role: { $in: ['admin', 'superAdmin'] } });
        
        for (const admin of admins) {
          const reportData = await this.generateWeeklyReport(admin._id, admin.role);
          
          await emailService.sendWeeklyReportEmail(
            admin.email,
            admin.userName,
            reportData
          );
          
          console.log(`📧 Sent weekly report to ${admin.email}`);
        }
      } catch (error) {
        console.error('❌ Error in weekly reports job:', error);
      }
    });

    this.jobs.push(job);
  }

  // Monthly reports
  scheduleMonthlyReports() {
    // 1st day of month at 9 AM
    const job = cron.schedule('0 9 1 * *', async () => {
      console.log('📊 Running monthly reports...');
      
      try {
        const admins = await User.find({ role: { $in: ['admin', 'superAdmin'] } });
        
        for (const admin of admins) {
          const reportData = await this.generateMonthlyReport(admin._id, admin.role);
          
          await emailService.sendMonthlyReportEmail(
            admin.email,
            admin.userName,
            reportData
          );
          
          console.log(`📧 Sent monthly report to ${admin.email}`);
        }
      } catch (error) {
        console.error('❌ Error in monthly reports job:', error);
      }
    });

    this.jobs.push(job);
  }

  // Review requests for delivered orders
  scheduleReviewRequests() {
    // Every 2 hours
    const job = cron.schedule('0 */2 * * *', async () => {
      console.log('⭐ Running review request check...');
      
      try {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find delivered orders from 2-7 days ago that haven't had review requests sent
        const deliveredOrders = await Order.find({
          status: 'delivered',
          orderUpdateDate: { $gte: sevenDaysAgo, $lte: twoDaysAgo },
          reviewRequestSent: { $ne: true }
        }).populate('user');

        for (const order of deliveredOrders) {
          if (!order.user || !order.user.email) continue;

          // Send review request for each product
          for (const item of order.cartItems || []) {
            try {
              await emailService.sendProductReviewRequestEmail(
                order.user.email,
                order.user.userName,
                {
                  orderId: order._id,
                  deliveryDate: order.orderUpdateDate
                },
                {
                  id: item.productId,
                  title: item.title,
                  image: item.image
                }
              );
            } catch (reviewError) {
              console.error('Failed to send review request:', reviewError);
            }
          }

          // Mark review request as sent
          await Order.findByIdAndUpdate(order._id, {
            reviewRequestSent: true
          });

          console.log(`📧 Sent review requests to ${order.user.email} for order ${order._id}`);
        }
      } catch (error) {
        console.error('❌ Error in review requests job:', error);
      }
    });

    this.jobs.push(job);
  }

  // Generate weekly report data
  async generateWeeklyReport(adminId, role) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const prevStartDate = new Date();
    const prevEndDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - 14);
    prevEndDate.setDate(prevEndDate.getDate() - 7);

    // Get orders for this week and previous week
    const orderFilter = role === 'admin' ? { 'cartItems.productId': { $in: await this.getAdminProductIds(adminId) } } : {};
    
    const thisWeekOrders = await Order.find({
      ...orderFilter,
      orderDate: { $gte: startDate, $lte: endDate }
    });

    const prevWeekOrders = await Order.find({
      ...orderFilter,
      orderDate: { $gte: prevStartDate, $lte: prevEndDate }
    });

    // Calculate metrics
    const thisWeekRevenue = thisWeekOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const prevWeekRevenue = prevWeekOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const revenueChange = prevWeekRevenue > 0 ? ((thisWeekRevenue - prevWeekRevenue) / prevWeekRevenue * 100).toFixed(1) : 0;
    const ordersChange = prevWeekOrders.length > 0 ? ((thisWeekOrders.length - prevWeekOrders.length) / prevWeekOrders.length * 100).toFixed(1) : 0;

    return {
      weekStart: startDate.toLocaleDateString(),
      weekEnd: endDate.toLocaleDateString(),
      totalOrders: thisWeekOrders.length,
      totalRevenue: thisWeekRevenue.toFixed(2),
      revenueChange: parseFloat(revenueChange),
      ordersChange: parseFloat(ordersChange),
      newCustomers: await this.getNewCustomersCount(startDate, endDate),
      customersChange: 0,
      productsSold: await this.getProductsSoldCount(thisWeekOrders),
      productsSoldChange: 0,
      userRole: role,
      insights: [
        thisWeekRevenue > prevWeekRevenue ? 'Revenue increased this week' : 'Revenue decreased this week',
        thisWeekOrders.length > prevWeekOrders.length ? 'More orders than last week' : 'Fewer orders than last week'
      ]
    };
  }

  // Generate monthly report data
  async generateMonthlyReport(adminId, role) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

    const prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);

    const orderFilter = role === 'admin' ? { 'cartItems.productId': { $in: await this.getAdminProductIds(adminId) } } : {};
    
    const thisMonthOrders = await Order.find({
      ...orderFilter,
      orderDate: { $gte: startDate, $lte: endDate }
    });

    const prevMonthOrders = await Order.find({
      ...orderFilter,
      orderDate: { $gte: prevStartDate, $lte: prevEndDate }
    });

    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const prevMonthRevenue = prevMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const avgOrderValue = thisMonthOrders.length > 0 ? (thisMonthRevenue / thisMonthOrders.length).toFixed(2) : 0;

    return {
      monthName: startDate.toLocaleDateString('en-US', { month: 'long' }),
      monthNumber: startDate.getMonth() + 1,
      year: startDate.getFullYear(),
      totalOrders: thisMonthOrders.length,
      totalRevenue: thisMonthRevenue.toFixed(2),
      avgOrderValue: avgOrderValue,
      revenueChange: prevMonthRevenue > 0 ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1) : 0,
      ordersChange: prevMonthOrders.length > 0 ? ((thisMonthOrders.length - prevMonthOrders.length) / prevMonthOrders.length * 100).toFixed(1) : 0,
      aovChange: 0,
      newCustomers: await this.getNewCustomersCount(startDate, endDate),
      customersChange: 0,
      userRole: role,
      highlights: [
        {
          icon: '📈',
          title: 'Revenue Growth',
          description: `${thisMonthRevenue > prevMonthRevenue ? 'Increased' : 'Decreased'} by ${Math.abs(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1))}%`
        }
      ]
    };
  }

  // Helper methods
  async getAdminProductIds(adminId) {
    const products = await Product.find({ createdBy: adminId });
    return products.map(p => p._id);
  }

  async getNewCustomersCount(startDate, endDate) {
    const count = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      role: 'user'
    });
    return count;
  }

  async getProductsSoldCount(orders) {
    return orders.reduce((total, order) => {
      return total + (order.cartItems || []).reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
  }

  // Stop all scheduled jobs
  stop() {
    this.jobs.forEach(job => {
      if (job) job.stop();
    });
    this.jobs = [];
    this.initialized = false;
    console.log('🛑 Email scheduler stopped');
  }
}

module.exports = new EmailScheduler(); 