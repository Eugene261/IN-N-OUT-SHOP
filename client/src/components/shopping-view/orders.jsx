import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Dialog, DialogContent } from '../ui/dialog'
import ShoppingOrderDetailsView from './orderDetails'
import { useDispatch, useSelector } from 'react-redux'
import { getAllOrdersByUserId, getOrdersDetails } from '@/store/shop/order-slice'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Package, Calendar, CircleDollarSign } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
}

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
}

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
}

function ShoppingOrders() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { orderList, isLoading, orderDetails } = useSelector(state => state.shopOrder)

  function handleFetchOrderDetails(getId) {
    setSelectedOrderId(getId)
    dispatch(getOrdersDetails(getId))
  }

  useEffect(() => {
    if (user?.id) {
      dispatch(getAllOrdersByUserId(user.id))
    }
  }, [dispatch, user])

  // Modified: Only open the dialog when we've fetched details for the *selected* order
  useEffect(() => {
    if(orderDetails !== null && selectedOrderId && orderDetails._id === selectedOrderId) {
      setOpenDetailsDialog(true)
    }
  }, [orderDetails, selectedOrderId])

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
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto"
    >
      <motion.div 
        className="mb-8 flex justify-between items-center"
        variants={cardVariants}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Orders</h1>
        <span className="text-sm text-gray-500">{orderList?.length || 0} orders found</span>
      </motion.div>

      <motion.div variants={cardVariants}>
        <Card className="border-0 shadow-md rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 py-6">
            <CardTitle className="text-white font-medium tracking-tight text-xl">
              Order History
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 text-center text-gray-500">
                <motion.div
                  animate={{ 
                    opacity: [0.5, 1, 0.5], 
                    scale: [0.98, 1, 0.98] 
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  Loading your orders...
                </motion.div>
              </div>
            ) : (
              <Table className="w-full">
                <TableHeader className="bg-gray-50 border-b border-gray-100">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="font-medium text-gray-500 py-5 px-6">Order ID</TableHead>
                    <TableHead className="font-medium text-gray-500 px-6">Date</TableHead>
                    <TableHead className="font-medium text-gray-500 px-6">Status</TableHead>
                    <TableHead className="font-medium text-gray-500 px-6">Total</TableHead>
                    <TableHead className="font-medium text-gray-500 px-6 text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  <AnimatePresence>
                    {orderList && orderList.length > 0 ? (
                      orderList.map((orderItem, index) => (
                        <motion.tr
                          key={orderItem._id}
                          variants={rowVariants}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          className="border-b border-gray-100 cursor-pointer"
                          onClick={() => handleFetchOrderDetails(orderItem?._id)}
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
                              <span className="text-gray-900">GHS {orderItem.totalAmount.toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFetchOrderDetails(orderItem?._id);
                              }}
                              className="inline-flex items-center gap-1.5 text-gray-700 hover:text-black 
                              transition-colors py-1.5 px-3 rounded-full hover:bg-gray-100 cursor-pointer"
                              whileHover={{ x: 2 }}
                            >
                              <span className="text-sm font-medium">View</span>
                              <ArrowUpRight className="w-4 h-4" />
                            </motion.button>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <TableCell colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package className="w-10 h-10 text-gray-300" />
                            <p className="text-gray-500 mt-2">No orders found</p>
                            <motion.a 
                              href="/shop"
                              whileHover={{ scale: 1.02 }}
                              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-full"
                            >
                              Continue Shopping
                            </motion.a>
                          </div>
                        </TableCell>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        {orderDetails && <ShoppingOrderDetailsView orderDetails={orderDetails} user={user} />}
      </Dialog>
    </motion.div>
  )
}

export default ShoppingOrders