const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const addOnlineStatusFields = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to MongoDB');

    // Count users without online status fields
    const usersWithoutOnlineFields = await User.countDocuments({
      $or: [
        { isOnline: { $exists: false } },
        { lastSeen: { $exists: false } },
        { lastHeartbeat: { $exists: false } }
      ]
    });

    console.log(`Found ${usersWithoutOnlineFields} users without online status fields`);

    if (usersWithoutOnlineFields === 0) {
      console.log('✅ All users already have online status fields');
      return;
    }

    // Add online status fields to all users
    const result = await User.updateMany(
      {
        $or: [
          { isOnline: { $exists: false } },
          { lastSeen: { $exists: false } },
          { lastHeartbeat: { $exists: false } }
        ]
      },
      {
        $set: {
          isOnline: false,
          lastSeen: new Date(),
          lastHeartbeat: null
        }
      }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount} users with online status fields`);
    
    // Verify the update
    const updatedCount = await User.countDocuments({
      isOnline: { $exists: true },
      lastSeen: { $exists: true },
      lastHeartbeat: { $exists: true }
    });

    console.log(`✅ Total users with online status fields: ${updatedCount}`);

  } catch (error) {
    console.error('❌ Error adding online status fields:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the migration
if (require.main === module) {
  addOnlineStatusFields();
}

module.exports = addOnlineStatusFields; 