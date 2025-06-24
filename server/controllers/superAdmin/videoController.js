const Video = require('../../models/Video');
const Product = require('../../models/Products');
const { ImageUploadUtil } = require("../../helpers/cloudinary");

/**
 * Get all videos (SuperAdmin only)
 */
const getAllVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, isFeatured } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    
    const videos = await Video.find(filter)
      .populate('uploadedBy', 'userName')
      .populate('vendorId', 'userName shopName')
      .populate('taggedProducts.productId', 'title price salePrice image')
      .sort({ isFeatured: -1, priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Video.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: videos,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos'
    });
  }
};

/**
 * Get a single video by ID
 */
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findById(id)
      .populate('uploadedBy', 'userName')
      .populate('vendorId', 'userName shopName')
      .populate('taggedProducts.productId', 'title price salePrice image')
      .lean();
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video'
    });
  }
};

/**
 * Create a new video
 */
const createVideo = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      tags, 
      vendorId, 
      status, 
      isFeatured, 
      priority,
      taggedProducts 
    } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required'
      });
    }
    
    let videoUrl = '';
    let thumbnailUrl = '';
    let duration = 0;
    let fileSize = 0;
    
    // Handle video upload
    try {
      const videoFile = req.files.video[0];
      const base64Video = videoFile.buffer.toString('base64');
      const videoDataURI = `data:${videoFile.mimetype};base64,${base64Video}`;
      
      // Upload video to Cloudinary
      const videoUploadResult = await ImageUploadUtil(videoDataURI);
      videoUrl = videoUploadResult.secure_url;
      duration = videoUploadResult.duration || 0;
      fileSize = videoFile.size;
      
      // Generate thumbnail from video
      thumbnailUrl = videoUploadResult.secure_url.replace(/\.(mp4|mov|avi|mkv)$/, '.jpg');
    } catch (uploadError) {
      console.error('Error uploading video:', uploadError);
      return res.status(400).json({
        success: false,
        message: 'Failed to upload video'
      });
    }
    
    // Handle custom thumbnail upload if provided
    if (req.files && req.files.thumbnail) {
      try {
        const thumbnailFile = req.files.thumbnail[0];
        const base64Thumbnail = thumbnailFile.buffer.toString('base64');
        const thumbnailDataURI = `data:${thumbnailFile.mimetype};base64,${base64Thumbnail}`;
        
        const thumbnailUploadResult = await ImageUploadUtil(thumbnailDataURI);
        thumbnailUrl = thumbnailUploadResult.secure_url;
      } catch (thumbnailError) {
        console.error('Error uploading thumbnail:', thumbnailError);
        // Continue with auto-generated thumbnail
      }
    }
    
    // Parse tagged products if provided
    let parsedTaggedProducts = [];
    if (taggedProducts) {
      try {
        parsedTaggedProducts = typeof taggedProducts === 'string' 
          ? JSON.parse(taggedProducts) 
          : taggedProducts;
      } catch (parseError) {
        console.error('Error parsing tagged products:', parseError);
      }
    }
    
    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' 
          ? (tags.includes(',') ? tags.split(',').map(tag => tag.trim()) : JSON.parse(tags))
          : tags;
      } catch (parseError) {
        parsedTags = typeof tags === 'string' ? [tags] : [];
      }
    }
    
    // Create new video
    const newVideo = new Video({
      title,
      description: description || '',
      videoUrl,
      thumbnailUrl,
      duration,
      fileSize,
      category: category || 'showcase',
      tags: parsedTags,
      vendorId: vendorId || null,
      status: status || 'draft',
      isFeatured: isFeatured === 'true' || isFeatured === true,
      priority: parseInt(priority) || 0,
      taggedProducts: parsedTaggedProducts,
      uploadedBy: req.user.id
    });
    
    await newVideo.save();
    
    // Populate the saved video
    const populatedVideo = await Video.findById(newVideo._id)
      .populate('uploadedBy', 'userName')
      .populate('vendorId', 'userName shopName')
      .populate('taggedProducts.productId', 'title price salePrice image');
    
    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: populatedVideo
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video'
    });
  }
};

/**
 * Update a video
 */
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      category, 
      tags, 
      vendorId, 
      status, 
      isFeatured, 
      priority,
      taggedProducts 
    } = req.body;
    
    // Find the video to update
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    // Update fields
    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (category) video.category = category;
    if (vendorId !== undefined) video.vendorId = vendorId || null;
    if (status) video.status = status;
    if (isFeatured !== undefined) video.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (priority !== undefined) video.priority = parseInt(priority) || 0;
    
    // Parse and update tags
    if (tags !== undefined) {
      try {
        video.tags = typeof tags === 'string' 
          ? (tags.includes(',') ? tags.split(',').map(tag => tag.trim()) : JSON.parse(tags))
          : tags || [];
      } catch (parseError) {
        video.tags = typeof tags === 'string' ? [tags] : [];
      }
    }
    
    // Parse and update tagged products
    if (taggedProducts !== undefined) {
      try {
        video.taggedProducts = typeof taggedProducts === 'string' 
          ? JSON.parse(taggedProducts) 
          : taggedProducts || [];
      } catch (parseError) {
        video.taggedProducts = [];
      }
    }
    
    // Handle new video upload if provided
    if (req.files && req.files.video) {
      try {
        const videoFile = req.files.video[0];
        const base64Video = videoFile.buffer.toString('base64');
        const videoDataURI = `data:${videoFile.mimetype};base64,${base64Video}`;
        
        const videoUploadResult = await ImageUploadUtil(videoDataURI);
        video.videoUrl = videoUploadResult.secure_url;
        video.duration = videoUploadResult.duration || 0;
        video.fileSize = videoFile.size;
        
        // Update thumbnail with new video
        video.thumbnailUrl = videoUploadResult.secure_url.replace(/\.(mp4|mov|avi|mkv)$/, '.jpg');
      } catch (uploadError) {
        console.error('Error uploading new video:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload new video'
        });
      }
    }
    
    // Handle new thumbnail upload if provided
    if (req.files && req.files.thumbnail) {
      try {
        const thumbnailFile = req.files.thumbnail[0];
        const base64Thumbnail = thumbnailFile.buffer.toString('base64');
        const thumbnailDataURI = `data:${thumbnailFile.mimetype};base64,${base64Thumbnail}`;
        
        const thumbnailUploadResult = await ImageUploadUtil(thumbnailDataURI);
        video.thumbnailUrl = thumbnailUploadResult.secure_url;
      } catch (thumbnailError) {
        console.error('Error uploading new thumbnail:', thumbnailError);
      }
    }
    
    video.updatedAt = Date.now();
    await video.save();
    
    // Populate the updated video
    const populatedVideo = await Video.findById(video._id)
      .populate('uploadedBy', 'userName')
      .populate('vendorId', 'userName shopName')
      .populate('taggedProducts.productId', 'title price salePrice image');
    
    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      data: populatedVideo
    });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video'
    });
  }
};

/**
 * Delete a video
 */
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Video.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video'
    });
  }
};

/**
 * Toggle video featured status
 */
const toggleVideoFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    video.isFeatured = !video.isFeatured;
    video.updatedAt = Date.now();
    
    await video.save();
    
    res.status(200).json({
      success: true,
      message: `Video ${video.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: { isFeatured: video.isFeatured }
    });
  } catch (error) {
    console.error('Error toggling video featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video featured status'
    });
  }
};

/**
 * Update video priorities (bulk reordering)
 */
const updateVideoPriorities = async (req, res) => {
  try {
    const { priorities } = req.body;
    
    if (!priorities || !Array.isArray(priorities)) {
      return res.status(400).json({
        success: false,
        message: 'Priorities array is required'
      });
    }
    
    // Update priorities in a transaction
    const updatePromises = priorities.map(item => {
      return Video.findByIdAndUpdate(
        item.id,
        { priority: item.priority, updatedAt: Date.now() },
        { new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: 'Video priorities updated successfully'
    });
  } catch (error) {
    console.error('Error updating video priorities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video priorities'
    });
  }
};

module.exports = {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  toggleVideoFeatured,
  updateVideoPriorities
}; 