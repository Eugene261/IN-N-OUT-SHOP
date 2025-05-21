const mongoose = require('mongoose');
require('dotenv').config();
const ShippingZone = require('../models/ShippingZone');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const migrateShippingZones = async () => {
  try {
    console.log('Starting shipping zones migration...');
    
    // 1. Find all admin users
    const admins = await User.find({ role: 'admin' });
    if (!admins.length) {
      console.log('No admin users found. Please create admin users first.');
      process.exit(1);
    }
    
    console.log(`Found ${admins.length} admin users`);
    
    // Get a default admin to use for zones without a vendorId
    const defaultAdmin = admins[0];
    console.log(`Using ${defaultAdmin.userName} as default admin for zones without vendorId`);
    
    // 2. Get existing zones
    const existingZones = await ShippingZone.find();
    console.log(`Found ${existingZones.length} existing shipping zones`);
    
    if (!existingZones.length) {
      console.log('No existing shipping zones found. Nothing to migrate.');
      process.exit(0);
    }
    
    // 3. Process each zone
    for (const zone of existingZones) {
      console.log(`\nProcessing zone "${zone.name}" (ID: ${zone._id})`);
      let wasUpdated = false;
      
      // Find the admin who owns this zone
      let adminOwner = null;
      if (zone.vendorId) {
        try {
          const vendorIdStr = zone.vendorId.toString();
          adminOwner = admins.find(admin => admin._id && admin._id.toString() === vendorIdStr);
          
          if (adminOwner) {
            console.log(`Zone belongs to admin: ${adminOwner.userName}`);
          } else {
            console.log(`No admin found for zone ${zone.name} (vendor ID: ${vendorIdStr})`);
            // Assign default admin
            adminOwner = defaultAdmin;
            console.log(`Assigning default admin: ${adminOwner.userName}`);
            zone.vendorId = defaultAdmin._id;
            wasUpdated = true;
          }
        } catch (err) {
          console.log(`Error finding admin for zone: ${err.message}`);
          // Assign default admin
          adminOwner = defaultAdmin;
          console.log(`Assigning default admin: ${adminOwner.userName}`);
          zone.vendorId = defaultAdmin._id;
          wasUpdated = true;
        }
      } else {
        console.log(`No vendor ID set for zone ${zone.name}`);
        // Assign default admin
        adminOwner = defaultAdmin;
        console.log(`Assigning default admin: ${adminOwner.userName}`);
        zone.vendorId = defaultAdmin._id;
        wasUpdated = true;
      }
      
      // 4. Make sure vendor region is set
      if (!zone.vendorRegion) {
        // If the admin has a base region, use that
        if (adminOwner && adminOwner.baseRegion) {
          zone.vendorRegion = adminOwner.baseRegion;
          console.log(`Setting vendorRegion to admin's baseRegion: ${adminOwner.baseRegion}`);
        } else {
          // Otherwise use the zone's region or default to "Greater Accra"
          zone.vendorRegion = zone.region || "Greater Accra";
          console.log(`Setting vendorRegion to zone's region: ${zone.vendorRegion}`);
          
          // Also update the admin's base region if it's not set
          if (adminOwner && !adminOwner.baseRegion) {
            adminOwner.baseRegion = zone.vendorRegion;
            await adminOwner.save();
            console.log(`Updated admin's baseRegion to ${adminOwner.baseRegion}`);
          }
        }
        wasUpdated = true;
      }
      
      // 5. Update same region cap fee to 40 GHS for all zones
      if (zone.sameRegionCapFee === undefined || zone.sameRegionCapFee !== 40) {
        const oldValue = zone.sameRegionCapFee !== undefined ? `${zone.sameRegionCapFee} GHS` : 'not set';
        zone.sameRegionCapFee = 40; // Update to 40 GHS
        console.log(`Updating sameRegionCapFee from ${oldValue} to ${zone.sameRegionCapFee} GHS`);
        wasUpdated = true;
      }
      
      // 6. Save the zone if it was updated
      if (wasUpdated) {
        try {
          await zone.save();
          console.log(`Updated zone "${zone.name}" (ID: ${zone._id})`);
        } catch (err) {
          console.error(`Error updating zone "${zone.name}": ${err.message}`);
          // For more detail on validation errors
          if (err.name === 'ValidationError') {
            for (let field in err.errors) {
              console.error(`- Field ${field}: ${err.errors[field].message}`);
            }
          }
        }
      } else {
        console.log(`No changes needed for zone "${zone.name}"`);
      }
    }
    
    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
console.log('Starting shipping zone migration script...');
migrateShippingZones(); 