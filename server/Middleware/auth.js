// middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as needed

// Authentication middleware
const authMiddleware = async (req, res, next) => {
    // Get token from cookies
    let token = req.cookies.token;
    
    // If no token in cookies, check Authorization header
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        // Check if it's a Bearer token
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('Using token from Authorization header');
        }
    }

    if (!token) return res.status(401).json({
        success: false,
        message: 'Unauthorized user!'
    });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized user!'
        });
    }
};

// Verify token middleware (enhanced)
const verifyToken = (req, res, next) => {
    // Get token from cookies
    let token = req.cookies.token;
    
    // If no token in cookies, check Authorization header
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        // Check if it's a Bearer token
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('Using token from Authorization header');
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'CLIENT_SECRET_KEY');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Admin middleware - checks if the authenticated user is an admin
const isAdmin = async (req, res, next) => {
    try {
        if (req.user && (req.user.role === 'admin' || req.user.role === 'superAdmin')) {
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

// Super Admin middleware - checks if the authenticated user is a super admin
const isSuperAdmin = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'superAdmin') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Super Admin only'
            });
        }
    } catch (error) {
        console.error('Super Admin authorization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Export all middleware functions
module.exports = {
    authMiddleware,
    verifyToken,
    isAdmin,
    isSuperAdmin
};