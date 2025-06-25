const mongoose = require('mongoose');
const Feature = require('../models/feature');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.CLOUDINARY_DB_URI || process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB Connected for migration');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// Migration function
const migrateFeatureMedia = async () => {
  try {
    console.log('Starting feature media migration...');
    
    // Ensure database connection when called from API
    await connectDB();
    
    // Find all features that have an image but no mediaUrl
    const features = await Feature.find({
      image: { $exists: true, $ne: null },
      mediaUrl: { $exists: false }
    });
    
    console.log(`Found ${features.length} features to migrate`);
    
    if (features.length === 0) {
      console.log('No features need migration');
      return {
        success: true,
        message: 'No features need migration',
        migratedCount: 0
      };
    }
    
    // Update each feature
    const updatePromises = features.map(async (feature) => {
      return Feature.findByIdAndUpdate(
        feature._id,
        {
          $set: {
            mediaUrl: feature.image,
            mediaType: 'image',
            title: feature.title || '',
            description: feature.description || '',
            isActive: feature.isActive !== undefined ? feature.isActive : true,
            position: feature.position || 0
          }
        },
        { new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Successfully migrated ${features.length} features`);
    
    // Verify migration
    const migratedCount = await Feature.countDocuments({
      mediaUrl: { $exists: true }
    });
    
    console.log(`Total features with mediaUrl: ${migratedCount}`);
    
    return {
      success: true,
      message: `Successfully migrated ${features.length} features`,
      migratedCount: features.length,
      totalFeaturesWithMediaUrl: migratedCount
    };
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Main execution (when run directly)
const runMigration = async () => {
  try {
    await connectDB();
    const result = await migrateFeatureMedia();
    console.log('Migration completed successfully:', result);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateFeatureMedia }; 