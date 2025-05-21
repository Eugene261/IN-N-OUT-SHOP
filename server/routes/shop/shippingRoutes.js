const express = require('express');
const router = express.Router();
const {
    getAllShippingZones,
    getShippingZoneById,
    createShippingZone,
    updateShippingZone,
    deleteShippingZone,
    calculateShipping,
    debugFixZones
} = require('../../controllers/shop/shippingController');
const { verifyToken, isAdmin } = require('../../Middleware/auth');

// Public routes
router.post('/calculate', calculateShipping);

// Admin-only routes
router.get('/zones', verifyToken, isAdmin, getAllShippingZones);
router.get('/zones/:id', verifyToken, isAdmin, getShippingZoneById);
router.post('/zones', verifyToken, isAdmin, createShippingZone);
router.put('/zones/:id', verifyToken, isAdmin, updateShippingZone);
router.delete('/zones/:id', verifyToken, isAdmin, deleteShippingZone);
router.post('/debug-fix-zones', verifyToken, isAdmin, debugFixZones);

module.exports = router; 