const express = require('express');
const { migrateFeatureMedia } = require('../../scripts/migrateFeatureMedia');
const { authMiddleware, isSuperAdmin } = require('../../controllers/authController');

const router = express.Router();

// Temporary migration endpoint - REMOVE AFTER MIGRATION
router.post('/migrate-feature-media', authMiddleware, isSuperAdmin, async (req, res) => {
  try {
    console.log('Migration started by super admin:', req.user.id);
    
    await migrateFeatureMedia();
    
    res.status(200).json({
      success: true,
      message: 'Feature media migration completed successfully'
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

module.exports = router; 