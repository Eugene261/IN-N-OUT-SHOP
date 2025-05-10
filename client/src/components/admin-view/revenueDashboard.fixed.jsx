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
    </motion.div>
  );
}

export default RevenueDashboard;
