const express = require('express');
const router = express.Router();
const multer = require('multer');
const {    getShopProfile,    updateShopProfile,    uploadShopLogo,    uploadShopBanner,    getAllShops,    getShopDetails,    getShopCategories} = require('../../controllers/admin/shopController');
const { authMiddleware } = require('../../Middleware/auth');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Admin Shop Management Routes (Protected)
router.get('/profile', authMiddleware, getShopProfile);
router.put('/profile', authMiddleware, updateShopProfile);
router.post('/upload-logo', authMiddleware, upload.single('logo'), uploadShopLogo);
router.post('/upload-banner', authMiddleware, upload.single('banner'), uploadShopBanner);

// Public Shop Browsing Routes
router.get('/all', getAllShops);
router.get('/categories', getShopCategories);
router.get('/:shopId', getShopDetails);

module.exports = router; 