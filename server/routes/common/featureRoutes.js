const express = require('express');
const { addFeatureImage, addFeatureMedia, getFeatureImages, deleteFeatureImage, updateFeaturePositions } = require('./featureController');
const { upload } = require('../../helpers/cloudinary'); // Import the multer middleware

const router = express.Router();

// Use the multer middleware for file uploads (supports both images and videos)
router.post('/add', upload.single('my_file'), addFeatureMedia);

// Keep old route for backwards compatibility
router.post('/add-image', upload.single('my_file'), addFeatureImage);

router.get('/get', getFeatureImages);
router.delete('/delete/:id', deleteFeatureImage);

// New route for updating positions
router.put('/positions', updateFeaturePositions);

module.exports = router;