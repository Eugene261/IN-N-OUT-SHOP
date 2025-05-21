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
    if (price === undefined || price === null) return 'GHS 0.00';

    // Handle case where price might be an object with a fee property
    if (typeof price === 'object' && price !== null) {
      if (price.fee !== undefined && typeof price.fee === 'number') {
        return `GHS ${price.fee.toFixed(2)}`;
      }
      return 'GHS 0.00';
    }
    
    // Convert to number if it's a string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;

    // Check if it's a valid number after conversion
    if (isNaN(numPrice)) return 'GHS 0.00';

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

  // Determine shipping fee based on order data
  // First, check if we have a shipping fee directly on the order
  let calculatedShippingFee = 0;
  
  // First check if we have shipping fee in metadata (most accurate)
  if (orderDetails.metadata && orderDetails.metadata.shippingDetails && 
      typeof orderDetails.metadata.shippingDetails.totalShippingFee === 'number') {
    calculatedShippingFee = orderDetails.metadata.shippingDetails.totalShippingFee;
    console.log('Using shipping fee from metadata:', calculatedShippingFee);
  } 
  // Then check if we have a shipping fee directly on the order
  else if (orderDetails.shippingFee) {
    calculatedShippingFee = orderDetails.shippingFee;
    console.log('Using order shippingFee:', calculatedShippingFee);
  } 
  // Calculate from adminShippingFees if available
  else if (orderDetails.adminShippingFees && Object.keys(orderDetails.adminShippingFees).length > 0) {
    calculatedShippingFee = Object.values(orderDetails.adminShippingFees).reduce((total, fee) => {
      return total + (typeof fee === 'object' ? fee.fee || 0 : fee || 0);
    }, 0);
    console.log('Calculated from adminShippingFees:', calculatedShippingFee);
  } 
  // Calculate from adminGroups if available
  else if (orderDetails.adminGroups && orderDetails.adminGroups.length > 0) {
    calculatedShippingFee = orderDetails.adminGroups.reduce((total, group) => {
      return total + (group.shippingFee || 0);
    }, 0);
    console.log('Calculated from adminGroups:', calculatedShippingFee);
  }
  // If shipping fee is zero but we have a total amount, try to determine from metadata or calculate it
  else if (calculatedShippingFee === 0 && orderDetails.totalAmount) {
    // Check if we have shipping details in metadata
    if (orderDetails.metadata && orderDetails.metadata.shippingDetails && orderDetails.metadata.shippingDetails.totalFee) {
      calculatedShippingFee = orderDetails.metadata.shippingDetails.totalFee;
    } 
    // If we have admin shipping fees, sum them up
    else if (orderDetails.adminShippingFees && Object.keys(orderDetails.adminShippingFees).length > 0) {
      calculatedShippingFee = Object.entries(orderDetails.adminShippingFees)
        .reduce((sum, [_, fee]) => sum + (typeof fee === 'object' ? fee.fee || 0 : fee || 0), 0);
    }
    // If still zero but we have cart items, calculate based on location
    else if (calculatedShippingFee === 0 && orderDetails.cartItems && orderDetails.cartItems.length > 0) {
      // Group items by admin/vendor
      const adminGroups = {};
      
      orderDetails.cartItems.forEach(item => {
        const adminId = item.adminId || 'unknown';
        if (!adminGroups[adminId]) {
          adminGroups[adminId] = { items: [] };
        }
        adminGroups[adminId].items.push(item);
      });
      
      // Calculate shipping fee based on location (standard rate of 40 GHS in Accra, 70 GHS outside)
      const city = (orderDetails.addressInfo?.city || '').toLowerCase();
      const region = (orderDetails.addressInfo?.region || '').toLowerCase();
      const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
      
      // For each vendor group, apply standard shipping fee
      const perVendorShippingFee = isAccra ? 40 : 70;
      calculatedShippingFee = Object.keys(adminGroups).length * perVendorShippingFee;
    }
  }
  
  // Use final calculated shipping fee
  const totalShippingFee = calculatedShippingFee;
  
  // We don't need to modify the original orderDetails object
  // Just use our calculated totalShippingFee for display
  
  // Check if we have shipping data in metadata (new format)
  const hasVendorShipping = orderDetails.metadata && 
                           orderDetails.metadata.shippingDetails && 
                           orderDetails.metadata.shippingDetails.vendorShipping;

  // Extract vendor shipping details if available
  const vendorShippingDetails = hasVendorShipping ? 
                               orderDetails.metadata.shippingDetails.vendorShipping : null;
  
  // Get total shipping fee from metadata if available (most accurate)
  let metadataShippingFee = null;
  if (orderDetails.metadata && orderDetails.metadata.shippingDetails && 
      typeof orderDetails.metadata.shippingDetails.totalShippingFee === 'number') {
    metadataShippingFee = orderDetails.metadata.shippingDetails.totalShippingFee;
  }
  
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
    // Or try to create from cart items
    else if (orderDetails.cartItems && orderDetails.cartItems.length > 0) {
      const vendorGroups = {};
      orderDetails.cartItems.forEach(item => {
        const adminId = item.adminId || 'unknown';
        if (!vendorGroups[adminId]) {
          vendorGroups[adminId] = {
            vendorName: item.adminName || 'Vendor',
            count: 0
          };
        }
        vendorGroups[adminId].count += item.quantity || 1;
      });
      
      // Only create if we have multiple vendors
      if (Object.keys(vendorGroups).length > 1) {
        generatedVendorShipping = {};
        const city = (orderDetails.addressInfo?.city || '').toLowerCase();
        const region = (orderDetails.addressInfo?.region || '').toLowerCase();
        const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
        const perVendorFee = isAccra ? 40 : 70;
        
        Object.entries(vendorGroups).forEach(([adminId, details]) => {
          generatedVendorShipping[adminId] = {
            fee: perVendorFee,
            vendorName: details.vendorName
          };
        });
      }
    }
  }
  
  // Debug logging removed
  
  // Use either existing vendor shipping details or generated ones
  const effectiveVendorShipping = vendorShippingDetails || generatedVendorShipping;
  const hasEffectiveVendorShipping = effectiveVendorShipping && Object.keys(effectiveVendorShipping).length > 0; // Changed from > 1 to > 0
  
  // Calculate subtotal by summing the prices of all items
  const subtotal = orderDetails.cartItems ? 
    orderDetails.cartItems.reduce((sum, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const quantity = item.quantity || 1;
      return sum + (itemPrice * quantity);
    }, 0) : 0;
  
  // Calculate shipping fee from cart items and vendor info - handle case where shippingFee is 0 but we should have one
  if (calculatedShippingFee === 0 && orderDetails.totalAmount && subtotal > 0) {
    // If we have a valid subtotal and total amount, derive shipping fee from the difference
    calculatedShippingFee = orderDetails.totalAmount - subtotal;
    
    // If we have generated vendor shipping info, distribute the total shipping fee proportionally
    if (generatedVendorShipping && Object.keys(generatedVendorShipping).length > 0) {
      const vendorCount = Object.keys(generatedVendorShipping).length;
      const perVendorFee = calculatedShippingFee / vendorCount;
      
      // Update generated shipping fees
      Object.keys(generatedVendorShipping).forEach(vendorId => {
        generatedVendorShipping[vendorId].fee = perVendorFee;
      });
    }
  }

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
              <span className="font-medium">{formatPrice(totalShippingFee)}</span>
            </div>
            
            {/* Display shipping fee breakdown for vendors */}
            <div className="ml-6 text-xs text-gray-500 space-y-1 mt-1">
              {/* Improved shipping fee display logic - prioritize metadata shipping info */}
              {orderDetails.cartItems && orderDetails.cartItems.length > 0 ? (
                <>
                  {/* First try to use metadata shipping details if available (most accurate) */}
                  {vendorShippingDetails && Object.keys(vendorShippingDetails).length > 0 ? (
                    // Use the vendor shipping details from metadata
                    Object.entries(vendorShippingDetails).map(([vendorId, vendorData]) => {
                      const vendorName = (vendorData.vendorName && vendorData.vendorName.toLowerCase() !== 'vendor')
                        ? vendorData.vendorName
                        : `Vendor ${vendorId.substring(0, 6)}`;
                      
                      // Get the fee (handling both object and primitive cases)
                      const fee = typeof vendorData.fee === 'object' 
                        ? vendorData.fee.fee || 0 
                        : vendorData.fee || 0;
                          
                      return (
                        <div key={vendorId} className="flex justify-between">
                          <span>{vendorName} shipping:</span>
                          <span>{formatPrice(fee)}</span>
                        </div>
                      );
                    })
                  ) : generatedVendorShipping && Object.keys(generatedVendorShipping).length > 0 ? (
                    // Fallback to generated vendor shipping if metadata not available
                    Object.entries(generatedVendorShipping).map(([vendorId, vendorData]) => {
                      // Try to find a corresponding cart item for better vendor name
                      const cartItem = orderDetails.cartItems.find(item => item.adminId === vendorId);
                      const vendorName = (cartItem?.adminName && cartItem.adminName.toLowerCase() !== 'vendor')
                        ? cartItem.adminName
                        : (vendorData.vendorName && vendorData.vendorName.toLowerCase() !== 'vendor')
                          ? vendorData.vendorName
                          : `Vendor ${vendorId.substring(0, 6)}`;
                      
                      // Get the fee (handling both object and primitive cases)
                      const fee = typeof vendorData.fee === 'object' 
                        ? vendorData.fee.fee || 0 
                        : vendorData.fee || 0;
                          
                      return (
                        <div key={vendorId} className="flex justify-between">
                          <span>{vendorName} shipping:</span>
                          <span>{formatPrice(fee)}</span>
                        </div>
                      );
                    })
                  ) : (
                    // If no vendor shipping data, group cart items by admin and use best guess for fees
                    Object.entries(
                      orderDetails.cartItems.reduce((acc, item) => {
                        // Get vendor ID, defaulting to unknown if missing
                        const vendorId = item.adminId || 'unknown';
                        if (!acc[vendorId]) {
                          // Try to get vendor name from multiple sources
                          const vendorName = item.adminName || 
                            (item.vendor && typeof item.vendor === 'object' && item.vendor.username) || 
                            `Vendor ${vendorId.substring(0, 6)}`;
                            
                          // If we have a total shipping fee and multiple vendors, split evenly
                          let shippingFee = 0;
                          if (totalShippingFee > 0) {
                            // Count unique vendors
                            const uniqueVendors = new Set(orderDetails.cartItems.map(i => i.adminId || 'unknown'));
                            // Split shipping fee among vendors
                            shippingFee = totalShippingFee / uniqueVendors.size;
                          } else {
                            // Fallback to location-based fee
                            const city = (orderDetails.addressInfo?.city || '').toLowerCase();
                            const region = (orderDetails.addressInfo?.region || '').toLowerCase();
                            const isAccra = city.includes('accra') || region.includes('accra') || region.includes('greater accra');
                            shippingFee = isAccra ? 40 : 70;
                          }
                          
                          acc[vendorId] = {
                            vendorName,
                            shippingFee
                          };
                        }
                        return acc;
                      }, {})
                    ).map(([vendorId, info]) => (
                      <div key={vendorId} className="flex justify-between">
                        <span>{info.vendorName} shipping:</span>
                        <span>{formatPrice(info.shippingFee)}</span>
                      </div>
                    ))
                  )}
                </>
              ) : totalShippingFee > 0 ? (
                // If no cart items but we do have a shipping fee, show generic entry
                <div className="flex justify-between">
                  <span>Standard shipping:</span>
                  <span>{formatPrice(totalShippingFee)}</span>
                </div>
              ) : null}
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