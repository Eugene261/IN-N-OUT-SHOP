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
    // Special handling for subcategory filter (category-dependent)
    else if (filterType === 'subCategory') {
      // Only allow subcategory selection if a category is selected
      if (!newFilters.category || newFilters.category.length === 0) {
        console.log('Cannot select subcategory without selecting a category first');
        return;
      }
      
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


  // Function to map lowercase URL categories to proper case
  const mapUrlCategoryToProperCase = (urlCategory) => {
    const categoryMapping = {
      'men': 'Men',
      'women': 'Women', 
      'kids': 'Kids',
      'accessories': 'Accessories',
      'footwear': 'Footwear',
      'devices': 'Devices'
    };
    return categoryMapping[urlCategory?.toLowerCase()] || urlCategory;
  };

  // Function to map URL subcategories to proper case
  const mapUrlSubcategoryToProperCase = (urlSubcategory) => {
    // Common subcategory mappings
    const subcategoryMapping = {
      'tshirts': 'T-Shirts & Tops',
      't-shirts': 'T-Shirts & Tops',
      'pants': 'Pants',
      'trousers': 'Trousers',
      'shorts': 'Shorts',
      'hoodies': 'Hoodies & Sweatshirts',
      'jackets': 'Jackets & Outerwear',
      'tracksuits': 'Tracksuits',
      'running': 'Running',
      'basketball': 'Basketball',
      'training': 'Training & Gym',
      'lifestyle': 'Lifestyle',
      'soccer': 'Soccer',
      'shoes': 'All Shoes',
      'bags': 'Bags & Backpacks',
      'hats': 'Hats & Beanies',
      'socks': 'Socks & Underwear',
      'equipment': 'Sports Equipment',
      'smartphones': 'Smartphones',
      'tablets': 'Tablets',
      'laptops': 'Laptops',
      'smartwatches': 'Smartwatches',
      'headphones': 'Headphones',
      'speakers': 'Speakers'
    };
    return subcategoryMapping[urlSubcategory?.toLowerCase()] || urlSubcategory;
  };

  // New useEffect to handle URL parameters for filtering
  useEffect(() => {
    console.log('🔍 URL Parameters Debug:');
    console.log('categorySearchParam:', categorySearchParam);
    console.log('shopSearchParam:', shopSearchParam);
    console.log('brandSearchParam:', brandSearchParam);
    console.log('priceSearchParam:', priceSearchParam);
    
    // Get subcategory from URL
    const subCategorySearchParam = searchParams.get('subCategory');
    console.log('subCategorySearchParam:', subCategorySearchParam);
    
    let newFilters = {};

    const parseMultiValueParam = (param) => param ? decodeURIComponent(param).split(',').filter(Boolean) : [];

    const shopValues = parseMultiValueParam(shopSearchParam);
    const categoryValueFromUrl = categorySearchParam ? decodeURIComponent(categorySearchParam) : null;
    const subCategoryValuesFromUrl = parseMultiValueParam(subCategorySearchParam);
    const brandValues = parseMultiValueParam(brandSearchParam);
    const priceValues = parseMultiValueParam(priceSearchParam);

    console.log('Parsed values:');
    console.log('- shopValues:', shopValues);
    console.log('- categoryValueFromUrl (raw):', categoryValueFromUrl);
    console.log('- subCategoryValuesFromUrl (raw):', subCategoryValuesFromUrl);
    console.log('- brandValues:', brandValues);
    console.log('- priceValues:', priceValues);

    // Map category and subcategory to proper case
    const mappedCategory = categoryValueFromUrl ? mapUrlCategoryToProperCase(categoryValueFromUrl) : null;
    const mappedSubCategories = subCategoryValuesFromUrl.map(subcat => mapUrlSubcategoryToProperCase(subcat));
    console.log('- categoryValueFromUrl (mapped):', mappedCategory);
    console.log('- subCategoryValuesFromUrl (mapped):', mappedSubCategories);

    if (shopValues.length > 0) {
      newFilters.shop = shopValues;
      // If a shop is specified, we still want to allow category filtering
      if (mappedCategory) {
        newFilters.category = [mappedCategory];
      }
      if (mappedSubCategories.length > 0) {
        newFilters.subCategory = mappedSubCategories;
      }
      if (brandValues.length > 0) {
        newFilters.brand = brandValues;
      }
      if (priceValues.length > 0) {
        newFilters.price = priceValues;
      }
    } else {
      // No shop in URL, handle other filters
      if (mappedCategory) {
        newFilters.category = [mappedCategory];
      }
      if (mappedSubCategories.length > 0) {
        newFilters.subCategory = mappedSubCategories;
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
          // Use session filters as-is, no validation
          newFilters = sessionFilters;
        }
      }
    }
    
    console.log('Final newFilters:', newFilters);
    setFilters(newFilters);
    if (Object.keys(newFilters).length > 0) {
      sessionStorage.setItem('filters', JSON.stringify(newFilters));
    } else {
      sessionStorage.removeItem('filters');
    }
  }, [shopSearchParam, categorySearchParam, brandSearchParam, priceSearchParam, searchParams]);


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
        console.log('Category filter type:', typeof apiFilters.category);
        console.log('Category filter array:', filters.category);
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
      console.log('Sort parameter:', sort);
      console.log('===== END DEBUGGING =====');
      
      // Dispatch the action with properly formatted filters
      dispatch(fetchAllFilteredProducts({
        filterParams: apiFilters, 
        sortParams: sort
      }))
      .then((result) => {
        console.log('===== API RESPONSE DEBUGGING =====');
        console.log('API response:', result);
        if (result.payload && result.payload.data) {
          console.log('Number of products returned:', result.payload.data.length);
          if (result.payload.data.length > 0) {
            console.log('Sample product categories:', result.payload.data.slice(0, 3).map(p => p.category));
          }
        }
        console.log('===== END API RESPONSE DEBUGGING =====');
      })
      .catch((error) => {
        console.error('API call failed:', error);
      });
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
    <div className='flex flex-col bg-gray-50 min-h-screen'>
      {/* Mobile Filter Toggle */}
      <div className="md:hidden px-4 py-3 bg-white border-b border-gray-200">
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 
          rounded-md text-sm font-medium transition-colors duration-200"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      <div className='flex flex-col lg:grid lg:grid-cols-[280px_1fr] min-h-screen'>
        {/* Sidebar Filters */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block bg-white border-r border-gray-200 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto`}>
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="p-6">
            <EnhancedProductFilter 
              filters={filters}  
              handleFilter={handleFilter}
              availableShops={availableShops}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white">
          {/* Header Section */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">All Products</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {productList?.length || 0} product{productList?.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-50 hover:bg-gray-100 
                    text-gray-800 border border-gray-200 transition-all duration-200 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    <span>Sort</span>
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

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <ShoppingLoader />
            </div>
          ) : (
            <div className="px-4 lg:px-8 py-6">
              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {productList?.map((productItem, index) => {
                  const isInWishlist = wishlistItems?.some(item => item.productId === productItem._id);
                  return (
                    <motion.div
                      key={`product-${productItem.id || index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="group"
                    >
                      <EnhancedShoppingProductTile 
                        handleGetProductDetails={handleGetProductDetails}
                        product={productItem} 
                        handleAddToCart={handleAddToCart}
                        handleAddToWishlist={handleAddToWishlist}
                        isInWishlist={isInWishlist}
                      />
                      
                      {/* Clean separator between rows */}
                      {(index + 1) % 2 === 0 && index < productList.length - 2 && (
                        <div className="col-span-2 sm:hidden">
                          <div className="h-px bg-gray-100 my-4 mx-2"></div>
                        </div>
                      )}
                      {(index + 1) % 3 === 0 && index < productList.length - 3 && (
                        <div className="hidden sm:block lg:hidden col-span-3">
                          <div className="h-px bg-gray-100 my-6 mx-4"></div>
                        </div>
                      )}
                      {(index + 1) % 4 === 0 && index < productList.length - 4 && (
                        <div className="hidden lg:block xl:hidden col-span-4">
                          <div className="h-px bg-gray-100 my-6 mx-4"></div>
                        </div>
                      )}
                      {(index + 1) % 5 === 0 && index < productList.length - 5 && (
                        <div className="hidden xl:block col-span-5">
                          <div className="h-px bg-gray-100 my-6 mx-4"></div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Empty State */}
              {productList?.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">🛍️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
                  <button 
                    onClick={() => {
                      setFilters({});
                      sessionStorage.removeItem('filters');
                    }}
                    className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
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