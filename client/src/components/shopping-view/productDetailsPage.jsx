            <div className="flex items-center justify-between mb-4">
              <div className="flex items-end gap-2">
                {/* Regular price */}
                <p className="text-2xl font-bold text-black">
                  GHS{productDetails?.price}
                </p>
                
                {/* Sale price if available */}
                {productDetails?.salePrice > 0 && (
                  <p className="text-xl font-bold text-gray-400 line-through">
                    GHS{productDetails?.salePrice}
                  </p>
                )}
              </div>
              
              {/* Wishlist button */}
              <button
                onClick={() => handleToggleWishlist()}
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
              >
                <Heart 
                  className={`w-6 h-6 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
                />
              </button>
            </div> 