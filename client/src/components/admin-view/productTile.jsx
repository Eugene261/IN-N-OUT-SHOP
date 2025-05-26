import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '../ui/card';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye } from 'lucide-react';

function AdminProductTile({ 
    product, 
    setFormData, 
    setOpenCreateProductsDialog, 
    setCurrentEditedId,
    handleDelete
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Log when product props change
  useEffect(() => {
    console.log('ProductTile received updated product:', product?._id, product?.title);
  }, [product]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="w-full"
    >
      <Card 
        className="w-full max-w-sm mx-auto overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
        data-product-id={product._id}
      >
        <div className="relative">
          {/* Pricing badge */}
          <motion.div 
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 z-10 shadow-sm border border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-2">
              {product.salePrice > 0 ? (
                <>
                  <span className="line-through text-sm text-gray-500">GHS{product?.salePrice}</span>
                  <span className="text-sm font-bold text-gray-900 product-price">GHS{product?.price}</span>
                </>
              ) : (
                <span className="text-sm font-bold text-gray-900 product-price">GHS{product?.price}</span>
              )}
            </div>
          </motion.div>
          
          {/* Image container */}
          <div className="relative overflow-hidden h-[300px] w-full">
            <motion.img
              src={product?.image && product.image.trim() !== '' ? product.image : 'https://via.placeholder.com/300x300?text=No+Image'}
              alt={product?.title}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
              }}
            />
            
            {/* Overlay gradient */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0"
              animate={{ opacity: isHovered ? 0.5 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 product-title">
            {product?.title}
          </h2>
          
          <div 
            className="text-sm text-gray-600 line-clamp-2 h-10 overflow-hidden prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product?.description || "No description available" }}
          />
          
          <div className="mt-3 flex justify-between items-center">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${parseInt(product?.totalStock) > 10 ? 'bg-green-100 text-green-800' : parseInt(product?.totalStock) > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {parseInt(product?.totalStock) > 0 ? `${product?.totalStock} in stock` : 'Out of stock'}
            </span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
              {product?.category || "Uncategorized"}
            </span>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center p-4 pt-0 gap-2">
          {/* Edit Button */}
          <motion.button
            whileHover={{ 
              scale: 1.05,
              backgroundColor: "#f3f4f6"
            }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 px-3 py-2 rounded-lg bg-white text-gray-800 text-sm font-medium 
            border border-gray-300 hover:border-gray-400 transition-all flex items-center 
            justify-center gap-2 shadow-sm"
            onClick={() => {
              // Create a clean copy of the product data to avoid reference issues
              const productData = {
                title: product.title,
                description: product.description,
                category: product.category ? product.category.toLowerCase() : '',
                subCategory: product.subCategory ? product.subCategory.toLowerCase() : '',
                gender: product.gender || '',
                brand: product.brand ? product.brand.toLowerCase() : '',
                sizes: product.sizes || [],
                colors: product.colors || [],
                price: product.price,
                salePrice: product.salePrice || 0,
                totalStock: product.totalStock,
                image: product.image,
                additionalImages: product.additionalImages || [],
                isBestseller: product.isBestseller || false,
                isNewArrival: product.isNewArrival || false
              };
              
              console.log('Editing product:', product._id);
              console.log('Product data being passed to form:', productData);
              
              // Set the current product ID being edited
              setCurrentEditedId(product._id);
              
              // Set the form data with the clean copy
              setFormData(productData);
              
              // Open the dialog
              setOpenCreateProductsDialog(true);
            }}
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </motion.button>

          {/* Delete Button */}
          <motion.button
            onClick={() => handleDelete()}
            whileHover={{ 
              scale: 1.05,
              backgroundColor: "#fee2e2"
            }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 px-3 py-2 rounded-lg bg-white text-red-600 text-sm font-medium 
            border border-red-200 hover:border-red-300 transition-all flex items-center 
            justify-center gap-2 shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </motion.button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default AdminProductTile;