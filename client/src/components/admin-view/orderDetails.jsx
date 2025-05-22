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
    // First check for direct userName in the order details
    if (orderDetails.userName) {
      return orderDetails.userName;
    }
    
    // Check if user is an object with userName
    if (typeof orderDetails.user === 'object') {
      if (orderDetails.user?.userName) {
        return orderDetails.user.userName;
      }
      if (orderDetails.user?.name) {
        return orderDetails.user.name;
      }
    }
    
    // IMPORTANT: For the customer's privacy and better display, 
    // we'll just return "Customer" instead of showing IDs
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

  // Simple solution - use the values shown in the orders table
  const calculateAdminSubtotal = () => {
    if (!orderDetails) return 0;
    
    // Direct approach - use adminTotalAmount directly from the server response
    // This is the exact value shown in the orders table
    if (orderDetails.adminTotalAmount !== undefined) {
      const amount = parseFloat(orderDetails.adminTotalAmount);
      if (!isNaN(amount)) {
        return amount;
      }
    }
    
      // Calculate based on admin's items
    const adminItems = getAdminItems();
    if (adminItems && adminItems.length > 0) {
      return adminItems.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity, 10) || 1;
        return total + (price * quantity);
      }, 0);
    }
    
    // Final fallback
    return 0;
  };

  // Calculate direct values first to avoid circular dependency
  const adminSubtotal = calculateAdminSubtotal();
  
  // Get the shipping fee from metadata for admin
  const calculateShippingFee = () => {
    // Check if we have vendor-specific shipping fees in metadata
    if (orderDetails?.metadata?.shippingDetails?.vendorShipping) {
      const adminId = user?.id;
      const vendorShipping = orderDetails.metadata.shippingDetails.vendorShipping;
      
      // If we have vendor-specific shipping fee for this admin, use it
      if (adminId && vendorShipping[adminId]) {
        const fee = vendorShipping[adminId].fee;
        return typeof fee === 'object' ? fee.fee || 0 : parseFloat(fee) || 0;
      }
    }
    
    // Default to 0 as per the UI requirements
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
        </div>
        
        {/* Price Details section removed as requested */}
        
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
                  <span className="font-medium">Customer</span>
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