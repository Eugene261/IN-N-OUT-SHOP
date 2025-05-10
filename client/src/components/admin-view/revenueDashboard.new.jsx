import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRevenueStats, fetchAdminOrders, updateOrderStatus } from '@/store/admin/revenue-slice';
import { DollarSign, Package, ShoppingBag, TruckIcon, CreditCard, BarChart3, X, ArrowRight } from 'lucide-react';

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
      )}

      {/* Order Details Modal */}
      {openOrderDialog && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Package className="h-5 w-5 text-blue-600" />
                  Order Details
                </div>
                <button 
                  onClick={() => setOpenOrderDialog(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Update the status for order #{selectedOrder._id.slice(-6).toUpperCase()}
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Order ID:</span>
                    <span className="font-mono font-medium">#{selectedOrder._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Date:</span>
                    <span>{new Date(selectedOrder.orderDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Current Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${selectedOrder.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {selectedOrder.orderStatus}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700">Update Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                      <button
                        key={status}
                        type="button"
                        className={`px-3 py-2 text-sm rounded-md border ${updatedStatus === status ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700'} font-medium shadow-sm hover:bg-gray-50 transition-colors capitalize`}
                        onClick={() => setUpdatedStatus(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-700 mb-2">Order Items</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedOrder.cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-gray-500 text-sm">x{item.quantity}</span>
                        </div>
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setOpenOrderDialog(false)}
                    className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      dispatch(updateOrderStatus({
                        orderId: selectedOrder._id,
                        status: updatedStatus
                      }));
                      setOpenOrderDialog(false);
                    }}
                    className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium shadow-sm hover:shadow-blue-500/30 transition-colors"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default RevenueDashboard;      {/* Custom Modal Dialog */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  {dialogType === 'revenue' && <DollarSign className="h-5 w-5 text-green-600" />}
                  {dialogType === 'items' && <ShoppingBag className="h-5 w-5 text-blue-600" />}
                  {dialogType === 'orders' && <Package className="h-5 w-5 text-purple-600" />}
                  {dialogType === 'pending' && <TruckIcon className="h-5 w-5 text-yellow-600" />}
                  {dialogType === 'payments' && <CreditCard className="h-5 w-5 text-indigo-600" />}
                  {dialogType === 'products' && <BarChart3 className="h-5 w-5 text-pink-600" />}
                  {dialogTitle}
                </div>
                <button 
                  onClick={() => setOpenDialog(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-4">{dialogDescription}</p>
              
              <div className="py-4">
                {dialogType === 'revenue' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Revenue Breakdown</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-sm text-gray-500">Total Revenue</p>
                          <p className="text-xl font-bold">{formatCurrency(revenueStats?.totalRevenue)}</p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-sm text-gray-500">Average Order Value</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(revenueStats?.totalOrders ? revenueStats.totalRevenue / revenueStats.totalOrders : 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Recent Transactions</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {adminOrders && adminOrders.length > 0 ? (
                              adminOrders.slice(0, 5).map(order => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">#{order._id.slice(-6).toUpperCase()}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.orderDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(order.totalAmount)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" className="px-4 py-2 text-center text-sm text-gray-500">No orders found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button 
                        type="button"
                        onClick={() => setOpenDialog(false)}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
                
                {dialogType === 'items' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Items Sold Summary</h3>
                      <p className="text-gray-600">You have sold a total of {revenueStats?.totalItemsSold || 0} items.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Recent Items Sold</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {adminOrders && adminOrders.length > 0 ? (
                              adminOrders.slice(0, 5).flatMap(order => 
                                order.cartItems.map((item, index) => (
                                  <tr key={`${order._id}-${index}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.price)}</td>
                                  </tr>
                                ))
                              )
                            ) : (
                              <tr>
                                <td colSpan="3" className="px-4 py-2 text-center text-sm text-gray-500">No items found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button 
                        type="button"
                        onClick={() => setOpenDialog(false)}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
                
                {dialogType === 'orders' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Order Summary</h3>
                      <p className="text-gray-600">You have received a total of {revenueStats?.totalOrders || 0} orders.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Recent Orders</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {adminOrders && adminOrders.length > 0 ? (
                              adminOrders.slice(0, 5).map(order => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">#{order._id.slice(-6).toUpperCase()}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded-full text-xs ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                      {order.orderStatus}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(order.totalAmount)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="px-4 py-2 text-center text-sm text-gray-500">No orders found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => setOpenDialog(false)}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                      <button 
                        type="button"
                        onClick={() => window.location.href = '/admin/orders'}
                        className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium shadow-sm hover:shadow-blue-500/30 transition-colors"
                      >
                        View All Orders
                      </button>
                    </div>
                  </div>
                )}
                
                {dialogType === 'pending' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Pending Deliveries</h3>
                      <p className="text-gray-600">You have {revenueStats?.pendingDeliveries || 0} orders pending delivery.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Orders Awaiting Delivery</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {adminOrders && adminOrders.length > 0 ? (
                              adminOrders
                                .filter(order => ['confirmed', 'processing', 'shipped'].includes(order.orderStatus))
                                .slice(0, 5)
                                .map(order => (
                                  <tr key={order._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">#{order._id.slice(-6).toUpperCase()}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      <span className={`px-2 py-1 rounded-full text-xs ${order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {order.orderStatus}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      <button 
                                        type="button"
                                        className="px-3 py-1 text-sm rounded-md border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          setUpdatedStatus(order.orderStatus);
                                          setOpenOrderDialog(true);
                                          setOpenDialog(false);
                                        }}
                                      >
                                        Update Status
                                      </button>
                                    </td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="px-4 py-2 text-center text-sm text-gray-500">No pending deliveries</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => setOpenDialog(false)}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                      <button 
                        type="button"
                        onClick={() => window.location.href = '/admin/orders'}
                        className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium shadow-sm hover:shadow-blue-500/30 transition-colors"
                      >
                        View All Orders
                      </button>
                    </div>
                  </div>
                )}
                
                {dialogType === 'payments' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Confirmed Payments</h3>
                      <p className="text-gray-600">You have {revenueStats?.confirmedPayments || 0} orders with confirmed payments.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Paid Orders</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {adminOrders && adminOrders.length > 0 ? (
                              adminOrders
                                .filter(order => order.paymentStatus === 'paid')
                                .slice(0, 5)
                                .map(order => (
                                  <tr key={order._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">#{order._id.slice(-6).toUpperCase()}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(order.totalAmount)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{order.paymentMethod || 'N/A'}</td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="px-4 py-2 text-center text-sm text-gray-500">No paid orders found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button 
                        type="button"
                        onClick={() => setOpenDialog(false)}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
                
                {dialogType === 'products' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-700 mb-2">Your Products</h3>
                      <p className="text-gray-600">You have {revenueStats?.adminProducts || 0} products in your inventory.</p>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => setOpenDialog(false)}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                      <button 
                        type="button"
                        onClick={() => window.location.href = '/admin/products'}
                        className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium shadow-sm hover:shadow-blue-500/30 transition-colors"
                      >
                        Manage Products
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
