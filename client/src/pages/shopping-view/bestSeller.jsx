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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="inline-block text-sm font-bold tracking-widest uppercase text-gray-500 mb-3">Trending Now</span>
          <h2 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-600">Best Sellers</h2>
          <div className="w-20 h-1 bg-black mx-auto"></div>
        </motion.div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[600px] w-full">
            <ShoppingLoader />
          </div>
        ) : bestsellerProducts && bestsellerProducts.length > 0 ? (
          <motion.div 
            className="relative"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Main showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden rounded-3xl shadow-2xl border border-gray-100">
              {/* Left column: Main product image */}
              <motion.div 
                className="lg:col-span-2 relative overflow-hidden"
                variants={itemVariants}
              >
                <div className="relative h-[700px] overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                  {mainImage && (
                    <RenderImage 
                      src={mainImage} 
                      alt="Bestseller product" 
                      className="object-contain w-full h-full transition-transform duration-700 hover:scale-105 filter drop-shadow-2xl p-8"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  
                  {/* Product info overlay */}
                  {bestsellerProducts.slice(0, 1).map((product, index) => (
                    <div key={product._id || index} className="absolute bottom-0 left-0 right-0 p-10 text-white">
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-block bg-red-500 text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full">Featured</span>
                          <span className="inline-block bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20">
                            {product.category}
                          </span>
                        </div>
                        <h3 className="text-4xl font-bold mb-3 leading-tight">{product.title}</h3>
                        <div 
                          className="text-gray-200 text-lg line-clamp-2 mb-6 max-w-2xl"
                          dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-300 uppercase tracking-wide">Price</span>
                          <span className="text-3xl font-bold">GHS {product.price.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-3">
                          <motion.button
                            className="bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                            variants={buttonVariants}
                            initial="initial"
                            whileHover={{ scale: 1.05, y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleOpenDialog(product._id)}
                          >
                            View Details
                          </motion.button>
                          <motion.button
                            className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            variants={buttonVariants}
                            initial="initial"
                            whileHover={{ scale: 1.05, y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product._id);
                            }}
                          >
                            <ShoppingBag className="w-5 h-5" />
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
                className="bg-white p-8 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-2xl font-bold mb-6 flex items-center">
                    <span className="w-1.5 h-6 bg-black rounded-full mr-3"></span>
                    Browse Collection
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {bestsellerProducts.slice(0, 4).map((product, index) => (
                      <motion.div 
                        key={product._id || index}
                        className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-300 bg-white shadow-sm border ${product.image === mainImage ? 'ring-2 ring-black scale-105 shadow-lg' : 'hover:shadow-lg hover:scale-102'}`}
                        onClick={() => setMainImage(product.image)}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="relative">
                          <div className="h-36 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                            <RenderImage 
                              src={product.image} 
                              alt={product.title} 
                              className="w-full h-full object-contain p-2 transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                          {product.image === mainImage && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center shadow-lg">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-xs font-medium truncate">{product.title}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Why shop our bestsellers?</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                        Customer favorites with proven quality
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                        Fast shipping on all bestselling items
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                        Trending styles updated weekly
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Decorative elements */}
            <div className="hidden lg:block absolute -bottom-10 -left-10 w-20 h-20 bg-black/5 rounded-full"></div>
            <div className="hidden lg:block absolute -top-10 -right-10 w-32 h-32 bg-black/5 rounded-full"></div>
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
