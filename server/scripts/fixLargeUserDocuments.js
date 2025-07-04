const mongoose = require('mongoose');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dq80s3m4e',
  api_key: process.env.CLOUDINARY_API_KEY || '993987412169513',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'o2DDXYmE8eUDN1L4qWFv1eSQE9s'
});

async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-ecommerce';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function calculateDocumentSize(doc) {
  return Buffer.byteLength(JSON.stringify(doc), 'utf8');
}

function isBase64Image(str) {
  if (!str || typeof str !== 'string') return false;
  
  // Check if it's a data URL with base64 image
  const base64ImagePattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
  return base64ImagePattern.test(str);
}

async function uploadBase64ToCloudinary(base64Data, userId) {
  try {
    console.log(`📤 Uploading avatar for user ${userId} to Cloudinary...`);
    
    const uploadResult = await cloudinary.uploader.upload(base64Data, {
      folder: 'user-avatars',
      public_id: `avatar-${userId}`,
      overwrite: true,
      transformation: [
        { width: 200, height: 200, crop: 'fill', quality: 'auto' },
        { format: 'jpg' }
      ]
    });
    
    console.log(`✅ Avatar uploaded successfully for user ${userId}: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;
  } catch (error) {
    console.error(`❌ Failed to upload avatar for user ${userId}:`, error.message);
    return null;
  }
}

async function analyzeUserDocuments() {
  console.log('\n🔍 Analyzing User documents for size issues...\n');
  
  try {
    const users = await User.find({}).lean();
    console.log(`Found ${users.length} users in database`);
    
    let largeDocuments = [];
    let base64Avatars = [];
    let longUserAgents = [];
    let totalSizeReduction = 0;
    
    for (const user of users) {
      const docSize = calculateDocumentSize(user);
      
      // Check for documents over 100KB (potential issues)
      if (docSize > 100 * 1024) {
        largeDocuments.push({
          id: user._id,
          userName: user.userName,
          email: user.email,
          size: docSize,
          formattedSize: formatBytes(docSize)
        });
      }
      
      // Check for base64 avatars
      if (isBase64Image(user.avatar)) {
        const avatarSize = Buffer.byteLength(user.avatar, 'utf8');
        base64Avatars.push({
          id: user._id,
          userName: user.userName,
          email: user.email,
          avatarSize: avatarSize,
          formattedAvatarSize: formatBytes(avatarSize),
          totalDocSize: docSize,
          formattedTotalSize: formatBytes(docSize)
        });
        totalSizeReduction += avatarSize;
      }
      
      // Check for long user agents
      if (user.lastUserAgent && user.lastUserAgent.length > 1000) {
        const userAgentSize = Buffer.byteLength(user.lastUserAgent, 'utf8');
        longUserAgents.push({
          id: user._id,
          userName: user.userName,
          email: user.email,
          userAgentSize: userAgentSize,
          formattedUserAgentSize: formatBytes(userAgentSize),
          userAgentLength: user.lastUserAgent.length
        });
      }
    }
    
    // Report findings
    console.log('\n📊 ANALYSIS RESULTS:');
    console.log('==================');
    console.log(`📈 Large documents (>100KB): ${largeDocuments.length}`);
    console.log(`🖼️  Base64 avatars found: ${base64Avatars.length}`);
    console.log(`🕷️  Long user agents (>1000 chars): ${longUserAgents.length}`);
    console.log(`💾 Potential size reduction: ${formatBytes(totalSizeReduction)}`);
    
    if (largeDocuments.length > 0) {
      console.log('\n⚠️  LARGE DOCUMENTS (>100KB):');
      largeDocuments
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .forEach(doc => {
          console.log(`   - ${doc.userName} (${doc.email}): ${doc.formattedSize}`);
        });
    }
    
    if (base64Avatars.length > 0) {
      console.log('\n🖼️  BASE64 AVATARS DETECTED:');
      base64Avatars
        .sort((a, b) => b.avatarSize - a.avatarSize)
        .slice(0, 10)
        .forEach(user => {
          console.log(`   - ${user.userName} (${user.email}): Avatar ${user.formattedAvatarSize}, Total ${user.formattedTotalSize}`);
        });
    }
    
    if (longUserAgents.length > 0) {
      console.log('\n🕷️  LONG USER AGENTS (>1000 chars):');
      longUserAgents
        .sort((a, b) => b.userAgentSize - a.userAgentSize)
        .slice(0, 5)
        .forEach(user => {
          console.log(`   - ${user.userName} (${user.email}): ${user.formattedUserAgentSize} (${user.userAgentLength} chars)`);
        });
    }
    
    return { largeDocuments, base64Avatars, longUserAgents };
  } catch (error) {
    console.error('❌ Error analyzing documents:', error);
    throw error;
  }
}

async function fixBase64Avatars(dryRun = true) {
  console.log('\n🔧 Fixing Base64 Avatars...\n');
  
  try {
    const usersWithBase64Avatars = await User.find({
      avatar: { $regex: /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i }
    }).select('_id userName email avatar').lean();
    
    console.log(`Found ${usersWithBase64Avatars.length} users with base64 avatars`);
    
    if (usersWithBase64Avatars.length === 0) {
      console.log('✅ No base64 avatars found to fix');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    let totalSizeSaved = 0;
    
    for (const user of usersWithBase64Avatars) {
      try {
        const originalSize = Buffer.byteLength(user.avatar, 'utf8');
        console.log(`\n🔄 Processing ${user.userName} (${user.email}): ${formatBytes(originalSize)}`);
        
        if (dryRun) {
          console.log(`   📋 DRY RUN: Would upload base64 avatar to Cloudinary`);
          totalSizeSaved += originalSize;
          successCount++;
        } else {
          const cloudinaryUrl = await uploadBase64ToCloudinary(user.avatar, user._id);
          
          if (cloudinaryUrl) {
            await User.findByIdAndUpdate(user._id, {
              avatar: cloudinaryUrl
            });
            
            const newSize = Buffer.byteLength(cloudinaryUrl, 'utf8');
            const sizeSaved = originalSize - newSize;
            totalSizeSaved += sizeSaved;
            
            console.log(`   ✅ Converted successfully: Saved ${formatBytes(sizeSaved)}`);
            console.log(`   🔗 New avatar URL: ${cloudinaryUrl}`);
            successCount++;
          } else {
            console.log(`   ❌ Failed to upload to Cloudinary`);
            errorCount++;
          }
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${user.userName}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 BASE64 AVATAR CONVERSION RESULTS:');
    console.log('===================================');
    console.log(`✅ Successful conversions: ${successCount}`);
    console.log(`❌ Failed conversions: ${errorCount}`);
    console.log(`💾 Total size saved: ${formatBytes(totalSizeSaved)}`);
    
    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made');
      console.log('💡 Run with --fix flag to apply changes');
    }
    
  } catch (error) {
    console.error('❌ Error fixing base64 avatars:', error);
    throw error;
  }
}

async function cleanupLargeFields(dryRun = true) {
  console.log('\n🧹 Cleaning up large fields...\n');
  
  try {
    // Find users with long user agents
    const usersWithLongUserAgents = await User.find({
      lastUserAgent: { $exists: true },
      $expr: { $gt: [{ $strLenCP: "$lastUserAgent" }, 1000] }
    }).select('_id userName email lastUserAgent').lean();
    
    console.log(`Found ${usersWithLongUserAgents.length} users with long user agents (>1000 chars)`);
    
    let cleanedFields = 0;
    let sizeSaved = 0;
    
    for (const user of usersWithLongUserAgents) {
      const originalSize = Buffer.byteLength(user.lastUserAgent, 'utf8');
      console.log(`\n🔄 ${user.userName} (${user.email}): UserAgent ${formatBytes(originalSize)} (${user.lastUserAgent.length} chars)`);
      
      if (dryRun) {
        console.log('   📋 DRY RUN: Would remove lastUserAgent field');
        sizeSaved += originalSize;
        cleanedFields++;
      } else {
        await User.findByIdAndUpdate(user._id, {
          $unset: { lastUserAgent: 1 }
        });
        
        console.log(`   ✅ Removed lastUserAgent field: Saved ${formatBytes(originalSize)}`);
        sizeSaved += originalSize;
        cleanedFields++;
      }
    }
    
    console.log('\n📊 FIELD CLEANUP RESULTS:');
    console.log('========================');
    console.log(`🧹 Fields cleaned: ${cleanedFields}`);
    console.log(`💾 Size saved: ${formatBytes(sizeSaved)}`);
    
    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up large fields:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--fix');
  const analyze = args.includes('--analyze') || args.length === 0;
  const fixAvatars = args.includes('--fix-avatars') || args.includes('--fix');
  const cleanup = args.includes('--cleanup') || args.includes('--fix');
  
  console.log('🚀 Large User Documents Fixer');
  console.log('============================');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
    console.log('💡 Use --fix flag to apply changes');
  }
  
  await connectDB();
  
  try {
    if (analyze) {
      await analyzeUserDocuments();
    }
    
    if (fixAvatars) {
      await fixBase64Avatars(dryRun);
    }
    
    if (cleanup) {
      await cleanupLargeFields(dryRun);
    }
    
    if (!analyze && !fixAvatars && !cleanup) {
      console.log('\n📋 Usage:');
      console.log('   node fixLargeUserDocuments.js --analyze    # Analyze document sizes');
      console.log('   node fixLargeUserDocuments.js --fix-avatars # Fix base64 avatars (dry run)');
      console.log('   node fixLargeUserDocuments.js --cleanup     # Clean up large fields (dry run)');
      console.log('   node fixLargeUserDocuments.js --fix         # Apply all fixes');
    }
    
  } catch (error) {
    console.error('❌ Error during execution:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Script interrupted');
  await disconnectDB();
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = {
  analyzeUserDocuments,
  fixBase64Avatars,
  cleanupLargeFields
}; 