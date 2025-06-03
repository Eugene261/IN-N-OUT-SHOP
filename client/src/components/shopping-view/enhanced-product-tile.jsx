import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
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
    <Card className="w-full max-w-sm mx-auto cursor-pointer relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 bg-white overflow-hidden">
      {/* Sale Badge */}
      {product?.salePrice > 0 && (
        <Badge className="absolute top-2 left-2 z-20 bg-red-500 text-white text-xs px-2 py-1">
          Sale
        </Badge>
      )}

      {/* Wishlist Button */}
      <button
        className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
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
        {/* Compact Product Image */}
        <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-gray-50">
          <img
            src={product?.image}
            alt={product?.title}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </div>

        <CardContent className="p-3 space-y-2">
          {/* Shop Information - Compact */}
          {shop && shop.shopName && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {shop.shopLogo ? (
                  <img
                    src={shop.shopLogo}
                    alt={shop.shopName}
                    className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                    <Store className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <span className="text-xs font-medium text-gray-600 truncate">
                  {shop.shopName}
                </span>
              </div>
              {shop.shopRating > 0 && (
                <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded">
                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-700">
                    {shop.shopRating}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Product Title - Compact */}
          <h3 className="text-sm font-semibold line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
            {product?.title}
          </h3>

          {/* Categories and Location Row */}
          <div className="flex items-center justify-between text-xs">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0.5">
              {displayCategory}
            </Badge>
            {shop && (shop.baseCity || shop.baseRegion) && (
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="text-xs truncate">
                  {shop.baseCity}{shop.baseCity && shop.baseRegion ? ', ' : ''}{shop.baseRegion}
                </span>
              </div>
            )}
          </div>

          {/* Brand Badge */}
          {displayBrand && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 px-1.5 py-0.5 w-fit">
              {displayBrand}
            </Badge>
          )}

          {/* Price - Compact */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-lg font-bold text-gray-900">
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
    </Card>
  );
}

export default EnhancedShoppingProductTile; 