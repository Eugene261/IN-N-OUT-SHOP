const FeaturedCollection = require('../../models/FeaturedCollection');
const { ImageUploadUtil } = require("../../helpers/cloudinary");

/**
 * Get all featured collections
 */
const getAllFeaturedCollections = async (req, res) => {
  try {
    const collections = await FeaturedCollection.find({})
      .sort({ position: 1 })
      .lean();
    
    res.status(200).json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Error fetching featured collections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured collections'
    });
  }
};

/**
 * Get a single featured collection by ID
 */
const getFeaturedCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = await FeaturedCollection.findById(id).lean();
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Featured collection not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error fetching featured collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured collection'
    });
  }
};

/**
 * Create a new featured collection
 */
const createFeaturedCollection = async (req, res) => {
  try {
    const { title, description, linkTo, position, isActive } = req.body;
    let imageUrl = req.body.imageUrl || ''; // Get image URL if provided directly
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    // Handle image upload if file is provided
    if (req.file) {
      try {
        // Convert buffer to base64 for Cloudinary
        const base64Image = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
        
        // Upload to Cloudinary
        const uploadResult = await ImageUploadUtil(dataURI);
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }
    
    // Check if we have an image URL after potential upload
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }
    
    // Create new featured collection
    const newCollection = new FeaturedCollection({
      title,
      description,
      image: imageUrl,
      linkTo: linkTo || '/shop',
      position: position || 0,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await newCollection.save();
    
    res.status(201).json({
      success: true,
      message: 'Featured collection created successfully',
      data: newCollection
    });
  } catch (error) {
    console.error('Error creating featured collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create featured collection'
    });
  }
};

/**
 * Update a featured collection
 */
const updateFeaturedCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, linkTo, position, isActive } = req.body;
    
    // Find the collection to update
    const collection = await FeaturedCollection.findById(id);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Featured collection not found'
      });
    }
    
    // Handle image upload if file is provided
    let imageToUse = null;
    if (req.file) {
      try {
        // Convert buffer to base64 for Cloudinary
        const base64Image = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
        
        // Upload to Cloudinary
        const uploadResult = await ImageUploadUtil(dataURI);
        imageToUse = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    } else if (imageUrl) {
      // If imageUrl is provided in the body, use it
      imageToUse = imageUrl;
    }
    
    // Update fields
    if (title) collection.title = title;
    if (description !== undefined) collection.description = description;
    if (imageToUse) collection.image = imageToUse;
    if (linkTo) collection.linkTo = linkTo;
    if (position !== undefined) collection.position = position;
    if (isActive !== undefined) collection.isActive = isActive;
    
    collection.updatedAt = Date.now();
    
    await collection.save();
    
    res.status(200).json({
      success: true,
      message: 'Featured collection updated successfully',
      data: collection
    });
  } catch (error) {
    console.error('Error updating featured collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update featured collection'
    });
  }
};

/**
 * Delete a featured collection
 */
const deleteFeaturedCollection = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await FeaturedCollection.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Featured collection not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Featured collection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting featured collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete featured collection'
    });
  }
};

/**
 * Upload an image for a featured collection
 */
const uploadFeaturedCollectionImage = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create proper base64 string
    const b64 = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await ImageUploadUtil(dataURI);

    // Return success response
    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error occurred during image upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update the position of featured collections (reordering)
 */
const updateFeaturedCollectionPositions = async (req, res) => {
  try {
    const { positions } = req.body;
    
    if (!positions || !Array.isArray(positions)) {
      return res.status(400).json({
        success: false,
        message: 'Positions array is required'
      });
    }
    
    // Update positions in a transaction
    const updatePromises = positions.map(item => {
      return FeaturedCollection.findByIdAndUpdate(
        item.id,
        { position: item.position },
        { new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: 'Featured collection positions updated successfully'
    });
  } catch (error) {
    console.error('Error updating featured collection positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update featured collection positions'
    });
  }
};

module.exports = {
  getAllFeaturedCollections,
  getFeaturedCollectionById,
  createFeaturedCollection,
  updateFeaturedCollection,
  deleteFeaturedCollection,
  uploadFeaturedCollectionImage,
  updateFeaturedCollectionPositions
};
