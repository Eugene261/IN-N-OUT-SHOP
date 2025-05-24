const express = require('express');
const { registerUser, loginUser, logoutUser, authMiddleware, forgotPassword, verifyResetToken, resetPassword } = require('../../controllers/authController');
const { authRateLimiter } = require('../../Middleware/rateLimiter');
const emailService = require('../../services/emailService');

const router = express.Router()

router.post('/register', authRateLimiter, registerUser);
router.post('/login', authRateLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/check-auth', authMiddleware, (req, res) => {
    console.log('Check-auth endpoint hit successfully');
    const user = req.user;
    res.status(200).json({
        success : true,
        message :'Authenticated user',
        user,
    });
});

// Add a simple test endpoint that doesn't require auth
router.get('/test', (req, res) => {
    console.log('Test endpoint hit');
    res.status(200).json({
        success: true,
        message: 'Auth routes working',
        timestamp: new Date().toISOString()
    });
});

// Test email endpoint (for development/testing)
router.post('/test-email', authRateLimiter, async (req, res) => {
    const { email, type = 'test' } = req.body;
    
    try {
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        let result;
        switch (type) {
            case 'welcome':
                result = await emailService.sendWelcomeEmail(email, 'Test User');
                break;
            case 'reset':
                const testResetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/reset-password/test-token`;
                result = await emailService.sendPasswordResetEmail(email, testResetUrl, 'Test User');
                break;
            default:
                result = await emailService.sendEmail({
                    to: email,
                    subject: 'Test Email - IN-N-OUT Store',
                    html: `
                        <h1>🎉 Email Service Test</h1>
                        <p>If you're reading this, your email service is working correctly!</p>
                        <p>Timestamp: ${new Date().toISOString()}</p>
                        <hr>
                        <small>This is a test email from IN-N-OUT Store</small>
                    `
                });
        }

        console.log('Test email sent successfully to:', email);
        res.status(200).json({
            success: true,
            message: `Test ${type} email sent successfully`,
            messageId: result.messageId
        });

    } catch (error) {
        console.error('Test email failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Email service error'
        });
    }
});

module.exports = router;