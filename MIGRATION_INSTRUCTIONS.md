# Shipping Zone Migration Instructions

## Overview
We've updated the shipping zone system to be vendor-specific, allowing each vendor to have their own shipping zones. We've also added a special rule that caps shipping fees at 50 GHS when the buyer and seller are in the same region.

## Migration Steps

1. **Backup your database**
   ```bash
   mongodump --uri="your-mongodb-uri" --out=backup-before-migration
   ```

2. **Run the migration script**
   ```bash
   node server/scripts/migrateShippingZones.js
   ```

3. **Restart your server**
   ```bash
   npm run start
   ```

## What the migration does

1. Finds all existing shipping zones
2. Assigns them to the first admin user found in the system
3. Sets the vendor's region to match the zone's region
4. Saves the updated zones

## Changes to shipping calculations

1. **Vendor-Specific Zones**: Each vendor now has their own shipping zones
2. **Same-Region Discount**: When a customer is in the same region as the vendor, shipping fees are capped at 50 GHS
3. **Vendor Base Region**: Each shipping zone includes a "vendorRegion" field that determines where the vendor is based

## Verifying the migration

1. Log in to the admin dashboard
2. Go to the Shipping Zones section
3. Verify that your shipping zones are visible and have a "Your Base Region" field set
4. Create a test order with a shipping address in the same region as one of your vendors
5. Verify that the shipping fee doesn't exceed 50 GHS

## Troubleshooting

If you encounter any issues during or after migration:

1. **Schema Validation Errors**: If you get schema validation errors, check that all shipping zones have both `vendorId` and `vendorRegion` fields.
2. **Missing Zones**: If your zones are missing after migration, check that you're logged in as the correct vendor.
3. **Incorrect Fee Calculation**: If shipping fees aren't calculating correctly, check that the customer's region matches the vendor's region exactly.

For any other issues, please contact support.

## Rolling Back

If you need to roll back this migration:

1. Restore your database backup
2. Use the previous version of the application code 