const express = require('express');
const router = express.Router();
const { authMiddleware, isSuperAdmin } = require('../../controllers/authController');
const { verifyToken, isAdmin } = require('../../Middleware/auth');
const emailScheduler = require('../../services/emailScheduler');

// Add a health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.id,
      role: req.user.role
    } : 'Not authenticated'
  });
});

// Manually trigger abandoned cart reminders (for serverless environments)
router.post('/trigger-abandoned-cart-reminders', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    console.log('📧 Manually triggering abandoned cart reminders...');
    
    // This would normally be called by cron, but we'll call it manually
    await emailScheduler.runAbandonedCartCheck();
    
    res.json({
      success: true,
      message: 'Abandoned cart reminder check initiated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering abandoned cart reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger abandoned cart reminders',
      error: error.message
    });
  }
});

// Manually trigger weekly reports
router.post('/trigger-weekly-reports', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    console.log('📊 Manually triggering weekly reports...');
    
    // Generate and send weekly reports manually
    const User = require('../../models/User');
    const admins = await User.find({ role: { $in: ['admin', 'superAdmin'] } });
    
    let sentCount = 0;
    for (const admin of admins) {
      try {
        const reportData = await emailScheduler.generateWeeklyReport(admin._id, admin.role);
        const emailService = require('../../services/emailService');
        
        await emailService.sendWeeklyReportEmail(
          admin.email,
          admin.userName,
          reportData
        );
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send weekly report to ${admin.email}:`, emailError);
      }
    }
    
    res.json({
      success: true,
      message: `Weekly reports sent to ${sentCount} admins`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering weekly reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger weekly reports',
      error: error.message
    });
  }
});

// Manually trigger monthly reports
router.post('/trigger-monthly-reports', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    console.log('📊 Manually triggering monthly reports...');
    
    const User = require('../../models/User');
    const admins = await User.find({ role: { $in: ['admin', 'superAdmin'] } });
    
    let sentCount = 0;
    for (const admin of admins) {
      try {
        const reportData = await emailScheduler.generateMonthlyReport(admin._id, admin.role);
        const emailService = require('../../services/emailService');
        
        await emailService.sendMonthlyReportEmail(
          admin.email,
          admin.userName,
          reportData
        );
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send monthly report to ${admin.email}:`, emailError);
      }
    }
    
    res.json({
      success: true,
      message: `Monthly reports sent to ${sentCount} admins`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering monthly reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger monthly reports',
      error: error.message
    });
  }
});

// Email system health check
router.get('/email-system-status', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    const emailService = require('../../services/emailService');
    
    const status = {
      emailServiceConfigured: !!(emailService && emailService.transporter),
      schedulerInitialized: emailScheduler.initialized,
      isServerless: emailScheduler.isServerless,
      scheduledJobsActive: !emailScheduler.isServerless && emailScheduler.jobs.length > 0,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      status,
      message: 'Email system status retrieved successfully'
    });
  } catch (error) {
    console.error('Error checking email system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email system status',
      error: error.message
    });
  }
});

module.exports = router; 