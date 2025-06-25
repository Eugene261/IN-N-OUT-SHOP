import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Check } from 'lucide-react';

const FeaturedCollectionForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    linkTo: '',
    position: 0,
    isActive: true,
    image: '',
    imageFile: null
  });
  
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});
  
  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        linkTo: initialData.linkTo || '',
        position: initialData.position || 0,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        image: initialData.image || '',
        imageFile: null
      });
      
      if (initialData.image) {
        setImagePreview(initialData.image);
      }
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imageFile: file,
        image: '' // Clear the image URL when a new file is selected
      });
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.linkTo.trim()) {
      newErrors.linkTo = 'Link is required';
    }
    
    if (!imagePreview && !formData.imageFile) {
      newErrors.image = 'Image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6 border border-gray-200"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
          {initialData ? 'Edit Collection' : 'Add New Collection'}
        </h3>
        <button 
          onClick={onCancel}
          className="self-start sm:self-auto p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter collection title"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Link To <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="linkTo"
              value={formData.linkTo}
              onChange={handleChange}
              placeholder="e.g., /category/summer-collection"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.linkTo ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.linkTo && <p className="text-red-500 text-xs mt-1">{errors.linkTo}</p>}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            placeholder="Optional description for this collection..."
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Position
            </label>
            <input
              type="number"
              name="position"
              value={formData.position}
              onChange={handleChange}
              min="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500">Lower numbers appear first</p>
          </div>
          
          <div className="flex items-start pt-2">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Active (visible to customers)
              </label>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Collection Image <span className="text-red-500">*</span>
          </label>
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {imagePreview && (
              <div className="relative flex-shrink-0">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setFormData({
                      ...formData,
                      image: '',
                      imageFile: null
                    });
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            <div className={`flex-1 ${errors.image ? 'border-red-500' : ''}`}>
              <label 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center py-6">
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 text-center">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 text-center">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              {errors.image && <p className="text-red-500 text-xs mt-2">{errors.image}</p>}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
          >
            <Check size={18} className="mr-2" />
            {initialData ? 'Update Collection' : 'Create Collection'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default FeaturedCollectionForm;
