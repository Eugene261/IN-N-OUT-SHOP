import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBestsellerProducts } from '../../store/shop/product-slice/index';
import { addToCart, fetchCartItems } from '../../store/shop/cart-slice';
import RenderImage from '../../components/common/renderImage';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ShoppingLoader from '../../components/common/ShoppingLoader';
import { ShoppingBag } from 'lucide-react';
import ProductOptionsModal from '../../components/shopping-view/productOptionsModal';

const BestSeller = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bestsellerProducts, bestsellerLoading: loading } = useSelector((state) => state.shopProducts);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const [mainImage, setMainImage] = useState("");
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    dispatch(fetchBestsellerProducts());
  }, [dispatch]);

  useEffect(() => {
    if (bestsellerProducts?.[0]) {
      setMainImage(bestsellerProducts[0].image || '');
    }
  }, [bestsellerProducts]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.5 
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.95 }
  };

  const handleOpenDialog = (productId) => {
    navigate(`/shop/product/${productId}`);
  };

  const handleAddToCart = (productId) => {
    if (!user) {
      toast.error("Please login to add items to your cart");
      return;
    }
    
    // Find the product by ID
    const product = bestsellerProducts?.find(p => p._id === productId);
    
    if (product) {
      // Open the options modal with the selected product
      setSelectedProduct(product);
      setIsOptionsModalOpen(true);
    } else {
      toast.error("Product not found");
    }
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg">No bestseller products available at the moment.</p>
      <p className="text-gray-400 mt-2">Check back soon for our top picks!</p>
    </div>
  );

  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-16 text-center"
        >
          <span className="inline-block text-sm font-bold tracking-widest uppercase text-gray-500 mb-3">Trending Now</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-600">Best Sellers</h2>
          <div className="w-20 h-1 bg-black mx-auto"></div>
        </motion.div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px] sm:min-h-[600px] w-full">
            <ShoppingLoader />
          </div>
        ) : bestsellerProducts && bestsellerProducts.length > 0 ? (
          <motion.div 
            className="relative"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile Card Layout - Visible only on very small screens */}
            <div className="block sm:hidden">
              <motion.div className="space-y-6">
                {bestsellerProducts.slice(0, 3).map((product, index) => (
                  <motion.div
                    key={product._id || index}
                    variants={itemVariants}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden cursor-pointer"
                    onClick={() => handleOpenDialog(product._id)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative h-48 bg-gradient-to-br from-gray-50 to-white">
                      <RenderImage 
                        src={product.image} 
                        alt={product.title} 
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">{product.category}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-gray-900 line-clamp-1">{product.title}</h3>
                      <div 
                        className="text-gray-600 text-sm line-clamp-2 mb-4"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-gray-900">GHS {product.price.toFixed(2)}</span>
                        {product.salePrice && product.salePrice > product.price && (
                          <span className="text-lg text-gray-400 line-through">GHS {product.salePrice.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(product._id);
                          }}
                        >
                          View Details
                        </motion.button>
                        <motion.button
                          className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product._id);
                          }}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Add to Cart
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Desktop and Tablet Layout - Hidden on very small screens */}
            <div className="hidden sm:block">
              {/* Main showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-gray-100">
                {/* Left column: Main product image */}
                <motion.div 
                  className="lg:col-span-2 relative overflow-hidden"
                  variants={itemVariants}
                >
                  <div className="relative h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                    {mainImage && (
                      <RenderImage 
                        src={mainImage} 
                        alt="Bestseller product" 
                        className="object-contain w-full h-full transition-transform duration-700 hover:scale-105 filter drop-shadow-2xl p-4 sm:p-8"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    
                    {/* Product info overlay */}
                    {bestsellerProducts.slice(0, 1).map((product, index) => (
                      <div key={product._id || index} className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-10 text-white">
                        <div className="mb-4 sm:mb-6">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <span className="inline-block bg-red-500 text-white text-xs font-bold uppercase tracking-wide px-2 sm:px-3 py-1 rounded-full">Featured</span>
                            <span className="inline-block bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 sm:px-3 py-1 rounded-full border border-white/20">
                              {product.category}
                            </span>
                          </div>
                          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight">{product.title}</h3>
                          <div 
                            className="text-gray-200 text-sm sm:text-base lg:text-lg line-clamp-2 mb-4 sm:mb-6 max-w-full lg:max-w-2xl"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                          />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6">
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm text-gray-300 uppercase tracking-wide">Price</span>
                            <span className="text-2xl sm:text-3xl font-bold">GHS {product.price.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                            <motion.button
                              className="bg-white text-black px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-full font-medium hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
                              variants={buttonVariants}
                              initial="initial"
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleOpenDialog(product._id)}
                            >
                              View Details
                            </motion.button>
                            <motion.button
                              className="bg-black text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-full font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
                              variants={buttonVariants}
                              initial="initial"
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product._id);
                              }}
                            >
                              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                              Add to Cart
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Right column: Thumbnails and info */}
                <motion.div 
                  variants={itemVariants} 
                  className="bg-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center">
                      <span className="w-1.5 h-4 sm:h-6 bg-black rounded-full mr-2 sm:mr-3"></span>
                      Browse Collection
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                      {bestsellerProducts.slice(0, 4).map((product, index) => (
                        <motion.div 
                          key={product._id || index}
                          className={`cursor-pointer rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 bg-white shadow-sm border ${product.image === mainImage ? 'ring-2 ring-black scale-105 shadow-lg' : 'hover:shadow-lg hover:scale-102'}`}
                          onClick={() => setMainImage(product.image)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="relative">
                            <div className="h-24 sm:h-32 lg:h-36 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                              <RenderImage 
                                src={product.image} 
                                alt={product.title} 
                                className="w-full h-full object-contain p-1 sm:p-2 transition-transform duration-300 hover:scale-105"
                              />
                            </div>
                            {product.image === mainImage && (
                              <div className="absolute top-1 sm:top-2 right-1 sm:right-2 w-4 sm:w-6 h-4 sm:h-6 bg-black rounded-full flex items-center justify-center shadow-lg">
                                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 sm:p-2">
                              <p className="text-white text-xs font-medium truncate">{product.title}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="border-t border-gray-200 pt-4 sm:pt-6 mb-4 sm:mb-6">
                      <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Why shop our bestsellers?</h4>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1.5 sm:space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-black rounded-full flex-shrink-0"></span>
                          <span>Customer favorites with proven quality</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-black rounded-full flex-shrink-0"></span>
                          <span>Fast shipping on all bestselling items</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-black rounded-full flex-shrink-0"></span>
                          <span>Trending styles updated weekly</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Decorative elements - hidden on mobile for cleaner look */}
            <div className="hidden xl:block absolute -bottom-10 -left-10 w-20 h-20 bg-black/5 rounded-full"></div>
            <div className="hidden xl:block absolute -top-10 -right-10 w-32 h-32 bg-black/5 rounded-full"></div>
          </motion.div>
          ) : (
            renderEmptyState()
          )}


      </div>

      {/* Product Options Modal */}
      <ProductOptionsModal 
        isOpen={isOptionsModalOpen} 
        onClose={() => setIsOptionsModalOpen(false)} 
        product={selectedProduct}
        onAddToCart={() => {
          setIsOptionsModalOpen(false);
          dispatch(fetchCartItems(user?._id || user?.id));
        }}
      />
    </section>
  );
};

export default BestSeller;
