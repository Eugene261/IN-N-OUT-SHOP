import React from 'react'
import { DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

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
    if (price === undefined || price === null) return 'N/A';

    // Convert to number if it's a string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;

    // Check if it's a valid number after conversion
    if (isNaN(numPrice)) return 'N/A';

    return `GHS ${numPrice.toFixed(2)}`;
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
            
            <p className="font-medium text-sm text-gray-700">Total Amount</p>
            <p className="text-sm text-right font-semibold">{formatPrice(orderDetails.totalAmount)}</p>

            <p className="font-medium text-sm text-gray-700">Payment Method</p>
            <p className="text-sm text-right font-semibold">{orderDetails?.paymentMethod}</p>

            <p className="font-medium text-sm text-gray-700">Payment Status</p>
            <p className="text-sm text-right font-semibold">{orderDetails?.paymentStatus}</p>
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
                    <span className="font-medium">{formatPrice(item.price)}</span>
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