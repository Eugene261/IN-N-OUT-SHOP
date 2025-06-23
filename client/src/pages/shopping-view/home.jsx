import React, { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner';
import PageTitle from '../../components/common/PageTitle';
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
  Diamond,
  ArrowUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllFilteredProducts, fetchProductDetails, fetchBestsellerProducts, fetchNewArrivalProducts } from '@/store/shop/product-slice'
import { getFeatureImages } from '../../store/common-slice/index'

import EnhancedShoppingProductTile from '@/components/shopping-view/enhanced-product-tile'
import { useNavigate } from 'react-router-dom'
import { addToCart, fetchCartItems } from '@/store/shop/cart-slice'
import { addToWishlist, removeFromWishlist, fetchWishlistItems } from '@/store/shop/wishlist-slice'
import BestSeller from './bestSeller';
import NewArrivals from './newArrivals';
import FeaturedCollection from '../../components/shopping-view/featuredCollection';
import FeaturedSection from '../../components/shopping-view/featuredSection';
import ProductOptionsModal from '../../components/shopping-view/productOptionsModal';
import ValueProposition from '../../components/shopping-view/ValueProposition';
import CustomerTestimonials from '../../components/shopping-view/CustomerTestimonials';
import NewsletterSection from '../../components/shopping-view/NewsletterSection';
import StatsSection from '../../components/shopping-view/StatsSection';
import EnhancedHeroCarousel from '../../components/shopping-view/EnhancedHeroCarousel'

/* const categoriesWithIcon = [
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
]; */



function ShoppingHome() {
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productsToShow, setProductsToShow] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector(state => state.auth);
  const { productList } = useSelector(state => state.shopProducts);
  const { wishlistItems } = useSelector(state => state.wishlist);
  const { FeatureImageList, isLoading } = useSelector(state => state.commonFeature);

  // Handle scroll for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when user scrolls down 500px from the top
      if (window.scrollY > 500) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  function handleNavigateToListingPage(getCurrentItem, section){
    sessionStorage.removeItem('filters');
    const currentFilter = {
      [section] : [getCurrentItem.id]
    }

    sessionStorage.setItem('filters', JSON.stringify(currentFilter));
    navigate('/shop/listing')
  }

  function handleGetProductDetails(getCurrentProductId){
    navigate(`/shop/product/${getCurrentProductId}`);
  }

  function handleAddToCart(getCurrentProductId){
    const product = productList.find(p => p._id === getCurrentProductId);
    
    if (!product) {
      toast.error("Product not found");
      return;
    }

    // Check if product has variants (sizes, colors, etc.)
    const hasVariants = (product.sizes && product.sizes.length > 0) || 
                       (product.colors && product.colors.length > 0);

    if (hasVariants) {
      // Show options modal for products with variants
      setSelectedProduct(product);
      setIsOptionsModalOpen(true);
    } else {
      // Add directly to cart for products without variants
      let guestId = null;
      if (!user) {
        guestId = localStorage.getItem('guestId');
        if (!guestId) {
          guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('guestId', guestId);
        }
      }

      dispatch(addToCart({
        userId: user?.id || user?._id,
        guestId: guestId,
        productId: getCurrentProductId, 
        quantity: 1
      })).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchCartItems(user?._id || user?.id || { guestId }));
          toast.success('Product added to cart');
        }
      });
    }
  }

  function handleAddToWishlist(getCurrentProductId) {
    let wishlistParams = {};
    
    if (user && (user._id || user.id)) {
      wishlistParams.userId = user._id || user.id;
    } else {
      let guestId = localStorage.getItem('guestId');
      if (!guestId) {
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guestId', guestId);
      }
      wishlistParams.guestId = guestId;
    }
    
    const isInWishlist = wishlistItems?.some(item => item.productId === getCurrentProductId);
    
    if (isInWishlist) {
      dispatch(removeFromWishlist({ ...wishlistParams, productId: getCurrentProductId }))
        .then((result) => {
          if (result?.payload?.success) {
            toast.success("Removed from wishlist", {
              position: 'top-center',
              duration: 2000
            });
          }
        });
    } else {
      dispatch(addToWishlist({ ...wishlistParams, productId: getCurrentProductId }))
        .then((result) => {
          if (result?.payload?.success) {
            toast.success("Added to wishlist", {
              position: 'top-center',
              duration: 2000
            });
          }
        });
    }
  }



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
  
  // Function to scroll back to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };



  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    console.log('Home page: Fetching products with refresh key:', refreshKey);
    dispatch(fetchAllFilteredProducts({filterParams: {}, sortParams : 'price-lowtohigh'}));
    
    // Also fetch bestsellers and new arrivals to ensure they're up to date
    dispatch(fetchBestsellerProducts());
    dispatch(fetchNewArrivalProducts());
    
    // Fetch wishlist items for both authenticated and guest users
    if (user && (user._id || user.id)) {
      dispatch(fetchWishlistItems({ userId: user._id || user.id }));
    } else {
      // Guest user - fetch guest wishlist
      const guestId = localStorage.getItem('guestId');
      if (guestId) {
        dispatch(fetchWishlistItems({ guestId }));
      }
    }
  }, [dispatch, refreshKey, user]);



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


  // Feature images loading state is managed by Redux store
  
  useEffect(() => {
    dispatch(getFeatureImages());
  }, [dispatch]);
  
    return (
      <div className='flex flex-col min-h-screen'>
        <PageTitle title="Home" />
        {/* Enhanced Hero Banner Slider */}
        <EnhancedHeroCarousel 
          FeatureImageList={FeatureImageList} 
          isLoading={isLoading}
        />
  
        {/* Categories Section */}
       {/*  <motion.section 
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
                    onClick={() => handleNavigateToListingPage(categoryItem, 'category')}
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
        </motion.section> */}
  
        {/* Brands Section */}
        {/* <motion.section 
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
                    onClick={() => handleNavigateToListingPage(brandItem, 'brand')}
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
        </motion.section> */}
  
                {/* <ValueProposition /> */}

        <BestSeller />
  
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
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
              variants={staggerVariants}
            >
              {productsToShow?.map((productItem) => {
                const isInWishlist = wishlistItems?.some(item => item.productId === productItem._id);
                return (
                  <motion.div 
                    key={productItem._id}
                    variants={itemVariants}
                  >
                    <EnhancedShoppingProductTile 
                      handleGetProductDetails={handleGetProductDetails}
                      product={productItem} 
                      handleAddToCart={handleAddToCart}
                      handleAddToWishlist={handleAddToWishlist}
                      isInWishlist={isInWishlist}
                    />
                  </motion.div>
                );
              })}
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

        <NewArrivals />
  
        <FeaturedCollection />

        <StatsSection />

        <CustomerTestimonials />

        <FeaturedSection />

        <NewsletterSection />

        {/* Back to Top Button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-black text-white shadow-lg hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowUp size={24} />
            </motion.button>
          )}
        </AnimatePresence>

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