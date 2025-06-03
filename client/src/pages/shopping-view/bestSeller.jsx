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
            className="relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile Card Layout - Visible only on very small screens */}
            <div className="block sm:hidden">
              <motion.div className="space-y-4 relative z-10 px-2">
                {bestsellerProducts.slice(0, 3).map((product, index) => (
                  <motion.div
                    key={product._id || index}
                    variants={itemVariants}
                    className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden cursor-pointer relative z-10"
                    onClick={() => handleOpenDialog(product._id)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative h-44 bg-gradient-to-br from-gray-50 to-white">
                      <RenderImage 
                        src={product.image} 
                        alt={product.title} 
                        className="w-full h-full object-contain p-3"
                      />
                      <div className="absolute top-2 left-2 z-20">
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                          Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-3 relative z-10">
                      <div className="mb-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">{product.category}</span>
                      </div>
                      <h3 className="text-base font-bold mb-2 text-gray-900 line-clamp-1">{product.title}</h3>
                      <div 
                        className="text-gray-600 text-xs line-clamp-2 mb-3 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-gray-900">GHS {product.price.toFixed(2)}</span>
                        {product.salePrice && product.salePrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">GHS {product.salePrice.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex gap-2 relative z-20">
                        <motion.button
                          className="flex-1 bg-gray-100 text-gray-900 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all relative z-30 text-sm"
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(product._id);
                          }}
                        >
                          View Details
                        </motion.button>
                        <motion.button
                          className="flex-1 bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2 relative z-30 text-sm"
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product._id);
                          }}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          Add to Cart
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Desktop and Tablet Layout - Hidden on very small screens */}
            <div className="hidden sm:block relative z-10">
              {/* Main showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 bg-white overflow-visible">
                {/* Left column: Main product image */}
                <motion.div 
                  className="lg:col-span-2 relative overflow-hidden rounded-l-xl lg:rounded-l-2xl"
                  variants={itemVariants}
                >
                  <div className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                    {mainImage && (
                      <RenderImage 
                        src={mainImage} 
                        alt="Bestseller product" 
                        className="object-contain w-full h-full transition-transform duration-700 hover:scale-105 filter drop-shadow-xl p-4 md:p-6 lg:p-8"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                    
                    {/* Product info overlay */}
                    {bestsellerProducts.slice(0, 1).map((product, index) => (
                      <div key={product._id || index} className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 text-white z-20">
                        <div className="mb-4 md:mb-6">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="inline-block bg-red-500 text-white text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full">Featured</span>
                            <span className="inline-block bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full border border-white/20">
                              {product.category}
                            </span>
                          </div>
                          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 leading-tight">{product.title}</h3>
                          <div 
                            className="text-gray-200 text-sm md:text-base line-clamp-2 mb-4 max-w-full lg:max-w-2xl"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                          />
                        </div>
                        
                        <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-3 md:gap-4 relative z-30">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-300 uppercase tracking-wide">Price</span>
                            <span className="text-xl md:text-2xl font-bold">GHS {product.price.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <motion.button
                              className="bg-white text-black px-4 md:px-6 py-2.5 md:py-3 rounded-full font-medium hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl text-sm md:text-base relative z-40"
                              variants={buttonVariants}
                              initial="initial"
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleOpenDialog(product._id)}
                            >
                              View Details
                            </motion.button>
                            <motion.button
                              className="bg-black text-white px-4 md:px-6 py-2.5 md:py-3 rounded-full font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm md:text-base relative z-40"
                              variants={buttonVariants}
                              initial="initial"
                              whileHover={{ scale: 1.02, y: -2 }}
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
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Right column: Thumbnails and info */}
                <motion.div 
                  variants={itemVariants} 
                  className="bg-white p-4 md:p-6 flex flex-col justify-between rounded-r-xl lg:rounded-r-2xl relative z-10"
                >
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                      <span className="w-1 h-4 md:h-5 bg-black rounded-full mr-2"></span>
                      Browse Collection
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2 md:gap-3 mb-6">
                      {bestsellerProducts.slice(0, 4).map((product, index) => (
                        <motion.div 
                          key={product._id || index}
                          className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-300 bg-white shadow-sm border relative z-20 ${product.image === mainImage ? 'ring-2 ring-black scale-105 shadow-md' : 'hover:shadow-md hover:scale-102'}`}
                          onClick={() => setMainImage(product.image)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="relative">
                            <div className="h-20 md:h-28 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                              <RenderImage 
                                src={product.image} 
                                alt={product.title} 
                                className="w-full h-full object-contain p-1 transition-transform duration-300 hover:scale-105"
                              />
                            </div>
                            {product.image === mainImage && (
                              <div className="absolute top-1 right-1 w-3 h-3 md:w-4 md:h-4 bg-black rounded-full flex items-center justify-center shadow-lg z-30">
                                <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full"></div>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                              <p className="text-white text-xs font-medium truncate">{product.title}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <h4 className="font-medium text-gray-700 mb-2 text-sm md:text-base">Why shop our bestsellers?</h4>
                      <ul className="text-xs md:text-sm text-gray-600 space-y-1.5">
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-black rounded-full flex-shrink-0"></span>
                          <span>Customer favorites with proven quality</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-black rounded-full flex-shrink-0"></span>
                          <span>Fast shipping on all bestselling items</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-black rounded-full flex-shrink-0"></span>
                          <span>Trending styles updated weekly</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
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
