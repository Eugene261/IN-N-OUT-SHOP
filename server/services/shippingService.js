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
            
            // Apply base rate - prioritize shipping zone if defined, fall back to vendor preferences
            let adminFee = 0;
            if (destinationZone && destinationZone.baseRate) {
                // Use custom shipping zone rate if defined
                adminFee = destinationZone.baseRate;
                console.log(`Initial shipping fee for ${adminId}: ${adminFee} GHS (using zone: ${destinationZone.name})`);
            } else if (vendorShippingPrefs) {
                // Fall back to vendor shipping preferences if no custom zone is found
                // Default to out-of-region rate first
                adminFee = vendorShippingPrefs.defaultOutOfRegionRate || 70;
                console.log(`Initial shipping fee for ${adminId}: ${adminFee} GHS (using vendor default out-of-region rate)`);
            } else {
                // Final fallback to system default
                adminFee = 70; // Default shipping fee
                console.log(`Initial shipping fee for ${adminId}: ${adminFee} GHS (using system default)`);
            }
            
            // Check if customer's region matches vendor's base region for direct shipping discount
            const vendorBaseRegion = group.baseRegion?.toLowerCase().trim();
            if (vendorBaseRegion && region) {
                // Check for region match (with some flexibility for similar region names)
                const isBaseRegionMatch = 
                    vendorBaseRegion === region || 
                    (vendorBaseRegion === 'greater accra' && region === 'accra') ||
                    (vendorBaseRegion === 'accra' && region === 'greater accra') ||
                    (vendorBaseRegion === 'ashanti' && region === 'ashanti region') ||
                    (vendorBaseRegion === 'ashanti region' && region === 'ashanti');
                
                if (isBaseRegionMatch) {
                    console.log(`✓ Customer is in vendor's base region (${vendorBaseRegion})`);
                    
                    // Check if vendor has enabled regional rates
                    const enableRegionalRates = vendorShippingPrefs ? 
                        vendorShippingPrefs.enableRegionalRates !== false : true; // Default to true
                    
                    if (enableRegionalRates) {
                        // Get appropriate base region fee
                        let baseRegionFee = null;
                        
                        // Priority order: 1) Custom zone > 2) Vendor preference > 3) Default
                        if (destinationZone && destinationZone.sameRegionCapFee) {
                            // Use zone-specific cap fee
                            baseRegionFee = destinationZone.sameRegionCapFee;
                            console.log(`Using zone-specific same-region cap fee: ${baseRegionFee} GHS`);
                        } else if (vendorShippingPrefs && vendorShippingPrefs.defaultBaseRate) {
                            // Use vendor's default base region rate
                            baseRegionFee = vendorShippingPrefs.defaultBaseRate;
                            console.log(`Using vendor's base region rate: ${baseRegionFee} GHS`);
                        } else {
                            // Use system default
                            baseRegionFee = 40; // Default system base region fee
                            console.log(`Using system default base region fee: ${baseRegionFee} GHS`);
                        }
                        
                        console.log(`Applying base region fee of ${baseRegionFee} GHS (was ${adminFee} GHS)`);
                        adminFee = Math.min(adminFee, baseRegionFee); // Use the lower of the two fees
                    } else {
                        console.log(`✗ Vendor has disabled regional rates - no base region discount applied`);
                    }
                } else {
                    console.log(`✗ Customer region (${region}) doesn't match vendor base region (${vendorBaseRegion})`);
                }
            }
            
            // Apply additional rates based on weight or cart value
            if (destinationZone.additionalRates && destinationZone.additionalRates.length > 0) {
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
            
            // Save the admin fee for this vendor with additional information
            adminShippingFees[adminId] = {
                fee: adminFee,
                zone: destinationZone.name,
                itemCount: group.items.length,
                cartValue: group.totalValue,
                baseRegion: group.baseRegion || 'unknown',
                customerRegion: region,
                isSameRegion: vendorBaseRegion && vendorBaseRegion === region,
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
        // Fallback to default shipping rates if calculation fails
        const fallbackRate = 70; // Default fallback rate
        const fallbackAccraRate = 40; // Default rate for Accra
        
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
        const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
        
        // Calculate fallback shipping fees with same-region discount attempts
        const adminShippingFees = {};
        let totalFee = 0;
        
        // Try to get vendor data for same-region discounts
        const User = require('../models/User');
        
        for (const adminId of Object.keys(adminGroups)) {
            try {
                // Try to find the vendor's base region and shipping preferences
                const vendor = await User.findById(adminId);
                if (vendor) {
                    // Get vendor region and shipping preferences
                    const vendorRegion = vendor.baseRegion?.toLowerCase();
                    const vendorShippingPrefs = vendor.shippingPreferences || null;
                    const customerRegion = region.toLowerCase();
                    
                    // Check if vendor has regional rates enabled
                    const enableRegionalRates = vendorShippingPrefs ? 
                        vendorShippingPrefs.enableRegionalRates !== false : true; // Default to true
                    
                    // Need exact region match, not partial match
                    const isExactMatch = vendorRegion && (
                        vendorRegion === customerRegion || 
                        (vendorRegion === 'greater accra' && customerRegion === 'accra') ||
                        (vendorRegion === 'accra' && customerRegion === 'greater accra') ||
                        (vendorRegion === 'ashanti' && customerRegion === 'ashanti region') ||
                        (vendorRegion === 'ashanti region' && customerRegion === 'ashanti')
                    );
                    
                    if (isExactMatch && enableRegionalRates) {
                        // Get base region fee based on vendor preferences
                        const sameRegionFee = vendorShippingPrefs?.defaultBaseRate || 40; // Default same-region cap fee
                        console.log(`Fallback - SAME REGION MATCH! Customer: ${region}, Vendor: ${vendorRegion}, applying vendor base rate of GHS ${sameRegionFee}`);
                        adminShippingFees[adminId] = sameRegionFee;
                        totalFee += sameRegionFee;
                        continue;
                    } else if (vendorShippingPrefs && !isExactMatch) {
                        // Apply vendor-specific out-of-region rate
                        const outOfRegionFee = vendorShippingPrefs.defaultOutOfRegionRate || (isAccra ? fallbackAccraRate : fallbackRate);
                        console.log(`Fallback - DIFFERENT REGIONS - using vendor out-of-region rate: GHS ${outOfRegionFee}`);
                        adminShippingFees[adminId] = outOfRegionFee;
                        totalFee += outOfRegionFee;
                        continue;
                    } else if (isExactMatch && !enableRegionalRates) {
                        console.log(`Fallback - SAME REGION but vendor has disabled regional rates`);
                    }
                }
            } catch (vendorError) {
                console.error(`Error fetching vendor ${adminId} for same-region check:`, vendorError);
                // Continue with standard fallback below
            }
            
            // Standard fallback based on location
            const fee = isAccra ? fallbackAccraRate : fallbackRate;
            adminShippingFees[adminId] = fee;
            totalFee += fee;
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
                
                // First try to find a vendor-specific zone for this exact region
                zone = await ShippingZone.findOne({
                    vendorId,
                    region: normalizedRegion
                });
                
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
            console.log('No shipping zone found, using hardcoded default zone');
            zone = {
                name: 'Default Zone',
                region: 'Ghana',
                baseRate: 70,
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
        
        // Check for same-region discount rule - if customer and vendor are in the same region,
        // cap the shipping fee at the vendor-specified cap fee
        if (zone.vendorRegion && normalizedRegion) {
            // Need exact region match, not partial match
            const vendorRegionLower = zone.vendorRegion.toLowerCase().trim();
            const isExactMatch = 
                vendorRegionLower === normalizedRegion || 
                (vendorRegionLower === 'greater accra' && normalizedRegion === 'accra') ||
                (vendorRegionLower === 'accra' && normalizedRegion === 'greater accra') ||
                (vendorRegionLower === 'ashanti' && normalizedRegion === 'ashanti region') ||
                (vendorRegionLower === 'ashanti region' && normalizedRegion === 'ashanti');
            
            if (isExactMatch) {
                console.log(`SAME REGION MATCH! Customer region: ${normalizedRegion}, Vendor region: ${zone.vendorRegion}`);
                
                // Create a copy of the zone to avoid modifying the original
                const modifiedZone = JSON.parse(JSON.stringify(zone));
                
                // Use the vendor-specified cap fee (default 40 GHS)
                const capFee = modifiedZone.sameRegionCapFee || 40;
                console.log(`Applying same-region cap fee: ${capFee} GHS (original base rate: ${modifiedZone.baseRate} GHS)`);
                
                modifiedZone.baseRate = Math.min(modifiedZone.baseRate, capFee);
                modifiedZone.isSameRegion = true; // Mark this for reference
                modifiedZone.appliedCapFee = capFee; // Store the applied cap fee for reference
                
                console.log(`After same-region discount, base rate is now: ${modifiedZone.baseRate} GHS`);
                
                // Also cap any additional rates to ensure total doesn't exceed the cap fee
                if (modifiedZone.additionalRates && modifiedZone.additionalRates.length > 0) {
                    modifiedZone.additionalRates = modifiedZone.additionalRates.map(rate => {
                        if (rate.additionalFee > 0 && modifiedZone.baseRate + rate.additionalFee > capFee) {
                            // Adjust the fee to cap at vendor-specified cap fee total
                            const newFee = Math.max(0, capFee - modifiedZone.baseRate);
                            return { ...rate, additionalFee: newFee };
                        }
                        return rate;
                    });
                }
                
                return modifiedZone;
            } else {
                console.log(`DIFFERENT REGIONS - NO DISCOUNT: Customer region: ${normalizedRegion}, Vendor region: ${zone.vendorRegion}`);
            }
        }
        
        return zone;
    } catch (error) {
        console.error('Error in findShippingZone:', error);
        // Return a default zone in case of error
        return {
            name: 'Default Zone (Error Fallback)',
            region: 'Ghana',
            baseRate: 70,
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