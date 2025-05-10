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
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
