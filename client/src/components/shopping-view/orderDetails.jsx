import React from 'react'
import { DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { TruckIcon } from 'lucide-react';

function ShoppingOrderDetailsView({ orderDetails, user }) {
  if (!orderDetails) return null;

  // Format date directly instead of using a separate utility
  const formatOrderDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format price ensuring it's treated as a number
  const formatPrice = (price) => {
    // Added strict validation for zero values
    if (price === undefined || price === null || price === 0) {
      return 'GHS 0.00';
    }

    // Handle case where price might be an object with a fee property
    if (typeof price === 'object' && price !== null) {
      if (price.fee !== undefined) {
        const numFee = parseFloat(price.fee);
        if (!isNaN(numFee)) {
          return `GHS ${numFee.toFixed(2)}`;
        }
      }
      return 'GHS 0.00';
    }
    
    // Convert to number if it's a string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;

    // Check if it's a valid number after conversion
    if (isNaN(numPrice)) return 'GHS 0.00';

    // Extra debugging
    console.log('PRICE DEBUG - Formatting price:', {
      originalPrice: price,
      parsedPrice: numPrice,
      formatted: `GHS ${numPrice.toFixed(2)}`
    });

    return `GHS ${numPrice.toFixed(2)}`;
  };
  
  // Get the actual purchase price from items array if available
  const getActualPurchasePrice = (cartItem) => {
    // If there are no items array or no productId to match, return the cart item price
    if (!orderDetails.items || !orderDetails.items.length || !cartItem.productId) {
      return cartItem.price;
    }
    
    // Try to find matching item in the items array which has the actual purchase price
    const matchingItem = orderDetails.items.find(item => 
      item.product === cartItem.productId || // MongoDB ObjectId match
      (item.productId && item.productId === cartItem.productId) // String ID match
    );
    
    // If found matching item, use its price (the actual purchase price)
    if (matchingItem && matchingItem.price) {
      return matchingItem.price;
    }
    
    // Fallback to cart item price if no match found
    return cartItem.price;
  };
  
  // Get status badge style based on status
  const getStatusBadgeStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle shipping fees with better error checking and type conversion
  let totalShippingFee = 0;
  
  // Enhanced debugging for shipping fee data
  console.log('COMPREHENSIVE SHIPPING FEE DEBUG:', {
    orderID: orderDetails._id,
    directShippingFee: orderDetails.shippingFee,
    adminShippingFeesType: typeof orderDetails.adminShippingFees,
    adminShippingFeesValue: orderDetails.adminShippingFees,
    hasMetadata: !!orderDetails.metadata,
    metadataKeys: orderDetails.metadata ? Object.keys(orderDetails.metadata) : 'none',
    shippingDetails: orderDetails.metadata?.shippingDetails,
    metadataShippingFee: orderDetails.metadata?.shippingDetails?.totalShippingFee,
    paymentMetadata: orderDetails.metadata?.paymentMetadata,
    vendorShippingInfo: orderDetails.metadata?.shippingDetails?.vendorShipping
  });

  // REVISED APPROACH: Handle shipping fees with strict type checking and multiple fallbacks
  // First priority: Use metadata.shippingDetails.totalShippingFee as the most reliable source
  if (orderDetails.metadata?.shippingDetails?.totalShippingFee !== undefined) {
    const parsedFee = parseFloat(orderDetails.metadata.shippingDetails.totalShippingFee);
    if (!isNaN(parsedFee)) {
      totalShippingFee = parsedFee;
      console.log('Using shipping fee from metadata.shippingDetails:', totalShippingFee);
    }
  }
  
  // Second priority: Use shipping fee from payment metadata if available
  else if (orderDetails.metadata?.paymentMetadata?.totalShippingFee) {
    const parsedFee = parseFloat(orderDetails.metadata.paymentMetadata.totalShippingFee);
    if (!isNaN(parsedFee)) {
      totalShippingFee = parsedFee;
      console.log('Using shipping fee from payment metadata:', totalShippingFee);
    }
  }
  
  // Third priority: Calculate from metadata.shippingDetails.vendorShipping if available
  else if (orderDetails.metadata?.shippingDetails?.vendorShipping) {
    try {
      const vendorShipping = orderDetails.metadata.shippingDetails.vendorShipping;
      totalShippingFee = Object.values(vendorShipping).reduce((sum, vendor) => {
        const vendorFee = typeof vendor === 'object' ? parseFloat(vendor.fee) || 0 : 0;
        return sum + vendorFee;
      }, 0);
      console.log('Calculated shipping fee from vendorShipping details:', totalShippingFee);
    } catch (error) {
      console.error('Error calculating from vendorShipping:', error);
    }
  }
  
  // Fourth priority: Use direct shipping fee if available and non-zero
  else if (orderDetails.shippingFee) {
    const parsedFee = parseFloat(orderDetails.shippingFee);
    if (!isNaN(parsedFee) && parsedFee > 0) {
      totalShippingFee = parsedFee;
      console.log('Using direct shipping fee field:', totalShippingFee);
    }
  }
  
  // Third priority: Calculate from adminShippingFees if both above are zero or invalid
  if (totalShippingFee === 0 && orderDetails.adminShippingFees) {
    // Handle both object and string formats of adminShippingFees
    let adminFeesObj = orderDetails.adminShippingFees;
    
    // If it's a string, try to parse it
    if (typeof adminFeesObj === 'string') {
      try {
        adminFeesObj = JSON.parse(adminFeesObj);
      } catch (e) {
        console.error('Failed to parse adminShippingFees string:', e);
        adminFeesObj = {};
      }
    }
    
    // Now calculate the total from the object
    if (typeof adminFeesObj === 'object' && adminFeesObj !== null) {
      totalShippingFee = Object.values(adminFeesObj).reduce((sum, fee) => {
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
      console.log('Calculated shipping fee from admin fees:', totalShippingFee);
    }
  }
  
  // If we still don't have a shipping fee, check if it's in the vendor shipping details
  if (totalShippingFee === 0 && orderDetails.metadata?.shippingDetails?.vendorShipping) {
    const vendorShipping = orderDetails.metadata.shippingDetails.vendorShipping;
    if (Object.keys(vendorShipping).length > 0) {
      totalShippingFee = Object.values(vendorShipping).reduce((sum, vendor) => {
        const fee = typeof vendor === 'object' ? (vendor.fee || 0) : 0;
        return sum + parseFloat(fee);
      }, 0);
      console.log('Calculated shipping fee from vendor shipping details:', totalShippingFee);
    }
  }
  // If no shipping fee is available, log a warning but don't use fallbacks
  else {
    console.log('Warning: No admin-set shipping fees found for this order. Displaying 0.00 as shipping fee.');
    totalShippingFee = 0;
  }
  
  // Generate vendor shipping data if not available in metadata
  // Check if we have shipping data in metadata (new format)
  const hasVendorShipping = orderDetails.metadata && 
                           orderDetails.metadata.shippingDetails && 
                           orderDetails.metadata.shippingDetails.vendorShipping;

  // Extract vendor shipping details if available
  const vendorShippingDetails = hasVendorShipping ? 
                               orderDetails.metadata.shippingDetails.vendorShipping : null;
  
  // If no vendor shipping details but we have admin groups or cart items with adminId, create vendor shipping details
  let generatedVendorShipping = null;
  if (!hasVendorShipping) {
    // Try to create from admin groups
    if (orderDetails.adminGroups && orderDetails.adminGroups.length > 0) {
      generatedVendorShipping = {};
      orderDetails.adminGroups.forEach(group => {
        generatedVendorShipping[group.adminId] = {
          fee: group.shippingFee || 0,
          vendorName: group.adminName || 'Vendor'
        };
      });
    }
  }
  
  // Use either existing vendor shipping details or generated ones
  const effectiveVendorShipping = vendorShippingDetails || generatedVendorShipping;
  const hasEffectiveVendorShipping = effectiveVendorShipping && Object.keys(effectiveVendorShipping).length > 0;
  
  // Calculate subtotal by summing the prices of all items
  const subtotal = orderDetails.cartItems ? 
    orderDetails.cartItems.reduce((sum, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const quantity = item.quantity || 1;
      return sum + (itemPrice * quantity);
    }, 0) : 0;
  

  return (
    <DialogContent className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto p-4 md:p-6 overflow-y-auto max-h-[90vh]">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-xl font-semibold">Order Details</DialogTitle>
      </DialogHeader>

      <div className="space-y-5">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3">
            <p className="font-medium text-sm text-gray-700">Order ID</p>
            <p className="text-sm text-right font-mono">#{orderDetails._id?.slice(-6).toUpperCase() || 'N/A'}</p>
            
            <p className="font-medium text-sm text-gray-700">Order Date</p>
            <p className="text-sm text-right">{formatOrderDate(orderDetails.orderDate)}</p>
            
            <p className="font-medium text-sm text-gray-700">Status</p>
            <p className="text-sm text-right">{orderDetails.orderStatus || 'N/A'}</p>
            
            <p className="font-medium text-sm text-gray-700">Payment Method</p>
            <p className="text-sm text-right font-semibold">{orderDetails?.paymentMethod}</p>

            <p className="font-medium text-sm text-gray-700">Payment Status</p>
            <p className="text-sm text-right font-semibold">{orderDetails?.paymentStatus}</p>
          </div>
        </div>

        {/* Price details with shipping fee */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Price Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center">
                <TruckIcon className="h-4 w-4 mr-2 text-gray-400" /> Shipping Fee:
              </span>
              <span className="font-medium">
                {/* Debug the raw shipping fee value before formatting */}
                {console.log('SHIPPING FEE RENDER:', {
                  rawValue: totalShippingFee,
                  directFee: orderDetails.shippingFee,
                  metadataFee: orderDetails.metadata?.shippingDetails?.totalShippingFee
                })}
                {/* Force use of direct shipping fee if available and valid */}
                {formatPrice(orderDetails.shippingFee || totalShippingFee)}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatPrice(orderDetails.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3">Order Items</h3>
          <ul className="space-y-3">
            {orderDetails.cartItems && orderDetails.cartItems.length > 0 ? (
              orderDetails.cartItems.map((item, index) => (
                <li key={index} className="flex flex-col border-b pb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[70%] font-medium">{item.title || item.tilte || `Product ${index + 1}`}</span>
                    <span className="font-medium">{formatPrice(getActualPurchasePrice(item))}</span>
                  </div>
                  {/* Display size and color information */}
                  <div className="flex text-xs text-gray-500 mt-1">
                    {item.size && <span className="mr-3">Size: <span className="uppercase">{item.size}</span></span>}
                    {item.color && <span>Color: <span className="uppercase">{item.color}</span></span>}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">Qty: {item.quantity || 1}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeStyle(item.status || orderDetails.status)}`}>
                      {item.status || orderDetails.status || 'Processing'}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-sm">No items found</li>
            )}
          </ul>
        </div>

        {orderDetails.addressInfo && (
          <>
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Shipping Information</h3>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="space-y-1 text-gray-700">
                  {/* Add check for user before accessing userName */}
                  {user?.userName && <p>{user.userName}</p>}
                  {orderDetails.addressInfo.region && <p>{orderDetails.addressInfo.region}</p>}
                  {orderDetails.addressInfo.address && <p>{orderDetails.addressInfo.address}</p>}
                  {orderDetails.addressInfo.city && <p>{orderDetails.addressInfo.city}</p>}
                  {orderDetails.addressInfo.phone && <p className="font-mono">{orderDetails.addressInfo.phone}</p>}
                  {orderDetails.addressInfo.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500">Notes:</p>
                      <p className="italic">{orderDetails.addressInfo.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DialogContent>
  )
}

export default ShoppingOrderDetailsView;