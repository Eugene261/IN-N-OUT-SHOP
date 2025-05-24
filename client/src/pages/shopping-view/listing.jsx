import EnhancedProductFilter from '../../components/shopping-view/enhanced-filter';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuTrigger 
} from '../../components/ui/dropdown-menu';
import { sortOptions } from '../../config';
import { ArrowUpDown, Filter } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllFilteredProducts, fetchProductDetails, fetchAvailableShops } from '../../store/shop/product-slice';
import EnhancedShoppingProductTile from '../../components/shopping-view/enhanced-product-tile';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { addToCart, fetchCartItems } from '../../store/shop/cart-slice';
import { addToWishlist, removeFromWishlist, fetchWishlistItems } from '../../store/shop/wishlist-slice';
import { toast } from 'sonner';
import ShoppingLoader from '../../components/common/ShoppingLoader';
import ProductOptionsModal from '../../components/shopping-view/productOptionsModal';


function createSearchParamsHelper(filterParams){
  const queryParams = [];

  for(const [key, value] of Object.entries(filterParams)){
    if(Array.isArray(value) && value.length > 0){
      const paramValue = value.join(',')

      queryParams.push(`${key}=${encodeURIComponent(paramValue)}`)
    }
  }

  return queryParams.join('&')
}


function ShoppingListing() {
  const dispatch = useDispatch();
  const { productList, isLoading, availableShops, shopsLoading } = useSelector(state => state.shopProducts);
  const {cartItems} = useSelector(state => state.shopCart);
  const { wishlistItems } = useSelector(state => state.wishlist);
  const {user} = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [filters, setFilters ] = useState({});
  const [sort, setSort] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySearchParam = searchParams.get('category');
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  function handleSort(value) {
    setSort(value);
    // Add your sorting logic here
  }

  function handleFilter(getSectionId, getCurrentOption){
    let copyFilters = {...filters};
    const indexofSection = Object.keys(copyFilters).indexOf(getSectionId);

    if(indexofSection === -1){
      copyFilters = {
        ...copyFilters,
        [getSectionId] : [getCurrentOption]
      }
    } else {
      const indexOfCurrentOption = copyFilters[getSectionId].indexOf(getCurrentOption);

      if(indexOfCurrentOption === -1) copyFilters[getSectionId].push(getCurrentOption)
        else copyFilters[getSectionId].splice(indexOfCurrentOption , 1 )
    }

    setFilters(copyFilters);
    sessionStorage.setItem('filters', JSON.stringify(copyFilters));
  }

  useEffect(() => {
    setSort('price-lowtohigh')
    setFilters(JSON.parse(sessionStorage.getItem('filters')) || {})
    
    // Fetch available shops for filtering
    dispatch(fetchAvailableShops());
    
    // Fetch wishlist items if user is logged in
    if (user && (user._id || user.id)) {
      dispatch(fetchWishlistItems(user._id || user.id));
    }
  }, [categorySearchParam, dispatch, user]);


  function handleGetProductDetails(getCurrentProductId){
    navigate(`/shop/product/${getCurrentProductId}`);
  }

  function handleAddToCart(getCurrentProductId, getTotalStock) {
    // Check if user is authenticated
    if (!user || !user.id) {
      toast.error("Please login to add items to your cart", {
        position: 'top-center',
        duration: 2000
      });
      return;
    }
    
    // Check stock availability
    let getCartItems = cartItems.items || [];
    if(getCartItems.length) {
      const indexOfCurrentItem = getCartItems.findIndex(item => item.productId === getCurrentProductId);
      if(indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity;
        if(getQuantity >= getTotalStock) {
          toast.error(`Only ${getTotalStock} items can be added for this product`, {
            position: 'top-center',
            duration: 2000
          });
          return;
        }
      }
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

  function handleAddToWishlist(getCurrentProductId) {
    // Check if user is authenticated
    if (!user || !user.id) {
      toast.error("Please login to add items to your wishlist", {
        position: 'top-center',
        duration: 2000
      });
      return;
    }

    const userId = user._id || user.id;
    
    // Check if product is already in wishlist
    const isInWishlist = wishlistItems?.some(item => item.productId === getCurrentProductId);
    
    if (isInWishlist) {
      // Remove from wishlist
      dispatch(removeFromWishlist({ userId, productId: getCurrentProductId }))
        .then((result) => {
          if (result?.payload?.success) {
            toast.success("Removed from wishlist", {
              position: 'top-center',
              duration: 2000
            });
          }
        });
    } else {
      // Add to wishlist
      dispatch(addToWishlist({ userId, productId: getCurrentProductId }))
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


  useEffect(() => {
    if(filters && Object.keys(filters).length > 0){
      const createQueryString = createSearchParamsHelper(filters)
      setSearchParams(new URLSearchParams(createQueryString))
    }
  }, [filters]);


  // Add a refresh key to force re-fetch when needed
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    if(filters !== null && sort !== null) {
      console.log('Listing page: Fetching products with refresh key:', refreshKey);
      // Add timestamp to query to prevent caching
      dispatch(fetchAllFilteredProducts({
        filterParams: filters, 
        sortParams: sort
      }));
    }
  }, [dispatch, sort, filters, refreshKey]);
  
  // Force refresh when component mounts
  useEffect(() => {
    // Set a small timeout to ensure the component is fully mounted
    const timer = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);


  // We've removed the dialog approach in favor of navigating to the product details page
  
  


  return (
    <div className='flex flex-col'>
      {/* Mobile Filter Toggle */}
      <div className="md:hidden p-4 pb-0">
        <button 
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 
          dark:bg-gray-800 rounded-lg text-sm font-medium"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 p-4 md:p-6'>
        {/* Mobile filters - only visible when toggled */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <EnhancedProductFilter 
            filters={filters}  
            handleFilter={handleFilter}
            availableShops={availableShops}
          />
        </div>

        <div className="bg-background w-full rounded-lg shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-bold">All Products</h2>
            <div className="flex items-center gap-3">
              <span className='text-muted-foreground text-sm'>{productList?.length || 0} products</span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 
                    hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 
                    dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition-all 
                    duration-200 ease-out shadow-sm hover:shadow-md relative overflow-hidden"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.div
                      animate={{ rotate: sort ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </motion.div>
                    <span className="text-sm font-medium">Sort</span>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-[200px]'>
                  <DropdownMenuRadioGroup value={sort} onValueChange={handleSort}>
                    {sortOptions.map(sortItem => (
                      <DropdownMenuRadioItem 
                        key={`sort-option-${sortItem.id}`}
                        value={sortItem.id}
                      >
                        {sortItem.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px] w-full">
              <ShoppingLoader />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
              {productList?.map((productItem, index) => {
                const isInWishlist = wishlistItems?.some(item => item.productId === productItem._id);
                return (
                  <EnhancedShoppingProductTile 
                    handleGetProductDetails={handleGetProductDetails}
                    key={`product-${productItem.id || index}`}
                    product={productItem} 
                    handleAddToCart={handleAddToCart}
                    handleAddToWishlist={handleAddToWishlist}
                    isInWishlist={isInWishlist}
                  />
                );
              })}
            </div>
          )}


        </div>
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
    </div>
  )
}

export default ShoppingListing;