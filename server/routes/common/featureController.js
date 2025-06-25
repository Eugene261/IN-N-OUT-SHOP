const Feature = require('../../models/feature');
const { ImageUploadUtil } = require('../../helpers/cloudinary'); // Import your Cloudinary utility

const addFeatureMedia = async(req, res) => {
    try {
        const { mediaType = 'image', title = '', description = '' } = req.body;

        // Validate mediaType
        if (!['image', 'video'].includes(mediaType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid media type. Must be either "image" or "video"'
            });
        }

        let mediaUrl = '';

        // If using Cloudinary directly with base64 string
        if (req.body.image && typeof req.body.image === 'string') {
            // Upload the media to Cloudinary
            const cloudinaryResult = await ImageUploadUtil(req.body.image);
            mediaUrl = cloudinaryResult.secure_url;
        } 
        // If using multer for file upload (req.file)
        else if (req.file) {
            // Convert buffer to base64 string for Cloudinary
            const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            const cloudinaryResult = await ImageUploadUtil(fileStr);
            mediaUrl = cloudinaryResult.secure_url;
        } else {
            return res.status(400).json({
                success: false,
                message: 'No media file provided'
            });
        }

        // Create new feature media
        const featureMedia = new Feature({
            mediaType,
            mediaUrl,
            image: mediaUrl, // For backwards compatibility
            title,
            description,
            isActive: true,
            position: 0 // Will be updated if needed
        });
        
        await featureMedia.save();
        
        return res.status(201).json({
            success: true,
            data: featureMedia
        });

    } catch (error) {
        console.error('Error adding feature media:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while uploading feature media'
        });
    }
}

const getFeatureImages = async(req, res) => {
    try {
        const features = await Feature.find({ isActive: { $ne: false } }).sort({ position: 1, createdAt: 1 });

        // Migrate old data structure if needed
        const migratedFeatures = features.map(feature => {
            if (!feature.mediaUrl && feature.image) {
                feature.mediaUrl = feature.image;
                feature.mediaType = 'image';
            }
            return feature;
        });

        res.status(200).json({
            success: true,
            data: migratedFeatures
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
        
        // Check if the feature exists
        const feature = await Feature.findById(id);
        if (!feature) {
            return res.status(404).json({
                success: false,
                message: 'Feature media not found'
            });
        }
        
        // Delete from database
        await Feature.findByIdAndDelete(id);
        
        // Note: You might want to also delete from Cloudinary
        // This would require saving the Cloudinary public_id in your model
        // And then using cloudinary.uploader.destroy(public_id)
        
        res.status(200).json({
            success: true,
            message: 'Feature media deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting feature media:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the feature media'
        });
    }
}

// Update feature media positions
const updateFeaturePositions = async(req, res) => {
    try {
        const { positions } = req.body; // Array of { id, position }
        
        if (!Array.isArray(positions)) {
            return res.status(400).json({
                success: false,
                message: 'Positions must be an array'
            });
        }

        // Update positions in bulk
        const updatePromises = positions.map(({ id, position }) => 
            Feature.findByIdAndUpdate(id, { position }, { new: true })
        );

        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: 'Positions updated successfully'
        });
    } catch (error) {
        console.error('Error updating positions:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating positions'
        });
    }
}

module.exports = {
    addFeatureImage: addFeatureMedia, // Keep old name for backwards compatibility
    addFeatureMedia,
    getFeatureImages,
    deleteFeatureImage,
    updateFeaturePositions
};