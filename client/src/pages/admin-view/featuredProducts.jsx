import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchAllFilteredProducts, 
  toggleProductBestseller, 
  toggleProductNewArrival 
} from '../../store/shop/product-slice/index';
import RenderImage from '../../components/common/renderImage';
import { Star, Zap, Loader2, AlertCircle, CheckCircle, Activity, Box } from 'lucide-react';

const AdminFeaturedProducts = () => {
  const dispatch = useDispatch();
  const { productList, isLoading } = useSelector((state) => state.shopProducts);
  const [updateStatus, setUpdateStatus] = useState({
    loading: false,
    error: null,
    successMessage: null,
    productId: null,
    type: null
  });
  
  useEffect(() => {
    dispatch(fetchAllFilteredProducts({ filterParams: {}, sortParams: 'title-atoz' }));
  }, [dispatch]);

  // Handle toggle bestseller with better error tracking
  const handleToggleBestseller = async (productId) => {
    try {
      setUpdateStatus({
        loading: true,
        error: null,
        successMessage: null,
        productId,
        type: 'bestseller'
      });
      
      const result = await dispatch(toggleProductBestseller(productId)).unwrap();
      console.log("Toggle bestseller result:", result);
      
      setUpdateStatus({
        loading: false,
        error: null,
        successMessage: result.message || 'Bestseller status updated successfully',
        productId,
        type: 'bestseller'
      });
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setUpdateStatus(prev => {
          if (prev.productId === productId && prev.type === 'bestseller') {
            return { ...prev, successMessage: null };
          }
          return prev;
        });
      }, 3000);
    } catch (error) {
      console.error("Failed to toggle bestseller status:", error);
      setUpdateStatus({
        loading: false,
        error: error.message || 'Failed to update bestseller status',
        successMessage: null,
        productId,
        type: 'bestseller'
      });
    }
  };

  // Handle toggle new arrival with better error tracking
  const handleToggleNewArrival = async (productId) => {
    try {
      setUpdateStatus({
        loading: true,
        error: null,
        successMessage: null,
        productId,
        type: 'newArrival'
      });
      
      const result = await dispatch(toggleProductNewArrival(productId)).unwrap();
      console.log("Toggle new arrival result:", result);
      
      setUpdateStatus({
        loading: false,
        error: null,
        successMessage: result.message || 'New arrival status updated successfully',
        productId,
        type: 'newArrival'
      });
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setUpdateStatus(prev => {
          if (prev.productId === productId && prev.type === 'newArrival') {
            return { ...prev, successMessage: null };
          }
          return prev;
        });
      }, 3000);
    } catch (error) {
      console.error("Failed to toggle new arrival status:", error);
      setUpdateStatus({
        loading: false,
        error: error.message || 'Failed to update new arrival status',
        successMessage: null,
        productId,
        type: 'newArrival'
      });
    }
  };

  // Display any global errors at the top
  const [globalError, setGlobalError] = useState(null);
  
  useEffect(() => {
    // If we encounter errors often, set a global error message
    if (updateStatus.error) {
      setGlobalError(`Error: ${updateStatus.error}. Please check your network connection and try again.`);
      
      // Clear global error after 5 seconds
      const timer = setTimeout(() => {
        setGlobalError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [updateStatus.error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center space-y-3"
        >
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <span className="text-gray-500 font-medium">Loading products...</span>
        </motion.div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  const tableRowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeInOut"
      }
    }),
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto p-4 max-w-6xl"
    >
      <motion.div variants={itemVariants} className="flex items-center mb-8">
        <Box className="h-6 w-6 mr-3 text-blue-600" />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Manage Featured Products
        </h1>
      </motion.div>
      
      <AnimatePresence>
        {globalError && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center shadow-md"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{globalError}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center mb-4"
          >
            <div className="rounded-full bg-yellow-100 p-2 mr-3">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <h2 className="text-lg font-semibold">Bestseller Products</h2>
          </motion.div>
          <p className="text-sm text-gray-500">
            Products marked as bestsellers will appear in the Bestseller section on the homepage.
            The first product in this list will be featured prominently.
          </p>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center mb-4"
          >
            <div className="rounded-full bg-blue-100 p-2 mr-3">
              <Zap className="h-5 w-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold">New Arrival Products</h2>
          </motion.div>
          <p className="text-sm text-gray-500">
            Products marked as new arrivals will appear in the New Arrivals section on the homepage.
          </p>
        </motion.div>
      </div>
      
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-700">All Products</h3>
          </div>
          <div className="text-sm text-gray-500">{productList?.length || 0} items</div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bestseller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Arrival
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {productList && productList.length > 0 ? (
                  productList.map((product, index) => (
                    <motion.tr 
                      key={product._id}
                      custom={index}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-gray-100 shadow-sm"
                          >
                            <RenderImage
                              src={product.image || ''}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          </motion.div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.title}</div>
                            <div className="text-xs text-gray-500">{product.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">${product.price?.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggleBestseller(product._id)}
                            disabled={updateStatus.loading && updateStatus.productId === product._id && updateStatus.type === 'bestseller'}
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center justify-center transition-all duration-200 ${
                              product.isBestseller
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                            } ${updateStatus.loading && updateStatus.productId === product._id && updateStatus.type === 'bestseller' ? 'opacity-75 cursor-not-allowed' : ''}`}
                          >
                            {updateStatus.loading && updateStatus.productId === product._id && updateStatus.type === 'bestseller' ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                <span>Updating...</span>
                              </>
                            ) : product.isBestseller ? (
                              <>
                                <Star className="h-3 w-3 mr-1 fill-yellow-500 stroke-yellow-500" />
                                <span>Bestseller</span>
                              </>
                            ) : (
                              'Set as Bestseller'
                            )}
                          </motion.button>
                          
                          <AnimatePresence>
                            {updateStatus.successMessage && updateStatus.productId === product._id && updateStatus.type === 'bestseller' && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-xs text-green-600 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {updateStatus.successMessage}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          <AnimatePresence>
                            {updateStatus.error && updateStatus.productId === product._id && updateStatus.type === 'bestseller' && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-xs text-red-600 flex items-center"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {updateStatus.error}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggleNewArrival(product._id)}
                            disabled={updateStatus.loading && updateStatus.productId === product._id && updateStatus.type === 'newArrival'}
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center justify-center transition-all duration-200 ${
                              product.isNewArrival
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                            } ${updateStatus.loading && updateStatus.productId === product._id && updateStatus.type === 'newArrival' ? 'opacity-75 cursor-not-allowed' : ''}`}
                          >
                            {updateStatus.loading && updateStatus.productId === product._id && updateStatus.type === 'newArrival' ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                <span>Updating...</span>
                              </>
                            ) : product.isNewArrival ? (
                              <>
                                <Zap className="h-3 w-3 mr-1 fill-blue-500 stroke-blue-500" />
                                <span>New Arrival</span>
                              </>
                            ) : (
                              'Set as New Arrival'
                            )}
                          </motion.button>
                          
                          <AnimatePresence>
                            {updateStatus.successMessage && updateStatus.productId === product._id && updateStatus.type === 'newArrival' && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-xs text-green-600 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {updateStatus.successMessage}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          <AnimatePresence>
                            {updateStatus.error && updateStatus.productId === product._id && updateStatus.type === 'newArrival' && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-xs text-red-600 flex items-center"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {updateStatus.error}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <motion.tr
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Box className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-lg font-medium">No products found</p>
                        <p className="text-sm">Products will appear here once added to the system</p>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminFeaturedProducts;