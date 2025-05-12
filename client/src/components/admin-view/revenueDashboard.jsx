import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRevenueStats, fetchAdminOrders, updateOrderStatus } from '@/store/admin/revenue-slice';
import { DollarSign, Package, ShoppingBag, TruckIcon, CreditCard, BarChart3, X, ArrowRight } from 'lucide-react';
import AdminRevenueStats from './adminRevenueStats';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] 
    }
  }
};

function RevenueDashboard() {
  const dispatch = useDispatch();
  const { revenueStats, adminOrders, isLoading, error } = useSelector(state => state.adminRevenue);
  const { user } = useSelector(state => state.auth);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  
  // Order details dialog states
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState('');

  useEffect(() => {
    dispatch(fetchRevenueStats());
    dispatch(fetchAdminOrders());
  }, [dispatch]);
  
  // Function to open dialog with specific content
  const openCardDialog = (type) => {
    console.log('Opening dialog:', type);
    setDialogType(type);
    
    switch(type) {
      case 'revenue':
        setDialogTitle('Revenue Details');
        setDialogDescription('Breakdown of your total earnings');
        break;
      case 'items':
        setDialogTitle('Items Sold');
        setDialogDescription('Details of products sold');
        break;
      case 'orders':
        setDialogTitle('Order History');
        setDialogDescription('All orders containing your products');
        break;
      case 'pending':
        setDialogTitle('Pending Deliveries');
        setDialogDescription('Orders that need to be delivered');
        break;
      case 'payments':
        setDialogTitle('Confirmed Payments');
        setDialogDescription('Orders with confirmed payments');
        break;
      case 'products':
        setDialogTitle('Your Products');
        setDialogDescription('All products in your inventory');
        break;
      default:
        setDialogTitle('Details');
        setDialogDescription('');
    }
    
    setOpenDialog(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `GH₵${parseFloat(amount || 0).toFixed(2)}`;
  };
  
  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'No date available';
    
    try {
      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'No date available';
      }
      
      // Format the date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'No date available';
    }
  };

  // Custom Modal Component - Inline version without dark background
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    
    return (
      <div className="mt-8 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-full overflow-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  };
  
  // Render dialog content based on type
  const renderDialogContent = () => {
    switch(dialogType) {
      case 'revenue':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800">Total Revenue</h4>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(revenueStats?.totalRevenue)}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Revenue Breakdown</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total Orders:</span>
                  <span className="font-medium">{revenueStats?.totalOrders || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Order Value:</span>
                  <span className="font-medium">
                    {formatCurrency(revenueStats?.totalRevenue / (revenueStats?.totalOrders || 1))}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        );
      case 'items':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">Total Items Sold</h4>
              <p className="text-2xl font-bold text-blue-900">{revenueStats?.totalItemsSold || 0}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Items Breakdown</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Total Products:</span>
                  <span className="font-medium">{revenueStats?.adminProducts || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Items Per Order:</span>
                  <span className="font-medium">
                    {(revenueStats?.totalItemsSold / (revenueStats?.totalOrders || 1)).toFixed(2)}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800">Total Orders</h4>
              <p className="text-2xl font-bold text-purple-900">{revenueStats?.totalOrders || 0}</p>
            </div>
            <div className="border-t pt-4 max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-2">Recent Orders</h4>
              {adminOrders && adminOrders.length > 0 ? (
                <ul className="space-y-3">
                  {adminOrders.slice(0, 5).map(order => (
                    <li key={order._id} className="border p-3 rounded-md">
                      <div className="flex justify-between">
                        <span className="font-medium">Order #{order._id.substring(order._id.length - 6)}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(order.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No orders found</p>
              )}
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800">Pending Deliveries</h4>
              <p className="text-2xl font-bold text-yellow-900">{revenueStats?.pendingDeliveries || 0}</p>
            </div>
            <div className="border-t pt-4 max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-2">Orders Awaiting Delivery</h4>
              {adminOrders && adminOrders.length > 0 ? (
                <ul className="space-y-3">
                  {adminOrders
                    .filter(order => {
                      // Normalize status to lowercase for consistent comparison
                      const orderStatus = order.orderStatus ? order.orderStatus.toLowerCase() : '';
                      const paymentStatus = order.paymentStatus ? order.paymentStatus.toLowerCase() : '';
                      
                      // Only include confirmed, processing, and shipped orders that are paid
                      return ['confirmed', 'processing', 'shipped'].includes(orderStatus) && 
                             paymentStatus === 'paid';
                    })
                    .map(order => (
                      <li key={order._id} className="border p-3 rounded-md">
                        <div className="flex justify-between">
                          <span className="font-medium">Order #{order._id.substring(order._id.length - 6)}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.orderStatus === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                            order.orderStatus === 'processing' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatDate(order.createdAt)}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setUpdatedStatus(order.orderStatus);
                            setOpenDialog(false);
                            setOpenOrderDialog(true);
                          }}
                          className="mt-2 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                        >
                          Update Status
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-gray-500">No pending deliveries</p>
              )}
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-medium text-indigo-800">Confirmed Payments</h4>
              <p className="text-2xl font-bold text-indigo-900">{revenueStats?.confirmedPayments || 0}</p>
            </div>
            <div className="border-t pt-4 max-h-96 overflow-y-auto">
              <h4 className="font-medium mb-2">Paid Orders</h4>
              {adminOrders && adminOrders.length > 0 ? (
                <ul className="space-y-3">
                  {adminOrders
                    .filter(order => order.paymentStatus === 'paid')
                    .map(order => (
                      <li key={order._id} className="border p-3 rounded-md">
                        <div className="flex justify-between">
                          <span className="font-medium">Order #{order._id.substring(order._id.length - 6)}</span>
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            Paid
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatDate(order.createdAt)}
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-gray-500">No confirmed payments</p>
              )}
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="space-y-4">
            <div className="bg-pink-50 p-4 rounded-lg">
              <h4 className="font-medium text-pink-800">Your Products</h4>
              <p className="text-2xl font-bold text-pink-900">{revenueStats?.adminProducts || 0}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Product Statistics</h4>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Sales per Product:</span>
                  <span className="font-medium">
                    {(revenueStats?.totalItemsSold / (revenueStats?.adminProducts || 1)).toFixed(2)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Revenue per Product:</span>
                  <span className="font-medium">
                    {formatCurrency(revenueStats?.totalRevenue / (revenueStats?.adminProducts || 1))}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        );
      default:
        return <p>No data available</p>;
    }
  };

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Revenue Dashboard</h2>
        <p className="text-gray-500">Sales performance for {user?.name || 'admin'}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={() => {
              dispatch(fetchRevenueStats());
              dispatch(fetchAdminOrders());
            }}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Revenue */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:border-green-200 hover:bg-green-50/10"
            onClick={() => openCardDialog('revenue')}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 font-medium">Total Revenue</h3>
              <span className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(revenueStats?.totalRevenue)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Lifetime earnings</p>
            <div className="mt-4 text-green-600 text-sm font-medium flex items-center">
              <span>View details</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </motion.div>

          {/* Total Items Sold */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-200 hover:bg-blue-50/10"
            onClick={() => openCardDialog('items')}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 font-medium">Items Sold</h3>
              <span className="p-2 bg-blue-100 rounded-full">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {revenueStats?.totalItemsSold || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total units sold</p>
            <div className="mt-4 text-blue-600 text-sm font-medium flex items-center">
              <span>View details</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </motion.div>

          {/* Total Orders */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:border-purple-200 hover:bg-purple-50/10"
            onClick={() => openCardDialog('orders')}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 font-medium">Total Orders</h3>
              <span className="p-2 bg-purple-100 rounded-full">
                <Package className="h-5 w-5 text-purple-600" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {revenueStats?.totalOrders || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Completed orders</p>
            <div className="mt-4 text-purple-600 text-sm font-medium flex items-center">
              <span>View details</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </motion.div>

          {/* Pending Deliveries */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:border-yellow-200 hover:bg-yellow-50/10"
            onClick={() => openCardDialog('pending')}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 font-medium">Pending Deliveries</h3>
              <span className="p-2 bg-yellow-100 rounded-full">
                <TruckIcon className="h-5 w-5 text-yellow-600" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {revenueStats?.pendingDeliveries || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Orders to be delivered</p>
            <div className="mt-4 text-yellow-600 text-sm font-medium flex items-center">
              <span>View details</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </motion.div>

          {/* Confirmed Payments */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/10"
            onClick={() => openCardDialog('payments')}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 font-medium">Confirmed Payments</h3>
              <span className="p-2 bg-indigo-100 rounded-full">
                <CreditCard className="h-5 w-5 text-indigo-600" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {revenueStats?.confirmedPayments || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Paid orders</p>
            <div className="mt-4 text-indigo-600 text-sm font-medium flex items-center">
              <span>View details</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </motion.div>

          {/* Total Products */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:border-pink-200 hover:bg-pink-50/10"
            onClick={() => openCardDialog('products')}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 font-medium">Your Products</h3>
              <span className="p-2 bg-pink-100 rounded-full">
                <BarChart3 className="h-5 w-5 text-pink-600" />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {revenueStats?.adminProducts || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Products in inventory</p>
            <div className="mt-4 text-pink-600 text-sm font-medium flex items-center">
              <span>View details</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </motion.div>
        </div>
        
        {/* Revenue Analytics Section */}
        <AdminRevenueStats />
        
        {/* Main Dialog Modal */}
        <Modal
          isOpen={openDialog}
          onClose={() => setOpenDialog(false)}
          title={dialogTitle}
        >
          {renderDialogContent()}
        </Modal>
        
        {/* Order Status Update Modal */}
        <Modal
          isOpen={openOrderDialog}
          onClose={() => setOpenOrderDialog(false)}
          title="Update Order Status"
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">Order #{selectedOrder._id.substring(selectedOrder._id.length - 6)}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Created on {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Select New Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => setUpdatedStatus(status)}
                      className={`px-3 py-2 rounded-md text-sm capitalize ${updatedStatus === status
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => setOpenOrderDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    dispatch(updateOrderStatus({
                      orderId: selectedOrder._id,
                      status: updatedStatus
                    }));
                    setOpenOrderDialog(false);
                    // Refresh data after a short delay
                    setTimeout(() => {
                      dispatch(fetchRevenueStats());
                      dispatch(fetchAdminOrders());
                    }, 1000);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Update Status
                </button>
              </div>
            </div>
          )}
        </Modal>
        </div>
      )}
    </motion.div>
  );
}

export default RevenueDashboard;
