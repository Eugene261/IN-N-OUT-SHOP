import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Folder,
  Image,
  Link,
  Tag,
  Eye,
  Upload
} from 'lucide-react';

const CategoryModal = ({ isOpen, onClose, onSubmit, category, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    icon: '',
    sortOrder: 0,
    metaTitle: '',
    metaDescription: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        image: category.image || '',
        icon: category.icon || '',
        sortOrder: category.sortOrder || 0,
        metaTitle: category.metaTitle || '',
        metaDescription: category.metaDescription || '',
        isActive: category.isActive !== undefined ? category.isActive : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        image: '',
        icon: '',
        sortOrder: 0,
        metaTitle: '',
        metaDescription: '',
        isActive: true
      });
    }
    setErrors({});
  }, [category, mode, isOpen]);

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
      newErrors.name = 'Category name is required';
    }
    
    if (formData.name.length > 100) {
      newErrors.name = 'Category name must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (formData.sortOrder < 0) {
      newErrors.sortOrder = 'Sort order must be a positive number';
    }
    
    if (formData.metaTitle && formData.metaTitle.length > 60) {
      newErrors.metaTitle = 'Meta title should be less than 60 characters for SEO';
    }
    
    if (formData.metaDescription && formData.metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta description should be less than 160 characters for SEO';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      case 'create': return 'Create New Category';
      case 'edit': return 'Edit Category';
      case 'view': return 'Category Details';
      default: return 'Category';
    }
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Folder className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {getModalTitle()}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === 'create' && 'Add a new product category'}
                {mode === 'edit' && 'Update category information'}
                {mode === 'view' && 'View category details'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
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
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                  placeholder="Enter category name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                  placeholder="Enter category description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Image and Icon */}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                      mode === 'view' ? 'bg-gray-50' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon (Emoji or Text)
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                      mode === 'view' ? 'bg-gray-50' : 'border-gray-300'
                    }`}
                    placeholder="👕 or ⚡"
                  />
                </div>
              </div>

              {/* Sort Order and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                      errors.sortOrder ? 'border-red-300' : 'border-gray-300'
                    } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                    placeholder="0"
                  />
                  {errors.sortOrder && (
                    <p className="mt-1 text-sm text-red-600">{errors.sortOrder}</p>
                  )}
                </div>
                
                <div className="flex items-center pt-8">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      disabled={mode === 'view'}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SEO Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">SEO Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                    errors.metaTitle ? 'border-red-300' : 'border-gray-300'
                  } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                  placeholder="SEO title for search engines"
                />
                {errors.metaTitle && (
                  <p className="mt-1 text-sm text-red-600">{errors.metaTitle}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.metaTitle.length}/60 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none ${
                    errors.metaDescription ? 'border-red-300' : 'border-gray-300'
                  } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                  placeholder="SEO description for search engines"
                />
                {errors.metaDescription && (
                  <p className="mt-1 text-sm text-red-600">{errors.metaDescription}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>
            </div>

            {/* Preview */}
            {(formData.image || formData.icon || formData.name) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt={formData.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : formData.icon ? (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-lg">
                      {formData.icon}
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Folder className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{formData.name || 'Category Name'}</h4>
                    <p className="text-sm text-gray-500">{formData.description || 'Category description'}</p>
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
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Category' : 'Update Category'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CategoryModal; 