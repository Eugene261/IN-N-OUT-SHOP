const express = require('express');
const { registerUser, loginUser, logoutUser, authMiddleware, forgotPassword, verifyResetToken, resetPassword } = require('../../controllers/authController');
const { authRateLimiter } = require('../../Middleware/rateLimiter');

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



module.exports = router;