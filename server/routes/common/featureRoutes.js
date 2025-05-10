const express = require('express');
const { addFeatureImage, getFeatureImages, deleteFeatureImage } = require('./featureController');
const { upload } = require('../../helpers/cloudinary'); // Import the multer middleware

const router = express.Router();

// Use the multer middleware for file uploads
router.post('/add', upload.single('my_file'), addFeatureImage);
router.get('/get', getFeatureImages);
router.delete('/delete/:id', deleteFeatureImage);

module.exports = router;