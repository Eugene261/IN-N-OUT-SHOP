/**
 * Shipping Fee Diagnostic Tool
 * 
 * This utility helps diagnose issues with shipping fee calculations
 * by checking each step of the process and logging detailed information.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Products');
const ShippingZone = require('../models/ShippingZone');
const Order = require('../models/Order');

/**
 * Run a complete diagnostic on the shipping fee calculation process
 * @param {string} orderId - Order ID to diagnose
 * @returns {Object} - Diagnostic results
 */
const diagnoseShippingFees = async (orderId) => {
    console.log(`\n===== SHIPPING FEE DIAGNOSTIC FOR ORDER ${orderId} =====\n`);
    const results = {
        order: null,
        cartItems: [],
        addressInfo: null,
        vendors: [],
        shippingZones: [],
        calculationResults: null,
        issues: [],
        recommendations: []
    };
    
    try {
        // Step 1: Get the order
        console.log('Step 1: Retrieving order data...');
        const order = await Order.findById(orderId);
        if (!order) {
            results.issues.push('Order not found');
            results.recommendations.push('Verify the order ID is correct');
            return results;
        }
        
        results.order = {
            id: order._id,
            userId: order.userId || order.user,
            shippingFee: order.shippingFee,
            adminShippingFees: order.adminShippingFees || {},
            metadata: order.metadata
        };
        
        console.log(`Order found: ${order._id}`);
        console.log(`Current shipping fee: ${order.shippingFee || 0}`);
        console.log(`Admin shipping fees: ${JSON.stringify(order.adminShippingFees || {})}`);
        
        // Step 2: Check cart items
        console.log('\nStep 2: Analyzing cart items...');
        if (!order.cartItems || order.cartItems.length === 0) {
            results.issues.push('No cart items found in order');
            results.recommendations.push('Check if the order was created with valid cart items');
        } else {
            console.log(`Found ${order.cartItems.length} items in cart`);
            
            // Check for missing adminId
            const itemsWithMissingAdminId = order.cartItems.filter(item => 
                !item.adminId || item.adminId === 'unknown'
            );
            
            if (itemsWithMissingAdminId.length > 0) {
                console.log(`WARNING: ${itemsWithMissingAdminId.length} items have missing or unknown adminId`);
                results.issues.push(`${itemsWithMissingAdminId.length} items have missing or unknown adminId`);
                results.recommendations.push('Ensure all products have a valid adminId assigned');
            }
            
            // Group by adminId
            const adminGroups = {};
            order.cartItems.forEach(item => {
                const adminId = item.adminId || 'unknown';
                if (!adminGroups[adminId]) {
                    adminGroups[adminId] = [];
                }
                adminGroups[adminId].push(item);
            });
            
            console.log(`Items grouped by ${Object.keys(adminGroups).length} unique vendors`);
            results.cartItems = order.cartItems.map(item => ({
                productId: item.productId,
                adminId: item.adminId || 'unknown',
                title: item.title,
                price: item.price,
                quantity: item.quantity
            }));
        }
        
        // Step 3: Check address information
        console.log('\nStep 3: Checking address information...');
        if (!order.addressInfo) {
            results.issues.push('No address information found');
            results.recommendations.push('Ensure the order has valid shipping address information');
        } else {
            console.log(`Address: ${order.addressInfo.address || 'N/A'}`);
            console.log(`City: ${order.addressInfo.city || 'N/A'}`);
            console.log(`Region: ${order.addressInfo.region || 'N/A'}`);
            
            if (!order.addressInfo.city && !order.addressInfo.region) {
                results.issues.push('Missing city and region in address');
                results.recommendations.push('Ensure the shipping address has city and region information');
            }
            
            results.addressInfo = order.addressInfo;
        }
        
        // Step 4: Check vendor information
        console.log('\nStep 4: Checking vendor information...');
        const uniqueAdminIds = [...new Set(order.cartItems.map(item => item.adminId || 'unknown'))];
        
        for (const adminId of uniqueAdminIds) {
            if (adminId === 'unknown') {
                console.log('Skipping vendor check for unknown adminId');
                continue;
            }
            
            try {
                const vendor = await User.findById(adminId);
                if (!vendor) {
                    console.log(`WARNING: Vendor with ID ${adminId} not found`);
                    results.issues.push(`Vendor with ID ${adminId} not found`);
                    results.recommendations.push('Verify that all adminId values reference valid vendors');
                    continue;
                }
                
                const vendorInfo = {
                    id: vendor._id,
                    baseRegion: vendor.baseRegion || 'Not set',
                    hasShippingPreferences: !!vendor.shippingPreferences
                };
                
                if (vendor.shippingPreferences) {
                    vendorInfo.shippingPreferences = vendor.shippingPreferences;
                }
                
                results.vendors.push(vendorInfo);
                
                console.log(`Vendor ${adminId} found:`);
                console.log(`  Base region: ${vendor.baseRegion || 'Not set'}`);
                console.log(`  Has shipping preferences: ${!!vendor.shippingPreferences}`);
                
                if (!vendor.baseRegion) {
                    results.issues.push(`Vendor ${adminId} has no base region set`);
                    results.recommendations.push(`Ask vendor ${adminId} to set their base region in their profile`);
                }
                
                if (!vendor.shippingPreferences) {
                    results.issues.push(`Vendor ${adminId} has no shipping preferences set`);
                    results.recommendations.push(`Ask vendor ${adminId} to configure their shipping preferences`);
                }
            } catch (error) {
                console.error(`Error fetching vendor ${adminId}:`, error);
                results.issues.push(`Error fetching vendor ${adminId}: ${error.message}`);
            }
        }
        
        // Step 5: Check shipping zones
        console.log('\nStep 5: Checking shipping zones...');
        try {
            const shippingZones = await ShippingZone.find({});
            console.log(`Found ${shippingZones.length} shipping zones in the system`);
            
            if (shippingZones.length === 0) {
                results.issues.push('No shipping zones defined in the system');
                results.recommendations.push('Set up shipping zones for proper shipping fee calculation');
            }
            
            results.shippingZones = shippingZones.map(zone => ({
                id: zone._id,
                name: zone.name,
                region: zone.region,
                baseRate: zone.baseRate,
                vendorId: zone.vendorId || 'Global'
            }));
            
            // Check if there are zones for each vendor
            for (const adminId of uniqueAdminIds) {
                if (adminId === 'unknown') continue;
                
                const vendorZones = shippingZones.filter(zone => 
                    zone.vendorId && zone.vendorId.toString() === adminId
                );
                
                console.log(`Vendor ${adminId} has ${vendorZones.length} custom shipping zones`);
                
                if (vendorZones.length === 0) {
                    results.issues.push(`Vendor ${adminId} has no custom shipping zones`);
                    results.recommendations.push(`Set up shipping zones for vendor ${adminId}`);
                }
            }
        } catch (error) {
            console.error('Error fetching shipping zones:', error);
            results.issues.push(`Error fetching shipping zones: ${error.message}`);
        }
        
        // Step 6: Simulate shipping fee calculation
        console.log('\nStep 6: Simulating shipping fee calculation...');
        try {
            const { calculateShippingFees } = require('./shippingService');
            
            if (order.cartItems && order.cartItems.length > 0 && order.addressInfo) {
                const calculationResult = await calculateShippingFees(order.cartItems, order.addressInfo);
                
                console.log('Calculation result:');
                console.log(`  Total shipping fee: ${calculationResult.totalShippingFee || 0}`);
                console.log(`  Admin shipping fees: ${JSON.stringify(calculationResult.adminShippingFees || {})}`);
                
                results.calculationResults = calculationResult;
                
                // Compare with actual order shipping fee
                if (order.shippingFee !== calculationResult.totalShippingFee) {
                    console.log(`DISCREPANCY: Order shipping fee (${order.shippingFee}) doesn't match calculated fee (${calculationResult.totalShippingFee})`);
                    results.issues.push('Order shipping fee doesn\'t match calculated fee');
                    results.recommendations.push('Update the order with the correct shipping fee');
                }
                
                // Check if any admin shipping fees are missing or zero
                const zeroFees = Object.entries(calculationResult.adminShippingFees || {}).filter(([_, fee]) => {
                    const feeValue = typeof fee === 'object' ? (fee.fee || 0) : (fee || 0);
                    return feeValue === 0;
                });
                
                if (zeroFees.length > 0) {
                    console.log(`WARNING: ${zeroFees.length} vendors have zero shipping fees`);
                    results.issues.push(`${zeroFees.length} vendors have zero shipping fees`);
                    results.recommendations.push('Check vendor shipping settings for vendors with zero fees');
                }
            } else {
                console.log('Cannot simulate calculation: missing cart items or address info');
            }
        } catch (error) {
            console.error('Error simulating shipping fee calculation:', error);
            results.issues.push(`Error simulating shipping fee calculation: ${error.message}`);
        }
        
        // Final summary
        console.log('\n===== DIAGNOSTIC SUMMARY =====');
        console.log(`Found ${results.issues.length} issues`);
        
        if (results.issues.length > 0) {
            console.log('\nIssues found:');
            results.issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
            
            console.log('\nRecommendations:');
            results.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        } else {
            console.log('No issues found. Shipping fee calculation should be working correctly.');
        }
        
        console.log('\n===== END OF DIAGNOSTIC =====\n');
        
        return results;
    } catch (error) {
        console.error('Error running shipping fee diagnostic:', error);
        results.issues.push(`Diagnostic error: ${error.message}`);
        return results;
    }
};

/**
 * Fix shipping fees for an order based on diagnostic results
 * @param {string} orderId - Order ID to fix
 * @returns {Object} - Fix results
 */
const fixOrderShippingFees = async (orderId) => {
    console.log(`\n===== FIXING SHIPPING FEES FOR ORDER ${orderId} =====\n`);
    
    try {
        // Run diagnostic first
        const diagnostic = await diagnoseShippingFees(orderId);
        
        // If we have calculation results, use them to fix the order
        if (diagnostic.calculationResults && diagnostic.calculationResults.totalShippingFee > 0) {
            const order = await Order.findById(orderId);
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            
            // Update the shipping fee and admin shipping fees
            const oldShippingFee = order.shippingFee;
            const newShippingFee = diagnostic.calculationResults.totalShippingFee;
            
            // CRITICAL FIX: Explicitly set shipping fee fields to ensure they're saved correctly
            // This is needed because Mongoose might not properly handle complex nested objects
            order.shippingFee = newShippingFee;
            
            // Create a deep copy of the admin shipping fees to ensure all metadata is preserved
            const adminShippingFeesDeepCopy = JSON.parse(JSON.stringify(diagnostic.calculationResults.adminShippingFees));
            order.adminShippingFees = adminShippingFeesDeepCopy;
            
            // Ensure metadata exists
            if (!order.metadata) {
                order.metadata = {};
            }
            
            if (!order.metadata.shippingDetails) {
                order.metadata.shippingDetails = {};
            }
            
            // Create comprehensive metadata with shipping details
            order.metadata.shippingDetails = {
                totalShippingFee: newShippingFee,
                calculationMethod: 'diagnostic-fix',
                vendorShipping: {}
            };
            
            // Add detailed vendor shipping information to metadata
            Object.keys(adminShippingFeesDeepCopy).forEach(vendorId => {
                const vendorFee = adminShippingFeesDeepCopy[vendorId];
                
                // Get vendor name if available
                let vendorName = 'Vendor';
                const vendorItems = order.cartItems.filter(item => item.adminId === vendorId);
                if (vendorItems.length > 0 && vendorItems[0].adminName) {
                    vendorName = vendorItems[0].adminName;
                }
                
                // Create detailed shipping entry
                order.metadata.shippingDetails.vendorShipping[vendorId] = {
                    vendorName,
                    vendorId,
                    fee: typeof vendorFee === 'object' ? (vendorFee.fee || 0) : vendorFee,
                    items: vendorItems.map(item => ({
                        productId: item.productId,
                        title: item.title,
                        quantity: item.quantity
                    }))
                };
                
                // Copy any additional metadata from the original fee object
                if (typeof vendorFee === 'object') {
                    Object.keys(vendorFee).forEach(key => {
                        if (key !== 'fee' && key !== 'items') {
                            order.metadata.shippingDetails.vendorShipping[vendorId][key] = vendorFee[key];
                        }
                    });
                }
            });
            
            // Update order summary if it exists
            if (order.metadata.orderSummary) {
                order.metadata.orderSummary.shipping = newShippingFee;
                
                // Recalculate total
                const subtotal = order.metadata.orderSummary.subtotal || 0;
                order.metadata.orderSummary.total = subtotal + newShippingFee;
            }
            
            // CRITICAL FIX: Use direct MongoDB operations instead of Mongoose save
            // This bypasses potential Mongoose middleware issues
            try {
                // Get direct access to the MongoDB collection
                const orderCollection = mongoose.connection.collection('orders');
                
                // Convert the order ID to MongoDB ObjectId if needed
                const orderId = typeof order._id === 'string'
                    ? new mongoose.Types.ObjectId(order._id)
                    : order._id;
                
                console.log('DIAGNOSTIC - Using direct MongoDB update for order:', orderId);
                
                // Create the update operation
                const updateData = {
                    $set: {
                        shippingFee: newShippingFee,
                        adminShippingFees: adminShippingFeesDeepCopy,
                        'metadata.shippingDetails': order.metadata.shippingDetails
                    }
                };
                
                // Execute the update
                const updateResult = await orderCollection.updateOne(
                    { _id: orderId },
                    updateData
                );
                
                console.log('DIAGNOSTIC - Direct MongoDB update result:', {
                    acknowledged: updateResult.acknowledged,
                    modifiedCount: updateResult.modifiedCount,
                    matchedCount: updateResult.matchedCount
                });
                
                // If the update didn't work, fall back to save method
                if (!updateResult.modifiedCount) {
                    console.log('DIAGNOSTIC - Direct update failed, falling back to save method');
                    await order.save();
                }
            } catch (updateError) {
                console.error('DIAGNOSTIC - Error during direct MongoDB update:', updateError);
                console.log('DIAGNOSTIC - Falling back to save method');
                await order.save();
            }
            
            console.log(`Successfully updated shipping fee from ${oldShippingFee || 0} to ${newShippingFee}`);
            return {
                success: true,
                message: `Shipping fee updated from ${oldShippingFee || 0} to ${newShippingFee}`,
                oldShippingFee: oldShippingFee || 0,
                newShippingFee,
                adminShippingFees: diagnostic.calculationResults.adminShippingFees
            };
        } else {
            console.log('Cannot fix shipping fees: No valid calculation results available');
            return {
                success: false,
                message: 'Cannot fix shipping fees: No valid calculation results available',
                diagnostic
            };
        }
    } catch (error) {
        console.error('Error fixing shipping fees:', error);
        return { success: false, message: `Error fixing shipping fees: ${error.message}` };
    }
};

/**
 * Trace the shipping fee data flow from checkout to order creation
 * This function adds detailed logging to help debug where shipping fees are getting lost
 */
const traceShippingFeeFlow = async () => {
    console.log('\n===== SHIPPING FEE FLOW TRACER ACTIVATED =====\n');
    console.log('This tool will trace shipping fee data through the entire flow');
    console.log('1. Add items to cart');
    console.log('2. Go to checkout and select an address');
    console.log('3. Proceed to payment');
    console.log('4. Complete the order');
    console.log('\nCheck the server logs for detailed tracing information');
    
    // Add global hooks to trace shipping fee data
    const originalCalculateShippingFees = require('./shippingService').calculateShippingFees;
    
    // Override the calculateShippingFees function to add tracing
    require('./shippingService').calculateShippingFees = async function(...args) {
        console.log('\n===== TRACE: calculateShippingFees CALLED =====');
        console.log('Input cart items:', JSON.stringify(args[0]));
        console.log('Input address:', JSON.stringify(args[1]));
        
        const result = await originalCalculateShippingFees.apply(this, args);
        
        console.log('Output shipping fees:', JSON.stringify(result));
        console.log('===== END TRACE: calculateShippingFees =====\n');
        
        return result;
    };
    
    return { success: true, message: 'Shipping fee flow tracer activated' };
};

/**
 * Check the schema of the Order model to ensure it can store shipping fee data correctly
 */
const checkOrderSchema = async () => {
    const Order = require('../models/Order');
    const mongoose = require('mongoose');
    
    console.log('\n===== ORDER SCHEMA ANALYSIS =====\n');
    
    // Get the schema definition
    const schema = Order.schema.obj;
    
    // Check shipping fee related fields
    console.log('Shipping fee field:', schema.shippingFee ? 'Present' : 'Missing');
    console.log('adminShippingFees field:', schema.adminShippingFees ? 'Present' : 'Missing');
    console.log('metadata field:', schema.metadata ? 'Present' : 'Missing');
    
    // Check field types
    if (schema.shippingFee) {
        console.log('shippingFee type:', schema.shippingFee.type === Number ? 'Number' : schema.shippingFee.type);
        console.log('shippingFee default:', schema.shippingFee.default);
    }
    
    if (schema.adminShippingFees) {
        console.log('adminShippingFees type:', 
            schema.adminShippingFees.type === mongoose.Schema.Types.Mixed ? 'Mixed' : schema.adminShippingFees.type);
    }
    
    if (schema.metadata) {
        console.log('metadata type:', 
            schema.metadata.type === mongoose.Schema.Types.Mixed ? 'Mixed' : schema.metadata.type);
    }
    
    return {
        success: true,
        schema: {
            hasShippingFee: !!schema.shippingFee,
            hasAdminShippingFees: !!schema.adminShippingFees,
            hasMetadata: !!schema.metadata
        }
    };
};

module.exports = {
    diagnoseShippingFees,
    fixOrderShippingFees,
    traceShippingFeeFlow,
    checkOrderSchema
};
