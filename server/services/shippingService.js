const ShippingZone = require('../models/ShippingZone');
const Product = require('../models/Products');

/**
 * Calculate shipping fees based on cart items and address information
 * @param {Array} cartItems - The cart items
 * @param {Object} addressInfo - The shipping address information
 * @returns {Object} - Shipping fee information including total fee and breakdown by admin
 */
const calculateShippingFees = async (cartItems, addressInfo) => {
    try {
        if (!cartItems || !cartItems.length || !addressInfo) {
            throw new Error('Missing required information for shipping calculation');
        }

        // ===== DEBUG LOGGING =====
        console.log('==== SHIPPING CALCULATION DEBUG ====');
        console.log('Customer Address:', JSON.stringify(addressInfo));
        console.log('Cart Items:', JSON.stringify(cartItems.map(item => ({
            productId: item.productId, 
            adminId: item.adminId, 
            title: item.title || 'unknown'
        }))));
        
        // Check for anonymous/default adminIds
        const defaultAdminIds = cartItems.filter(item => 
            !item.adminId || 
            item.adminId === 'unknown' || 
            item.adminId === 'Shop Seller'
        );
        
        if (defaultAdminIds.length > 0) {
            console.log('WARNING: Found items with default/missing adminId:', defaultAdminIds);
        }
        
        console.log('============================');
        // ===== END DEBUG LOGGING =====

        console.log(`Calculating shipping fees for ${cartItems.length} items to: 
            city=${addressInfo.city || 'unknown'}, region=${addressInfo.region || 'unknown'}`);

        // Extract location information
        const city = (addressInfo.city || '').toLowerCase().trim();
        const region = (addressInfo.region || '').toLowerCase().trim();
        
        // Group items by admin/vendor
        const adminGroups = {};
        let totalWeight = 0;
        let totalCartValue = 0;
        
        // Get User model for vendor info
        const User = require('../models/User');
        
        // Calculate weight and group items by admin
        for (const item of cartItems) {
            // Get product to determine its weight
            let productInfo;
            try {
                productInfo = await Product.findById(item.productId);
            } catch (error) {
                console.error(`Error fetching product ${item.productId}:`, error);
            }
            
            // Default weight if not defined on product
            const itemWeight = productInfo?.weight || 0.5; // Default to 0.5kg if no weight specified
            const itemTotalWeight = itemWeight * item.quantity;
            totalWeight += itemTotalWeight;
            
            // Calculate item value for cart total
            const itemPrice = parseFloat(item.price) || 0;
            const itemTotalValue = itemPrice * (item.quantity || 1);
            totalCartValue += itemTotalValue;
            
            // Group by admin/vendor
            const adminId = item.adminId || 'unknown';
            if (!adminGroups[adminId]) {
                // Get vendor's base region if available
                let vendorBaseRegion = null;
                try {
                    const vendor = await User.findById(adminId);
                    if (vendor && vendor.baseRegion) {
                        vendorBaseRegion = vendor.baseRegion;
                    }
                } catch (error) {
                    console.error(`Error fetching vendor ${adminId} info:`, error);
                }
                
                adminGroups[adminId] = {
                    items: [],
                    totalWeight: 0,
                    totalValue: 0,
                    baseRegion: vendorBaseRegion
                };
            }
            
            adminGroups[adminId].items.push(item);
            adminGroups[adminId].totalWeight += itemTotalWeight;
            adminGroups[adminId].totalValue += itemTotalValue;
        }
        
        console.log(`Found ${Object.keys(adminGroups).length} unique vendors in cart`);
        
        // Calculate shipping fees per admin
        const adminShippingFees = {};
        let totalShippingFee = 0;
        
        for (const [adminId, group] of Object.entries(adminGroups)) {
            console.log(`Calculating shipping for vendor: ${adminId}`);
            console.log(`Vendor has ${group.items.length} items in cart`);
            console.log(`Total weight: ${group.totalWeight.toFixed(2)} kg, total value: ${group.totalValue.toFixed(2)} GHS`);
            console.log(`Vendor base region: ${group.baseRegion || 'unknown'}`);
            
            // Get vendor's shipping preferences, if available
            let vendorShippingPrefs = null;
            try {
                const vendor = await User.findById(adminId);
                if (vendor) {
                    // Store vendor shipping preferences for later use
                    vendorShippingPrefs = vendor.shippingPreferences || null;
                    
                    if (vendorShippingPrefs) {
                        console.log(`Found vendor shipping preferences:`, JSON.stringify(vendorShippingPrefs));
                    }
                    
                    // Make sure base region is also stored in group (in case it wasn't fetched earlier)
                    if (vendor.baseRegion && !group.baseRegion) {
                        group.baseRegion = vendor.baseRegion;
                        console.log(`Updated group with vendor base region: ${group.baseRegion}`);
                    }
                }
            } catch (error) {
                console.error(`Error fetching vendor ${adminId} shipping preferences:`, error);
            }
            
            // Find the shipping zone for this admin and destination
            const destinationZone = await findShippingZone(city, region, adminId);
            
            // Use direct region-to-rate lookup - no "same region" vs "different region" logic
            let adminFee = 0;
            
            // First priority: Check if vendor has configured a specific zone for this region
            if (destinationZone && destinationZone.baseRate !== undefined) {
                adminFee = destinationZone.baseRate;
                console.log(`Initial shipping fee for ${adminId}: ${adminFee} GHS (using configured rate for ${region})`);
            } else {
                // Second priority: Use vendor's default shipping preferences as fallback
                if (vendorShippingPrefs && vendorShippingPrefs.defaultBaseRate !== undefined) {
                    adminFee = vendorShippingPrefs.defaultBaseRate;
                    console.log(`Initial shipping fee for ${adminId}: ${adminFee} GHS (using vendor default rate - no specific region configured)`);
                } else {
                    // Last resort: No rates configured at all
                    adminFee = 0;
                    console.log(`Initial shipping fee for ${adminId}: ${adminFee} GHS (no rates configured for this vendor)`);
                }
            }
            
            console.log(`Using shipping fee of ${adminFee} GHS for ${adminId} based on admin preferences`);
            
            // Apply additional rates from shipping zones (if any)
            if (destinationZone && destinationZone.additionalRates && destinationZone.additionalRates.length > 0) {
                for (const rate of destinationZone.additionalRates) {
                    if (rate.type === 'weight' && group.totalWeight > rate.threshold) {
                        adminFee += rate.additionalFee;
                        console.log(`Added ${rate.additionalFee} GHS for weight > ${rate.threshold} kg`);
                    } else if (rate.type === 'price' && group.totalValue > rate.threshold) {
                        adminFee += rate.additionalFee;
                        console.log(`Added ${rate.additionalFee} GHS for value > ${rate.threshold} GHS`);
                    }
                }
            }
            
            // Ensure fee is not negative
            adminFee = Math.max(0, adminFee);
            
            // Save the admin fee for this vendor with simplified information
            // Remove references to base region and same region comparison
            adminShippingFees[adminId] = {
                fee: adminFee,
                zone: destinationZone?.name || 'unknown',
                itemCount: group.items.length,
                cartValue: group.totalValue,
                customerRegion: region,
                items: group.items.map(item => ({
                    productId: item.productId || 'unknown',
                    title: item.title || 'Unknown Product',
                    quantity: item.quantity || 1
                }))
            };
            
            console.log(`Final shipping fee for ${adminId}: ${adminFee} GHS`);
            
            // Add to total shipping fee
            totalShippingFee += adminFee;
        }
        
        console.log(`Total shipping fee across all vendors: ${totalShippingFee} GHS`);
        
        return {
            totalShippingFee,
            adminShippingFees,
            details: {
                totalWeight,
                totalCartValue
            }
        };
    } catch (error) {
        console.error('Error calculating shipping fees:', error);
        // Fallback to admin-configured shipping rates from database if calculation fails
        let fallbackRate = 0; // Initialize with zero instead of hardcoded value
        
        // Try to get rates from database - without hardcoding specific regions
        try {
            // Get the default zone as the primary fallback
            const defaultZone = await ShippingZone.findOne({ isDefault: true });
            fallbackRate = defaultZone?.baseRate || 0;
            
            if (!defaultZone) {
                // If no default zone, just get any zone as a last resort
                const anyZone = await ShippingZone.findOne();
                fallbackRate = anyZone?.baseRate || 0;
            }
            
            console.log(`Using database values for fallback rate: ${fallbackRate} GHS`);
        } catch (dbError) {
            console.error('Error fetching fallback rates from database:', dbError);
            // Even in case of error, we'll use 0 as the fallback rate
            fallbackRate = 0;
        }
        
        // Group items by admin/vendor for fallback calculation
        const adminGroups = {};
        
        for (const item of cartItems) {
            const adminId = item.adminId || 'unknown';
            if (!adminGroups[adminId]) {
                adminGroups[adminId] = [];
            }
            adminGroups[adminId].push(item);
        }
        
        // Extract location information
        const city = (addressInfo.city || '').toLowerCase().trim();
        const region = (addressInfo.region || '').toLowerCase().trim();
        // No hardcoded region checks - we'll use the normalizeRegionName function defined earlier
        
        // Calculate fallback shipping fees using admin preferences
        const adminShippingFees = {};
        let totalFee = 0;
        
        // Try to get vendor data for admin preferences
        const User = require('../models/User');
        
        for (const adminId of Object.keys(adminGroups)) {
            try {
                // Try to find a specific shipping zone for this vendor and region first
                const ShippingZone = require('../models/ShippingZone');
                
                // Look for vendor-specific zone for this region
                let vendorZone = await ShippingZone.findOne({
                    vendorId: adminId,
                    $or: [
                        { region: { $regex: region, $options: 'i' } },
                        { name: { $regex: city, $options: 'i' } }
                    ]
                }).sort({ updatedAt: -1 });
                
                if (vendorZone && vendorZone.baseRate !== undefined) {
                    const fee = vendorZone.baseRate;
                    console.log(`Fallback - Found configured rate for ${region}: GHS ${fee}`);
                    adminShippingFees[adminId] = fee;
                    totalFee += fee;
                    continue;
                }
                
                // If no specific zone found, try vendor's default shipping preferences
                const vendor = await User.findById(adminId);
                if (vendor && vendor.shippingPreferences && vendor.shippingPreferences.defaultBaseRate !== undefined) {
                    const fee = vendor.shippingPreferences.defaultBaseRate;
                    console.log(`Fallback - Using vendor default rate: GHS ${fee}`);
                    adminShippingFees[adminId] = fee;
                    totalFee += fee;
                    continue;
                }
            } catch (vendorError) {
                console.error(`Error fetching vendor ${adminId} shipping configuration:`, vendorError);
                // Continue with standard fallback below
            }
            
            // Standard fallback when no admin preferences found - try to get from shipping zones
            try {
                const ShippingZone = require('../models/ShippingZone');
                
                // Try to find a vendor-specific zone first
                let vendorZone = await ShippingZone.findOne({
                    vendorId: adminId,
                    $or: [
                        { region: { $regex: region, $options: 'i' } },
                        { name: { $regex: city, $options: 'i' } }
                    ]
                }).sort({ updatedAt: -1 });
                
                // If no vendor-specific zone, try default zone for this vendor
                if (!vendorZone) {
                    vendorZone = await ShippingZone.findOne({
                        vendorId: adminId,
                        isDefault: true
                    });
                }
                
                const fee = vendorZone ? vendorZone.baseRate : 0;
                console.log(`Fallback - No admin preferences found for ${adminId}, using zone rate: GHS ${fee}`);
                adminShippingFees[adminId] = fee;
                totalFee += fee;
            } catch (zoneError) {
                console.error(`Error fetching shipping zone for ${adminId}:`, zoneError);
                // If all else fails, use 0 to avoid unexpected charges
                const fee = 0;
                console.log(`Fallback - Error fetching zone for ${adminId}, using zero rate: GHS ${fee}`);
                adminShippingFees[adminId] = fee;
                totalFee += fee;
            }
        }
        
        return {
            totalShippingFee: totalFee,
            adminShippingFees,
            details: {
                destinationZone: isAccra ? 'Accra' : 'Other Regions',
                isError: true,
                errorMessage: error.message
            }
        };
    }
};

/**
 * Find the shipping zone that matches the given vendor, city and region
 * @param {string} city - The delivery city
 * @param {string} region - The delivery region
 * @param {string} vendorId - The vendor ID for vendor-specific rates
 * @returns {Object} - The matching shipping zone
 */
const findShippingZone = async (city, region, vendorId) => {
    try {
        console.log(`Finding shipping zone for city=${city}, region=${region}, vendorId=${vendorId}`);
        
        // Normalize region for better matching
        const normalizedRegion = region ? region.toLowerCase().trim() : null;
        const normalizedCity = city ? city.toLowerCase().trim() : null;
        
        // Try to find a zone with exact match for this vendor
        let zone = null;
        
        // Debug logging for vendorId
        if (!vendorId || vendorId === 'unknown') {
            console.log('WARNING: vendorId is missing or unknown. This may prevent finding vendor-specific shipping zones.');
        } else {
            console.log(`Looking for shipping zones for vendor: ${vendorId}`);
        }
        
        // Step 1: Try to find vendor-specific zones if we have a valid vendorId
        if (vendorId && vendorId !== 'unknown') {
            try {
                // Get the vendor's information first to know their base region
                const User = require('../models/User');
                const vendor = await User.findById(vendorId);
                let vendorBaseRegion = vendor?.baseRegion || null;
                
                if (vendorBaseRegion) {
                    console.log(`Vendor ${vendorId} has base region: ${vendorBaseRegion}`);
                } else {
                    console.log(`Vendor ${vendorId} has no base region set`);
                }
                
                // First try to find a vendor-specific zone for this region using flexible matching
                // Sort by updatedAt to ensure we get the most recently updated zone
                zone = await ShippingZone.findOne({
                    vendorId,
                    region: { $regex: normalizedRegion, $options: 'i' }
                }).sort({ updatedAt: -1 });
                
                // If the region contains the word 'region' but didn't match, try without it
                if (!zone && normalizedRegion.includes('region')) {
                    const shortRegion = normalizedRegion.replace('region', '').trim();
                    console.log(`Trying simplified region name: '${shortRegion}'`);
                    zone = await ShippingZone.findOne({
                        vendorId,
                        region: { $regex: shortRegion, $options: 'i' }
                    }).sort({ updatedAt: -1 });
                }
                
                // Also try matching by the zone name (which is often the city)
                if (!zone && normalizedCity) {
                    console.log(`Trying to match by city name: '${normalizedCity}'`);
                    zone = await ShippingZone.findOne({
                        vendorId,
                        name: { $regex: normalizedCity, $options: 'i' }
                    }).sort({ updatedAt: -1 });
                }
                
                if (zone) {
                    console.log(`Found vendor-specific zone for region: ${zone.name}`);
                    // Update zone with vendor's base region if needed
                    if (vendorBaseRegion && (!zone.vendorRegion || zone.vendorRegion !== vendorBaseRegion)) {
                        zone.vendorRegion = vendorBaseRegion;
                        await zone.save();
                        console.log(`Updated zone with vendor's base region: ${vendorBaseRegion}`);
                    }
                    return zone;
                }
                
                // If no exact region match, try to find a default zone for this vendor
                zone = await ShippingZone.findOne({
                    vendorId,
                    isDefault: true
                });
                
                if (zone) {
                    console.log(`Found vendor's default zone: ${zone.name}`);
                    // Update zone with vendor's base region if needed
                    if (vendorBaseRegion && (!zone.vendorRegion || zone.vendorRegion !== vendorBaseRegion)) {
                        zone.vendorRegion = vendorBaseRegion;
                        await zone.save();
                        console.log(`Updated zone with vendor's base region: ${vendorBaseRegion}`);
                    }
                    return zone;
                }
            } catch (error) {
                console.error(`Error finding vendor-specific zone:`, error);
            }
        }
        
        // Step 2: If no vendor-specific zone was found, fall back to global zones
        try {
            // Try to find a global zone that matches the region or city
            zone = await ShippingZone.findOne({
                $or: [
                    { region: { $regex: normalizedRegion, $options: 'i' } },
                    { name: { $regex: normalizedCity, $options: 'i' } }
                ]
            });
            
            if (zone) {
                console.log(`Found global zone for region/city: ${zone.name}`);
                return zone;
            }
            
            // If no specific zone found, use the default zone
            zone = await ShippingZone.findOne({ isDefault: true });
            
            if (zone) {
                console.log(`Using global default zone: ${zone.name}`);
                return zone;
            }
        } catch (error) {
            console.error('Error finding global zone:', error);
        }
        
        // Step 3: If no zone found at all, create a default fallback zone object
        if (!zone) {
            console.log('No shipping zone found, using safe fallback zone with zero rate');
            zone = {
                name: 'Default Zone',
                region: 'Ghana',
                baseRate: 0,  // Default to zero instead of hardcoded 70 GHS
                isDefault: true,
                additionalRates: [
                    {
                        type: 'price',
                        threshold: 1000,
                        additionalFee: -20 // Discount for orders over 1000 GHS
                    }
                ]
            };
        }
        
        // Log the found zone
        console.log(`Selected zone: ${zone.name}, region: ${zone.region}, baseRate: ${zone.baseRate}, vendorRegion: ${zone.vendorRegion || 'not set'}`);
        
        // No special handling for same region anymore - directly return the zone with the configured base rate
        // This ensures the shipping fee is exactly what was configured in the admin panel
        
        return zone;
    } catch (error) {
        console.error('Error in findShippingZone:', error);
        
        // Try to find a default zone from the database instead of using hardcoded values
        try {
            const defaultZone = await ShippingZone.findOne({ isDefault: true });
            if (defaultZone) {
                console.log(`Found default zone from database: ${defaultZone.name}, baseRate: ${defaultZone.baseRate}`);
                return defaultZone;
            }
            
            // If no default zone is found, try to find any zone as a fallback
            const anyZone = await ShippingZone.findOne();
            if (anyZone) {
                console.log(`Found fallback zone from database: ${anyZone.name}, baseRate: ${anyZone.baseRate}`);
                return anyZone;
            }
        } catch (fallbackError) {
            console.error('Error finding default zone:', fallbackError);
        }
        
        // As a last resort, return a minimal default zone with zero rate
        // to avoid charging unexpected fees
        return {
            name: 'Default Zone (Error Fallback)',
            region: 'Ghana',
            baseRate: 0,
            isDefault: true
        };
    }
};

/**
 * Calculate estimated delivery date based on the shipping zone
 * @param {string} zoneId - The shipping zone ID
 * @returns {Object} - Estimated delivery date information
 */
const calculateEstimatedDelivery = (zoneId) => {
    const today = new Date();
    const minDays = 2; // Minimum delivery days
    const maxDays = 5; // Maximum delivery days
    
    const minDeliveryDate = new Date(today);
    minDeliveryDate.setDate(today.getDate() + minDays);
    
    const maxDeliveryDate = new Date(today);
    maxDeliveryDate.setDate(today.getDate() + maxDays);
    
    return {
        minDeliveryDate,
        maxDeliveryDate,
        displayText: `${minDays}-${maxDays} business days`
    };
};

module.exports = {
    calculateShippingFees,
    findShippingZone,
    calculateEstimatedDelivery
}; 