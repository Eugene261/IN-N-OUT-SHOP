const ShippingZone = require('../../models/ShippingZone');
const { calculateShippingFees, calculateEstimatedDelivery } = require('../../services/shippingService');

/**
 * Get all shipping zones
 */
const getAllShippingZones = async (req, res) => {
    try {
        // If user is an admin, only show their zones
        let filter = {};
        if (req.user && req.user.role === 'admin') {
            filter.vendorId = req.user.id;
        } 
        // If user is superAdmin, show all zones
        
        const zones = await ShippingZone.find(filter).sort({ name: 1 });
        
        res.status(200).json({
            success: true,
            count: zones.length,
            data: zones
        });
    } catch (error) {
        console.error('Error fetching shipping zones:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get a shipping zone by ID
 */
const getShippingZoneById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const zone = await ShippingZone.findById(id);
        
        if (!zone) {
            return res.status(404).json({
                success: false,
                message: 'Shipping zone not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: zone
        });
    } catch (error) {
        console.error('Error fetching shipping zone:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Create a new shipping zone
 */
const createShippingZone = async (req, res) => {
    try {
        const { name, region, baseRate, isDefault, additionalRates, vendorRegion } = req.body;
        
        // Validate required fields
        if (!name || !region || baseRate === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, region, baseRate'
            });
        }
        
        // Get the vendor ID from the authenticated user
        const vendorId = req.user.id;
        
        // If this is a default zone, unset any other default zones for this vendor
        if (isDefault) {
            await ShippingZone.updateMany({ vendorId: vendorId, isDefault: true }, { isDefault: false });
        }
        
        // Create the new shipping zone with vendor information
        const newZone = new ShippingZone({
            name,
            region,
            baseRate,
            isDefault: isDefault || false,
            additionalRates: additionalRates || [],
            vendorId: vendorId,
            vendorRegion: vendorRegion || region, // Use the provided vendorRegion or default to region
        });
        
        await newZone.save();
        
        res.status(201).json({
            success: true,
            message: 'Shipping zone created successfully',
            data: newZone
        });
    } catch (error) {
        console.error('Error creating shipping zone:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Update a shipping zone
 */
const updateShippingZone = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, region, baseRate, isDefault, additionalRates, vendorRegion, sameRegionCapFee } = req.body;
        
        console.log(`Received update request for zone ${id} with data:`, req.body);
        console.log(`Vendor region from request: ${vendorRegion}`);
        
        // Get vendor ID from authenticated user
        const vendorId = req.user.id;
        console.log(`User ID from token: ${vendorId}`);
        
        // Find the shipping zone and make sure it belongs to this vendor
        let zone = await ShippingZone.findOne({ _id: id, vendorId: vendorId });
        
        if (!zone) {
            console.log(`Zone not found or not owned by user ${vendorId}`);
            return res.status(404).json({
                success: false,
                message: 'Shipping zone not found or you do not have permission to modify it'
            });
        }
        
        console.log(`Found zone: ${zone.name}, current vendorRegion: ${zone.vendorRegion}`);
        
        // If this is being set as default, unset any other default zones for this vendor
        if (isDefault && !zone.isDefault) {
            await ShippingZone.updateMany({ vendorId: vendorId, isDefault: true }, { isDefault: false });
        }
        
        // Update the shipping zone
        if (name) zone.name = name;
        if (region) zone.region = region;
        if (baseRate !== undefined) zone.baseRate = baseRate;
        if (isDefault !== undefined) zone.isDefault = isDefault;
        if (additionalRates) zone.additionalRates = additionalRates;
        if (sameRegionCapFee !== undefined) zone.sameRegionCapFee = sameRegionCapFee;
        
        // For vendor region, we need to check if we should update all zones or just this one
        if (vendorRegion) {
            // Update the current zone
            zone.vendorRegion = vendorRegion;
            
            // Also update the vendor's base region in their user profile
            const User = require('../../models/User');
            const vendor = await User.findById(vendorId);
            if (vendor) {
                vendor.baseRegion = vendorRegion;
                await vendor.save();
                console.log(`Updated vendor's base region to: ${vendorRegion}`);
            }
            
            // Check if we should update all zones for this vendor
            const updateAllZones = req.body.updateAllZones === true;
            if (updateAllZones) {
                console.log(`Updating vendorRegion for all zones of vendor ${vendorId} to ${vendorRegion}`);
                await ShippingZone.updateMany(
                    { vendorId: vendorId, _id: { $ne: id } },
                    { vendorRegion: vendorRegion }
                );
            }
        }
        
        await zone.save();
        
        res.status(200).json({
            success: true,
            message: 'Shipping zone updated successfully',
            data: zone
        });
    } catch (error) {
        console.error('Error updating shipping zone:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Delete a shipping zone
 */
const deleteShippingZone = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get vendor ID from authenticated user
        const vendorId = req.user.id;
        
        // Find the shipping zone and ensure it belongs to this vendor
        const zone = await ShippingZone.findOne({ _id: id, vendorId: vendorId });
        
        if (!zone) {
            return res.status(404).json({
                success: false,
                message: 'Shipping zone not found or you do not have permission to delete it'
            });
        }
        
        // Don't allow deletion of default zones
        if (zone.isDefault) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete the default shipping zone. Make another zone default first.'
            });
        }
        
        await ShippingZone.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Shipping zone deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting shipping zone:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Calculate shipping fees for cart items
 */
const calculateShipping = async (req, res) => {
    try {
        const { cartItems, addressInfo } = req.body;
        
        // Validate required fields
        if (!cartItems || !addressInfo) {
            return res.status(400).json({
                success: false,
                message: 'Please provide cartItems and addressInfo'
            });
        }
        
        // Calculate shipping fees
        const shippingData = await calculateShippingFees(cartItems, addressInfo);
        
        // Add estimated delivery information
        const estimatedDelivery = calculateEstimatedDelivery();
        
        res.status(200).json({
            success: true,
            data: {
                ...shippingData,
                estimatedDelivery
            }
        });
    } catch (error) {
        console.error('Error calculating shipping fees:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating shipping fees',
            error: error.message
        });
    }
};

/**
 * Debug function to directly fix vendor regions in all shipping zones
 */
const debugFixZones = async (req, res) => {
    try {
        const { baseRegion } = req.body;
        
        if (!baseRegion) {
            return res.status(400).json({
                success: false,
                message: 'Base region is required'
            });
        }
        
        console.log(`Attempting to fix all zones with base region: ${baseRegion}`);
        
        // Get vendor ID from authenticated user
        const vendorId = req.user.id;
        console.log(`User ID from token: ${vendorId}`);
        
        // Find all zones for this vendor
        const zones = await ShippingZone.find({ vendorId });
        console.log(`Found ${zones.length} zones for vendor ${vendorId}`);
        
        const results = [];
        let successCount = 0;
        
        // Update each zone directly with findByIdAndUpdate
        for (const zone of zones) {
            try {
                console.log(`Updating zone ${zone.name} (${zone._id}) from ${zone.vendorRegion} to ${baseRegion}`);
                
                // Use findByIdAndUpdate to directly update the database
                const updatedZone = await ShippingZone.findByIdAndUpdate(
                    zone._id,
                    { $set: { vendorRegion: baseRegion } },
                    { new: true } // Return the modified document
                );
                
                console.log(`Updated zone:`, updatedZone);
                results.push({
                    id: zone._id,
                    name: zone.name,
                    success: true,
                    oldRegion: zone.vendorRegion,
                    newRegion: updatedZone.vendorRegion
                });
                successCount++;
            } catch (error) {
                console.error(`Error updating zone ${zone._id}:`, error);
                results.push({
                    id: zone._id,
                    name: zone.name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Fixed ${successCount} of ${zones.length} shipping zones`,
            results
        });
    } catch (error) {
        console.error('Error in debugFixZones:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Export controller functions
module.exports = {
    getAllShippingZones,
    getShippingZoneById,
    createShippingZone,
    updateShippingZone,
    deleteShippingZone,
    calculateShipping,
    debugFixZones
}; 