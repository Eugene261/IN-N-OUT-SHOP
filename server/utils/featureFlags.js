/**
 * Production-Safe Feature Flag System
 * 
 * This system allows controlled rollout of new features with instant disable capability.
 * Critical for production environments where features need to be toggled without deployment.
 */

class FeatureFlags {
  constructor() {
    this.flags = {
      // Product Approval System
      PRODUCT_APPROVAL_ENABLED: process.env.PRODUCT_APPROVAL_ENABLED === 'true',
      REQUIRE_APPROVAL_FOR_NEW_PRODUCTS: process.env.REQUIRE_APPROVAL_FOR_NEW_PRODUCTS === 'true',
      AUTO_APPROVE_TRUSTED_ADMINS: process.env.AUTO_APPROVE_TRUSTED_ADMINS === 'true',
      
      // Messaging System
      MESSAGING_SYSTEM_ENABLED: process.env.MESSAGING_SYSTEM_ENABLED === 'true',
      ENABLE_AUDIO_MESSAGES: process.env.ENABLE_AUDIO_MESSAGES === 'true',
      ENABLE_VIDEO_MESSAGES: process.env.ENABLE_VIDEO_MESSAGES === 'true',
      
      // General Feature Control
      ENABLE_NEW_FEATURES: process.env.ENABLE_NEW_FEATURES === 'true',
      
      // Performance & Safety Settings
      MAX_MESSAGE_LENGTH: parseInt(process.env.MAX_MESSAGE_LENGTH) || 2000,
      MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB) || 10,
      ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image,video,audio,pdf').split(',')
    };

    // Log current feature flag status (useful for debugging)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🏁 Feature Flags Status:', this.flags);
    }
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagName) {
    return this.flags[flagName] === true;
  }

  /**
   * Get feature flag value (can be boolean, string, number, array)
   */
  getValue(flagName) {
    return this.flags[flagName];
  }

  /**
   * Check if product approval system is enabled
   */
  isProductApprovalEnabled() {
    // Re-enable product approval system - the issue is not product visibility
    // but cart functionality for approved products
    return this.isEnabled('PRODUCT_APPROVAL_ENABLED') && this.isEnabled('ENABLE_NEW_FEATURES');
  }

  /**
   * Check if messaging system is active
   */
  isMessagingEnabled() {
    return this.isEnabled('MESSAGING_SYSTEM_ENABLED') && this.isEnabled('ENABLE_NEW_FEATURES');
  }

  /**
   * Get product default status based on approval settings
   */
  getDefaultProductStatus() {
    if (this.isProductApprovalEnabled()) {
      return 'pending'; // New products need approval
    }
    return 'approved'; // Backward compatibility - products auto-approved
  }

  /**
   * Check if admin should auto-approve products (for trusted admins)
   */
  shouldAutoApprove(adminId) {
    if (!this.isProductApprovalEnabled()) {
      return true; // Auto-approve when system disabled
    }
    
    if (this.isEnabled('AUTO_APPROVE_TRUSTED_ADMINS')) {
      // TODO: Implement trusted admin list logic
      return false; // For now, no auto-approval
    }
    
    return false;
  }

  /**
   * Get messaging constraints
   */
  getMessagingLimits() {
    return {
      maxMessageLength: this.getValue('MAX_MESSAGE_LENGTH'),
      maxFileSizeMB: this.getValue('MAX_FILE_SIZE_MB'),
      allowedFileTypes: this.getValue('ALLOWED_FILE_TYPES'),
      audioEnabled: this.isEnabled('ENABLE_AUDIO_MESSAGES'),
      videoEnabled: this.isEnabled('ENABLE_VIDEO_MESSAGES')
    };
  }

  /**
   * Validate file upload against feature flags
   */
  validateFileUpload(fileType, fileSizeMB) {
    const limits = this.getMessagingLimits();
    
    // Check if messaging is enabled
    if (!this.isMessagingEnabled()) {
      return { valid: false, error: 'Messaging system is disabled' };
    }

    // Check file type
    if (!limits.allowedFileTypes.includes(fileType)) {
      return { valid: false, error: `File type ${fileType} not allowed` };
    }

    // Check specific media types
    if (fileType === 'audio' && !limits.audioEnabled) {
      return { valid: false, error: 'Audio messages are disabled' };
    }

    if (fileType === 'video' && !limits.videoEnabled) {
      return { valid: false, error: 'Video messages are disabled' };
    }

    // Check file size
    if (fileSizeMB > limits.maxFileSizeMB) {
      return { valid: false, error: `File size exceeds ${limits.maxFileSizeMB}MB limit` };
    }

    return { valid: true };
  }

  /**
   * Runtime feature flag update (for emergency disable)
   * WARNING: Use with caution in production
   */
  updateFlag(flagName, value) {
    console.warn(`⚠️ Runtime feature flag update: ${flagName} = ${value}`);
    this.flags[flagName] = value;
    
    // Log the change
    console.log(`🏁 Feature flag updated: ${flagName} = ${value}`);
    
    return this.flags[flagName];
  }

  /**
   * Emergency disable all new features
   */
  emergencyDisableAll() {
    console.error('🚨 EMERGENCY: Disabling all new features');
    
    this.updateFlag('ENABLE_NEW_FEATURES', false);
    this.updateFlag('PRODUCT_APPROVAL_ENABLED', false);
    this.updateFlag('MESSAGING_SYSTEM_ENABLED', false);
    
    return this.flags;
  }

  /**
   * Get current status for health checks
   */
  getHealthStatus() {
    return {
      timestamp: new Date().toISOString(),
      productApproval: {
        enabled: this.isProductApprovalEnabled(),
        defaultStatus: this.getDefaultProductStatus()
      },
      messaging: {
        enabled: this.isMessagingEnabled(),
        limits: this.getMessagingLimits()
      },
      allFlags: { ...this.flags }
    };
  }

  /**
   * Gradual rollout helper - percentage-based feature enabling
   */
  isEnabledForUser(flagName, userId, rolloutPercentage = 100) {
    if (!this.isEnabled(flagName)) {
      return false; // Feature disabled globally
    }

    if (rolloutPercentage >= 100) {
      return true; // Full rollout
    }

    // Hash-based consistent assignment
    const hash = this.hashUserId(userId);
    const userBucket = hash % 100;
    
    return userBucket < rolloutPercentage;
  }

  /**
   * Simple hash function for consistent user assignment
   */
  hashUserId(userId) {
    let hash = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Singleton instance
const featureFlags = new FeatureFlags();

// Middleware for feature flag injection
const injectFeatureFlags = (req, res, next) => {
  req.featureFlags = featureFlags;
  next();
};

// Express middleware for feature-gated routes
const requireFeature = (flagName) => {
  return (req, res, next) => {
    if (!featureFlags.isEnabled(flagName)) {
      return res.status(503).json({
        success: false,
        message: 'Feature temporarily unavailable',
        feature: flagName,
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

// Health check endpoint data
const getFeatureFlagsStatus = (req, res) => {
  res.json({
    success: true,
    data: featureFlags.getHealthStatus()
  });
};

module.exports = {
  featureFlags,
  injectFeatureFlags,
  requireFeature,
  getFeatureFlagsStatus
}; 