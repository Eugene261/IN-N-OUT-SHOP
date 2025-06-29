import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Heart, Star, Store, MapPin, ShoppingBag, Clock } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchAllTaxonomyData } from '@/store/superAdmin/taxonomy-slice';
import { useNavigate } from 'react-router-dom';
import { navigateWithScroll } from '../../utils/scrollUtils';

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
  const navigate = useNavigate();

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

  const handleProductClick = () => {
    // Ensure we have a valid product and product ID before navigating
    if (!product || !product._id) {
      console.error('Product or product ID is missing:', product);
      return;
    }

    if (handleGetProductDetails) {
      handleGetProductDetails();
    } else {
      navigateWithScroll(navigate, `/shop/product/${product._id}`);
    }
  };

  return (
    <div className="w-full cursor-pointer group" onClick={handleProductClick}>
      {/* Product Image */}
      <div className="relative w-full aspect-square mb-3 overflow-hidden bg-gray-50 rounded-lg">
        <img
          src={product?.image}
          alt={product?.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Sale Badge - Nike style */}
        {product?.salePrice > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            Sale
          </div>
        )}

        {/* Wishlist Button - Nike style */}
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
          onClick={(e) => {
            e.stopPropagation();
            if (handleAddToWishlist) {
              handleAddToWishlist(product?._id);
            }
          }}
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-200 ${
              isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`}
          />
        </button>
      </div>

      {/* Product Information - Nike style minimal layout */}
      <div className="space-y-1">
        {/* Shop/Brand Name - small and subtle */}
        {shop?.shopName && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">
              {shop.shopName}
            </span>
            {shop.shopRating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-500">{shop.shopRating}</span>
              </div>
            )}
          </div>
        )}

        {/* Product Title */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
          {product?.title}
        </h3>

        {/* Category - subtle */}
        {displayCategory && (
          <p className="text-xs text-gray-500">
            {displayCategory}
          </p>
        )}

        {/* Colors available - Nike style */}
        {product?.colors && product.colors.length > 0 && (
          <p className="text-xs text-gray-500">
            {product.colors.length} Color{product.colors.length > 1 ? 's' : ''}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-sm font-bold text-gray-900">
            GHS {product?.price?.toFixed(2)}
          </span>
          {product?.salePrice > 0 && product?.salePrice > product?.price && (
            <span className="text-sm text-gray-500 line-through">
              GHS {product?.salePrice?.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedShoppingProductTile; 