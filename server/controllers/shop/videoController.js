const Video = require('../../models/Video');

/**
 * Get featured videos for homepage
 */
const getFeaturedVideos = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const videos = await Video.getFeatured(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('Error fetching featured videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured videos'
    });
  }
};

/**
 * Get all published videos with pagination
 */
const getPublishedVideos = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, tags } = req.query;
    
    // Build filter for published videos
    const filter = {
      status: 'published',
      publishDate: { $lte: new Date() }
    };
    
    if (category) filter.category = category;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }
    
    const videos = await Video.find(filter)
      .populate('uploadedBy', 'userName')
      .populate('vendorId', 'userName shopName')
      .populate('taggedProducts.productId', 'title price salePrice image')
      .sort({ isFeatured: -1, priority: -1, publishDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Video.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: videos,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching published videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos'
    });
  }
};

/**
 * Get a single video by ID (public view)
 */
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findOne({
      _id: id,
      status: 'published',
      publishDate: { $lte: new Date() }
    })
    .populate('uploadedBy', 'userName')
    .populate('vendorId', 'userName shopName')
    .populate('taggedProducts.productId', 'title price salePrice image');
    
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
 * Like or unlike a video
 */
const toggleVideoLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { guestId } = req.body;
    
    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: 'User ID or Guest ID is required'
      });
    }
    
    const video = await Video.findOne({
      _id: id,
      status: 'published'
    });
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    // Check if user already liked the video
    const existingLikeIndex = video.likes.findIndex(like => {
      if (userId) {
        return like.userId && like.userId.toString() === userId.toString();
      }
      return like.guestId === guestId;
    });
    
    let isLiked = false;
    
    if (existingLikeIndex > -1) {
      // Unlike: Remove the like
      video.likes.splice(existingLikeIndex, 1);
      isLiked = false;
    } else {
      // Like: Add the like
      video.likes.push({
        userId: userId || null,
        guestId: guestId || null,
        timestamp: new Date()
      });
      isLiked = true;
    }
    
    await video.save();
    
    res.status(200).json({
      success: true,
      message: isLiked ? 'Video liked' : 'Video unliked',
      data: {
        isLiked,
        likeCount: video.likes.length
      }
    });
  } catch (error) {
    console.error('Error toggling video like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update like status'
    });
  }
};

/**
 * Add a comment to a video
 */
const addVideoComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?.id;
    const { guestId } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }
    
    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        message: 'User ID or Guest ID is required'
      });
    }
    
    const video = await Video.findOne({
      _id: id,
      status: 'published'
    });
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    const newComment = {
      userId: userId || null,
      guestId: guestId || null,
      text: text.trim(),
      timestamp: new Date(),
      isApproved: true // Auto-approve for now, can add moderation later
    };
    
    video.comments.push(newComment);
    await video.save();
    
    // Get the comment with populated user data
    const populatedVideo = await Video.findById(video._id)
      .populate('comments.userId', 'userName')
      .lean();
    
    const addedComment = populatedVideo.comments[populatedVideo.comments.length - 1];
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: addedComment
    });
  } catch (error) {
    console.error('Error adding video comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
};

/**
 * Get comments for a video
 */
const getVideoComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const video = await Video.findOne({
      _id: id,
      status: 'published'
    })
    .populate('comments.userId', 'userName')
    .lean();
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    // Filter approved comments and sort by timestamp
    const approvedComments = video.comments
      .filter(comment => comment.isApproved)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Implement pagination
    const startIndex = (page - 1) * limit;
    const paginatedComments = approvedComments.slice(startIndex, startIndex + parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: paginatedComments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(approvedComments.length / limit),
        total: approvedComments.length
      }
    });
  } catch (error) {
    console.error('Error fetching video comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
};

/**
 * Track video view
 */
const trackVideoView = async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findOneAndUpdate(
      { 
        _id: id, 
        status: 'published' 
      },
      { 
        $inc: { views: 1 },
        $set: { updatedAt: Date.now() }
      },
      { new: true }
    );
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'View tracked successfully',
      data: { views: video.views }
    });
  } catch (error) {
    console.error('Error tracking video view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view'
    });
  }
};

/**
 * Get products tagged in a video
 */
const getVideoProducts = async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findOne({
      _id: id,
      status: 'published'
    })
    .populate('taggedProducts.productId', 'title price salePrice image description category brand')
    .lean();
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    const products = video.taggedProducts
      .filter(item => item.productId) // Filter out null/deleted products
      .map(item => ({
        ...item.productId,
        videoTimestamp: item.timestamp,
        clickPosition: item.position
      }));
    
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching video products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video products'
    });
  }
};

module.exports = {
  getFeaturedVideos,
  getPublishedVideos,
  getVideoById,
  toggleVideoLike,
  addVideoComment,
  getVideoComments,
  trackVideoView,
  getVideoProducts
}; 