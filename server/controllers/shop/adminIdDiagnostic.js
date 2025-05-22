/**
 * Admin ID and Shipping Fee Diagnostic Tool
 * 
 * This utility helps diagnose and fix issues with adminIds and shipping fees
 * by checking products, cart items, and orders to ensure proper connections.
 */

const Product = require('../../models/Products');
const Cart = require('../../models/cart');
const Order = require('../../models/Order');
const User = require('../../models/User');
const ShippingZone = require('../../models/ShippingZone');
const { calculateShippingFees } = require('../../services/shippingService');

/**
 * Diagnose adminId issues in a user's cart
 * @param {string} userId - User ID to diagnose
 * @returns {Object} - Diagnostic results
 */
const diagnoseCartAdminIds = async (userId) => {
    console.log(`\n===== ADMIN ID DIAGNOSTIC FOR USER ${userId} CART =====\n`);
    
    const results = {
        cart: null,
        itemsWithMissingAdminId: [],
        itemsWithIncorrectAdminId: [],
        fixedItems: [],
        issues: [],
        recommendations: []
    };
    
    try {
        // Find the user's cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            results.issues.push('Cart not found for this user');
            return results;
        }
        
        results.cart = {
            userId: cart.userId,
            itemCount: cart.items.length
        };
        
        console.log(`Found cart with ${cart.items.length} items`);
        
        // Check each item in the cart
        for (const item of cart.items) {
            // Find the product
            const product = await Product.findById(item.productId);
            if (!product) {
                console.log(`Product not found for item: ${item.productId}`);
                results.issues.push(`Product not found: ${item.productId}`);
                continue;
            }
            
            // Check if adminId matches product.createdBy
            const productAdminId = product.createdBy ? product.createdBy.toString() : null;
            const itemAdminId = item.adminId || 'unknown';
            
            if (!productAdminId) {
                console.log(`Product ${item.productId} has no createdBy field`);
                results.issues.push(`Product ${item.productId} has no createdBy field`);
                results.recommendations.push('Ensure all products have a createdBy field');
                continue;
            }
            
            if (!item.adminId || item.adminId === 'unknown') {
                console.log(`Item ${item.productId} has missing adminId`);
                results.itemsWithMissingAdminId.push({
                    productId: item.productId,
                    title: item.title || product.title,
                    currentAdminId: item.adminId,
                    correctAdminId: productAdminId
                });
                
                // Fix the adminId
                item.adminId = productAdminId;
                results.fixedItems.push({
                    productId: item.productId,
                    oldAdminId: itemAdminId,
                    newAdminId: productAdminId
                });
            } else if (item.adminId !== productAdminId) {
                console.log(`Item ${item.productId} has incorrect adminId: ${item.adminId} (should be ${productAdminId})`);
                results.itemsWithIncorrectAdminId.push({
                    productId: item.productId,
                    title: item.title || product.title,
                    currentAdminId: item.adminId,
                    correctAdminId: productAdminId
                });
                
                // Fix the adminId
                item.adminId = productAdminId;
                results.fixedItems.push({
                    productId: item.productId,
                    oldAdminId: itemAdminId,
                    newAdminId: productAdminId
                });
            }
        }
        
        // Save the cart if we made any changes
        if (results.fixedItems.length > 0) {
            await cart.save();
            console.log(`Fixed ${results.fixedItems.length} items in the cart`);
        }
        
        // Add recommendations
        if (results.itemsWithMissingAdminId.length > 0) {
            results.recommendations.push('Update cart items to always include adminId from product.createdBy');
        }
        
        if (results.itemsWithIncorrectAdminId.length > 0) {
            results.recommendations.push('Ensure cart items use the correct adminId from product.createdBy');
        }
        
        return results;
    } catch (error) {
        console.error('Error diagnosing cart adminIds:', error);
        results.issues.push(`Error: ${error.message}`);
        return results;
    }
};

/**
 * Diagnose and fix shipping fees for an order
 * @param {string} orderId - Order ID to diagnose
 * @returns {Object} - Diagnostic results
 */
const diagnoseOrderShippingFees = async (orderId) => {
    console.log(`\n===== SHIPPING FEE DIAGNOSTIC FOR ORDER ${orderId} =====\n`);
    
    const results = {
        order: null,
        originalShippingFee: 0,
        calculatedShippingFee: 0,
        originalAdminShippingFees: {},
        calculatedAdminShippingFees: {},
        issues: [],
        recommendations: [],
        fixed: false
    };
    
    try {
        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            results.issues.push('Order not found');
            return results;
        }
        
        results.order = {
            id: order._id,
            userId: order.userId || order.user,
            totalAmount: order.totalAmount,
            status: order.status
        };
        
        results.originalShippingFee = order.shippingFee || 0;
        results.originalAdminShippingFees = order.adminShippingFees || {};
        
        console.log(`Found order: ${order._id}`);
        console.log(`Current shipping fee: ${results.originalShippingFee}`);
        console.log(`Admin shipping fees: ${JSON.stringify(results.originalAdminShippingFees)}`);
        
        // Check if we have cart items and address info
        if (!order.cartItems || order.cartItems.length === 0) {
            results.issues.push('Order has no cart items');
            results.recommendations.push('Ensure orders have cart items');
            return results;
        }
        
        if (!order.addressInfo) {
            results.issues.push('Order has no address information');
            results.recommendations.push('Ensure orders have address information');
            return results;
        }
        
        // Check adminIds in cart items
        const itemsWithMissingAdminId = order.cartItems.filter(item => !item.adminId || item.adminId === 'unknown');
        if (itemsWithMissingAdminId.length > 0) {
            console.log(`${itemsWithMissingAdminId.length} items have missing adminId`);
            results.issues.push(`${itemsWithMissingAdminId.length} items have missing adminId`);
            
            // Try to fix missing adminIds
            for (const item of itemsWithMissingAdminId) {
                try {
                    const product = await Product.findById(item.productId);
                    if (product && product.createdBy) {
                        item.adminId = product.createdBy.toString();
                        console.log(`Fixed adminId for item ${item.productId}: ${item.adminId}`);
                    }
                } catch (error) {
                    console.error(`Error fixing adminId for item ${item.productId}:`, error);
                }
            }
        }
        
        // Calculate shipping fees
        try {
            const calculationResult = await calculateShippingFees(order.cartItems, order.addressInfo);
            
            results.calculatedShippingFee = calculationResult.totalShippingFee || 0;
            results.calculatedAdminShippingFees = calculationResult.adminShippingFees || {};
            
            console.log(`Calculated shipping fee: ${results.calculatedShippingFee}`);
            console.log(`Calculated admin shipping fees: ${JSON.stringify(results.calculatedAdminShippingFees)}`);
            
            // Check if there's a discrepancy
            if (Math.abs(results.originalShippingFee - results.calculatedShippingFee) > 0.01) {
                console.log(`Shipping fee discrepancy: ${results.originalShippingFee} vs ${results.calculatedShippingFee}`);
                results.issues.push(`Shipping fee discrepancy: ${results.originalShippingFee} vs ${results.calculatedShippingFee}`);
                results.recommendations.push('Update order with correct shipping fee');
                
                // Fix the shipping fee
                order.shippingFee = results.calculatedShippingFee;
                order.adminShippingFees = results.calculatedAdminShippingFees;
                
                // Update metadata if it exists
                if (!order.metadata) {
                    order.metadata = {};
                }
                
                if (!order.metadata.shippingDetails) {
                    order.metadata.shippingDetails = {};
                }
                
                order.metadata.shippingDetails.totalShippingFee = results.calculatedShippingFee;
                order.metadata.shippingDetails.calculationMethod = 'diagnostic-fix';
                order.metadata.shippingDetails.vendorShipping = results.calculatedAdminShippingFees;
                
                // Update order summary if it exists
                if (order.metadata.orderSummary) {
                    order.metadata.orderSummary.shipping = results.calculatedShippingFee;
                    
                    // Recalculate total
                    const subtotal = order.metadata.orderSummary.subtotal || 0;
                    order.metadata.orderSummary.total = subtotal + results.calculatedShippingFee;
                }
                
                // Save the order
                await order.save();
                results.fixed = true;
                console.log(`Fixed shipping fee for order ${orderId}`);
            } else {
                console.log(`Shipping fee is correct: ${results.originalShippingFee}`);
            }
        } catch (error) {
            console.error('Error calculating shipping fees:', error);
            results.issues.push(`Error calculating shipping fees: ${error.message}`);
        }
        
        return results;
    } catch (error) {
        console.error('Error diagnosing order shipping fees:', error);
        results.issues.push(`Error: ${error.message}`);
        return results;
    }
};

/**
 * Fix all orders with missing or incorrect adminIds and shipping fees
 * @returns {Object} - Fix results
 */
const fixAllOrders = async () => {
    console.log('\n===== FIXING ALL ORDERS =====\n');
    
    const results = {
        ordersProcessed: 0,
        ordersFixed: 0,
        issues: [],
        fixedOrders: []
    };
    
    try {
        // Get all orders
        const orders = await Order.find().sort({ createdAt: -1 });
        results.ordersProcessed = orders.length;
        
        console.log(`Found ${orders.length} orders to process`);
        
        // Process each order
        for (const order of orders) {
            try {
                const diagnosticResult = await diagnoseOrderShippingFees(order._id);
                
                if (diagnosticResult.fixed) {
                    results.ordersFixed++;
                    results.fixedOrders.push({
                        orderId: order._id,
                        originalShippingFee: diagnosticResult.originalShippingFee,
                        newShippingFee: diagnosticResult.calculatedShippingFee
                    });
                }
            } catch (error) {
                console.error(`Error processing order ${order._id}:`, error);
                results.issues.push(`Error processing order ${order._id}: ${error.message}`);
            }
        }
        
        console.log(`Fixed ${results.ordersFixed} out of ${results.ordersProcessed} orders`);
        
        return results;
    } catch (error) {
        console.error('Error fixing all orders:', error);
        results.issues.push(`Error: ${error.message}`);
        return results;
    }
};

module.exports = {
    diagnoseCartAdminIds,
    diagnoseOrderShippingFees,
    fixAllOrders
};
