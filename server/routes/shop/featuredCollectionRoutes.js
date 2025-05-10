const express = require('express');
const router = express.Router();
const FeaturedCollection = require('../../models/FeaturedCollection');

/**
 * Get all active featured collections for the shop homepage
 * This route is public and doesn't require authentication
 */
router.get('/', async (req, res) => {
  try {
    const collections = await FeaturedCollection.find({ isActive: true })
      .sort({ position: 1 })
      .lean();
    
    res.status(200).json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Error fetching featured collections for shop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured collections'
    });
  }
});

module.exports = router;
