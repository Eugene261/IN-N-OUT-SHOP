import React, { useEffect, useState } from 'react'
import bannerOne from '../../assets/banner-1.webp'
import bannerTwo from '../../assets/banner-2.webp'
import bannerThree from '../../assets/banner-3.webp'
import { toast } from 'sonner';
import ShoppingLoader from '@/components/common/ShoppingLoader';
import { 
  ChevronLeft, 
  ChevronRight, 
  Shirt,
  VenetianMask,
  Baby,
  Watch,
  Footprints,
  Trophy,
  ShoppingBag,
  Zap,
  Leaf,
  Diamond
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllFilteredProducts, fetchProductDetails, fetchBestsellerProducts, fetchNewArrivalProducts } from '@/store/shop/product-slice'
import { getFeatureImages } from '../../store/common-slice/index'

import ShoppingProductTile from '@/components/shopping-view/productTile'
import { useNavigate } from 'react-router-dom'
import { addToCart, fetchCartItems } from '@/store/shop/cart-slice'
import BestSeller from './bestSeller';
import NewArrivals from './newArrivals';
import FeaturedCollection from '../../components/shopping-view/featuredCollection';
import FeaturedSection from '../../components/shopping-view/featuredSection';
import ProductOptionsModal from '../../components/shopping-view/productOptionsModal';

const categoriesWithIcon = [
  { id: "men", label: "Men", icon: Shirt },
  { id: "women", label: "Women", icon: VenetianMask }, // More feminine icon
  { id: "kids", label: "Kids", icon: Baby },
  { id: "accessories", label: "Accessories", icon: Watch },
  { id: "footwear", label: "Footwear", icon: Footprints },
];

const brandWithIcons = [
  { id: "nike", label: "Nike", icon: Trophy }, // Nike swoosh alternative
  { id: "adidas", label: "Adidas", icon: Shirt }, // Stripes represent Adidas
  { id: "puma", label: "Puma", icon: Zap }, // Puma's speed/energy
  { id: "levi", label: "Levi's", icon: ShoppingBag }, // Classic denim
  { id: "zara", label: "Zara", icon: Diamond }, // Fashion/glamour
  { id: "h&m", label: "H&M", icon: Leaf }, // Eco-friendly fast fashion
];

function ShoppingHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const slides = [bannerOne, bannerTwo, bannerThree];
  const { productList } = useSelector(state => state.shopProducts)
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { cartItems } = useSelector(state => state.shopCart);
  const [productsToShow, setProductsToShow] = useState([]);
  const { FeatureImageList } = useSelector(state => state.commonFeature);
  const dispatch = useDispatch();
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    // Only set up the timer if FeatureImageList exists and has items
    if (FeatureImageList && FeatureImageList.length > 0) {
      const timer = setInterval(() => {
        setDirection(1);
        setCurrentSlide(prevSlide => (prevSlide + 1) % FeatureImageList.length);
      }, 6000);

      return () => clearInterval(timer);
    }
  }, [FeatureImageList]);

  function handleNaviagteToListingPage(getCerrentItem, section){
    sessionStorage.removeItem('filters');
    const currentFilter = {
      [section] : [getCerrentItem.id]
    }

    sessionStorage.setItem('filters', JSON.stringify(currentFilter));
    navigate('/shop/listing')
  }

  function handleGetProductDetails(getCurrentProductId){
    navigate(`/shop/product/${getCurrentProductId}`);
  }

  function handleAddToCart(getCurrentProductId){
    // Check if user is authenticated
    if (!user || !user.id) {
      toast.error("Please login to add items to your cart", {
        position: 'top-center',
        duration: 2000
      });
      return;
    }
    
    // Find the product by ID
    const product = productList?.find(p => p._id === getCurrentProductId);
    
    if (product) {
      // Open the options modal with the selected product
      setSelectedProduct(product);
      setIsOptionsModalOpen(true);
    } else {
      toast.error("Product not found", {
        position: 'top-center',
        duration: 2000
      });
    }
  }

  const goToNextSlide = () => {
    if (FeatureImageList && FeatureImageList.length > 0) {
      setDirection(1);
      setCurrentSlide(prevSlide => (prevSlide + 1) % FeatureImageList.length);
    }
  };

  const goToPrevSlide = () => {
    if (FeatureImageList && FeatureImageList.length > 0) {
      setDirection(-1);
      setCurrentSlide(prevSlide => (prevSlide - 1 + FeatureImageList.length) % FeatureImageList.length);
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.05,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.5 }
      }
    },
    exit: (direction) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.5 }
      }
    })
  };

  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    console.log('Home page: Fetching products with refresh key:', refreshKey);
    dispatch(fetchAllFilteredProducts({filterParams: {}, sortParams : 'price-lowtohigh'}));
    
    // Also fetch bestsellers and new arrivals to ensure they're up to date
    dispatch(fetchBestsellerProducts());
    dispatch(fetchNewArrivalProducts());
  }, [dispatch, refreshKey]);



  // Set how many products to show based on screen size
  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024; // lg breakpoint
      if (productList && productList.length > 0) {
        setProductsToShow(productList.slice(0, isLargeScreen ? 8 : 4));
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [productList]);


  useEffect(() => {
      dispatch(getFeatureImages());
    }, [dispatch]);
  
    return (
      <div className='flex flex-col min-h-screen'>
        {/* Enhanced Banner Slider */}
        <motion.div 
          className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[70vh] max-h-[800px] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 z-10 pointer-events-none"></div>
          
          {FeatureImageList && FeatureImageList.length > 0 ? (
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0"
              >
                <img
                  src={FeatureImageList[currentSlide]?.image}
                  alt={`Banner ${currentSlide + 1}`}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-[2px] z-10"></div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="absolute inset-0">
              <img
                src={bannerOne}
                alt="Default Banner"
                className="w-full h-full object-cover object-center"
              />
            </div>
          )}
  
          {/* Navigation Buttons */}
          <motion.button
            onClick={goToPrevSlide}
            className='absolute top-1/2 left-2 sm:left-6 z-20 transform -translate-y-1/2 p-2 sm:p-3
            rounded-full bg-gray-700/80 backdrop-blur-md shadow-lg border border-white/30
            hover:bg-gray-400 transition-all'
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 0 15px rgba(255, 255, 255, 0.5)"
            }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
          </motion.button>
  
          <motion.button 
            onClick={goToNextSlide}
            className='absolute top-1/2 right-2 sm:right-6 z-20 transform -translate-y-1/2 p-2 sm:p-3
            rounded-full bg-gray-700/80 backdrop-blur-md shadow-lg border border-white/30
            hover:bg-gray-400 transition-all'
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 0 15px rgba(255, 255, 255, 0.5)"
            }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
          </motion.button>
  
          {/* Slide Indicators */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2 sm:space-x-3">
            {FeatureImageList && FeatureImageList.length > 0 ? 
              FeatureImageList.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentSlide ? 1 : -1);
                    setCurrentSlide(index);
                  }}
                  className={`w-1.5 sm:w-2 h-6 sm:h-8 rounded-full transition-all overflow-hidden relative`}
                  whileHover={{ scale: 1.1 }}
                  animate={{ 
                    backgroundColor: index === currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                    width: index === currentSlide ? '20px' : '6px'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {index === currentSlide && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              )) : (
                slides.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentSlide ? 1 : -1);
                      setCurrentSlide(index);
                    }}
                    className={`w-1.5 sm:w-2 h-6 sm:h-8 rounded-full transition-all overflow-hidden relative`}
                    whileHover={{ scale: 1.1 }}
                    animate={{ 
                      backgroundColor: index === currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                      width: index === currentSlide ? '20px' : '6px'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {index === currentSlide && (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                ))
              )
            }
          </div>
        </motion.div>
  
        {/* Categories Section */}
        <motion.section 
          className="py-12 sm:py-16 bg-gradient-to-b from-white to-blue-50/20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={sectionVariants}
        >
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800"
              variants={itemVariants}
            >
              Shop by Category
            </motion.h2>
            
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
              variants={staggerVariants}
            >
              {categoriesWithIcon.map((categoryItem, index) => (
                <motion.div 
                  key={categoryItem.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <Card 
                    onClick={() => handleNaviagteToListingPage(categoryItem, 'category')}
                    className='cursor-pointer group relative overflow-hidden shadow-lg hover:shadow-xl transition-all'
                  >
                    <CardContent className='flex flex-col items-center justify-center p-6 sm:p-8 h-full bg-white'>
                      <motion.div
                        className="mb-4 p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-all"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                      >
                        <categoryItem.icon className='w-8 h-8 sm:w-10 sm:h-10 text-blue-600 group-hover:text-purple-600 transition-colors'/>
                      </motion.div>
                      <span className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {categoryItem.label}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
  
        {/* Brands Section */}
        <motion.section 
          className="py-12 sm:py-16 bg-white"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
        >
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800"
              variants={itemVariants}
            >
              Featured Brands
            </motion.h2>
            
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6"
              variants={staggerVariants}
            >
              {brandWithIcons.map((brandItem, index) => (
                <motion.div 
                  key={brandItem.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card 
                    className='cursor-pointer group relative overflow-hidden shadow-md hover:shadow-lg transition-all h-full'
                    onClick={() => handleNaviagteToListingPage(brandItem, 'brand')}
                  >
                    <CardContent className='flex flex-col items-center justify-center p-6 bg-gray-50 group-hover:bg-white transition-colors'>
                      <motion.div
                        className="mb-3 p-3 rounded-lg bg-white group-hover:bg-gray-100 transition-colors"
                        whileHover={{ scale: 1.1 }}
                      >
                        <brandItem.icon className='w-8 h-8 sm:w-10 sm:h-10 text-gray-700 group-hover:text-black transition-colors'/>
                      </motion.div>
                      <span className="font-medium text-sm sm:text-base text-gray-700 group-hover:text-black transition-colors">
                        {brandItem.label}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
  
        {/* Section Divider */}
        <div className="relative py-12 bg-white">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full border-t border-gray-200/60"></div>
          </div>
        </div>
  
        <BestSeller />
  
        {/* Section Divider */}
        <div className="relative py-12 bg-white">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full border-t border-gray-200/60"></div>
          </div>
        </div>
  
        {/* Featured Products */}
        <motion.section 
          className='py-16 sm:py-24 bg-gradient-to-b from-white to-gray-50'
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
        >
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <motion.div 
              className="text-center mb-12"
              variants={itemVariants}
            >
              <span className="text-sm uppercase tracking-widest text-gray-500 mb-2 block">Discover Our Collection</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 inline-block">
                Featured Products
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-black to-gray-400 rounded-full mt-4 mx-auto"></div>
            </motion.div>
            
            {/* Products Grid */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8"
              variants={staggerVariants}
            >
              {productsToShow?.map((productItem) => ( 
                <motion.div 
                  key={productItem._id}
                  variants={itemVariants}
                >
                  <ShoppingProductTile 
                    handleGetProductDetails={handleGetProductDetails}
                    product={productItem} 
                    handleAddToCart={handleAddToCart}
                  />
                </motion.div>
              ))}
            </motion.div>
            
            {/* Explore All Button */}
            {productList?.length > productsToShow?.length && (
              <motion.div 
                className="text-center mt-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <motion.button 
                  onClick={() => navigate('/shop/listing')}
                  className="px-8 py-4 bg-black text-white rounded-xl
                  font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl
                  flex items-center gap-2 mx-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Explore All Products</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.section>
  
        {/* Section Divider */}
        <div className="relative py-12 bg-white">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full border-t border-gray-200/60"></div>
          </div>
        </div>
  
        <NewArrivals />
  
        {/* Section Divider */}
        <div className="relative py-12 bg-white">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full border-t border-gray-200/60"></div>
          </div>
        </div>
  
        <FeaturedCollection />
  
        {/* Section Divider */}
        <div className="relative py-12 bg-white">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full border-t border-gray-200/60"></div>
          </div>
        </div>
  
        <FeaturedSection />

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
      </div>
    );
}

export default ShoppingHome;