const Video = require('../../models/Video');
const Product = require('../../models/Products');
const User = require('../../models/User');
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
    console.log('=== CREATE VIDEO DEBUG START ===');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    console.log('req.user:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    
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
      console.log('ERROR: Title is missing');
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    console.log('Title validation passed:', title);
    
    // Check files
    if (!req.files) {
      console.log('ERROR: No files in request');
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    if (!req.files.video) {
      console.log('ERROR: No video file in request', Object.keys(req.files));
      return res.status(400).json({
        success: false,
        message: 'Video file is required'
      });
    }
    
    console.log('Files validation passed, video files count:', req.files.video.length);
    
    let videoUrl = '';
    let thumbnailUrl = '';
    let duration = 0;
    let fileSize = 0;
    
    // Handle video upload
    try {
      console.log('Starting video upload...');
      const videoFile = req.files.video[0];
      console.log('Video file info:', {
        originalname: videoFile.originalname,
        mimetype: videoFile.mimetype,
        size: videoFile.size
      });
      
      const base64Video = videoFile.buffer.toString('base64');
      const videoDataURI = `data:${videoFile.mimetype};base64,${base64Video}`;
      
      console.log('Video converted to base64, length:', base64Video.length);
      
      // Upload video to Cloudinary
      console.log('Uploading to Cloudinary...');
      const videoUploadResult = await ImageUploadUtil(videoDataURI);
      console.log('Cloudinary upload result:', {
        secure_url: videoUploadResult.secure_url,
        duration: videoUploadResult.duration,
        resource_type: videoUploadResult.resource_type
      });
      
      videoUrl = videoUploadResult.secure_url;
      duration = videoUploadResult.duration || 0;
      fileSize = videoFile.size;
      
      // Generate thumbnail from video
      thumbnailUrl = videoUploadResult.secure_url.replace(/\.(mp4|mov|avi|mkv)$/, '.jpg');
      console.log('Generated thumbnail URL:', thumbnailUrl);
    } catch (uploadError) {
      console.error('Error uploading video:', uploadError);
      return res.status(400).json({
        success: false,
        message: 'Failed to upload video: ' + uploadError.message
      });
    }
    
    // Handle custom thumbnail upload if provided
    if (req.files && req.files.thumbnail) {
      try {
        console.log('Uploading custom thumbnail...');
        const thumbnailFile = req.files.thumbnail[0];
        const base64Thumbnail = thumbnailFile.buffer.toString('base64');
        const thumbnailDataURI = `data:${thumbnailFile.mimetype};base64,${base64Thumbnail}`;
        
        const thumbnailUploadResult = await ImageUploadUtil(thumbnailDataURI);
        thumbnailUrl = thumbnailUploadResult.secure_url;
        console.log('Custom thumbnail uploaded:', thumbnailUrl);
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
    
    // Validate and process vendorId
    let processedVendorId = null;
    if (vendorId && vendorId.trim() !== '') {
      // Check if it's a valid ObjectId
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(vendorId.trim())) {
        processedVendorId = vendorId.trim();
      } else {
        console.log('Invalid vendorId provided:', vendorId, '- setting to null');
        processedVendorId = null;
      }
    }
    
    console.log('Parsed data:', {
      title,
      category: category || 'showcase',
      parsedTags,
      status: status || 'draft',
      isFeatured: isFeatured === 'true' || isFeatured === true,
      priority: parseInt(priority) || 0,
      processedVendorId,
      uploadedBy: req.user.id
    });
    
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
      vendorId: processedVendorId,
      status: status || 'draft',
      isFeatured: isFeatured === 'true' || isFeatured === true,
      priority: parseInt(priority) || 0,
      taggedProducts: parsedTaggedProducts,
      uploadedBy: req.user.id
    });
    
    console.log('About to save video to database...');
    await newVideo.save();
    console.log('Video saved successfully, ID:', newVideo._id);
    
    // Populate the saved video
    const populatedVideo = await Video.findById(newVideo._id)
      .populate('uploadedBy', 'userName')
      .populate('vendorId', 'userName shopName')
      .populate('taggedProducts.productId', 'title price salePrice image');
    
    console.log('=== CREATE VIDEO DEBUG END ===');
    
    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: populatedVideo
    });
  } catch (error) {
    console.error('=== CREATE VIDEO ERROR ===');
    console.error('Error creating video:', error);
    console.error('Stack trace:', error.stack);
    console.error('=== CREATE VIDEO ERROR END ===');
    res.status(500).json({
      success: false,
      message: 'Failed to create video: ' + error.message
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

/**
 * Get vendors and admins for video assignment dropdown
 */
const getVendorsAndAdmins = async (req, res) => {
  try {
    // Fetch users with admin or vendor roles
    const users = await User.find(
      { 
        role: { $in: ['admin', 'vendor'] },
        isActive: true 
      },
      'userName email shopName role baseRegion baseCity'
    ).sort({ role: 1, userName: 1 }).lean();
    
    // Format users for dropdown
    const formattedUsers = users.map(user => ({
      id: user._id,
      label: `${user.userName} ${user.shopName ? `(${user.shopName})` : ''} - ${user.role}`,
      userName: user.userName,
      shopName: user.shopName,
      role: user.role,
      email: user.email,
      location: user.baseRegion && user.baseCity ? `${user.baseCity}, ${user.baseRegion}` : ''
    }));
    
    res.status(200).json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Error fetching vendors and admins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors and admins'
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
  updateVideoPriorities,
  getVendorsAndAdmins
}; 