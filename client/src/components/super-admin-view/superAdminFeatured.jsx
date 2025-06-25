import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  toggleProductBestseller, 
  toggleProductNewArrival 
} from '../../store/shop/product-slice/index';
import { fetchFeaturedProducts } from '../../store/super-admin/products-slice/index';
import { getFeatureImages, deleteFeatureImage, addFeatureImage, addFeatureMedia } from '../../store/common-slice/index';
import { createFeaturedCollection, updateFeaturedCollection, fetchFeaturedCollections } from '../../store/superAdmin/featured-collection-slice';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';
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
  Grid,
  Video,
  Play,
  Edit
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
  
  // Media upload states (enhanced for video support)
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);
  
  // Featured collections states
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  
  // Migration state
  const [migrationStatus, setMigrationStatus] = useState({
    isRunning: false,
    completed: false,
    error: null,
    result: null
  });
  
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
  
  // Handle media file selection
  const handleMediaFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setMediaFile(selectedFile);
      // Auto-detect media type based on file type
      if (selectedFile.type.startsWith('video/')) {
        setMediaType('video');
      } else if (selectedFile.type.startsWith('image/')) {
        setMediaType('image');
      }
    }
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
    if (droppedFile) {
      setMediaFile(droppedFile);
      // Auto-detect media type
      if (droppedFile.type.startsWith('video/')) {
        setMediaType('video');
      } else if (droppedFile.type.startsWith('image/')) {
        setMediaType('image');
      }
    }
  };
  
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaTitle('');
    setMediaDescription('');
    setMediaType('image');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleUploadMedia = async () => {
    if (!mediaFile) return;
    
    try {
      const mediaData = {
        file: mediaFile,
        mediaType: mediaType,
        title: mediaTitle.trim(),
        description: mediaDescription.trim()
      };
      
      await dispatch(addFeatureMedia(mediaData)).unwrap();
      setUploadSuccess(true);
      
      // Reset form
      setMediaFile(null);
      setMediaTitle('');
      setMediaDescription('');
      setMediaType('image');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading feature media:', error);
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
  
  // Migration function
  const handleRunMigration = async () => {
    setMigrationStatus({ isRunning: true, completed: false, error: null, result: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/migrations/migrate-feature-media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMigrationStatus({
          isRunning: false,
          completed: true,
          error: null,
          result: data
        });
        // Refresh the feature list
        dispatch(getFeatureImages());
      } else {
        setMigrationStatus({
          isRunning: false,
          completed: false,
          error: data.message || 'Migration failed',
          result: null
        });
      }
    } catch (error) {
      setMigrationStatus({
        isRunning: false,
        completed: false,
        error: error.message || 'Migration failed',
        result: null
      });
    }
  };
  
  // Get file type icon
  const getFileTypeIcon = (file) => {
    if (file.type.startsWith('video/')) {
      return <Video className="w-6 h-6 text-blue-600" />;
    } else if (file.type.startsWith('image/')) {
      return <Image className="w-6 h-6 text-green-600" />;
    }
    return <FileIcon className="w-6 h-6 text-gray-700" />;
  };
  
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
        <p className="text-gray-600">Manage featured products, collections, and promotional images & videos</p>
      </motion.div>
      
      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('featureImages')}
              className={`${activeTab === 'featureImages' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Video className="w-5 h-5 mr-2" />
              Hero Media
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
      
      {/* Feature Media Tab Content */}
      {activeTab === 'featureImages' && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-800">Hero Media</h2>
              <div className="ml-2 h-1 w-10 bg-blue-500 rounded-full"></div>
            </div>
            
            {/* Migration Button */}
            <button
              onClick={handleRunMigration}
              disabled={migrationStatus.isRunning || migrationStatus.completed}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                migrationStatus.completed 
                  ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                  : migrationStatus.isRunning 
                    ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              {migrationStatus.isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : migrationStatus.completed ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Migration Complete
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Migration
                </>
              )}
            </button>
          </div>
          
          {/* Migration Status Messages */}
          {migrationStatus.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-100 border border-red-200 rounded-xl flex items-center gap-3 text-red-700"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Migration failed: {migrationStatus.error}</span>
            </motion.div>
          )}
          
          {migrationStatus.completed && migrationStatus.result && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-100 border border-green-200 rounded-xl"
            >
              <div className="flex items-center gap-3 text-green-700 mb-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{migrationStatus.result.message}</span>
              </div>
              {migrationStatus.result.migratedCount > 0 && (
                <div className="text-xs text-green-600 ml-8">
                  • Migrated: {migrationStatus.result.migratedCount} features
                  <br />
                  • Total features: {migrationStatus.result.totalFeaturesWithMediaUrl}
                </div>
              )}
            </motion.div>
          )}
          
          {/* Media Upload Section */}
          <motion.div 
            variants={itemVariants}
            className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <UploadCloud className="mr-2 h-5 w-5 text-blue-500" />
              Upload Hero Media
            </h3>
            
            <div className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg">
              <strong>Supported formats:</strong> Images (JPG, PNG, WebP) and Videos (MP4, WebM, MOV)
              <br />
              <strong>Recommended:</strong> Images: 1920x1080px, Videos: 1920x1080px or 16:9 aspect ratio
            </div>
            
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
                <span className="text-sm font-medium">Media uploaded successfully!</span>
              </motion.div>
            )}
            
            {/* Upload Area */}
            {!mediaFile ? (
              <label 
                className={`relative block border-2 ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-dashed border-gray-300'} rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={handleMediaFileChange}
                  ref={fileInputRef}
                />
                <div className="flex flex-col items-center justify-center h-32">
                  <div className="flex items-center justify-center space-x-4 mb-3">
                    <Image className="h-8 w-8 text-gray-400" />
                    <Video className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {isDragging ? 'Drop media here' : 'Drag and drop images or videos here'}
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
              <div className="space-y-4">
                {/* File Preview */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center truncate max-w-[70%]">
                    <div className="bg-gray-100 p-2 rounded-lg mr-3">
                      {getFileTypeIcon(mediaFile)}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium truncate text-gray-900">{mediaFile.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{(mediaFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span className="capitalize">{mediaType}</span>
                      </div>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                    onClick={handleRemoveMedia}
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Remove File</span>
                  </motion.button>
                </motion.div>
                
                {/* Media Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMediaType('image')}
                    className={`p-3 border-2 rounded-lg flex items-center justify-center transition-all ${
                      mediaType === 'image' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Image className="w-5 h-5 mr-2" />
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`p-3 border-2 rounded-lg flex items-center justify-center transition-all ${
                      mediaType === 'video' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Video className="w-5 h-5 mr-2" />
                    Video
                  </button>
                </div>
                
                {/* Metadata Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={mediaTitle}
                      onChange={(e) => setMediaTitle(e.target.value)}
                      placeholder="Enter media title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={mediaDescription}
                      onChange={(e) => setMediaDescription(e.target.value)}
                      placeholder="Enter media description..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Upload Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUploadMedia}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <UploadCloud className="w-5 h-5 mr-2" />
                  Upload {mediaType === 'video' ? 'Video' : 'Image'}
                </motion.button>
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
              <span className="text-sm font-medium">Media deleted successfully!</span>
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
              {FeatureImageList.map((item, index) => {
                const mediaUrl = item.mediaUrl || item.image;
                const mediaType = item.mediaType || 'image';
                
                return (
                  <motion.div
                    key={item._id || index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group border-2 border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
                  >
                    {/* Media container */}
                    <div className="relative bg-gray-50 min-h-[200px] flex items-center justify-center p-2">
                      {mediaType === 'video' ? (
                        <div className="relative w-full h-full">
                          <video 
                            src={mediaUrl}
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                            muted
                            loop
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={mediaUrl} 
                          alt={item.title || `Feature media ${index + 1}`}
                          className="max-w-full max-h-full w-auto h-auto object-contain" 
                        />
                      )}
                      
                      {/* Media type indicator */}
                      <div className="absolute top-2 left-2">
                        <div className="bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center">
                          {mediaType === 'video' ? (
                            <Video className="w-3 h-3 mr-1" />
                          ) : (
                            <Image className="w-3 h-3 mr-1" />
                          )}
                          {mediaType}
                        </div>
                      </div>
                    </div>
                    
                    {/* Title and description */}
                    {(item.title || item.description) && (
                      <div className="p-3 border-t border-gray-100">
                        {item.title && (
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {item.title}
                          </h4>
                        )}
                        {item.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        className="p-2.5 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete Media"
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
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 space-y-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Image className="h-12 w-12 text-gray-300" />
                <Video className="h-12 w-12 text-gray-300" />
              </div>
              <p className="font-medium">No hero media uploaded yet</p>
              <p className="text-sm">Upload images or videos to create an engaging hero section</p>
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
              onSubmit={async (formData) => {
                console.log('Form submitted with data:', formData);
                
                try {
                  let submitData;
                  
                  // If there's a new image file, use FormData for multipart upload
                  if (formData.imageFile) {
                    submitData = new FormData();
                    submitData.append('title', formData.title);
                    submitData.append('description', formData.description);
                    submitData.append('linkTo', formData.linkTo);
                    submitData.append('position', formData.position);
                    submitData.append('isActive', formData.isActive);
                    submitData.append('image', formData.imageFile);
                  } else {
                    // If no new image file, use JSON data
                    submitData = {
                      title: formData.title,
                      description: formData.description,
                      linkTo: formData.linkTo,
                      position: parseInt(formData.position),
                      isActive: formData.isActive
                    };
                    
                    // Include existing image URL if available
                    if (formData.image) {
                      submitData.image = formData.image;
                    }
                  }
                  
                  // Dispatch the appropriate action
                  if (editingCollection) {
                    await dispatch(updateFeaturedCollection({ 
                      id: editingCollection._id, 
                      data: submitData 
                    })).unwrap();
                    toast.success('Featured collection updated successfully!');
                  } else {
                    await dispatch(createFeaturedCollection(submitData)).unwrap();
                    toast.success('Featured collection created successfully!');
                  }
                  
                  // Refresh the collections list and close form
                  dispatch(fetchFeaturedCollections());
                  setShowCollectionForm(false);
                  setEditingCollection(null);
                  
                } catch (error) {
                  console.error('Failed to save collection:', error);
                  toast.error(error.message || 'Failed to save featured collection');
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
