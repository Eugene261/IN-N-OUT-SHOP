import React, { useState, useEffect } from 'react'
import { DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2 } from 'lucide-react';
import CommonForm from '../common/form';
import { useDispatch, useSelector } from 'react-redux';
import { updateOrderStatus, resetUpdateStatus } from '@/store/admin/order-slice';

function AdminOrderDetailsView({ orderDetails, user }) {
  const dispatch = useDispatch();
  const { updateStatus } = useSelector(state => state.adminOrder);
  
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

  if (!orderDetails) return null;


  console.log(orderDetails, 'orderDetails');
  

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
            <p className="font-medium">Order Price</p>
            <Label className="font-semibold">{formatPrice(orderDetails.adminTotalAmount || orderDetails.totalAmount)}</Label>
          </div>
        </div>
        
        <Separator/>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium text-lg">Order Items</div>
            <ul className='grid gap-3'>
              {orderDetails.cartItems && orderDetails.cartItems.length > 0 ? (
                orderDetails.cartItems.map((item, index) => (
                  <li key={index} className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title || item.tilte || `Product ${index + 1}`}</span>
                        <span className="text-sm text-gray-500">x{item.quantity || 1}</span>
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
                          {item.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <span className="font-medium">{formatPrice(item.price)}</span>
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
                {orderDetails?.user?.userName && <div className="flex justify-between"><span className="text-gray-600">Customer:</span> <span>{orderDetails?.user?.userName}</span></div>}
                {orderDetails.addressInfo.region && <div className="flex justify-between"><span className="text-gray-600">Region:</span> <span>{orderDetails.addressInfo.region}</span></div>}
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