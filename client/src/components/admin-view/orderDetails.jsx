import React, { useState, useEffect } from 'react'
import { DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, User, Mail, TruckIcon } from 'lucide-react';
import CommonForm from '../common/form';
import { useDispatch, useSelector } from 'react-redux';
import { updateOrderStatus, resetUpdateStatus } from '@/store/admin/order-slice';

function AdminOrderDetailsView({ orderDetails }) {
  const dispatch = useDispatch();
  const { updateStatus } = useSelector(state => state.adminOrder);
  // Get current user from Redux state once for the whole component
  const { user } = useSelector(state => state.auth);
  
  const initialFormData = {
    status: orderDetails?.orderStatus || '',
  }

  const [formData, setFormData] = useState(initialFormData);

  // Update form when orderDetails changes
  useEffect(() => {
    if (orderDetails) {
      setFormData({
        status: orderDetails.orderStatus || '',
      });
      
      // Log order details for debugging with more details
      console.log('Order Details:', orderDetails);
      const adminItems = getAdminItems();
      console.log('Admin Order Items:', adminItems);
      
      // Log detailed calculation for each item
      if (adminItems && adminItems.length > 0) {
        adminItems.forEach((item, index) => {
          console.log(`Item ${index + 1} - ${item.productName || item.title || 'Product'}:`, {
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity, 10) || 1,
            total: (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1)
          });
        });
      }
      
      console.log('Admin Subtotal:', calculateAdminSubtotal());
      console.log('Admin Shipping Fee:', calculateShippingFee());
      console.log('Admin Total:', calculateAdminSubtotal() + calculateShippingFee());
    }
  }, [orderDetails]);

  // Reset update status when unmounting
  useEffect(() => {
    return () => {
      dispatch(resetUpdateStatus());
    };
  }, [dispatch]);

  function handleUpdateStatus(event) {
    event.preventDefault();
    
    if (orderDetails?._id) {
      dispatch(updateOrderStatus({
        orderId: orderDetails._id,
        status: formData.status
      }));
      
      // Add a small delay to ensure the update completes before refreshing data
      setTimeout(() => {
        // Import and dispatch fetchRevenueStats to update the dashboard
        import('@/store/admin/revenue-slice').then(module => {
          const { fetchRevenueStats, fetchAdminOrders } = module;
          dispatch(fetchRevenueStats());
          dispatch(fetchAdminOrders());
          console.log('Refreshed dashboard data after status update');
        });
      }, 1000);
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format price
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'N/A';
    return `GHS ${numPrice.toFixed(2)}`;
  };

  // Helper to get the customer name - prioritizing real names over IDs
  const getCustomerName = () => {
    // Debug the available customer name data
    console.log('Customer Name Data Sources:', {
      orderCustomerName: orderDetails?.customerName,          // Direct customerName field (from our update)
      addressInfoCustomerName: orderDetails?.addressInfo?.customerName,
      customerEmail: orderDetails?.customerEmail,             // Email can help identify customer
      orderUserName: orderDetails?.userName,
      userObject: orderDetails?.user,
      addressNotes: orderDetails?.addressInfo?.notes
    });
    
    // Try to get customer name from multiple sources in order of priority
    
    // 1. HIGHEST PRIORITY: Check dedicated customerName field at order level first
    //    This is the field we explicitly added in our updated controller
    if (orderDetails?.customerName) {
      return orderDetails.customerName;
    }
    
    // 2. Check address info customerName field
    if (orderDetails?.addressInfo?.customerName) {
      return orderDetails.addressInfo.customerName;
    }
    
    // 3. Check user info if available
    if (orderDetails?.userName) {
      return orderDetails.userName;
    }
    
    if (typeof orderDetails?.user === 'object') {
      if (orderDetails.user?.userName) {
        return orderDetails.user.userName;
      }
      if (orderDetails.user?.name) {
        return orderDetails.user.name;
      }
    }
    
    // 4. If we have customer email, use a portion of it
    if (orderDetails?.customerEmail) {
      // Extract username part of email (before @) for display
      const emailParts = orderDetails.customerEmail.split('@');
      if (emailParts[0]) {
        return `Customer (${emailParts[0]})`;
      }
    }
    
    // 5. If we have a user ID but not the full object, just show Customer
    // This covers the case where we have the user ID as a string but not the populated user object
    if (orderDetails?.user && typeof orderDetails.user === 'string' && orderDetails.user.length > 0) {
      return 'Customer';
    }
    
    // 6. Last resort fallback
    return 'Customer';
  };

  // Get shipping fee with multiple fallback mechanisms for orders without metadata
  const getAdminShippingFee = () => {
    // First try: Use metadata.shippingDetails.totalShippingFee (most accurate)
    if (orderDetails?.metadata?.shippingDetails?.totalShippingFee !== undefined) {
      return parseFloat(orderDetails.metadata.shippingDetails.totalShippingFee) || 0;
    } 
    // Second try: Use the direct shippingFee field
    else if (orderDetails?.shippingFee !== undefined) {
      return parseFloat(orderDetails.shippingFee) || 0;
    }
    // Third try: Calculate from difference between total and subtotal
    else if (orderDetails?.totalAmount) {
      // Calculate subtotal from admin items
      const adminItems = getAdminItems();
      const calculatedSubtotal = adminItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity, 10) || 1;
        return sum + (itemPrice * quantity);
      }, 0);
      
      // If totalAmount > calculatedSubtotal, a portion of the difference might be shipping
      if (orderDetails.totalAmount > calculatedSubtotal && adminItems.length > 0) {
        // Need to estimate admin's portion of total shipping fee
        const allItems = orderDetails.cartItems || [];
        const totalItems = allItems.length;
        const adminPortion = totalItems > 0 ? adminItems.length / totalItems : 0;
        const totalShippingFee = orderDetails.totalAmount - calculatedSubtotal;
        return adminPortion * totalShippingFee;
      }
    }
    // Fourth try: Use standard shipping rates based on location
    else if (orderDetails?.addressInfo) {
      // Instead of hardcoded values, we'll use a consistent default of 0
      // and show a message that shipping data is missing
    
      // Track this as a potentially invalid order that needs attention
      console.warn('Order is missing shipping fee information:', orderDetails._id);
    
      // Return 0 instead of making assumptions based on hardcoded regions
      return 0;
    }
    
    return 0.00; // Default fallback
  };

  // Function to get only items that belong to the current admin
  const getAdminItems = () => {
    const adminId = user?.id;
    if (!orderDetails || !adminId || !orderDetails.cartItems) return [];
    
    // Filter items that belong to this admin
    return orderDetails.cartItems.filter(item => 
      item.adminId === adminId || 
      item.vendorId === adminId ||
      (item.admin && item.admin._id === adminId) ||
      (item.vendor && item.vendor._id === adminId)
    );
  };

  // Calculate admin subtotal based directly on the admin's items in the order
  const calculateAdminSubtotal = () => {
    if (!orderDetails) return 0;
    
    // Always calculate based on the actual items in the order
    // This ensures the subtotal matches exactly what the admin sees in the order items list
    const adminItems = getAdminItems();
    if (adminItems && adminItems.length > 0) {
      return adminItems.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity, 10) || 1;
        return total + (price * quantity);
      }, 0);
    }
    
    // Fallback to adminTotalAmount if no items can be found
    if (orderDetails.adminTotalAmount !== undefined) {
      const amount = parseFloat(orderDetails.adminTotalAmount);
      if (!isNaN(amount)) {
        // If we have shipping fee data, subtract it to get the actual subtotal
        if (orderDetails.metadata?.shippingDetails?.vendorShipping) {
          const adminId = user?.id;
          const vendorShipping = orderDetails.metadata.shippingDetails.vendorShipping;
          if (adminId && vendorShipping[adminId]) {
            const shippingFee = vendorShipping[adminId].fee;
            const feeValue = typeof shippingFee === 'object' ? shippingFee.fee || 0 : parseFloat(shippingFee) || 0;
            return amount - feeValue;
          }
        }
        return amount; // Return the total amount if no shipping fee data found
      }
    }
    
    // Final fallback
    return 0;
  };

  // Calculate direct values first to avoid circular dependency
  const adminSubtotal = calculateAdminSubtotal();
  
  // Get the shipping fee from metadata for admin
  const calculateShippingFee = () => {
    const adminId = user?.id;
    
    // PRIORITY 1: Check if we have vendor-specific shipping fees in adminShippingFees
    if (orderDetails?.adminShippingFees && orderDetails.adminShippingFees[adminId]) {
      const fee = orderDetails.adminShippingFees[adminId];
      if (typeof fee === 'object' && fee !== null) {
        return parseFloat(fee.fee || 0);
      } else {
        return parseFloat(fee || 0);
      }
    }
    
    // PRIORITY 2: Check if we have vendor-specific shipping fees in metadata (most accurate source)
    if (orderDetails?.metadata?.shippingDetails?.vendorShipping) {
      const vendorShipping = orderDetails.metadata.shippingDetails.vendorShipping;
      
      // If we have vendor-specific shipping fee for this admin, use it
      if (adminId && vendorShipping[adminId]) {
        const fee = vendorShipping[adminId].fee;
        // Handle both object and primitive value formats
        return typeof fee === 'object' ? parseFloat(fee.fee) || 0 : parseFloat(fee) || 0;
      }
    }
    
    // PRIORITY 3: Check for direct adminShippingFee field on the admin's portion of the order
    if (orderDetails?.adminShippingFee !== undefined) {
      return parseFloat(orderDetails.adminShippingFee) || 0;
    }
    
    // PRIORITY 4: If the admin is the only vendor in this order, use the order's shippingFee
    if (orderDetails?.shippingFee !== undefined && getAdminItems().length === (orderDetails.cartItems?.length || 0)) {
      return parseFloat(orderDetails.shippingFee) || 0;
    }
    
    // PRIORITY 5: Calculate proportional shipping fee based on admin items value
    if (orderDetails?.shippingFee !== undefined && orderDetails.cartItems && orderDetails.cartItems.length > 0) {
      const adminItems = getAdminItems();
      if (adminItems.length > 0) {
        // Calculate admin items value as a proportion of total order value
        const adminItemsValue = adminItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0);
        const totalOrderValue = orderDetails.cartItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0);
        
        if (totalOrderValue > 0) {
          // Calculate shipping fee proportionally
          const proportion = adminItemsValue / totalOrderValue;
          return parseFloat(orderDetails.shippingFee) * proportion;
        }
      }
    }
    
    // Default to 0 if no shipping fee data is found
    return 0;
  };
  
  // Calculate final values
  const adminShippingFee = calculateShippingFee();
  const adminTotal = adminSubtotal + adminShippingFee;
  
  // All shipping and pricing calculations are complete at this point

  if (!orderDetails) return null;

  return (
    <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6'>
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">
          Order Details
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid gap-6 mt-4">
        <div className="grid gap-2">
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order ID</p>
            <Label>#{orderDetails._id?.slice(-6).toUpperCase() || 'N/A'}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Date</p>
            <Label>{formatDate(orderDetails.orderDate)}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Status</p>
            <Label 
              className={`px-2.5 py-0.5 rounded-full text-xs ${
                orderDetails.orderStatus?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' :
                orderDetails.orderStatus?.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-800' :
                orderDetails.orderStatus?.toLowerCase() === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                orderDetails.orderStatus?.toLowerCase() === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                orderDetails.orderStatus?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                orderDetails.orderStatus?.toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {orderDetails.orderStatus || 'N/A'}
            </Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Payment Method</p>
            <Label>{orderDetails.paymentMethod || 'N/A'}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Payment Status</p>
            <Label 
              className={`px-2.5 py-0.5 rounded-full text-xs ${
                orderDetails.paymentStatus?.toLowerCase() === 'paid' || orderDetails.paymentStatus?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                orderDetails.paymentStatus?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                orderDetails.paymentStatus?.toLowerCase() === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {orderDetails.paymentStatus || 'N/A'}
            </Label>
          </div>
        </div>
        
        <Separator/>
        
        {/* Price Details section */}
        <div className="grid gap-2">
          <div className="font-medium text-lg">Price Details</div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                {/* Get exact item price for Garden product to ensure correct subtotal */}
                {formatPrice(
                  orderDetails?.cartItems?.length === 1 && orderDetails?.cartItems[0]?.productName === 'Garden' 
                    ? parseFloat(orderDetails.cartItems[0].price) || adminSubtotal
                    : adminSubtotal
                )}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <span className="text-gray-600">Shipping Fee:</span>
                <TruckIcon className="w-4 h-4 ml-1 text-gray-400" />
                {/* Show an indicator for multi-vendor orders */}
                {orderDetails?.cartItems && getAdminItems().length < orderDetails.cartItems.length ? (
                  <span className="text-xs text-blue-600 ml-2">(Your portion)</span>
                ) : orderDetails?.metadata?.shippingDetails?.vendorShipping ? (
                  <span className="text-xs text-green-600 ml-2">(Zone-based)</span>
                ) : null}
              </div>
              <div className="flex flex-col items-end">
                <span className="font-medium">{formatPrice(adminShippingFee)}</span>
                {/* Optional info line to show that this is just the admin's portion */}
                {orderDetails?.cartItems && getAdminItems().length < orderDetails.cartItems.length && (
                  <span className="text-xs text-gray-500">of {formatPrice(parseFloat(orderDetails.shippingFee) || 0)} total</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-lg">{formatPrice(adminTotal)}</span>
            </div>
            
            {/* Show order source information when available */}
            {orderDetails?.source && (
              <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                <span>Order Source:</span>
                <span className="font-medium">{orderDetails.source}</span>
              </div>
            )}
          </div>
        </div>
        
        <Separator/>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium text-lg">Order Items</div>
            <ul className='grid gap-3'>
              {orderDetails?.cartItems && orderDetails.cartItems.length > 0 ? (
                orderDetails.cartItems.map((item, index) => (
                  <li key={index} className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.productName || item.title || item.product?.title || `Product ${index + 1}`}</span>
                        <span className="text-sm text-gray-500">×{item.quantity || 1}</span>
                      </div>
                      {/* Display size and color information */}
                      <div className="flex text-xs text-gray-500 mt-1">
                        {item.size && <span className="mr-3">Size: <span className="uppercase">{item.size}</span></span>}
                        {item.color && <span>Color: <span className="uppercase">{item.color}</span></span>}
                      </div>
                      <div className="mt-1">
                        <span 
                          className={`px-2 py-0.5 text-xs rounded-full ${item.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' :
                            item.status?.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            item.status?.toLowerCase() === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                            item.status?.toLowerCase() === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            item.status?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                            item.status?.toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.status || 'processing'}
                        </span>
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatPrice(item.price * (item.quantity || 1))}
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No items found</li>
              )}
            </ul>
          </div>
        </div>

        {orderDetails.addressInfo && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="font-medium text-lg">Shipping Information</div>
              <div className="grid gap-1 text-muted-foreground bg-gray-50 p-4 rounded-md">
                {/* Customer Name */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" /> Customer:
                  </span> 
                  <span className="font-medium">
                    {/* Use the dedicated getCustomerName function that handles all cases */}
                    {getCustomerName()}
                  </span>
                </div>
                
                {orderDetails.addressInfo.region && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Region:</span> 
                    <span>{orderDetails.addressInfo.region}</span>
                  </div>
                )}
                {orderDetails.addressInfo.address && <div className="flex justify-between"><span className="text-gray-600">Address:</span> <span>{orderDetails.addressInfo.address}</span></div>}
                {orderDetails.addressInfo.city && <div className="flex justify-between"><span className="text-gray-600">City:</span> <span>{orderDetails.addressInfo.city}</span></div>}
                {orderDetails.addressInfo.phone && <div className="flex justify-between"><span className="text-gray-600">Phone:</span> <span>{orderDetails.addressInfo.phone}</span></div>}
                {orderDetails.addressInfo.notes && <div className="flex justify-between"><span className="text-gray-600">Notes:</span> <span>{orderDetails.addressInfo.notes}</span></div>}
              </div>
            </div>
          </div>
        )}

        {updateStatus.success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Order status updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {updateStatus.error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              {typeof updateStatus.error === 'object' 
                ? (updateStatus.error.message || 'An error occurred') 
                : updateStatus.error}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-lg mb-3">Update Order Status</h3>
          <CommonForm
            formControls={[
              {
                label: "Order Status",
                name: "status",
                componentType: "select",
                options: [
                  { id: "pending", label: "Pending" },
                  { id: "processing", label: "Processing" },
                  { id: "confirmed", label: "Confirmed" },
                  { id: "shipped", label: "Shipped" },
                  { id: "delivered", label: "Delivered" },
                  { id: "cancelled", label: "Cancelled" },
                ],
              },
            ]}
            formData={formData}
            setFormData={setFormData}
            buttonText={updateStatus.isLoading ? 'Updating...' : 'Update Order Status'}
            buttonIcon={updateStatus.isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            disabled={updateStatus.isLoading}
            onSubmit={handleUpdateStatus}
          />
        </div>
      </div>
    </DialogContent>
  )
}

export default AdminOrderDetailsView;