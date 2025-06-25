require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Products');

async function addProductApprovalFields() {
  try {
    console.log('🔄 Starting Product Approval Fields Migration...');
    console.log('📅 Timestamp:', new Date().toISOString());
    
    // Connect to database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB for migration');
    }

    // Get all products that don't have approval fields
    const productsToUpdate = await Product.find({
      $or: [
        { approvalStatus: { $exists: false } },
        { submittedAt: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${productsToUpdate.length} products to update`);

    if (productsToUpdate.length === 0) {
      console.log('✅ All products already have approval fields - migration complete');
      return;
    }

    // Update products in batches for safety
    const batchSize = 50;
    let updatedCount = 0;
    let errors = [];

    for (let i = 0; i < productsToUpdate.length; i += batchSize) {
      const batch = productsToUpdate.slice(i, i + batchSize);
      
      try {
        // Update each product in this batch
        const bulkOps = batch.map(product => ({
          updateOne: {
            filter: { _id: product._id },
            update: {
              $set: {
                // DEFAULT ALL EXISTING PRODUCTS TO APPROVED - CRITICAL FOR PRODUCTION
                approvalStatus: 'approved',
                approvalComments: 'Existing product - auto-approved during migration',
                approvedBy: null, // No specific admin approved
                approvedAt: new Date(),
                submittedAt: product.createdAt || new Date(),
                rejectedAt: null,
                // Keep track of migration
                migrationInfo: {
                  migratedAt: new Date(),
                  version: '1.0.0',
                  autoApproved: true
                }
              }
            }
          }
        }));

        const result = await Product.bulkWrite(bulkOps);
        updatedCount += result.modifiedCount;
        
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Updated ${result.modifiedCount} products`);
        
        // Add delay between batches to not overwhelm the database
        if (i + batchSize < productsToUpdate.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (batchError) {
        console.error(`❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, batchError.message);
        errors.push({
          batch: Math.floor(i/batchSize) + 1,
          error: batchError.message,
          products: batch.map(p => p._id)
        });
      }
    }

    // Verification step
    const verificationCount = await Product.countDocuments({ 
      approvalStatus: { $exists: true } 
    });
    
    const totalProducts = await Product.countDocuments();

    console.log('\n📋 MIGRATION SUMMARY:');
    console.log(`✅ Total products updated: ${updatedCount}`);
    console.log(`📊 Products with approval fields: ${verificationCount}`);
    console.log(`📊 Total products in database: ${totalProducts}`);
    console.log(`❌ Errors encountered: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS DETAILS:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Batch ${error.batch}: ${error.error}`);
      });
    }

    if (verificationCount === totalProducts) {
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('🔍 All existing products are now marked as APPROVED');
      console.log('🚀 Ready to enable approval workflow for new products');
    } else {
      console.log('\n⚠️ MIGRATION PARTIALLY COMPLETED');
      console.log('🔧 Some products may need manual review');
    }

    return {
      success: verificationCount === totalProducts,
      totalProducts,
      updatedCount,
      verificationCount,
      errors
    };

  } catch (error) {
    console.error('🚨 CRITICAL MIGRATION ERROR:', error);
    throw error;
  }
}

// Rollback function for emergency use
async function rollbackProductApprovalFields() {
  try {
    console.log('🔄 ROLLING BACK Product Approval Fields Migration...');
    console.log('⚠️ This will remove approval fields from ALL products');
    
    const result = await Product.updateMany(
      { 'migrationInfo.version': '1.0.0' },
      {
        $unset: {
          approvalStatus: '',
          approvalComments: '',
          approvedBy: '',
          approvedAt: '',
          submittedAt: '',
          rejectedAt: '',
          migrationInfo: ''
        }
      }
    );

    console.log(`✅ Rollback completed: ${result.modifiedCount} products updated`);
    return result;
    
  } catch (error) {
    console.error('🚨 ROLLBACK ERROR:', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--rollback')) {
    rollbackProductApprovalFields()
      .then(() => {
        console.log('🎯 Rollback completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Rollback failed:', error);
        process.exit(1);
      });
  } else {
    addProductApprovalFields()
      .then((result) => {
        if (result.success) {
          console.log('🎯 Migration completed successfully');
          process.exit(0);
        } else {
          console.log('⚠️ Migration completed with issues');
          process.exit(1);
        }
      })
      .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  addProductApprovalFields,
  rollbackProductApprovalFields
}; 