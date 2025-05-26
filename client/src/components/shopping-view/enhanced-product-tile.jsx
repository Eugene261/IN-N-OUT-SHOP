import { Badge } from "../ui/badge";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Heart, Star, Store, MapPin } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchAllTaxonomyData } from '@/store/superAdmin/taxonomy-slice';

function EnhancedShoppingProductTile({
  product,
  handleGetProductDetails,
  handleAddToCart,
  handleAddToWishlist,
  isInWishlist = false
}) {
  const dispatch = useDispatch();
  const { brands, categories } = useSelector(state => state.taxonomy);
  const shop = product?.createdBy;

  // Fetch taxonomy data on component mount
  useEffect(() => {
    if (!brands || brands.length === 0) {
      dispatch(fetchAllTaxonomyData());
    }
  }, [dispatch, brands]);

  // Utility function to convert database IDs to human-readable names
  const convertIdToName = (id, taxonomyArray) => {
    if (!id) return '';
    
    // If it's already a human-readable name (not a MongoDB ObjectId), return as is
    if (typeof id === 'string' && id.length !== 24) {
      return id;
    }
    
    // Find the taxonomy item by ID
    const item = taxonomyArray?.find(item => item._id === id);
    return item ? item.name : id;
  };

  // Get display names for brand and category
  const displayBrand = convertIdToName(product?.brand, brands);
  const displayCategory = convertIdToName(product?.category, categories);

  return (
    <Card className="w-full max-w-sm mx-auto cursor-pointer relative group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-200 dark:border-gray-700 bg-white overflow-hidden">
      {/* Sale Badge */}
      {product?.salePrice > 0 && (
        <Badge className="absolute top-3 left-3 z-20 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg">
          Sale
        </Badge>
      )}

      {/* Wishlist Button */}
      <button
        className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        onClick={(e) => {
          e.stopPropagation();
          console.log('Wishlist button clicked for product:', product?._id);
          if (handleAddToWishlist) {
            handleAddToWishlist(product?._id);
          }
        }}
      >
        <Heart
          className={`h-4 w-4 transition-colors duration-200 ${
            isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-400'
          }`}
        />
      </button>

      <div onClick={() => handleGetProductDetails(product?._id)}>
        {/* Crystal Clear Product Image */}
        <div className="relative w-full h-[280px] overflow-hidden bg-white">
          {/* Clean Background with Subtle Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-white"></div>
          
          {/* Image Container with Perfect Centering */}
          <div className="relative h-full w-full p-6 flex items-center justify-center">
            <img
              src={product?.image}
              alt={product?.title}
              className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105 filter drop-shadow-xl"
              loading="lazy"
            />
          </div>
          
          {/* Subtle Shadow for Product Depth */}
          <div className="absolute inset-x-6 bottom-6 h-4 bg-black/10 rounded-full blur-lg opacity-50"></div>
          
          {/* Clean Hover Highlight */}
          <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </div>

        <CardContent className="p-4 pb-2 relative">
          {/* Shop Information */}
          {shop && shop.shopName && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {shop.shopLogo ? (
                  <img
                    src={shop.shopLogo}
                    alt={shop.shopName}
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0">
                    <Store className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {shop.shopName}
                </span>
              </div>
              {shop.shopRating > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0 bg-yellow-50 px-2 py-1 rounded-full">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-700">
                    {shop.shopRating}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Product Title */}
          <h3 className="text-lg font-bold mb-2 line-clamp-2 min-h-[3.5rem] text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-200">
            {product?.title}
          </h3>

          {/* Product Categories */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
              {displayCategory}
            </Badge>
            {displayBrand && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                {displayBrand}
              </Badge>
            )}
          </div>

          {/* Shop Location */}
          {shop && (shop.baseCity || shop.baseRegion) && (
            <div className="flex items-center gap-1 mb-3 text-gray-500">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">
                {shop.baseCity}{shop.baseCity && shop.baseRegion && ', '}{shop.baseRegion}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              GHS {product?.salePrice || product?.price}
            </span>
            {product?.salePrice > 0 && (
              <span className="text-sm text-gray-500 line-through">
                GHS {product?.price}
              </span>
            )}
          </div>
        </CardContent>
      </div>

      <CardFooter className="p-4 pt-0">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            console.log('Add to cart button clicked for product:', product?._id);
            if (handleAddToCart) {
              handleAddToCart(product?._id, product?.totalStock);
            }
          }}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 transform ${
            product?.totalStock === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
          }`}
          disabled={product?.totalStock === 0}
        >
          {product?.totalStock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </CardFooter>
    </Card>
  );
}

export default EnhancedShoppingProductTile; 