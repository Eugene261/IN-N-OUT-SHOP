// Load environment variables from the server directory
require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const ProductTemplateService = require('../services/productTemplateService');
const User = require('../models/User');

async function initializeProductTemplates() {
  try {
    console.log('🚀 Starting Product Template Initialization...');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    // Check if MongoDB URI is available
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable not found');
      console.log('💡 Looking in different locations...');
      
      // Try alternative paths for .env loading
      const paths = ['../.env', '../../.env', './.env', '../server/.env'];
      
      for (const path of paths) {
        try {
          console.log(`🔍 Trying: ${path}`);
          require('dotenv').config({ path });
          if (process.env.MONGODB_URI) {
            console.log(`✅ Found .env at: ${path}`);
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
      
      if (!process.env.MONGODB_URI) {
        console.log('📝 Make sure your .env file contains:');
        console.log('   MONGODB_URI=mongodb://localhost:27017/your-database');
        console.log('   Or your MongoDB connection string');
        console.log('📁 Current working directory:', process.cwd());
        return;
      }
    }
    
    console.log('🔗 Connecting to MongoDB...');
    console.log('🌐 Database:', process.env.MONGODB_URI.includes('localhost') ? 'Local MongoDB' : 'Remote MongoDB');
    
    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB for template initialization');
    }

    // Find a super admin to use as creator
    let superAdmin = await User.findOne({ role: 'superAdmin' });
    
    if (!superAdmin) {
      console.log('⚠️ No super admin found, looking for any admin...');
      
      // Try to find any admin user
      superAdmin = await User.findOne({ role: 'admin' });
      
      if (!superAdmin) {
        console.log('⚠️ No admin found, creating default system admin...');
        // Create a system admin for template creation
        superAdmin = await User.create({
          userName: 'System Admin',
          email: 'system@template-init.com',
          password: 'temp-password', // This won't be used
          role: 'superAdmin',
          isActive: false // Make it inactive since it's just for template creation
        });
        console.log('✅ Created system admin for template initialization');
      } else {
        console.log('📝 Using existing admin as template creator');
      }
    }

    console.log('👤 Using admin ID:', superAdmin._id);

    // Initialize default templates
    console.log('🏗️ Creating default product templates...');
    const result = await ProductTemplateService.createDefaultTemplates(superAdmin._id);
    
    if (result.success) {
      console.log('✅ Product templates initialized successfully!');
      console.log('📋 Available templates:');
      console.log('   - Electronics & Devices');
      console.log('   - Books & Publications');
      console.log('   - Food & Beverages');
      console.log('   - Digital Products');
      console.log('   - Services');
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Update your product categories to match template categories');
      console.log('2. Use the new /api/admin/products/form-config endpoint');
      console.log('3. Test dynamic form generation with different categories');
      console.log('4. Try adding a device product - it should no longer require sizes!');
      
    } else {
      console.error('❌ Failed to initialize templates:', result.error);
    }

  } catch (error) {
    console.error('💥 Error during template initialization:', error);
    
    if (error.name === 'MongooseError') {
      console.log('💡 This looks like a database connection issue.');
      console.log('   Make sure MongoDB is running and the connection string is correct.');
    }
  } finally {
    console.log('🏁 Template initialization complete');
    // Close database connection when done
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  initializeProductTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeProductTemplates }; 