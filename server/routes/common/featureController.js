const Feature = require('../../models/feature');
const { ImageUploadUtil } = require('../../helpers/cloudinary'); // Import your Cloudinary utility

const addFeatureImage = async(req, res) => {
    try {
        // If using Cloudinary directly with base64 string
        if (req.body.image && typeof req.body.image === 'string') {
            // Upload the image to Cloudinary
            const cloudinaryResult = await ImageUploadUtil(req.body.image);
            
            // Create new feature image with Cloudinary URL
            const featureImage = new Feature({
                image: cloudinaryResult.secure_url // Use the URL returned from Cloudinary
            });
            
            await featureImage.save();
            
            return res.status(201).json({
                success: true,
                data: featureImage
            });
        } 
        // If using multer for file upload (req.file)
        else if (req.file) {
            // Convert buffer to base64 string for Cloudinary
            const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            const cloudinaryResult = await ImageUploadUtil(fileStr);
            
            const featureImage = new Feature({
                image: cloudinaryResult.secure_url
            });
            
            await featureImage.save();
            
            return res.status(201).json({
                success: true,
                data: featureImage
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'No image provided'
            });
        }
    } catch (error) {
        console.error('Error adding feature image:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while uploading feature image'
        });
    }
}

const getFeatureImages = async(req, res) => {
    try {
        const images = await Feature.find({});

        res.status(200).json({
            success: true,
            data: images
        });
    } catch (error) {
        console.error('Error getting feature images:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching feature images'
        });
    }
};

const deleteFeatureImage = async(req, res) => {
    try {
        const { id } = req.params;
        
        // Check if the image exists
        const image = await Feature.findById(id);
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Feature image not found'
            });
        }
        
        // Delete from database
        await Feature.findByIdAndDelete(id);
        
        // Note: You might want to also delete from Cloudinary
        // This would require saving the Cloudinary public_id in your model
        // And then using cloudinary.uploader.destroy(public_id)
        
        res.status(200).json({
            success: true,
            message: 'Feature image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting feature image:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the feature image'
        });
    }
}


module.exports = {
    addFeatureImage,
    getFeatureImages,
    deleteFeatureImage
};