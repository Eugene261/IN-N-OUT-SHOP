const express = require('express');
const { registerUser, loginUser, logoutUser, authMiddleware } = require('../../controllers/authController');
const { authRateLimiter } = require('../../Middleware/rateLimiter');

const router = express.Router()

router.post('/register', authRateLimiter, registerUser);
router.post('/login', authRateLimiter, loginUser);
router.post('/logout', logoutUser);
router.get('/check-auth', authMiddleware, (req, res) => {
    const user = req.user;
    res.status(200).json({
        success : true,
        message :'Authenticated user',
        user,
    });
});



module.exports = router;