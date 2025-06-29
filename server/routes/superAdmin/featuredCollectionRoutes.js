const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, isSuperAdmin } = require('../../controllers/authController.js');
const { 
  getAllFeaturedCollections,
  getFeaturedCollectionById,
  createFeaturedCollection,
  updateFeaturedCollection,
  deleteFeaturedCollection,
  uploadFeaturedCollectionImage,
  updateFeaturedCollectionPositions
} = require('../../controllers/superAdmin/featuredCollectionController.js');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit - INCREASED FROM 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Apply auth middleware and SuperAdmin check to all routes
router.use(authMiddleware);
router.use(isSuperAdmin);

// Featured collection routes
router.get('/', getAllFeaturedCollections);
router.get('/:id', getFeaturedCollectionById);
router.post('/', upload.single('image'), createFeaturedCollection);
router.put('/:id', upload.single('image'), updateFeaturedCollection);
router.delete('/:id', deleteFeaturedCollection);
router.post('/upload', upload.single('image'), uploadFeaturedCollectionImage);
router.put('/positions/update', updateFeaturedCollectionPositions);

module.exports = router;
