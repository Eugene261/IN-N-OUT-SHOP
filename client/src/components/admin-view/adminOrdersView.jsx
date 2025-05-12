import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogTitle } from '../ui/dialog';
import AdminOrderDetailsView from './orderDetails';
import { motion } from 'framer-motion';
import { ArrowUpRight, Package, Calendar, CircleDollarSign, Search, X, Filter } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getOrdersDetailsForAdmin, resetOrderDetails } from '@/store/admin/order-slice';
import { fetchAdminOrders } from '@/store/admin/revenue-slice';

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
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] 
    } 
  }
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: i * 0.05, 
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }),
  hover: { 
    backgroundColor: "#f9f9f9",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    transition: { duration: 0.2 }
  }
};

function AdminOrdersView() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { orderDetails } = useSelector(state => state.adminOrder);
  const { adminOrders, isLoading, error } = useSelector(state => state.adminRevenue);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  // Filter states
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  function handleFetchOrderDetailsForAdmin(getId) {
    setSelectedOrderId(getId);
    dispatch(getOrdersDetailsForAdmin(getId)); // Dispatch action to fetch order details
  }

  const getStatusStyles = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500 text-white';
      case 'shipped':
        return 'bg-blue-500 text-white';
      case 'confirmed':
        return 'bg-purple-500 text-white';
      case 'processing':
        return 'bg-yellow-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'pending':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  useEffect(() => {
    dispatch(fetchAdminOrders());
  }, [dispatch]);

  useEffect(() => {
    if(orderDetails !== null) setOpenDetailsDialog(true);
  }, [orderDetails]);

  const handleCloseDialog = () => {
    setOpenDetailsDialog(false);
    dispatch(resetOrderDetails());
  };
  
  // Filter orders based on criteria and sort by date (newest first)
  const getFilteredOrders = () => {
    if (!adminOrders) return [];
    
    // First filter the orders
    const filteredOrders = adminOrders.filter(order => {
      // Filter by order ID (partial match)
      const orderIdMatch = orderIdFilter 
        ? order._id.toLowerCase().includes(orderIdFilter.toLowerCase()) ||
          (order._id.slice(-6).toLowerCase().includes(orderIdFilter.toLowerCase()))
        : true;
      
      // Filter by date range
      let dateMatch = true;
      const orderDate = new Date(order.orderDate || order.createdAt);
      
      if (startDateFilter) {
        const startDate = new Date(startDateFilter);
        startDate.setHours(0, 0, 0, 0); // Start of day
        dateMatch = dateMatch && orderDate >= startDate;
      }
      
      if (endDateFilter) {
        const endDate = new Date(endDateFilter);
        endDate.setHours(23, 59, 59, 999); // End of day
        dateMatch = dateMatch && orderDate <= endDate;
      }
      
      return orderIdMatch && dateMatch;
    });
    
    // Then sort by date (newest first)
    return filteredOrders.sort((a, b) => {
      const dateA = new Date(a.orderDate || a.createdAt);
      const dateB = new Date(b.orderDate || b.createdAt);
      return dateB - dateA; // Descending order (newest first)
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setOrderIdFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={cardVariants}>
        <Card className="border-0 shadow-md rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 py-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white font-medium tracking-tight text-xl">
                My Orders
              </CardTitle>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 text-white bg-slate-600 hover:bg-slate-500 transition-colors px-3 py-1.5 rounded-full text-sm`}
                >
                  <Filter className="w-4 h-4" />
                  <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                </button>
                <span className="text-sm text-gray-200 bg-slate-600 px-3 py-1 rounded-full">
                  {getFilteredOrders().length} / {adminOrders.length} orders
                </span>
              </div>
            </div>
          </CardHeader>
          
          {showFilters && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderIdFilter}
                      onChange={(e) => setOrderIdFilter(e.target.value)}
                      placeholder="Search by order ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent pl-9"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex-none">
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 text-center text-gray-500">
                Loading orders...
              </div>
            ) : error ? (
              <div className="py-16 text-center text-red-500">
                Error loading orders: {error}
              </div>
            ) : (
              <Table className="w-full">
                <TableHeader className="bg-gray-50 border-b border-gray-100">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="font-medium text-gray-500 py-5 px-6">Order ID</TableHead>
                    <TableHead className="font-medium text-gray-500 px-6">Date</TableHead>
                    <TableHead className="font-medium text-gray-500 px-6">Status</TableHead>
                    <TableHead className="font-medium text-gray-500 px-6">Amount</TableHead>
                    <TableHead className="font-medium text-gray-500 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {getFilteredOrders().length > 0 ? (
                    getFilteredOrders().map((orderItem, index) => (
                      <motion.tr
                        key={orderItem._id}
                        variants={rowVariants}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        className="border-b border-gray-100 cursor-pointer"
                      >
                        <TableCell className="font-medium py-5 px-6">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-mono">#{orderItem._id.slice(-6).toUpperCase()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {new Date(orderItem.orderDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusStyles(orderItem.orderStatus)}`}>
                            {orderItem.orderStatus}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium px-6">
                          <div className="flex items-center gap-2">
                            <CircleDollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900">GHS {(orderItem.adminTotalAmount || orderItem.totalAmount).toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex justify-end gap-2">
                            <motion.button
                              onClick={() => handleFetchOrderDetailsForAdmin(orderItem._id)}
                              className="inline-flex items-center gap-1.5 text-gray-700 hover:text-black 
                              transition-colors py-1.5 px-3 rounded-full hover:bg-gray-100 cursor-pointer"
                              whileHover={{ x: 2 }}
                            >
                              <span className="text-sm font-medium">View</span>
                              <ArrowUpRight className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={openDetailsDialog} onOpenChange={handleCloseDialog}>
        <DialogTitle className="sr-only">Order Details</DialogTitle>
        {orderDetails && <AdminOrderDetailsView orderDetails={orderDetails} user={user} />}
      </Dialog>
    </motion.div>
  );
}

export default AdminOrdersView;
