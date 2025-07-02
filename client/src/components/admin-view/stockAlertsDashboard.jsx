import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllFilteredProducts } from '@/store/shop/product-slice';
import { AlertTriangle, ShoppingBag, Package, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function StockAlertsDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { productList, isLoading: loading } = useSelector(state => state.shopProducts);
  const { user } = useSelector(state => state.auth);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [noAccess, setNoAccess] = useState(false);

  useEffect(() => {
    // Fetch all products when component mounts
    dispatch(fetchAllFilteredProducts({
      filterParams: {},
      sortParams: 'createdAt'
    }));
  }, [dispatch]);

  useEffect(() => {
    if (!user || !user.id) {
      setNoAccess(true);
      return;
    }

    if (productList && productList.length > 0) {
      // Filter products created by the current admin
      const adminProducts = productList.filter(product => {
        // Check if the product was created by the current admin
        // createdBy can be either an object with _id or a string ID
        const createdById = typeof product.createdBy === 'object' ? 
          product.createdBy?._id : product.createdBy;
        
        return createdById === user.id || createdById === user._id;
      });

      if (adminProducts.length === 0) {
        // No products created by this admin
        setOutOfStockProducts([]);
        setLowStockProducts([]);
        return;
      }

      // Filter out-of-stock products
      const outOfStock = adminProducts.filter(product => product.totalStock === 0);
      setOutOfStockProducts(outOfStock);

      // Filter low stock products (5 or fewer items)
      const lowStock = adminProducts.filter(product => product.totalStock > 0 && product.totalStock <= 5);
      setLowStockProducts(lowStock);
    }
  }, [productList, user]);

  const handleViewProduct = () => {
    // Navigate to the products page
    navigate('/admin/products');
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      {/* Header - Mobile Optimized */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="text-amber-500 h-4 w-4 sm:h-5 sm:w-5" />
          Stock Alerts
        </h2>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Monitor products that require inventory attention
        </p>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center items-center h-32 sm:h-40">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-800"></div>
          </div>
        ) : noAccess ? (
          <div className="flex flex-col items-center justify-center h-32 sm:h-40 text-gray-500">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 mb-2 text-amber-500" />
            <p className="text-center text-sm sm:text-base px-4">You need to be logged in as an admin to view stock alerts.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Out of Stock Section - Mobile Optimized */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-red-600 flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Out of Stock ({outOfStockProducts.length})
              </h3>
              
              {outOfStockProducts.length === 0 ? (
                <p className="text-gray-500 italic text-sm sm:text-base">No out-of-stock products found</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {outOfStockProducts.slice(0, 6).map((product) => (
                    <motion.div
                      key={product._id}
                      variants={itemVariants}
                      className="bg-red-50 border border-red-100 rounded-lg p-3 sm:p-4 flex items-start gap-3 cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={handleViewProduct}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-product.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{product.title}</h4>
                        <p className="text-red-600 text-xs sm:text-sm font-medium mt-1 flex items-center gap-1">
                          <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                          Stock: 0
                        </p>
                      </div>
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    </motion.div>
                  ))}
                </div>
              )}
              
              {outOfStockProducts.length > 6 && (
                <button 
                  className="mt-3 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  onClick={() => navigate('/admin/products', { state: { filter: 'outOfStock', createdBy: user.id } })}
                >
                  View all {outOfStockProducts.length} out-of-stock products
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
            
            {/* Low Stock Section - Mobile Optimized */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-amber-600 flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                Low Stock ({lowStockProducts.length})
              </h3>
              
              {lowStockProducts.length === 0 ? (
                <p className="text-gray-500 italic text-sm sm:text-base">No low-stock products found</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {lowStockProducts.slice(0, 6).map((product) => (
                    <motion.div
                      key={product._id}
                      variants={itemVariants}
                      className="bg-amber-50 border border-amber-100 rounded-lg p-3 sm:p-4 flex items-start gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
                      onClick={handleViewProduct}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-product.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{product.title}</h4>
                        <p className="text-amber-600 text-xs sm:text-sm font-medium mt-1 flex items-center gap-1">
                          <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                          Only {product.totalStock} left
                        </p>
                      </div>
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    </motion.div>
                  ))}
                </div>
              )}
              
              {lowStockProducts.length > 6 && (
                <button 
                  className="mt-3 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  onClick={() => navigate('/admin/products', { state: { filter: 'lowStock', createdBy: user.id } })}
                >
                  View all {lowStockProducts.length} low-stock products
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default StockAlertsDashboard;
