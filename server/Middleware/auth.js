// middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as needed

// Authentication middleware
exports.isAuthenticated = async (req, res, next) => {
    try {
        // Check if token exists in cookies or Authorization header
        let token = req.cookies.token;
        
        // If no token in cookies, check Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            // Check if it's a Bearer token
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Please login to access this resource'
            });
        }
        
        // Verify token
        // Make sure to use the same secret key as in authController.js
        const decoded = jwt.verify(token, 'CLIENT_SECRET_KEY');
        
        if (!decoded || !decoded.id) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        // Find user with decoded id
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Attach user data to request object
        req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            userName: user.userName
        };
        
        next();
        
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Admin middleware - checks if the authenticated user is an admin
exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Admin only'
            });
        }
    } catch (error) {
        console.error('Admin authorization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};