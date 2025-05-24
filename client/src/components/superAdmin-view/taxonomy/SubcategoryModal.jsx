import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  FolderOpen,
  Image,
  Folder
} from 'lucide-react';

const SubcategoryModal = ({ isOpen, onClose, onSubmit, subcategory, mode, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    image: '',
    sortOrder: 0,
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subcategory && (mode === 'edit' || mode === 'view')) {
      // Extract category ID if category is a populated object
      const categoryId = typeof subcategory.category === 'object' && subcategory.category !== null
        ? subcategory.category._id
        : subcategory.category || '';
      
      setFormData({
        name: subcategory.name || '',
        description: subcategory.description || '',
        category: categoryId,
        image: subcategory.image || '',
        sortOrder: subcategory.sortOrder || 0,
        isActive: subcategory.isActive !== undefined ? subcategory.isActive : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: categories.length > 0 ? categories[0]._id : '',
        image: '',
        sortOrder: 0,
        isActive: true
      });
    }
    setErrors({});
  }, [subcategory, mode, isOpen, categories]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Subcategory name is required';
    }
    
    if (formData.name.length > 100) {
      newErrors.name = 'Subcategory name must be less than 100 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a parent category';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.image && !isValidUrl(formData.image)) {
      newErrors.image = 'Please enter a valid image URL';
    }
    
    if (formData.sortOrder < 0) {
      newErrors.sortOrder = 'Sort order must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'view') return;
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Subcategory';
      case 'edit': return 'Edit Subcategory';
      case 'view': return 'Subcategory Details';
      default: return 'Subcategory';
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-xl border border-gray-200 mb-6 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FolderOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {getModalTitle()}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === 'create' && 'Add a new product subcategory'}
                {mode === 'edit' && 'Update subcategory information'}
                {mode === 'view' && 'View subcategory details'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                  placeholder="Enter subcategory name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                >
                  <option value="">Select a parent category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
                {categories.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-600">
                    No categories available. Please create a category first.
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                  placeholder="Enter subcategory description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Image and Sort Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors ${
                      errors.image ? 'border-red-300' : 'border-gray-300'
                    } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.image && (
                    <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors ${
                      errors.sortOrder ? 'border-red-300' : 'border-gray-300'
                    } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                    placeholder="0"
                  />
                  {errors.sortOrder && (
                    <p className="mt-1 text-sm text-red-600">{errors.sortOrder}</p>
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            {/* Preview */}
            {(formData.image || formData.name) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt={formData.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{formData.name || 'Subcategory Name'}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        <Folder className="w-3 h-3 mr-1" />
                        {formData.category ? getCategoryName(formData.category) : 'Select Category'}
                      </span>
                      <span className="text-xs text-gray-500">Order: {formData.sortOrder}</span>
                      <span className={`text-xs ${formData.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {formData.description && (
                      <p className="text-sm text-gray-600 mt-2">{formData.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            {mode !== 'view' && (
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || categories.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting 
                      ? 'Saving...' 
                      : categories.length === 0
                        ? 'No Categories Available'
                        : mode === 'create' 
                          ? 'Create Subcategory' 
                          : 'Update Subcategory'
                    }
                  </span>
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubcategoryModal; 