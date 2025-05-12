import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  toggleProductBestseller, 
  toggleProductNewArrival 
} from '../../store/shop/product-slice/index';
import { fetchFeaturedProducts } from '../../store/super-admin/products-slice/index';
import { getFeatureImages, deleteFeatureImage, addFeatureImage } from '../../store/common-slice/index';
import { createFeaturedCollection, updateFeaturedCollection, fetchFeaturedCollections } from '../../store/superAdmin/featured-collection-slice';
import { 
  Star, 
  Zap, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Activity, 
  Box, 
  Image, 
  Trash2,
  UploadCloud,
  FileIcon,
  X,
  Layout,
  Grid
} from 'lucide-react';

// Import the FeaturedCollections components
import FeaturedCollectionList from '../superAdmin-view/featuredCollectionList';
import FeaturedCollectionForm from '../superAdmin-view/featuredCollectionForm';

const SuperAdminFeatured = () => {
  const dispatch = useDispatch();
  const { featuredProducts, isLoading: productsLoading } = useSelector((state) => state.superAdminProducts);
  const { FeatureImageList, deleteLoading, deleteError, uploadLoading, uploadError, isLoading: imagesLoading } = useSelector(state => state.commonFeature);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('featureImages');
  
  // States
  const [updateStatus, setUpdateStatus] = useState({
    loading: false,
    error: null,
    successMessage: null,
    productId: null,
    type: null
  });
  
  const [filteredProducts, setFilteredProducts] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  
  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);
  
  // Featured collections states
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  
  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(getFeatureImages());
    dispatch(fetchFeaturedCollections());
  }, [dispatch]);
  
  // Refresh product data when needed
  const refreshProductData = () => {
    dispatch(fetchFeaturedProducts());
  };
  
  // Clear success/error messages after 5 seconds
  useEffect(() => {
    let timer;
    if (deleteSuccess || deleteError || uploadSuccess) {
      timer = setTimeout(() => {
        setDeleteSuccess(false);
        setUploadSuccess(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [deleteSuccess, deleteError, uploadSuccess]);
  
  // Handle image file upload
  useEffect(() => {
    if (imageFile) {
      handleUploadImage();
    }
  }, [imageFile]);
  
  const handleImageFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) setImageFile(selectedFile);
  };
  
  const handleDragOver = (evt) => {
    evt.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (evt) => {
    evt.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (evt) => {
    evt.preventDefault();
    setIsDragging(false);
    const droppedFile = evt.dataTransfer.files?.[0];
    if (droppedFile) setImageFile(droppedFile);
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleUploadImage = async () => {
    try {
      await dispatch(addFeatureImage(imageFile)).unwrap();
      setUploadSuccess(true);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading feature image:', error);
    }
  };
  
  function handleDeleteImage(imageId) {
    setImageToDelete(imageId);
    setShowDeleteDialog(true);
  }
  
  function confirmDeleteImage() {
    if (imageToDelete) {
      setDeletingId(imageToDelete);
      setShowDeleteDialog(false);
      
      dispatch(deleteFeatureImage(imageToDelete))
        .unwrap()
        .then((data) => {
          if (data?.success) {
            setDeleteSuccess(true);
          }
        })
        .catch((error) => {
          console.error("Delete failed:", error);
        })
        .finally(() => {
          setDeletingId(null);
          setImageToDelete(null);
        });
    }
  }
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Featured Content Management</h1>
        <p className="text-gray-600">Manage featured products, collections, and promotional images</p>
      </motion.div>
      
      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('featureImages')}
              className={`${activeTab === 'featureImages' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Image className="w-5 h-5 mr-2" />
              Feature Images
            </button>
            <button
              onClick={() => setActiveTab('featuredCollections')}
              className={`${activeTab === 'featuredCollections' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Layout className="w-5 h-5 mr-2" />
              Featured Collections
            </button>
            <button
              onClick={() => setActiveTab('featuredProducts')}
              className={`${activeTab === 'featuredProducts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Star className="w-5 h-5 mr-2" />
              Featured Products
            </button>
          </nav>
        </div>
      </motion.div>
      
      {/* Feature Images Tab Content */}
      {activeTab === 'featureImages' && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-800">Feature Images</h2>
              <div className="ml-2 h-1 w-10 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          
          {/* Image Upload Section */}
          <motion.div 
            variants={itemVariants}
            className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <UploadCloud className="mr-2 h-5 w-5 text-blue-500" />
              Upload Feature Image
            </h3>
            
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-red-100 border border-red-200 rounded-xl flex items-center gap-3 text-red-700"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{uploadError}</span>
              </motion.div>
            )}

            {uploadSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-green-100 border border-green-200 rounded-xl flex items-center gap-3 text-green-700"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Image uploaded successfully!</span>
              </motion.div>
            )}
            
            {/* Upload Area */}
            {!imageFile ? (
              <label 
                className={`relative block border-2 ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-dashed border-gray-300'} rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageFileChange}
                  ref={fileInputRef}
                />
                <div className="flex flex-col items-center justify-center h-32">
                  <UploadCloud className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {isDragging ? 'Drop image here' : 'Drag and drop image here'}
                  </p>
                  <p className="text-xs text-gray-500">or click to browse</p>
                </div>
              </label>
            ) : uploadLoading ? (
              <div className="flex items-center justify-center h-48">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
                />
              </div>
            ) : (
              <div className="p-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center truncate max-w-[70%]">
                    <div className="bg-gray-100 p-2 rounded-lg mr-3">
                      <FileIcon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium truncate text-gray-900">{imageFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(imageFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Remove File</span>
                  </motion.button>
                </motion.div>
              </div>
            )}
          </motion.div>
          
          {deleteError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-100 border border-red-200 rounded-xl flex items-center gap-3 text-red-700"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{deleteError}</span>
            </motion.div>
          )}

          {deleteSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-100 border border-green-200 rounded-xl flex items-center gap-3 text-green-700"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Image deleted successfully!</span>
            </motion.div>
          )}
          
          {imagesLoading ? (
            <div className="flex justify-center items-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full"
              />
            </div>
          ) : FeatureImageList && FeatureImageList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {FeatureImageList.map((item, index) => (
                <motion.div
                  key={item._id || index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group border-2 border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
                >
                  {/* Image container */}
                  <div className="relative bg-gray-50 min-h-[200px] flex items-center justify-center p-2">
                    <img 
                      src={item.image} 
                      alt={`Feature image ${index + 1}`}
                      className="max-w-full max-h-full w-auto h-auto object-contain" 
                    />
                  </div>
                  
                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      className="p-2.5 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete Image"
                      onClick={() => handleDeleteImage(item._id)}
                      disabled={deleteLoading && deletingId === item._id}
                    >
                      {deleteLoading && deletingId === item._id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full"
                        />
                      ) : (
                        <Trash2 className="w-5 h-5 text-red-600" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 space-y-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Image className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="font-medium">No feature images uploaded yet</p>
              <p className="text-sm">Images will appear here once uploaded</p>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Featured Collections Tab Content */}
      {activeTab === 'featuredCollections' && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-800">Featured Collections</h2>
              <div className="ml-2 h-1 w-10 bg-blue-500 rounded-full"></div>
            </div>
            <button
              onClick={() => {
                setShowCollectionForm(true);
                setEditingCollection(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Collection
            </button>
          </div>
          
          {showCollectionForm ? (
            <FeaturedCollectionForm 
              initialData={editingCollection} 
              onSubmit={(formData) => {
                console.log('Form submitted with data:', formData);
                
                // Create a FormData object for image upload if needed
                const submitData = new FormData();
                
                // Add all form fields to the FormData
                submitData.append('title', formData.title);
                submitData.append('description', formData.description);
                submitData.append('linkTo', formData.linkTo);
                submitData.append('position', formData.position);
                submitData.append('isActive', formData.isActive);
                
                // If there's a new image file, add it to the FormData
                if (formData.imageFile) {
                  submitData.append('image', formData.imageFile);
                } else if (formData.image) {
                  // If using an existing image URL
                  submitData.append('imageUrl', formData.image);
                }
                
                // Dispatch the appropriate action based on whether we're editing or creating
                if (editingCollection) {
                  dispatch(updateFeaturedCollection({ 
                    id: editingCollection._id, 
                    data: submitData 
                  }))
                    .unwrap()
                    .then(() => {
                      // Refresh the collections list
                      dispatch(fetchFeaturedCollections());
                      setShowCollectionForm(false);
                      setEditingCollection(null);
                    })
                    .catch(error => {
                      console.error('Failed to update collection:', error);
                    });
                } else {
                  dispatch(createFeaturedCollection(submitData))
                    .unwrap()
                    .then(() => {
                      // Refresh the collections list
                      dispatch(fetchFeaturedCollections());
                      setShowCollectionForm(false);
                      setEditingCollection(null);
                    })
                    .catch(error => {
                      console.error('Failed to create collection:', error);
                    });
                }
              }}
              onCancel={() => {
                setShowCollectionForm(false);
                setEditingCollection(null);
              }}
              isUploading={false}
            />
          ) : (
            <FeaturedCollectionList 
              onEdit={(collection) => {
                setEditingCollection(collection);
                setShowCollectionForm(true);
              }}
            />
          )}
        </motion.div>
      )}
      
      {/* Featured Products Tab Content */}
      {activeTab === 'featuredProducts' && (
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-blue-600 flex items-center">
              <Grid className="h-7 w-7 mr-2" />
              Manage Featured Products
            </h2>
          </div>
          
          {/* Product Management Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">All Products</h3>
              <p className="text-gray-600 mt-2">
                Toggle products as bestsellers or new arrivals to feature them on the homepage.
              </p>
            </div>
            
            {productsLoading ? (
              <div className="flex justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full"
                />
              </div>
            ) : (
              <div className="p-6">
                {updateStatus.error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-700">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm">{updateStatus.error}</p>
                  </div>
                )}
                
                {updateStatus.successMessage && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-lg flex items-center text-green-700">
                    <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm">{updateStatus.successMessage}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      if (searchTerm.trim() === '') {
                        setFilteredProducts(null);
                      } else {
                        const filtered = featuredProducts.filter(product => 
                          product.name.toLowerCase().includes(searchTerm)
                        );
                        setFilteredProducts(filtered);
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-4">
                  {(filteredProducts || featuredProducts)?.length > 0 ? (
                    (filteredProducts || featuredProducts).map((product) => (
                      <div 
                        key={product._id} 
                        className={`flex items-center justify-between p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors ${product.isBestseller || product.isNewArrival ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="h-20 w-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm">
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.title || product.name || 'Product'} 
                                className="h-full w-full object-cover"
                              />
                            ) : product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.title || product.name || 'Product'} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Box className="h-full w-full p-3 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <p className="text-base font-medium text-gray-900">{product.title || product.name || 'Product Name'}</p>
                              {product.isBestseller && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Star className="w-3 h-3 mr-1" /> Bestseller
                                </span>
                              )}
                              {product.isNewArrival && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  <Zap className="w-3 h-3 mr-1" /> New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">${product.price ? product.price.toFixed(2) : '0.00'}</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          {/* Bestseller Toggle */}
                          <button
                            onClick={() => {
                              setUpdateStatus({
                                loading: true,
                                error: null,
                                successMessage: null,
                                productId: product._id,
                                type: 'bestseller'
                              });
                              
                              dispatch(toggleProductBestseller(product._id))
                                .unwrap()
                                .then(() => {
                                  // Refresh product data to update UI
                                  refreshProductData();
                                  
                                  setUpdateStatus({
                                    loading: false,
                                    error: null,
                                    successMessage: `${product.bestseller ? 'Removed from' : 'Added to'} bestsellers`,
                                    productId: product._id,
                                    type: 'bestseller'
                                  });
                                  
                                  // Clear success message after 3 seconds
                                  setTimeout(() => {
                                    setUpdateStatus(prev => ({
                                      ...prev,
                                      successMessage: null
                                    }));
                                  }, 3000);
                                })
                                .catch((error) => {
                                  setUpdateStatus({
                                    loading: false,
                                    error: error.message || 'Failed to update bestseller status',
                                    successMessage: null,
                                    productId: product._id,
                                    type: 'bestseller'
                                  });
                                });
                            }}
                            disabled={updateStatus.loading && updateStatus.productId === product._id && updateStatus.type === 'bestseller'}
                            className={`px-3 py-2 rounded-lg ${product.isBestseller ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'} transition-colors flex items-center space-x-1`}
                            title={product.isBestseller ? 'Remove from bestsellers' : 'Add to bestsellers'}
                          >
                            {updateStatus.loading && updateStatus.productId === product._id && updateStatus.type === 'bestseller' ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-5 h-5 border-2 border-yellow-200 border-t-yellow-600 rounded-full"
                              />
                            ) : (
                              <>
                                <Star className="w-5 h-5" />
                                <span className="text-xs font-medium hidden sm:inline">Bestseller</span>
                              </>
                            )}
                          </button>
                          
                          {/* New Arrival Toggle */}
                          <button
                            onClick={() => {
                              setUpdateStatus({
                                loading: true,
                                error: null,
                                successMessage: null,
                                productId: product._id,
                                type: 'newArrival'
                              });
                              
                              dispatch(toggleProductNewArrival(product._id))
                                .unwrap()
                                .then(() => {
                                  // Refresh product data to update UI
                                  refreshProductData();
                                  
                                  setUpdateStatus({
                                    loading: false,
                                    error: null,
                                    successMessage: `${product.newArrival ? 'Removed from' : 'Added to'} new arrivals`,
                                    productId: product._id,
                                    type: 'newArrival'
                                  });
                                  
                                  // Clear success message after 3 seconds
                                  setTimeout(() => {
                                    setUpdateStatus(prev => ({
                                      ...prev,
                                      successMessage: null
                                    }));
                                  }, 3000);
                                })
                                .catch((error) => {
                                  setUpdateStatus({
                                    loading: false,
                                    error: error.message || 'Failed to update new arrival status',
                                    successMessage: null,
                                    productId: product._id,
                                    type: 'newArrival'
                                  });
                                });
                            }}
                            disabled={updateStatus.loading && updateStatus.productId === product._id && updateStatus.type === 'newArrival'}
                            className={`px-3 py-2 rounded-lg ${product.isNewArrival ? 'bg-blue-100 text-blue-700 border border-blue-300 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'} transition-colors flex items-center space-x-1`}
                            title={product.isNewArrival ? 'Remove from new arrivals' : 'Add to new arrivals'}
                          >
                            {updateStatus.loading && updateStatus.productId === product._id && updateStatus.type === 'newArrival' ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full"
                              />
                            ) : (
                              <>
                                <Zap className="w-5 h-5" />
                                <span className="text-xs font-medium hidden sm:inline">New Arrival</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Box className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p>No products found</p>
                      {filteredProducts && (
                        <button 
                          className="mt-4 text-blue-500 hover:text-blue-700"
                          onClick={() => setFilteredProducts(null)}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Legend Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Bestseller Products</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Products marked as bestsellers will appear in the Bestseller section on the homepage.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">New Arrival Products</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Products marked as new arrivals will appear in the New Arrivals section on the homepage.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">Delete Feature Image</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this image? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteImage}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center min-w-[100px]"
                  disabled={deletingId !== null}
                >
                  {deletingId !== null ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SuperAdminFeatured;
