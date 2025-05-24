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
      // Convert array values to lowercase for consistent matching
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
  const shopSearchParam = searchParams.get('shop');
  const brandSearchParam = searchParams.get('brand');
  const priceSearchParam = searchParams.get('price');
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  function handleSort(value) {
    setSort(value);
    // Add your sorting logic here
  }

  function handleFilter(filterType, filterValue) {
    console.log(`Filter triggered: ${filterType} = ${filterValue}`);
    
    // Create a fresh copy of current filters
    const newFilters = { ...filters };
    
    // Special handling for category filter (single selection)
    if (filterType === 'category') {
      if (newFilters.category && newFilters.category.includes(filterValue)) {
        // If already selected, remove it
        delete newFilters.category;
        // Also remove subcategories since they depend on category
        if (newFilters.subCategory) {
          delete newFilters.subCategory;
        }
      } else {
        // Select this category, replacing any previous selection
        newFilters.category = [filterValue];
        // Remove subcategories since they may not apply to new category
        if (newFilters.subCategory) {
          delete newFilters.subCategory;
        }
      }
    } 
    // For other filter types (multi-selection)
    else {
      // Initialize the array if it doesn't exist
      if (!newFilters[filterType]) {
        newFilters[filterType] = [];
      }
      
      // Check if the value is already selected
      const valueIndex = newFilters[filterType].indexOf(filterValue);
      
      if (valueIndex === -1) {
        // Add the value if not already selected
        newFilters[filterType].push(filterValue);
      } else {
        // Remove the value if already selected
        newFilters[filterType].splice(valueIndex, 1);
        // Remove the filter type entirely if empty
        if (newFilters[filterType].length === 0) {
          delete newFilters[filterType];
        }
      }
    }
    
    // Debug: Log the new filters
    console.log('New filters:', newFilters);
    
    // Update filters state
    setFilters(newFilters);
    
    // Save to session storage for persistence
    sessionStorage.setItem('filters', JSON.stringify(newFilters));
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
  }, [dispatch, user]);


  // New useEffect to handle URL parameters for filtering
  useEffect(() => {
    let newFilters = {};
    const validCategories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty', 'Health', 'Books', 'Toys', 'Automotive', 'Industrial', 'Grocery', 'Kids', 'Outdoors', 'Pet Supplies', 'Music', 'Movies', 'Software', 'Video Games', 'Computers', 'Appliances', 'Baby', 'Office Products', 'Tools & Home Improvement', 'Arts, Crafts & Sewing', 'Collectibles & Fine Art', 'Handmade', 'Luggage & Travel Gear', 'Shoes', 'Jewelry', 'Watches', 'Clothing', 'Accessories', 'Other'];

    const parseMultiValueParam = (param) => param ? decodeURIComponent(param).split(',').filter(Boolean) : [];

    const shopValues = parseMultiValueParam(shopSearchParam);
    const categoryValueFromUrl = categorySearchParam ? decodeURIComponent(categorySearchParam) : null;
    const brandValues = parseMultiValueParam(brandSearchParam);
    const priceValues = parseMultiValueParam(priceSearchParam);

    if (shopValues.length > 0) {
      newFilters.shop = shopValues;
      // If a shop is specified, we still want to allow category filtering
      if (categoryValueFromUrl) {
        const matchedCategory = validCategories.find(
          cat => cat.toLowerCase() === categoryValueFromUrl.toLowerCase()
        );
        if (matchedCategory) {
          newFilters.category = [matchedCategory]; // Use the properly cased category
        }
      }
      if (brandValues.length > 0) {
        newFilters.brand = brandValues;
      }
      if (priceValues.length > 0) {
        newFilters.price = priceValues;
      }
    } else {
      // No shop in URL, handle other filters
      if (categoryValueFromUrl) {
        const matchedCategory = validCategories.find(
          cat => cat.toLowerCase() === categoryValueFromUrl.toLowerCase()
        );
        if (matchedCategory) {
          newFilters.category = [matchedCategory]; // Use the properly cased category
        }
      }
      if (brandValues.length > 0) {
        newFilters.brand = brandValues;
      }
      if (priceValues.length > 0) {
        newFilters.price = priceValues;
      }

      // If no URL parameters, try loading from session storage
      if (Object.keys(newFilters).length === 0) {
        const sessionFilters = JSON.parse(sessionStorage.getItem('filters')) || {};
        if (Object.keys(sessionFilters).length > 0) {
          // Validate category from session storage
          if (sessionFilters.category) {
            const matchedCategory = validCategories.find(
              cat => cat.toLowerCase() === sessionFilters.category[0].toLowerCase()
            );
            if (matchedCategory) {
              sessionFilters.category = [matchedCategory];
            } else {
              delete sessionFilters.category;
            }
          }
          newFilters = sessionFilters;
        }
      }
    }
    
    setFilters(newFilters);
    if (Object.keys(newFilters).length > 0) {
      sessionStorage.setItem('filters', JSON.stringify(newFilters));
    } else {
      sessionStorage.removeItem('filters');
    }
  }, [shopSearchParam, categorySearchParam, brandSearchParam, priceSearchParam]);


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
      // Create a query string from the current filters
      const createQueryString = createSearchParamsHelper(filters)
      
      // Get the current URL search params
      const currentParams = new URLSearchParams(window.location.search);
      
      // Create new search params from our filter-based query string
      const newParams = new URLSearchParams(createQueryString);
      
      // Set the new search params
      setSearchParams(newParams);
    } else if (filters && Object.keys(filters).length === 0) {
      setSearchParams({}); // Clear URL params if filters are empty
    }
  }, [filters, setSearchParams]);


  // Add a refresh key to force re-fetch when needed
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    if(filters !== null && sort !== null) {
      console.log('===== DEBUGGING FILTERS =====');
      console.log('Listing page: Fetching products with refresh key:', refreshKey);
      console.log('Current filters object:', JSON.stringify(filters));
      
      // Prepare filter parameters for the API call
      // Create a new object with correct format for API
      const apiFilters = {};
      
      // Process categories - convert from array format to comma-separated string
      if (filters.category && filters.category.length > 0) {
        apiFilters.category = filters.category.join(',');
        console.log('Category filter being applied:', apiFilters.category);
      }
      
      // Process subcategories
      if (filters.subCategory && filters.subCategory.length > 0) {
        apiFilters.subCategory = filters.subCategory.join(',');
        console.log('Subcategory filter being applied:', apiFilters.subCategory);
      }
      
      // Process brands
      if (filters.brand && filters.brand.length > 0) {
        apiFilters.brand = filters.brand.join(',');
        console.log('Brand filter being applied:', apiFilters.brand);
      }
      
      // Process shops
      if (filters.shop && filters.shop.length > 0) {
        apiFilters.shop = filters.shop.join(',');
        console.log('Shop filter being applied:', apiFilters.shop);
      }
      
      // Process price ranges
      if (filters.price && filters.price.length > 0) {
        apiFilters.price = filters.price.join(',');
        console.log('Price filter being applied:', apiFilters.price);
      }
      
      console.log('Final API filters after processing:', apiFilters);
      console.log('===== END DEBUGGING =====');
      
      // Dispatch the action with properly formatted filters
      dispatch(fetchAllFilteredProducts({
        filterParams: apiFilters, 
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