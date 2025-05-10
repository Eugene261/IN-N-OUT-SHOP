import React, { useEffect, useRef, useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FileIcon, UploadCloudIcon, XIcon, ImageIcon } from 'lucide-react';
import axios from 'axios';
import ShoppingLoader from '../common/ShoppingLoader';
import { motion } from 'framer-motion';

function ProductImageUpload({
  imageFile,
  setImageFile,
  imageLoadingState,
  uploadedImageUrl,
  setUploadedImageUrl,
  setImageLoadingState,
  isEditMode,
  isCutomStyling = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleImageFileChange = (event) => {
    console.log(event.target.files);
    const selectedFile = event.target.files?.[0];
    if (selectedFile) setImageFile(selectedFile);
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
    const droppedFile = evt.dataTransfer.files?.[0];
    if (droppedFile) setImageFile(droppedFile);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  async function uploadImageToCloudinary() {
    setImageLoadingState(true);
    const data = new FormData();
    data.append('my_file', imageFile);
    const response = await axios.post('http://localhost:5000/api/admin/products/upload-image', data);
    console.log(response.data);

    if (response.data?.success) {
      setUploadedImageUrl(response.data.result.url);
      setImageLoadingState(false);
    }
  }

  useEffect(() => {
    if (imageFile !== null) uploadImageToCloudinary();
  }, [imageFile]);

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
          Product Image
        </span>
      </motion.div>

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
        `}
      >
        <Input
          id="image-upload"
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={handleImageFileChange}
          disabled={isEditMode}
        />

        {!imageFile ? (
          <Label
            htmlFor="image-upload"
            className={`
              ${isEditMode ? 'cursor-not-allowed' : 'cursor-pointer'} 
              flex flex-col items-center justify-center h-48 p-6
              transition-all duration-300
            `}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <UploadCloudIcon className="w-10 h-10 text-gray-700 dark:text-gray-300" />
              </div>
              <span className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Drag & drop product image here
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                or click to browse files
              </span>
              
              {/* Decorative elements */}
              <motion.div
                className="absolute bottom-2 right-4 w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full blur-xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3] 
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              />
            </motion.div>
          </Label>
        ) : imageLoadingState ? (
          <div className="flex items-center justify-center h-32">
            <ShoppingLoader className="bg-gray-400" />
          </div>
        ) : (
          <div className="p-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-white dark:bg-black p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center truncate max-w-[70%]">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg mr-3">
                  <FileIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{imageFile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(imageFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={handleRemoveImage}
              >
                <XIcon className="w-4 h-4" />
                <span className="sr-only">Remove File</span>
              </motion.button>
            </motion.div>
            
            {uploadedImageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <img 
                  src={uploadedImageUrl} 
                  alt="Preview" 
                  className="w-full h-40 object-cover"
                />
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
      
      {!imageFile && !isEditMode && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400"
        >
          Supported formats: JPG, PNG, WebP | Max size: 5MB
        </motion.p>
      )}
    </div>
  );
}

export default ProductImageUpload;