const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, isSuperAdmin } = require('../../controllers/authController.js');
const { 
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  toggleVideoFeatured,
  updateVideoPriorities,
  getVendorsAndAdmins
} = require('../../controllers/superAdmin/videoController.js');

// Configure multer for memory storage with larger limits for videos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept video files and images (for thumbnails)
    if (file.fieldname === 'video') {
      // Video file validation
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for video field'), false);
      }
    } else if (file.fieldname === 'thumbnail') {
      // Thumbnail image validation
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for thumbnail field'), false);
      }
    } else {
      cb(new Error('Unexpected field'), false);
    }
  }
});

// Apply auth middleware and SuperAdmin check to all routes
router.use(authMiddleware);
router.use(isSuperAdmin);

// Video management routes
router.get('/', getAllVideos);
router.get('/vendors-and-admins', getVendorsAndAdmins);
router.get('/:id', getVideoById);
router.post('/', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), createVideo);
router.put('/:id', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), updateVideo);
router.delete('/:id', deleteVideo);
router.put('/:id/featured', toggleVideoFeatured);
router.put('/priorities/update', updateVideoPriorities);

module.exports = router; 