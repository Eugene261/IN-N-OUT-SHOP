const Order = require('../../models/Order.js');
const Cart = require('../../models/cart.js');
const Product = require('../../models/Products.js');
const User = require('../../models/User.js');

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

        // Calculate total shipping fee if not provided or admin shipping fees if available
        let calculatedShippingFee = shippingFee || 0;
        let calculatedAdminShippingFees = adminShippingFees || {};
        
        // If admin shipping fees not provided but we have location info, calculate them using shipping service
        if ((!adminShippingFees || Object.keys(adminShippingFees).length === 0) && addressInfo) {
            try {
                console.log('Calculating shipping fees from order controller');
                const { calculateShippingFees } = require('../../services/shippingService');
                
                // Get proper shipping calculations using the shipping service
                const shippingResult = await calculateShippingFees(cartItems, addressInfo);
                
                if (shippingResult && shippingResult.adminShippingFees) {
                    // Transform the detailed shipping fee objects into simple fee amounts for backward compatibility
                    const simplifiedFees = {};
                    let totalCalculatedFee = 0;
                    
                    // Extract the fee values from the detailed shipping results
                    for (const [adminId, shippingInfo] of Object.entries(shippingResult.adminShippingFees)) {
                        // If the shipping info is an object with a fee property (new format)
                        if (typeof shippingInfo === 'object' && shippingInfo.fee !== undefined) {
                            simplifiedFees[adminId] = shippingInfo.fee;
                            totalCalculatedFee += shippingInfo.fee;
                            
                            // Store additional shipping info for reference
                            if (!calculatedAdminShippingFees.details) {
                                calculatedAdminShippingFees.details = {};
                            }
                            calculatedAdminShippingFees.details[adminId] = {
                                baseRegion: shippingInfo.baseRegion,
                                customerRegion: shippingInfo.customerRegion,
                                isSameRegion: shippingInfo.isSameRegion,
                                zoneName: shippingInfo.zone
                            };
                        } 
                        // If it's a direct number (old format)
                        else if (typeof shippingInfo === 'number') {
                            simplifiedFees[adminId] = shippingInfo;
                            totalCalculatedFee += shippingInfo;
                        }
                    }
                    
                    calculatedAdminShippingFees = simplifiedFees;
                    calculatedShippingFee = totalCalculatedFee || shippingResult.totalShippingFee;
                    
                    console.log('Calculated shipping fees:', JSON.stringify(calculatedAdminShippingFees));
                    console.log('Total shipping fee:', calculatedShippingFee);
                }
            } catch (error) {
                console.error('Error calculating shipping fees in order controller:', error);
                
                // Fallback to simple region-based calculation if shipping service fails
                const city = (addressInfo.city || '').toLowerCase().trim();
                const region = (addressInfo.region || '').toLowerCase().trim();
                const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
                
                // Group items by admin
                const adminItemGroups = {};
                
                cartItems.forEach(item => {
                    const adminId = item.adminId || 'unknown';
                    
                    if (!adminItemGroups[adminId]) {
                        adminItemGroups[adminId] = [];
                    }
                    
                    adminItemGroups[adminId].push(item);
                });
                
                // Calculate shipping fee for each admin using fallback logic
                calculatedAdminShippingFees = {};
                let totalFee = 0;
                
                // Try to get vendor data for base region checks
                try {
                    for (const adminId of Object.keys(adminItemGroups)) {
                        // Try to get vendor's base region
                        const vendor = await User.findById(adminId);
                        let fee = isAccra ? 40 : 70; // Default: GHS 40 for Accra, GHS 70 for others
                        
                        // Apply same-region discount if applicable
                        if (vendor && vendor.baseRegion) {
                            const vendorRegion = vendor.baseRegion.toLowerCase().trim();
                            
                            // Check for region match (same or equivalent regions)
                            const isBaseRegionMatch = 
                                vendorRegion === region || 
                                (vendorRegion === 'greater accra' && region === 'accra') ||
                                (vendorRegion === 'accra' && region === 'greater accra') ||
                                (vendorRegion === 'ashanti' && region === 'ashanti region') ||
                                (vendorRegion === 'ashanti region' && region === 'ashanti');
                            
                            if (isBaseRegionMatch) {
                                // Apply same-region fee (typically lower)
                                fee = Math.min(fee, 40); // Cap at GHS 40 for same region
                                console.log(`Fallback: Applied same-region fee (${fee}) for vendor ${adminId}`);
                            }
                        }
                        
                        calculatedAdminShippingFees[adminId] = fee;
                        totalFee += fee;
                    }
                } catch (vendorError) {
                    console.error('Error in vendor lookup during fallback shipping calculation:', vendorError);
                    
                    // Ultimate fallback - just use basic region rules
                    Object.keys(adminItemGroups).forEach(adminId => {
                        const fee = isAccra ? 40 : 70; // GHS 40 for Accra, GHS 70 for others
                        calculatedAdminShippingFees[adminId] = fee;
                        totalFee += fee;
                    });
                }
                
                calculatedShippingFee = totalFee;
                console.log('Fallback shipping fees:', calculatedAdminShippingFees);
            }
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

        // Calculate subtotal from cart items for verification
        const cartSubtotal = updatedCartItems.reduce((total, item) => {
            const itemPrice = parseFloat(item.price) || 0;
            const quantity = item.quantity || 1;
            return total + (itemPrice * quantity);
        }, 0);
        
        // IMPORTANT: Use the shipping fee provided from the frontend if available
        // This ensures we use the exact shipping fees shown at checkout
        if (shippingFee !== undefined && shippingFee !== null) {
            // CRITICAL FIX: Force the shipping fee to use the value provided by the frontend
            calculatedShippingFee = parseFloat(shippingFee) || 0;
            console.log(`Using provided shipping fee from frontend: ${calculatedShippingFee}`);
            
            // If shipping fee is 0 but totalAmount includes shipping, try to calculate it
            if (calculatedShippingFee === 0 && totalAmount > 0) {
                // Calculate the subtotal without shipping
                const itemsSubtotal = cartItems.reduce((sum, item) => {
                    const itemPrice = parseFloat(item.price) || 0;
                    const quantity = parseInt(item.quantity, 10) || 1;
                    return sum + (itemPrice * quantity);
                }, 0);
                
                // If totalAmount > subtotal, the difference might be shipping fee
                if (totalAmount > itemsSubtotal) {
                    calculatedShippingFee = totalAmount - itemsSubtotal;
                    console.log(`Derived shipping fee from totalAmount: ${calculatedShippingFee}`);
                }
            }
        }
        
        // If adminShippingFees are provided from frontend, use those directly
        if (adminShippingFees && Object.keys(adminShippingFees).length > 0) {
            calculatedAdminShippingFees = adminShippingFees;
            console.log('Using provided admin shipping fees from frontend:', calculatedAdminShippingFees);
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
        
        // Use the provided total amount
        const finalTotalAmount = totalAmount;
        
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
                
                metadata.shippingDetails.vendorShipping[vendorId] = {
                    vendorName,
                    vendorId,
                    fee,
                    items: vendorItems.map(item => ({
                        productId: item.productId,
                        title: item.title,
                        quantity: item.quantity
                    }))
                };
            });
        }
        
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
            metadata, // Add comprehensive metadata with shipping details
            orderDate: orderDate || new Date(),
            orderUpdateDate: orderUpdateDate || new Date(),
            paymentId
        });
        
        // Double-check the shipping fee is set properly - sometimes Mongoose models might reset defaults
        if (newlyCreatedOrder.shippingFee !== calculatedShippingFee) {
            console.log(`Warning: Order shipping fee was reset to ${newlyCreatedOrder.shippingFee}, forcing to ${calculatedShippingFee}`);
            newlyCreatedOrder.shippingFee = calculatedShippingFee;
        }

        // Save the order
        await newlyCreatedOrder.save();

        // Return success response with order ID
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            orderId: newlyCreatedOrder._id,
            data: newlyCreatedOrder
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the order',
            error: error.message
        });
    }
}


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
            
            // Get admin ID from product
            const adminId = product.createdBy ? product.createdBy.toString() : 'unknown';
            
            // Reduce inventory
            product.totalStock -= item.quantity;
            await product.save();
            
            // Add processed item with vendor info
            processedItems.push({
                product: product._id,
                quantity: item.quantity,
                price: parseFloat(item.price),
                status: 'processing',
                vendor: product.createdBy,
                productId: item.productId,
                title: item.title,
                image: item.image,
                adminId: adminId // Store admin ID with the item
            });
        }
        
        // Update order with processed items
        order.items = processedItems;
        
        // If admin groups and shipping fees are not already set, group items by admin
        if (!order.adminGroups || order.adminGroups.length === 0) {
            // Group items by admin
            const adminGroups = {};
            
            processedItems.forEach(item => {
                const adminId = item.adminId || item.vendor?.toString() || 'unknown';
                
                if (!adminGroups[adminId]) {
                    adminGroups[adminId] = {
                        adminId,
                        items: [],
                        itemCount: 0
                    };
                }
                
                adminGroups[adminId].items.push(item.productId);
                adminGroups[adminId].itemCount += item.quantity;
            });
            
            // Calculate shipping fee for each admin if not already set
            if (!order.adminShippingFees || Object.keys(order.adminShippingFees).length === 0) {
                const city = (order.addressInfo?.city || '').toLowerCase();
                const region = (order.addressInfo?.region || '').toLowerCase();
                const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
                
                const adminShippingFees = {};
                
                Object.keys(adminGroups).forEach(adminId => {
                    adminShippingFees[adminId] = isAccra ? 40 : 70;
                });
                
                order.adminShippingFees = adminShippingFees;
                
                // Calculate total shipping fee from all vendors
                const totalShippingFee = Object.values(adminShippingFees).reduce((sum, fee) => sum + fee, 0);
                order.shippingFee = totalShippingFee;
            }
            
            // Save admin groups to order
            order.adminGroups = Object.values(adminGroups);
        }
        
        // IMPORTANT: Clear the user's cart completely
        if (order.userId) {
            // Find the user's cart
            const cart = await Cart.findOne({ userId: order.userId });
            if (cart) {
                // Delete the entire cart document
                await Cart.findByIdAndDelete(cart._id);
                console.log(`Cart for user ${order.userId} has been deleted after successful payment`);
            }
        }

        // Save the updated order
        await order.save();
        
        // Prepare shipping details for the order confirmation page metadata
        const shippingDetails = {
            address: `${order.addressInfo.city}, ${order.addressInfo.region}`,
            totalFee: order.shippingFee || 0,
            vendorShipping: {}
        };
        
        // Include vendor-specific shipping information
        if (order.adminShippingFees) {
            // Get vendor information for each admin ID
            for (const [adminId, fee] of Object.entries(order.adminShippingFees)) {
                let vendorName = 'Vendor';
                try {
                    // Try to get the vendor name if available
                    const vendor = await User.findById(adminId).select('username brand');
                    if (vendor) {
                        vendorName = vendor.brand || vendor.username || 'Vendor';
                    }
                } catch (err) {
                    console.log('Error fetching vendor name:', err);
                }
                
                // Add shipping details
                shippingDetails.vendorShipping[adminId] = {
                    fee: typeof fee === 'object' ? fee.fee || 0 : fee || 0,
                    vendorName
                };
                
                // Add additional shipping details if available
                if (order.adminShippingFees.details && order.adminShippingFees.details[adminId]) {
                    const details = order.adminShippingFees.details[adminId];
                    shippingDetails.vendorShipping[adminId].baseRegion = details.baseRegion;
                    shippingDetails.vendorShipping[adminId].customerRegion = details.customerRegion;
                    shippingDetails.vendorShipping[adminId].isSameRegion = details.isSameRegion;
                }
            }
        }
        
        // Estimate delivery date range (3-5 business days)
        const today = new Date();
        const minDelivery = new Date(today);
        minDelivery.setDate(today.getDate() + 3);
        const maxDelivery = new Date(today);
        maxDelivery.setDate(today.getDate() + 5);
        
        // Format delivery date range
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
        
        shippingDetails.estimatedDelivery = `${formatDate(minDelivery)} - ${formatDate(maxDelivery)}`;

        return res.status(200).json({
            success: true,
            message: 'Payment verified and order confirmed',
            data: order,
            shippingDetails // Include shipping details in the response
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while verifying payment',
            error: error.message
        });
    }
}


const getAllOrdersByUser = async(req, res) => {
    try {
        const {userId} = req.params;

        // Find orders with populated data
        const orders = await Order.find({userId})
            .sort({ createdAt: -1 }) // Latest orders first

        if(!orders.length){
            return res.status(200).json({
                success : true,
                count: 0,
                orders: [] // Return empty array instead of error
            })
        }

        // Process orders to ensure they have vendor shipping information
        const processedOrders = orders.map(order => {
            // Convert to object for modification
            const orderObj = order.toObject();
            
            // Ensure we have proper shipping fee data
            // Calculate the shipping fee if it's zero but we have shipping info in other places
            if (orderObj.shippingFee === 0) {
                // If we have metadata with shipping details, use that
                if (orderObj.metadata && orderObj.metadata.shippingDetails && 
                    typeof orderObj.metadata.shippingDetails.totalShippingFee === 'number') {
                    orderObj.shippingFee = orderObj.metadata.shippingDetails.totalShippingFee;
                    console.log(`Updated order ${orderObj._id} shipping fee from metadata: ${orderObj.shippingFee}`);
                }
                // If we have admin shipping fees, sum them up
                else if (orderObj.adminShippingFees && Object.keys(orderObj.adminShippingFees).length > 0) {
                    orderObj.shippingFee = Object.values(orderObj.adminShippingFees).reduce((total, fee) => {
                        return total + (typeof fee === 'object' ? fee.fee || 0 : fee || 0);
                    }, 0);
                    console.log(`Updated order ${orderObj._id} shipping fee from adminShippingFees: ${orderObj.shippingFee}`);
                }
                // Calculate shipping fee based on vendor locations and customer's region
                else {
                    // Get location information
                    const city = (orderObj.addressInfo?.city || '').toLowerCase().trim();
                    const region = (orderObj.addressInfo?.region || '').toLowerCase().trim();
                    const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
                    
                    // Get unique vendors
                    const vendorIds = new Set();
                    orderObj.cartItems.forEach(item => {
                        if (item.adminId) vendorIds.add(item.adminId);
                    });
                    
                    // Calculate shipping fee based on number of vendors and location
                    const baseShippingFee = isAccra ? 40 : 70;
                    orderObj.shippingFee = baseShippingFee * vendorIds.size;
                    console.log(`Calculated order ${orderObj._id} shipping fee based on location: ${orderObj.shippingFee}`);
                    
                    // Create admin shipping fees if none exist
                    if (!orderObj.adminShippingFees) {
                        orderObj.adminShippingFees = {};
                        vendorIds.forEach(vendorId => {
                            orderObj.adminShippingFees[vendorId] = baseShippingFee;
                        });
                    }
                }
                
                // Create metadata with shipping details if it doesn't exist
                if (!orderObj.metadata) orderObj.metadata = {};
                if (!orderObj.metadata.shippingDetails) {
                    orderObj.metadata.shippingDetails = {
                        totalShippingFee: orderObj.shippingFee,
                        calculationMethod: 'derived',
                        vendorShipping: {}
                    };
                    
                    // Create vendor shipping details
                    if (orderObj.adminShippingFees) {
                        Object.keys(orderObj.adminShippingFees).forEach(vendorId => {
                            const fee = orderObj.adminShippingFees[vendorId];
                            const vendorItems = orderObj.cartItems.filter(item => item.adminId === vendorId);
                            const vendorName = vendorItems.length > 0 ? (vendorItems[0].adminName || 'Vendor') : 'Vendor';
                            
                            orderObj.metadata.shippingDetails.vendorShipping[vendorId] = {
                                vendorName,
                                fee: typeof fee === 'object' ? fee.fee || 0 : fee || 0
                            };
                        });
                    }
                }
            }
            
            // If adminGroups is empty but we have cart items with adminId, create adminGroups
            if ((!orderObj.adminGroups || orderObj.adminGroups.length === 0) && orderObj.cartItems && orderObj.cartItems.length > 0) {
                // Group items by admin
                const adminGroups = {};
                
                orderObj.cartItems.forEach(item => {
                    const adminId = item.adminId || 'unknown';
                    if (!adminGroups[adminId]) {
                        adminGroups[adminId] = {
                            adminId,
                            adminName: item.adminName || 'Vendor',
                            items: [],
                            shippingFee: 0 // Default shipping fee
                        };
                    }
                    adminGroups[adminId].items.push(item.productId || item._id);
                });
                
                // If there's metadata with shipping details, use that
                if (orderObj.metadata && orderObj.metadata.shippingDetails && orderObj.metadata.shippingDetails.vendorShipping) {
                    Object.entries(orderObj.metadata.shippingDetails.vendorShipping).forEach(([vendorId, details]) => {
                        if (adminGroups[vendorId]) {
                            adminGroups[vendorId].shippingFee = typeof details.fee === 'object' ? details.fee.fee || 0 : details.fee || 0;
                        }
                    });
                }
                
                // Convert to array
                orderObj.adminGroups = Object.values(adminGroups);
            }
            
            return orderObj;
        });

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
}


const getOrdersDetails = async(req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)

        if(!order){
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            })
        }

        // Convert to object for easier manipulation
        const orderObj = order.toObject();
        
        // If adminGroups is empty but we have cart items with adminId, create adminGroups
        if ((!orderObj.adminGroups || orderObj.adminGroups.length === 0) && orderObj.cartItems && orderObj.cartItems.length > 0) {
            // Group items by admin
            const adminGroups = {};
            
            orderObj.cartItems.forEach(item => {
                const adminId = item.adminId || 'unknown';
                if (!adminGroups[adminId]) {
                    adminGroups[adminId] = {
                        adminId,
                        adminName: item.adminName || 'Vendor',
                        items: [],
                        shippingFee: 0 // Default shipping fee
                    };
                }
                adminGroups[adminId].items.push(item.productId || item._id);
            });
            
            // If there's metadata with shipping details, use that
            if (orderObj.metadata && orderObj.metadata.shippingDetails && orderObj.metadata.shippingDetails.vendorShipping) {
                Object.entries(orderObj.metadata.shippingDetails.vendorShipping).forEach(([vendorId, details]) => {
                    if (adminGroups[vendorId]) {
                        adminGroups[vendorId].shippingFee = typeof details.fee === 'object' ? details.fee.fee || 0 : details.fee || 0;
                    }
                });
            }
            
            // Convert to array
            orderObj.adminGroups = Object.values(adminGroups);
        }

        res.status(200).json({
            success: true,
            data: orderObj
        })
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        })
    }
}

module.exports = {
    createOrder,
    verifyAndUpdateOrder,
    getAllOrdersByUser,
    getOrdersDetails
};