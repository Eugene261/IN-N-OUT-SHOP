import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Ruler,
  Info
} from 'lucide-react';

const SizeModal = ({ isOpen, onClose, onSubmit, size, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'clothing',
    description: '',
    measurements: {
      chest: '',
      waist: '',
      hip: '',
      length: '',
      sleeve: '',
      footLength: '',
      footWidth: ''
    },
    sortOrder: 0,
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizeCategories = ['clothing', 'footwear', 'accessories', 'general'];

  useEffect(() => {
    if (size && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: size.name || '',
        code: size.code || '',
        category: size.category || 'clothing',
        description: size.description || '',
        measurements: {
          chest: size.measurements?.chest || '',
          waist: size.measurements?.waist || '',
          hip: size.measurements?.hip || '',
          length: size.measurements?.length || '',
          sleeve: size.measurements?.sleeve || '',
          footLength: size.measurements?.footLength || '',
          footWidth: size.measurements?.footWidth || ''
        },
        sortOrder: size.sortOrder || 0,
        isActive: size.isActive !== undefined ? size.isActive : true
      });
    } else {
      setFormData({
        name: '',
        code: '',
        category: 'clothing',
        description: '',
        measurements: {
          chest: '',
          waist: '',
          hip: '',
          length: '',
          sleeve: '',
          footLength: '',
          footWidth: ''
        },
        sortOrder: 0,
        isActive: true
      });
    }
    setErrors({});
  }, [size, mode, isOpen]);

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

  const handleMeasurementChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Size name is required';
    }
    
    if (formData.name.length > 50) {
      newErrors.name = 'Size name must be less than 50 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Size code is required';
    }

    if (formData.code.length > 20) {
      newErrors.code = 'Size code must be less than 20 characters';
    }
    
    if (formData.description && formData.description.length > 300) {
      newErrors.description = 'Description must be less than 300 characters';
    }
    
    if (formData.sortOrder < 0) {
      newErrors.sortOrder = 'Sort order must be a positive number';
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
      // Clean up empty measurements
      const cleanedMeasurements = {};
      Object.keys(formData.measurements).forEach(key => {
        if (formData.measurements[key]) {
          cleanedMeasurements[key] = formData.measurements[key];
        }
      });

      const submitData = {
        ...formData,
        measurements: Object.keys(cleanedMeasurements).length > 0 ? cleanedMeasurements : undefined
      };
      
      await onSubmit(submitData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Size';
      case 'edit': return 'Edit Size';
      case 'view': return 'Size Details';
      default: return 'Size';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      clothing: '👕',
      footwear: '👟',
      accessories: '👒',
      general: '📦'
    };
    return icons[category] || '📦';
  };

  const getMeasurementFields = (category) => {
    switch (category) {
      case 'clothing':
        return [
          { key: 'chest', label: 'Chest (inches)', placeholder: 'e.g., 38' },
          { key: 'waist', label: 'Waist (inches)', placeholder: 'e.g., 32' },
          { key: 'hip', label: 'Hip (inches)', placeholder: 'e.g., 40' },
          { key: 'length', label: 'Length (inches)', placeholder: 'e.g., 28' },
          { key: 'sleeve', label: 'Sleeve (inches)', placeholder: 'e.g., 24' }
        ];
      case 'footwear':
        return [
          { key: 'footLength', label: 'Foot Length (inches)', placeholder: 'e.g., 10.5' },
          { key: 'footWidth', label: 'Foot Width', placeholder: 'e.g., D (Medium)' }
        ];
      case 'accessories':
        return [
          { key: 'length', label: 'Length (inches)', placeholder: 'e.g., 20' },
          { key: 'width', label: 'Width (inches)', placeholder: 'e.g., 15' }
        ];
      default:
        return [
          { key: 'length', label: 'Length', placeholder: 'Enter measurement' },
          { key: 'width', label: 'Width', placeholder: 'Enter measurement' },
          { key: 'height', label: 'Height', placeholder: 'Enter measurement' }
        ];
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  if (!isOpen) return null;

  const measurementFields = getMeasurementFields(formData.category);

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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Ruler className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {getModalTitle()}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === 'create' && 'Add a new product size'}
                {mode === 'edit' && 'Update size information'}
                {mode === 'view' && 'View size details'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-200 rounded-lg transition-colors"
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-colors ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                    placeholder="e.g., Large, XL, 10.5"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-colors ${
                      errors.code ? 'border-red-300' : 'border-gray-300'
                    } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                    placeholder="e.g., L, XL, 10_5"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={mode === 'view'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-colors ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                >
                  {sizeCategories.map(category => (
                    <option key={category} value={category}>
                      {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-colors resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                  placeholder="Enter size description or sizing guide"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-colors ${
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
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Measurements Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900">Measurements</h3>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-6 w-64 bg-gray-900 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Measurements help customers choose the right size. Fields shown depend on the selected category.
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {measurementFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={formData.measurements[field.key] || ''}
                      onChange={(e) => handleMeasurementChange(field.key, e.target.value)}
                      disabled={mode === 'view'}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-colors border-gray-300 ${
                        mode === 'view' ? 'bg-gray-50' : ''
                      }`}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Size Preview */}
            {formData.name && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center text-2xl">
                    {getCategoryIcon(formData.category)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{formData.name}</h4>
                    <p className="text-sm text-gray-500 mb-1">{formData.code}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span className="capitalize">{formData.category}</span>
                      <span>Order: {formData.sortOrder}</span>
                      <span className={formData.isActive ? 'text-green-600' : 'text-gray-400'}>
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {/* Show measurements preview */}
                    {Object.values(formData.measurements).some(val => val) && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">Measurements: </span>
                        {Object.entries(formData.measurements)
                          .filter(([_, value]) => value)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}
                      </div>
                    )}
                    
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
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Size' : 'Update Size'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SizeModal; 