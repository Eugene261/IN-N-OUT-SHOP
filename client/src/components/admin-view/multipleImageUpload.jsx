import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FileIcon, UploadCloudIcon, XIcon, ImageIcon, PlusCircleIcon } from 'lucide-react';
import axios from 'axios';
import ShoppingLoader from '../common/ShoppingLoader';
import { motion, AnimatePresence } from 'framer-motion';

function MultipleImageUpload({
  mainImageFile,
  setMainImageFile,
  additionalImageFiles,
  setAdditionalImageFiles,
  mainImageUrl,
  setMainImageUrl,
  additionalImageUrls,
  setAdditionalImageUrls,
  imageLoadingState,
  setImageLoadingState,
  isEditMode,
  isCutomStyling = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentUploadingIndex, setCurrentUploadingIndex] = useState(-1);
  const mainInputRef = useRef(null);
  const additionalInputRef = useRef(null);

  const handleMainImageChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) setMainImageFile(selectedFile);
  };

  const handleAdditionalImagesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      setAdditionalImageFiles([...additionalImageFiles, ...selectedFiles]);
    }
  };

  const handleDragOver = (evt) => {
    evt.preventDefault();
    if (!isEditMode) setIsDragging(true);
  };

  const handleDragLeave = (evt) => {
    evt.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (evt) => {
    evt.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(evt.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      // First file becomes main image if no main image exists
      if (!mainImageFile && droppedFiles.length > 0) {
        setMainImageFile(droppedFiles[0]);
        
        // Rest become additional images
        if (droppedFiles.length > 1) {
          setAdditionalImageFiles([...additionalImageFiles, ...droppedFiles.slice(1)]);
        }
      } else {
        // All dropped files become additional images
        setAdditionalImageFiles([...additionalImageFiles, ...droppedFiles]);
      }
    }
  };

  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setMainImageUrl('');
    if (mainInputRef.current) {
      mainInputRef.current.value = '';
    }
  };

  const handleRemoveAdditionalImage = (index) => {
    const newFiles = [...additionalImageFiles];
    newFiles.splice(index, 1);
    setAdditionalImageFiles(newFiles);
    
    const newUrls = [...additionalImageUrls];
    newUrls.splice(index, 1);
    setAdditionalImageUrls(newUrls);
  };

  async function uploadImageToCloudinary(file) {
    setImageLoadingState(true);
    const data = new FormData();
    data.append('my_file', file);
    try {
      const response = await axios.post('http://localhost:5000/api/admin/products/upload-image', data);
      
      if (response.data?.success) {
        return response.data.result.url;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
    return null;
  }

  // Upload main image when it changes
  useEffect(() => {
    if (mainImageFile !== null) {
      (async () => {
        const url = await uploadImageToCloudinary(mainImageFile);
        if (url) {
          setMainImageUrl(url);
          setImageLoadingState(false);
        }
      })();
    }
  }, [mainImageFile]);

  // Upload additional images one by one
  useEffect(() => {
    const uploadNextImage = async () => {
      if (currentUploadingIndex >= 0 && currentUploadingIndex < additionalImageFiles.length) {
        setImageLoadingState(true);
        const file = additionalImageFiles[currentUploadingIndex];
        const url = await uploadImageToCloudinary(file);
        
        if (url) {
          setAdditionalImageUrls(prev => {
            const newUrls = [...prev];
            newUrls[currentUploadingIndex] = url;
            return newUrls;
          });
        }
        
        // Move to next image
        setCurrentUploadingIndex(currentUploadingIndex + 1);
      } else {
        // All images uploaded
        setCurrentUploadingIndex(-1);
        setImageLoadingState(false);
      }
    };

    if (currentUploadingIndex !== -1) {
      uploadNextImage();
    }
  }, [currentUploadingIndex, additionalImageFiles]);

  // Start uploading additional images when they change
  useEffect(() => {
    if (additionalImageFiles.length > 0 && additionalImageUrls.length < additionalImageFiles.length) {
      // Start uploading from the first new image
      setCurrentUploadingIndex(additionalImageUrls.length);
    }
  }, [additionalImageFiles]);

  return (
    <div className={`w-full ${isCutomStyling ? '' : 'max-w-md mx-auto'} mt-6`}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-2 flex items-center"
      >
        <ImageIcon className="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
        <span className="text-lg font-medium text-gray-900 dark:text-white">
          Product Images
        </span>
      </motion.div>

      {/* Main Image Upload */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? '#ffffff' : '#333333',
          boxShadow: isDragging ? '0 8px 16px rgba(0, 0, 0, 0.2)' : '0 2px 6px rgba(0, 0, 0, 0.1)'
        }}
        className={`
          ${isEditMode ? 'opacity-60' : ''} 
          border-2 border-dashed rounded-xl 
          bg-gray-50 dark:bg-gray-900
          transition-all duration-200 relative overflow-hidden
          mb-4
        `}
      >
        <Input
          id="main-image-upload"
          type="file"
          className="hidden"
          ref={mainInputRef}
          onChange={handleMainImageChange}
          disabled={isEditMode}
        />

        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Main Product Image</h3>
          
          {!mainImageFile ? (
            <Label
              htmlFor="main-image-upload"
              className={`
                ${isEditMode ? 'cursor-not-allowed' : 'cursor-pointer'} 
                flex flex-col items-center justify-center h-40 p-6
                transition-all duration-300
                border border-dashed border-gray-300 rounded-lg
              `}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                  <UploadCloudIcon className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                </div>
                <span className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload main product image
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  or drag & drop
                </span>
              </motion.div>
            </Label>
          ) : imageLoadingState && !mainImageUrl ? (
            <div className="flex items-center justify-center h-40 border border-dashed border-gray-300 rounded-lg">
              <ShoppingLoader className="bg-gray-400" />
            </div>
          ) : (
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 h-40"
              >
                <img 
                  src={mainImageUrl} 
                  alt="Main product preview" 
                  className="w-full h-full object-cover"
                />
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                  onClick={handleRemoveMainImage}
                >
                  <XIcon className="w-4 h-4" />
                  <span className="sr-only">Remove Image</span>
                </motion.button>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Additional Images Upload */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Additional Product Images</h3>
          <Input
            id="additional-images-upload"
            type="file"
            multiple
            className="hidden"
            ref={additionalInputRef}
            onChange={handleAdditionalImagesChange}
            disabled={isEditMode}
          />
          <Label
            htmlFor="additional-images-upload"
            className={`
              ${isEditMode ? 'cursor-not-allowed' : 'cursor-pointer'} 
              flex items-center text-sm text-blue-600 hover:text-blue-700
            `}
          >
            <PlusCircleIcon className="w-4 h-4 mr-1" />
            Add Images
          </Label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence>
            {additionalImageUrls.map((url, index) => (
              <motion.div
                key={`img-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 h-24"
              >
                <img 
                  src={url} 
                  alt={`Product image ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                  onClick={() => handleRemoveAdditionalImage(index)}
                >
                  <XIcon className="w-3 h-3" />
                  <span className="sr-only">Remove Image</span>
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Loading indicator for additional images */}
          {imageLoadingState && currentUploadingIndex !== -1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-24 border border-dashed border-gray-300 rounded-lg"
            >
              <ShoppingLoader className="bg-gray-400" />
            </motion.div>
          )}
        </div>
      </motion.div>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center"
      >
        Supported formats: PNG, JPG, WEBP • Max size: 5MB per image
      </motion.p>
    </div>
  );
}

export default MultipleImageUpload;
