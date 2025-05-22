const mongoose = require('mongoose');
const Order = require('../../models/Order.js');
const Cart = require('../../models/cart.js');
const Product = require('../../models/Products.js');
const User = require('../../models/User.js');

// Helper function to ensure order has metadata - useful for backward compatibility with older orders
const ensureOrderMetadata = async (order) => {
    if (!order) {
        console.log('DEBUG - Order is null or undefined, cannot ensure metadata');
        return order;
    }

    console.log('DEBUG - ensureOrderMetadata called for order:', order._id);
    console.log('DEBUG - Current order shipping fee:', order.shippingFee);
    console.log('DEBUG - Current order adminShippingFees:', order.adminShippingFees);
    
    // Skip processing if order already has metadata
    if (order.metadata) {
        console.log('DEBUG - Order already has metadata, skipping metadata creation');
        return order;
    }
    
    // Convert to object if it's a mongoose document
    const orderObj = order.toObject ? order.toObject() : {...order};
    
    // Calculate subtotal from cart items
    const subtotal = orderObj.cartItems ? orderObj.cartItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity, 10) || 1;
        return sum + (itemPrice * quantity);
    }, 0) : 0;
    
    // Only use admin-set shipping fees - no fallbacks or inferences
    let shippingFee = 0;
    console.log('DEBUG - Getting shipping fee in ensureOrderMetadata:');
    
    // Use direct shipping fee if available
    if (orderObj.shippingFee) {
        shippingFee = parseFloat(orderObj.shippingFee) || 0;
        console.log('DEBUG - Using direct shipping fee field:', shippingFee);
    } 
    // Otherwise calculate from admin shipping fees if available
    else if (orderObj.adminShippingFees && Object.keys(orderObj.adminShippingFees).length > 0) {
        try {
            // Handle both string and object formats for adminShippingFees
            const adminShippingFeesObj = typeof orderObj.adminShippingFees === 'string' 
                ? JSON.parse(orderObj.adminShippingFees) 
                : orderObj.adminShippingFees;
                
            shippingFee = Object.values(adminShippingFeesObj).reduce((sum, fee) => {
                const feeValue = typeof fee === 'object' ? fee.fee || 0 : parseFloat(fee) || 0;
                return sum + feeValue;
            }, 0);
            console.log('DEBUG - Calculated shipping fee from adminShippingFees:', shippingFee);
        } catch (error) {
            console.error('Error parsing adminShippingFees:', error);
        }
    } else {
        console.log('DEBUG - No shipping fee information available');
    }
    
    // Build vendor shipping details
    const vendorShipping = {};
    
    // If we have adminShippingFees, use those directly
    if (orderObj.adminShippingFees && Object.keys(orderObj.adminShippingFees).length > 0) {
        try {
            // Handle both string and object formats
            const adminShippingFeesObj = typeof orderObj.adminShippingFees === 'string' 
                ? JSON.parse(orderObj.adminShippingFees) 
                : orderObj.adminShippingFees;
                
            Object.entries(adminShippingFeesObj).forEach(([adminId, fee]) => {
                // Get vendor name from cart items if possible
                const vendorItems = orderObj.cartItems?.filter(item => item.adminId === adminId) || [];
                const vendorName = vendorItems.length > 0 ? (vendorItems[0].adminName || 'Vendor') : 'Vendor';
                
                vendorShipping[adminId] = {
                    vendorName,
                    vendorId: adminId,
                    fee: typeof fee === 'object' ? fee.fee || 0 : parseFloat(fee) || 0,
                    items: vendorItems.map(item => ({
                        productId: item.productId,
                        title: item.title,
                        quantity: item.quantity
                    }))
                };
            });
        } catch (error) {
            console.error('Error processing adminShippingFees for vendor details:', error);
        }
    }
    // Otherwise, distribute the shipping fee among vendors
    else if (orderObj.cartItems && orderObj.cartItems.length > 0 && shippingFee > 0) {
        // Group by admin/vendor
        const adminGroups = {};
        orderObj.cartItems.forEach(item => {
            const adminId = item.adminId || 'unknown';
            if (!adminGroups[adminId]) {
                adminGroups[adminId] = {
                    items: [],
                    vendorName: item.adminName || 'Vendor'
                };
            }
            adminGroups[adminId].items.push(item);
        });
        
        // Distribute shipping fee among vendors
        const vendorCount = Object.keys(adminGroups).length;
        const perVendorFee = vendorCount > 0 ? shippingFee / vendorCount : 0;
        
        // Create vendor shipping details
        Object.entries(adminGroups).forEach(([adminId, group]) => {
            vendorShipping[adminId] = {
                vendorName: group.vendorName,
                vendorId: adminId,
                fee: perVendorFee,
                items: group.items.map(item => ({
                    productId: item.productId,
                    title: item.title,
                    quantity: item.quantity
                }))
            };
        });
    }
    
    // Create metadata object
    orderObj.metadata = {
        shippingDetails: {
            totalFee: shippingFee, // Match the key used in frontend
            totalShippingFee: shippingFee, // Keep both for compatibility
            calculationMethod: 'admin-set',
            vendorShipping
        },
        orderSummary: {
            subtotal,
            shipping: shippingFee,
            total: orderObj.totalAmount
        }
    };
    
    console.log('DEBUG - Created metadata:', JSON.stringify({
        hasShippingDetails: !!orderObj.metadata.shippingDetails,
        totalFee: orderObj.metadata.shippingDetails.totalFee,
        vendorCount: Object.keys(vendorShipping).length
    }));
    
    // If this is a mongoose document, update it
    if (order.toObject) {
        order.metadata = orderObj.metadata;
        
        // Ensure the shipping fee is also set directly on the order if it's zero
        if (shippingFee > 0 && (order.shippingFee === 0 || order.shippingFee === undefined)) {
            console.log(`DEBUG - Updating order.shippingFee to ${shippingFee}`);
            order.shippingFee = shippingFee;
        }
        
        // Save the updated order to the database
        try {
            await order.save();
            console.log('DEBUG - Successfully saved order with new metadata');
        } catch (saveError) {
            console.error('ERROR - Failed to save order with metadata:', saveError);
        }
    }
    
    return order;
};

const createOrder = async(req, res) => {
    try {
        const {
            userId, 
            cartItems,
            addressInfo,
            orderStatus, 
            paymentMethod,
            paymentStatus,
            totalAmount,
            shippingFee,
            adminShippingFees,
            adminGroups,
            orderDate,
            orderUpdateDate,
            paymentId
        } = req.body;

        // Basic validation
        if (!userId || !cartItems || !addressInfo || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required order information'
            });
        }

        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart items must be a non-empty array'
            });
        }

        // Handle shipping fees - no fallbacks, just use what's provided
        let calculatedShippingFee = 0;
        let calculatedAdminShippingFees = {};
        
        // Log the incoming shipping fee data for debugging
        console.log('Incoming shipping fee data:', {
            providedShippingFee: shippingFee,
            providedAdminShippingFees: typeof adminShippingFees === 'object' ? 'Object with keys: ' + Object.keys(adminShippingFees).join(', ') : adminShippingFees
        });
        
        // If adminShippingFees are provided from frontend, use those directly
        if (adminShippingFees && typeof adminShippingFees === 'object' && Object.keys(adminShippingFees).length > 0) {
            console.log('SHIPPING DEBUG - Raw adminShippingFees from frontend:', JSON.stringify(adminShippingFees));
            
            try {
                // Parse if it's a string (this happens sometimes with JSON objects passed through HTTP)
                if (typeof adminShippingFees === 'string') {
                    calculatedAdminShippingFees = JSON.parse(adminShippingFees);
                } else {
                    // Store the complete adminShippingFees objects to preserve all metadata
                    calculatedAdminShippingFees = JSON.parse(JSON.stringify(adminShippingFees));
                }
                
                // Ensure each admin fee has a standardized format with fee property
                Object.keys(calculatedAdminShippingFees).forEach(adminId => {
                    const fee = calculatedAdminShippingFees[adminId];
                    
                    // If it's already an object with a fee property, ensure fee is a number
                    if (typeof fee === 'object' && fee !== null) {
                        if (fee.fee !== undefined) {
                            calculatedAdminShippingFees[adminId].fee = parseFloat(fee.fee) || 0;
                        } else {
                            // Add fee property if missing
                            calculatedAdminShippingFees[adminId].fee = 0;
                        }
                    }
                    // If it's a primitive value, convert to proper object format
                    else if (typeof fee === 'number' || typeof fee === 'string') {
                        const feeValue = typeof fee === 'string' ? parseFloat(fee) : fee;
                        calculatedAdminShippingFees[adminId] = { fee: feeValue || 0 };
                    }
                    // Default to zero fee object if unexpected format
                    else {
                        calculatedAdminShippingFees[adminId] = { fee: 0 };
                    }
                });
                
                // Calculate total shipping fee by summing all vendor fees
                calculatedShippingFee = Object.values(calculatedAdminShippingFees).reduce((sum, fee) => {
                    const feeValue = typeof fee === 'object' && fee !== null ? (parseFloat(fee.fee) || 0) : 0;
                    return sum + feeValue;
                }, 0);
                
                console.log('SHIPPING DEBUG - Using admin shipping fees with standardized structure');
                console.log('Total shipping fee calculated from admin fees:', calculatedShippingFee);
            } catch (error) {
                console.error('Error processing adminShippingFees:', error);
                // Reset to default values on error
                calculatedAdminShippingFees = {};
                calculatedShippingFee = 0;
            }
        }
        // If shippingFee is provided directly, use it
        else if (shippingFee !== undefined && shippingFee !== null) {
            calculatedShippingFee = parseFloat(shippingFee) || 0;
            console.log(`Using provided shipping fee from frontend: ${calculatedShippingFee}`);
            
            // Distribute the shipping fee among vendors if adminShippingFees not provided
            if (Object.keys(calculatedAdminShippingFees).length === 0 && calculatedShippingFee > 0) {
                // Group items by admin/vendor
                const adminItemGroups = {};
                
                cartItems.forEach(item => {
                    const adminId = item.adminId || 'unknown';
                    if (!adminItemGroups[adminId]) {
                        adminItemGroups[adminId] = [];
                    }
                    adminItemGroups[adminId].push(item);
                });
                
                // Distribute shipping fee evenly among vendors
                const vendorCount = Object.keys(adminItemGroups).length;
                if (vendorCount > 0) {
                    const perVendorFee = calculatedShippingFee / vendorCount;
                    Object.keys(adminItemGroups).forEach(adminId => {
                        calculatedAdminShippingFees[adminId] = { 
                            fee: perVendorFee, 
                            vendorName: adminItemGroups[adminId][0]?.adminName || 'Vendor'
                        };
                    });
                    console.log('Distributed shipping fee among vendors:', JSON.stringify(calculatedAdminShippingFees));
                }
            }
        }
        // If no shipping fee is provided, log a warning and try to calculate a basic fee
        else {
            console.log('Warning: No shipping fees provided for order. Calculating a basic fee based on vendor count.');
            
            // Group items by admin to count vendors
            const adminGroups = {};
            cartItems.forEach(item => {
                const adminId = item.adminId || 'unknown';
                if (!adminGroups[adminId]) {
                    adminGroups[adminId] = {
                        items: [],
                        adminName: item.adminName || 'Vendor'
                    };
                }
                adminGroups[adminId].items.push(item);
            });
            
            // Apply a basic fee per vendor (40 GHS for Accra, 70 GHS for other regions)
            const region = (addressInfo.region || '').toLowerCase();
            const city = (addressInfo.city || '').toLowerCase();
            const isAccra = region.includes('accra') || city.includes('accra');
            const defaultFee = isAccra ? 40 : 70; // 40 GHS for Accra, 70 GHS for other regions
            
            Object.keys(adminGroups).forEach(adminId => {
                calculatedAdminShippingFees[adminId] = { 
                    fee: defaultFee,
                    vendorName: adminGroups[adminId].adminName
                };
                calculatedShippingFee += defaultFee;
            });
            
            console.log('Applied basic shipping fees:', JSON.stringify(calculatedAdminShippingFees));
            console.log('Total shipping fee:', calculatedShippingFee);
        }

        // Prepare admin groups if not provided
        let processedAdminGroups = adminGroups || [];
        
        // If no admin groups were provided, create them from cart items and shipping fees
        if (!adminGroups || adminGroups.length === 0) {
            // Group items by admin
            const adminItemsMap = {};
            
            cartItems.forEach(item => {
                const adminId = item.adminId || 'unknown';
                
                if (!adminItemsMap[adminId]) {
                    adminItemsMap[adminId] = {
                        adminId,
                        adminName: item.adminName || 'Vendor', // Add admin name for better identification
                        items: [],
                        itemCount: 0,
                        shippingFee: calculatedAdminShippingFees[adminId] || 0,
                        status: 'processing'
                    };
                }
                
                adminItemsMap[adminId].items.push(item.productId || item._id);
                adminItemsMap[adminId].itemCount += 1;
            });
            
            // Convert to array for the order schema
            processedAdminGroups = Object.values(adminItemsMap);
        }
        
        // Create order items with correct pricing information
        const orderItems = cartItems.map(item => {
            // Use the price field directly - it already contains the correct purchase price
            return {
                product: item.productId,
                quantity: item.quantity || 1,
                price: parseFloat(item.price), // Convert to number if it's a string
                status: 'processing',
                vendor: item.adminId,
                adminId: item.adminId,
                productId: item.productId,
                title: item.title,
                image: item.image,
                // Add size and color information
                size: item.size || '',
                color: item.color || ''
            };
        });

        // Ensure cart items have all the required attributes including size and color
        const updatedCartItems = cartItems.map(item => {
            // Create a shallow copy and ensure price is a number
            const updatedItem = { ...item };
            
            // Convert price to number if it's a string
            if (typeof updatedItem.price === 'string') {
                updatedItem.price = parseFloat(updatedItem.price);
            }
            
            // Remove salePrice field if it exists since we don't want to use it anymore
            delete updatedItem.salePrice;
            
            // CRITICAL FIX: Ensure size and color are included in cart items
            // This ensures they show up in order details
            if (!updatedItem.size && item.size) {
                updatedItem.size = item.size;
            }
            
            if (!updatedItem.color && item.color) {
                updatedItem.color = item.color;
            }
            
            return updatedItem;
        });

        
        // If totalAmount is provided but shipping fee is not calculated yet,
        // try to derive it from the difference between total and subtotal
        if (totalAmount > 0 && calculatedShippingFee === 0) {
            // If totalAmount > subtotal, the difference might be shipping fee
            if (totalAmount > cartSubtotal) {
                calculatedShippingFee = totalAmount - cartSubtotal;
                console.log(`Derived shipping fee from totalAmount: ${calculatedShippingFee}`);
                
                // Distribute shipping fee among vendors if not already set
                if (Object.keys(calculatedAdminShippingFees).length === 0) {
                    // Group items by admin/vendor
                    const adminItemGroups = {};
                    
                    cartItems.forEach(item => {
                        const adminId = item.adminId || 'unknown';
                        if (!adminItemGroups[adminId]) {
                            adminItemGroups[adminId] = [];
                        }
                        adminItemGroups[adminId].push(item);
                    });
                    
                    // Distribute shipping fee evenly among vendors
                    const vendorCount = Object.keys(adminItemGroups).length;
                    if (vendorCount > 0) {
                        const perVendorFee = calculatedShippingFee / vendorCount;
                        Object.keys(adminItemGroups).forEach(adminId => {
                            calculatedAdminShippingFees[adminId] = perVendorFee;
                        });
                    }
                }
            }
        }
        
        // Ensure shipping fee is not zero if we have admin shipping fees
        if (calculatedShippingFee === 0 && Object.keys(calculatedAdminShippingFees).length > 0) {
            calculatedShippingFee = Object.values(calculatedAdminShippingFees).reduce((sum, fee) => {
                const feeValue = typeof fee === 'object' ? fee.fee || 0 : parseFloat(fee) || 0;
                return sum + feeValue;
            }, 0);
            console.log(`Recalculated shipping fee from admin fees: ${calculatedShippingFee}`);
        }
        
        // Log values for debugging
        console.log('Order creation values:', {
            providedTotal: totalAmount,
            calculatedSubtotal: cartSubtotal,
            calculatedShippingFee,
            calculatedTotal: cartSubtotal + calculatedShippingFee,
            providedShippingFee: shippingFee,
            providedAdminShippingFees: adminShippingFees
        });
        
        // Use the provided total amount or calculate it from subtotal + shipping
        const finalTotalAmount = totalAmount || (cartSubtotal + calculatedShippingFee);
        
        // Create comprehensive metadata with shipping details for frontend reference
        const metadata = {
            shippingDetails: {
                totalShippingFee: calculatedShippingFee,
                calculationMethod: 'direct', // 'direct' from checkout, 'calculated' from shipping service, or 'fallback'
                vendorShipping: {}
            },
            orderSummary: {
                subtotal: cartSubtotal,
                shipping: calculatedShippingFee,
                total: finalTotalAmount
            }
        };
        
        // Build detailed vendor shipping details for metadata
        if (calculatedAdminShippingFees && Object.keys(calculatedAdminShippingFees).length > 0) {
            Object.keys(calculatedAdminShippingFees).forEach(vendorId => {
                // Get vendor name from cart items if possible
                const vendorItems = cartItems.filter(item => item.adminId === vendorId);
                const vendorName = vendorItems.length > 0 ? (vendorItems[0].adminName || 'Vendor') : 'Vendor';
                const fee = calculatedAdminShippingFees[vendorId];
                
                // Extract the fee value based on the data structure
                let feeValue = 0;
                if (typeof fee === 'object' && fee !== null) {
                    if (fee.fee !== undefined) {
                        feeValue = parseFloat(fee.fee) || 0;
                    }
                    // Use vendor name from shipping fee object if available
                    if (fee.vendorName) {
                        vendorName = fee.vendorName;
                    }
                } else if (typeof fee === 'number') {
                    feeValue = fee;
                } else if (typeof fee === 'string') {
                    feeValue = parseFloat(fee) || 0;
                }
                
                // Create a detailed shipping entry with all available information
                metadata.shippingDetails.vendorShipping[vendorId] = {
                    vendorName,
                    vendorId,
                    fee: feeValue,
                    items: vendorItems.map(item => ({
                        productId: item.productId,
                        title: item.title,
                        quantity: item.quantity
                    }))
                };
                
                // Preserve any additional metadata from the original shipping fee object
                if (typeof fee === 'object' && fee !== null) {
                    // Copy all properties except 'fee' which we've already handled
                    Object.keys(fee).forEach(key => {
                        if (key !== 'fee' && key !== 'vendorName') {
                            metadata.shippingDetails.vendorShipping[vendorId][key] = fee[key];
                        }
                    });
                }
            });
        }
        
        // Log the final shipping fee data for debugging
        console.log('SHIPPING DEBUG - Final shipping fee data for order creation:', {
            shippingFee: calculatedShippingFee,
            adminShippingFees: JSON.stringify(calculatedAdminShippingFees),
            metadataShippingFee: metadata.shippingDetails.totalShippingFee,
            metadataVendorShipping: JSON.stringify(metadata.shippingDetails.vendorShipping)
        });
        
        // Create a new order with all the shipping details properly included
        const newlyCreatedOrder = new Order({
            user: userId, 
            userId, 
            cartItems: updatedCartItems, // Use updated cart items with actual purchase prices
            items: orderItems, // Add properly formatted items array with actual purchase prices
            addressInfo,
            orderStatus: orderStatus || 'pending', 
            paymentMethod: paymentMethod || 'paystack',
            paymentStatus: paymentStatus || 'pending',
            totalAmount: finalTotalAmount,
            shippingFee: calculatedShippingFee, // Make sure shipping fee is set correctly
            adminShippingFees: calculatedAdminShippingFees, // Store the per-admin shipping fees
            adminGroups: processedAdminGroups, // Store calculated admin groups
            metadata: metadata, // Add comprehensive metadata with shipping details
            orderDate: orderDate || new Date(),
            orderUpdateDate: orderUpdateDate || new Date(),
            paymentId
        });
        
        // CRITICAL FIX: Force-set shipping fee fields to ensure they're saved correctly
        // This is needed because Mongoose might not properly handle complex nested objects
        try {
            // DRASTIC FIX: Instead of using Mongoose save, which might be having serialization issues,
            // we'll directly create the order document using insertOne
            
            // Log what we're about to save
            console.log('CRITICAL ORDER CREATION DEBUG:');
            console.log('- Calculated shipping fee:', calculatedShippingFee);
            console.log('- Admin shipping fees count:', Object.keys(calculatedAdminShippingFees).length);
            console.log('- Admin shipping fees data:', JSON.stringify(calculatedAdminShippingFees));
            console.log('- Metadata:', JSON.stringify(metadata));
            console.log('- Admin groups count:', processedAdminGroups.length);
            
            // First, perform just a minimal save to get the order ID
            console.log('Step 1: Performing initial save to get order ID');
            await newlyCreatedOrder.save();
            
            // Now do a direct database update with all the complex fields
            console.log('Step 2: Performing direct database update with shipping data');
            const updateData = {
                shippingFee: Number(calculatedShippingFee),
                adminShippingFees: calculatedAdminShippingFees,
                metadata: metadata,
                adminGroups: processedAdminGroups
            };
            
            // Convert object to plain data to avoid Mongoose serialization issues
            const plainUpdateData = JSON.parse(JSON.stringify(updateData));
            
            // Use the direct MongoDB driver instead of Mongoose model for the update
            const db = mongoose.connection.db;
            const ordersCollection = db.collection('orders');
            
            // CRITICAL FIX: Convert Mongoose ObjectId to valid MongoDB ObjectId
            // This is crucial - MongoDB won't find the document with a string ID
            const objectId = new mongoose.Types.ObjectId(newlyCreatedOrder._id);
            
            console.log('Using ObjectId for update:', objectId);
            
            const updateResult = await ordersCollection.updateOne(
                { _id: objectId },
                { $set: plainUpdateData }
            );
            
            console.log('Direct MongoDB update result:', updateResult);
            
            // Verify the update was successful using the raw MongoDB driver
            const updatedOrderDoc = await ordersCollection.findOne({ _id: objectId });
            
            console.log('VERIFICATION AFTER DIRECT UPDATE:');
            console.log('- Order ID:', updatedOrderDoc?._id);
            console.log('- Shipping fee saved:', updatedOrderDoc?.shippingFee);
            console.log('- Admin shipping fees saved:', !!updatedOrderDoc?.adminShippingFees);
            console.log('- Admin shipping fee keys:', updatedOrderDoc?.adminShippingFees ? Object.keys(updatedOrderDoc.adminShippingFees) : 'NONE');
            console.log('- Metadata saved:', !!updatedOrderDoc?.metadata);
            
            // FINAL BRUTE FORCE FIX: If the order still doesn't have shipping fees, try a complete replacement
            // This will guarantee the data is saved correctly
            console.log('EMERGENCY FIX: Ensuring shipping fee data is saved with final direct update');
            
            // Create a document with ONLY the critical shipping fields
            const finalFixData = {
                shippingFee: Number(calculatedShippingFee),
                adminShippingFees: JSON.parse(JSON.stringify(calculatedAdminShippingFees)),
                metadata: JSON.parse(JSON.stringify(metadata)),
                adminGroups: JSON.parse(JSON.stringify(processedAdminGroups))
            };
            
            // Log the exact data we're about to save
            console.log('FINAL UPDATE DATA:', JSON.stringify({
                shippingFee: finalFixData.shippingFee,
                adminShippingFeesKeys: Object.keys(finalFixData.adminShippingFees),
                metadataExists: !!finalFixData.metadata,
                adminGroupsCount: finalFixData.adminGroups.length
            }));
            
            // Use replaceOne for the shipping data to guarantee it's set
            const finalUpdateResult = await ordersCollection.updateOne(
                { _id: objectId },
                { $set: finalFixData },
                { upsert: false } // Don't create a new document
            );
            
            console.log('FINAL UPDATE RESULT:', finalUpdateResult);
            
            // Save diagnostic data regardless of outcome
            await db.collection('order_diagnostics').insertOne({
                originalOrderId: newlyCreatedOrder._id.toString(),
                timestamp: new Date(),
                orderObjectId: objectId.toString(),
                calculatedShippingFee,
                adminShippingFeesCount: Object.keys(calculatedAdminShippingFees).length,
                shippingData: finalFixData
            });
                
            console.log('Saved diagnostic data for debugging');
        } catch (saveError) {
            console.error('Error during order save process:', saveError);
            // Continue with the order creation even if there's an error in the verification process
        }
        
        // Return success response with order ID
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            orderId: newlyCreatedOrder._id,
            data: savedOrder // Return the freshly loaded order from the database
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the order',
            error: error.message
        });
    }
};

const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Ensure order has metadata for shipping fee calculation
        await ensureOrderMetadata(order);

        // Return the order with metadata added
        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error getting order by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting order by ID',
            error: error.message
        });
    }
};

const getAllOrdersByUser = async(req, res) => {
    try {
        const { userId } = req.params;
        
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        
        if (!orders.length) {
            return res.status(200).json({
                success: true,
                count: 0,
                orders: [] // Return empty array instead of error
            });
        }
        
        // Ensure all orders have metadata for shipping fee calculation
        const processedOrders = await Promise.all(orders.map(async order => {
            await ensureOrderMetadata(order);
            return order.toObject();
        }));

        res.status(200).json({
            success: true,
            count: processedOrders.length,
            orders: processedOrders
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

const verifyAndUpdateOrder = async(req, res) => {
    try {
        const { reference, orderId } = req.body;
        
        // Validate required params
        if (!reference || !orderId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment parameters (reference and orderId)'
            });
        }

        // Find the order
        let order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Debug order data before processing
        console.log('DEBUG - Order before processing:', {
            id: order._id,
            shippingFee: order.shippingFee,
            adminShippingFees: order.adminShippingFees,
            metadata: order.metadata,
            totalAmount: order.totalAmount
        });

        // Ensure order has metadata for shipping fee calculation
        await ensureOrderMetadata(order);
        
        // Ensure shipping fee is properly formatted
        // Force convert shippingFee to a number to handle string values
        order.shippingFee = parseFloat(order.shippingFee) || 0;
        
        // Only use admin shipping fees if they exist - no fallbacks
        if (order.adminShippingFees && Object.keys(order.adminShippingFees).length > 0) {
            const calculatedShippingFee = Object.values(order.adminShippingFees).reduce((sum, fee) => {
                // Handle different formats of fee data
                let feeValue = 0;
                if (typeof fee === 'object' && fee !== null) {
                    feeValue = parseFloat(fee.fee) || 0;
                } else if (typeof fee === 'string') {
                    feeValue = parseFloat(fee) || 0;
                } else if (typeof fee === 'number') {
                    feeValue = fee;
                }
                return sum + feeValue;
            }, 0);
            
            if (calculatedShippingFee > 0) {
                console.log(`Setting shipping fee to ${calculatedShippingFee} from admin shipping fees`);
                order.shippingFee = calculatedShippingFee;
                
                // Update metadata if it exists
                if (order.metadata && order.metadata.shippingDetails) {
                    order.metadata.shippingDetails.totalShippingFee = calculatedShippingFee;
                }
                if (order.metadata && order.metadata.orderSummary) {
                    order.metadata.orderSummary.shipping = calculatedShippingFee;
                }
            }
        } else if (order.metadata && order.metadata.shippingDetails && order.metadata.shippingDetails.totalShippingFee > 0) {
            // If we have shipping fee in metadata, use that value
            order.shippingFee = order.metadata.shippingDetails.totalShippingFee;
            console.log(`Using shipping fee from metadata: ${order.shippingFee}`);
        }

        // Update order status
        order.paymentStatus = 'completed';
        order.orderStatus = 'confirmed';
        order.paymentId = reference;
        
        // Process items
        let processedItems = [];
        
        // Update product inventory
        for (let item of order.cartItems) {
            let product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.title}`
                });
            }
        }
        
        // Save the updated order
        await order.save();
        
        // Clear the cart after successful order
        await Cart.findOneAndDelete({ userId: order.userId });
        
        return res.status(200).json({
            success: true,
            message: 'Payment verified and order updated successfully',
            order
        });
        
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error verifying payment',
            error: error.message
        });
    }
};


// Get detailed information about a specific order
const getOrdersDetails = async(req, res) => {
    try {
        const { id } = req.params;
        console.log('DEBUG - getOrdersDetails called for order ID:', id);

        // Get order from database
        const order = await Order.findById(id);

        if(!order){
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log('DEBUG - Order found, checking metadata...');
        console.log('DEBUG - Order has metadata?', !!order.metadata);
        console.log('DEBUG - Current shipping fee:', order.shippingFee);

        // FORCE recreate metadata for ALL orders - disable the early return in ensureOrderMetadata
        // This is an emergency fix to ensure all orders have shipping metadata
        if (order.metadata) {
            // Temporarily clear metadata to force recreation
            order.metadata = undefined;
            console.log('DEBUG - Cleared existing metadata to force recreation');
        }

        // Create/update metadata and save to database
        await ensureOrderMetadata(order);
        
        // If order still doesn't have metadata after ensure call, create it directly
        if (!order.metadata && order.adminShippingFees) {
            try {
                console.log('EMERGENCY FIX - Creating metadata directly');
                
                // Parse admin shipping fees if they're stored as a string
                let adminShippingFeesObj = {};
                try {
                    adminShippingFeesObj = typeof order.adminShippingFees === 'string' 
                        ? JSON.parse(order.adminShippingFees) 
                        : order.adminShippingFees;
                } catch (parseError) {
                    console.error('Failed to parse adminShippingFees:', parseError);
                }
                
                // Calculate total shipping fee
                let totalShippingFee = 0;
                try {
                    Object.values(adminShippingFeesObj).forEach(fee => {
                        if (typeof fee === 'object' && fee.fee) {
                            totalShippingFee += parseFloat(fee.fee) || 0;
                        } else if (typeof fee === 'number') {
                            totalShippingFee += fee;
                        } else if (typeof fee === 'string') {
                            totalShippingFee += parseFloat(fee) || 0;
                        }
                    });
                } catch (error) {
                    console.error('Failed to calculate total shipping fee:', error);
                }
                
                // Create basic metadata structure
                order.metadata = {
                    shippingDetails: {
                        totalFee: totalShippingFee || order.shippingFee || 0,
                        totalShippingFee: totalShippingFee || order.shippingFee || 0,
                        calculationMethod: 'admin-set',
                        vendorShipping: adminShippingFeesObj
                    }
                };
                
                // Update shipping fee if it's 0 but we calculated a value
                if (totalShippingFee > 0 && (!order.shippingFee || order.shippingFee === 0)) {
                    order.shippingFee = totalShippingFee;
                }
                
                // Save changes to database
                await order.save();
                console.log('EMERGENCY FIX - Directly created metadata and saved');
            } catch (fixError) {
                console.error('EMERGENCY FIX FAILED:', fixError);
            }
        }
        
        // Reload the order to ensure we have the latest data
        const freshOrder = await Order.findById(id);
        console.log('DEBUG - Order after metadata update has metadata?', !!freshOrder.metadata);
        console.log('DEBUG - Updated shipping fee:', freshOrder.shippingFee);
        
        // Convert to object for response
        const orderObj = freshOrder.toObject();
        
        // If shipping fee data is still missing in metadata, add it directly to response
        if (!orderObj.metadata || !orderObj.metadata.shippingDetails) {
            console.log('DEBUG - Adding shipping data directly to response');
            orderObj.metadata = orderObj.metadata || {};
            orderObj.metadata.shippingDetails = {
                totalFee: orderObj.shippingFee || 0,
                totalShippingFee: orderObj.shippingFee || 0,
                calculationMethod: 'admin-set'
            };
        }

        res.status(200).json({
            success: true,
            data: orderObj
        });
        
    } catch (error) {
        console.error('Error in getOrdersDetails:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
};

// Function to fix shipping fees for existing orders - using only admin-set fees
const fixShippingFees = async(req, res) => {
    try {
        const { orderId } = req.params;
        
        // Find the order
        let order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        console.log(`Checking shipping fee for order ${orderId}`);
        console.log('Current shipping fee:', order.shippingFee);
        
        // Force convert shippingFee to a number
        order.shippingFee = parseFloat(order.shippingFee) || 0;
        
        let updated = false;
        
        // Only use admin shipping fees if they exist - no fallbacks
        if (order.adminShippingFees && Object.keys(order.adminShippingFees).length > 0) {
            const calculatedShippingFee = Object.values(order.adminShippingFees).reduce((sum, fee) => {
                let feeValue = 0;
                if (typeof fee === 'object' && fee !== null) {
                    feeValue = parseFloat(fee.fee) || 0;
                } else if (typeof fee === 'string') {
                    feeValue = parseFloat(fee) || 0;
                } else if (typeof fee === 'number') {
                    feeValue = fee;
                }
                return sum + feeValue;
            }, 0);
            
            if (calculatedShippingFee > 0) {
                console.log(`Setting shipping fee to ${calculatedShippingFee} from admin shipping fees`);
                order.shippingFee = calculatedShippingFee;
                updated = true;
                
                // Update or create metadata if needed
                if (!order.metadata) {
                    order.metadata = {};
                }
                
                if (!order.metadata.shippingDetails) {
                    order.metadata.shippingDetails = {
                        totalShippingFee: calculatedShippingFee,
                        calculationMethod: 'admin-set',
                        vendorShipping: {}
                    };
                } else {
                    order.metadata.shippingDetails.totalShippingFee = calculatedShippingFee;
                    order.metadata.shippingDetails.calculationMethod = 'admin-set';
                }
                
                if (!order.metadata.orderSummary) {
                    // Calculate subtotal from cart items
                    const subtotal = order.cartItems ? order.cartItems.reduce((sum, item) => {
                        const itemPrice = parseFloat(item.price) || 0;
                        const quantity = parseInt(item.quantity, 10) || 1;
                        return sum + (itemPrice * quantity);
                    }, 0) : 0;
                    
                    order.metadata.orderSummary = {
                        subtotal,
                        shipping: calculatedShippingFee,
                        total: order.totalAmount
                    };
                } else {
                    order.metadata.orderSummary.shipping = calculatedShippingFee;
                }
            }
        } else {
            console.log('No admin shipping fees found for this order');
            
            try {
                // Import shipping service
                const { calculateShippingFees } = require('../services/shippingService');
                
                // Calculate shipping fees based on cart items and address
                const shippingResult = await calculateShippingFees(order.cartItems, order.addressInfo);
                
                if (shippingResult && shippingResult.totalShippingFee !== undefined) {
                    // Use the calculated shipping fees
                    const calculatedShippingFee = shippingResult.totalShippingFee;
                    const calculatedAdminShippingFees = {};
                    
                    // Format the admin shipping fees to ensure they're numbers
                    if (shippingResult.adminShippingFees) {
                        Object.keys(shippingResult.adminShippingFees).forEach(adminId => {
                            const fee = shippingResult.adminShippingFees[adminId];
                            if (typeof fee === 'object' && fee !== null) {
                                calculatedAdminShippingFees[adminId] = parseFloat(fee.fee) || 0;
                            } else {
                                calculatedAdminShippingFees[adminId] = parseFloat(fee) || 0;
                            }
                        });
                    }
                    
                    console.log('Successfully calculated shipping fees:', {
                        totalShippingFee: calculatedShippingFee,
                        adminShippingFees: calculatedAdminShippingFees
                    });
                    
                    order.shippingFee = calculatedShippingFee;
                    order.adminShippingFees = calculatedAdminShippingFees;
                    
                    // Update or create metadata if needed
                    if (!order.metadata) {
                        order.metadata = {};
                    }
                    
                    if (!order.metadata.shippingDetails) {
                        order.metadata.shippingDetails = {
                            totalShippingFee: calculatedShippingFee,
                            calculationMethod: 'calculated',
                            vendorShipping: {}
                        };
                    } else {
                        order.metadata.shippingDetails.totalShippingFee = calculatedShippingFee;
                        order.metadata.shippingDetails.calculationMethod = 'calculated';
                    }
                    
                    if (!order.metadata.orderSummary) {
                        // Calculate subtotal from cart items
                        const subtotal = order.cartItems ? order.cartItems.reduce((sum, item) => {
                            const itemPrice = parseFloat(item.price) || 0;
                            const quantity = parseInt(item.quantity, 10) || 1;
                            return sum + (itemPrice * quantity);
                        }, 0) : 0;
                        
                        order.metadata.orderSummary = {
                            subtotal,
                            shipping: calculatedShippingFee,
                            total: order.totalAmount
                        };
                    } else {
                        order.metadata.orderSummary.shipping = calculatedShippingFee;
                    }
                } else {
                    console.log('Warning: Shipping calculation returned invalid result. Using default fees.');
                    // Use default shipping fees based on location
                    const region = (order.addressInfo.region || '').toLowerCase();
                    const city = (order.addressInfo.city || '').toLowerCase();
                    const isAccra = region.includes('accra') || city.includes('accra');
                    
                    // Group items by admin
                    const adminGroups = {};
                    order.cartItems.forEach(item => {
                        const adminId = item.adminId || 'unknown';
                        if (!adminGroups[adminId]) {
                            adminGroups[adminId] = [];
                        }
                        adminGroups[adminId].push(item);
                    });
                    
                    // Apply default shipping fees per admin
                    const calculatedShippingFee = 0;
                    const calculatedAdminShippingFees = {};
                    Object.keys(adminGroups).forEach(adminId => {
                        const defaultFee = isAccra ? 40 : 70; // 40 GHS for Accra, 70 GHS for other regions
                        calculatedAdminShippingFees[adminId] = defaultFee;
                        calculatedShippingFee += defaultFee;
                    });
                    
                    console.log('Applied default shipping fees:', {
                        totalShippingFee: calculatedShippingFee,
                        adminShippingFees: calculatedAdminShippingFees
                    });
                    
                    order.shippingFee = calculatedShippingFee;
                    order.adminShippingFees = calculatedAdminShippingFees;
                    
                    // Update or create metadata if needed
                    if (!order.metadata) {
                        order.metadata = {};
                    }
                    
                    if (!order.metadata.shippingDetails) {
                        order.metadata.shippingDetails = {
                            totalShippingFee: calculatedShippingFee,
                            calculationMethod: 'default',
                            vendorShipping: {}
                        };
                    } else {
                        order.metadata.shippingDetails.totalShippingFee = calculatedShippingFee;
                        order.metadata.shippingDetails.calculationMethod = 'default';
                    }
                    
                    if (!order.metadata.orderSummary) {
                        // Calculate subtotal from cart items
                        const subtotal = order.cartItems ? order.cartItems.reduce((sum, item) => {
                            const itemPrice = parseFloat(item.price) || 0;
                            const quantity = parseInt(item.quantity, 10) || 1;
                            return sum + (itemPrice * quantity);
                        }, 0) : 0;
                        
                        order.metadata.orderSummary = {
                            subtotal,
                            shipping: calculatedShippingFee,
                            total: order.totalAmount
                        };
                    } else {
                        order.metadata.orderSummary.shipping = calculatedShippingFee;
                    }
                }
            } catch (error) {
                console.error('Error calculating shipping fees:', error);
                
                // Fallback to basic shipping fee calculation
                const region = (order.addressInfo.region || '').toLowerCase();
                const city = (order.addressInfo.city || '').toLowerCase();
                const isAccra = region.includes('accra') || city.includes('accra');
                
                // Group items by admin
                const adminGroups = {};
                order.cartItems.forEach(item => {
                    const adminId = item.adminId || 'unknown';
                    if (!adminGroups[adminId]) {
                        adminGroups[adminId] = [];
                    }
                    adminGroups[adminId].push(item);
                });
                
                // Apply default shipping fees per admin
                const calculatedShippingFee = 0;
                const calculatedAdminShippingFees = {};
                Object.keys(adminGroups).forEach(adminId => {
                    const defaultFee = isAccra ? 40 : 70; // 40 GHS for Accra, 70 GHS for other regions
                    calculatedAdminShippingFees[adminId] = defaultFee;
                    calculatedShippingFee += defaultFee;
                });
                
                console.log('Applied fallback shipping fees after error:', {
                    totalShippingFee: calculatedShippingFee,
                    adminShippingFees: calculatedAdminShippingFees
                });
                
                order.shippingFee = calculatedShippingFee;
                order.adminShippingFees = calculatedAdminShippingFees;
                
                // Update or create metadata if needed
                if (!order.metadata) {
                    order.metadata = {};
                }
                
                if (!order.metadata.shippingDetails) {
                    order.metadata.shippingDetails = {
                        totalShippingFee: calculatedShippingFee,
                        calculationMethod: 'fallback',
                        vendorShipping: {}
                    };
                } else {
                    order.metadata.shippingDetails.totalShippingFee = calculatedShippingFee;
                    order.metadata.shippingDetails.calculationMethod = 'fallback';
                }
                
                if (!order.metadata.orderSummary) {
                    // Calculate subtotal from cart items
                    const subtotal = order.cartItems ? order.cartItems.reduce((sum, item) => {
                        const itemPrice = parseFloat(item.price) || 0;
                        const quantity = parseInt(item.quantity, 10) || 1;
                        return sum + (itemPrice * quantity);
                    }, 0) : 0;
                    
                    order.metadata.orderSummary = {
                        subtotal,
                        shipping: calculatedShippingFee,
                        total: order.totalAmount
                    };
                } else {
                    order.metadata.orderSummary.shipping = calculatedShippingFee;
                }
            }
        }
        
        // Save the updated order
        await order.save();
        
        return res.status(200).json({
            success: true,
            message: `Shipping fee ${updated ? 'updated' : 'unchanged'}`,
            data: {
                orderId: order._id,
                shippingFee: order.shippingFee,
                adminShippingFees: order.adminShippingFees,
                metadata: order.metadata
            }
        });
    } catch (error) {
        console.error('Error checking shipping fee:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking shipping fee',
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    verifyAndUpdateOrder,
    getAllOrdersByUser,
    getOrderById,
    getOrdersDetails,
    fixShippingFees
};