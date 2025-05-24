import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Palette,
  Hash,
  Eye,
  Pipette
} from 'lucide-react';

const ColorModal = ({ isOpen, onClose, onSubmit, color, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    hexCode: '#000000',
    description: '',
    colorFamily: 'red',
    sortOrder: 0,
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorFamilies = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray'];

  useEffect(() => {
    if (color && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: color.name || '',
        code: color.code || '',
        hexCode: color.hexCode || '#000000',
        description: color.description || '',
        colorFamily: color.colorFamily || 'red',
        sortOrder: color.sortOrder || 0,
        isActive: color.isActive !== undefined ? color.isActive : true
      });
    } else {
      setFormData({
        name: '',
        code: '',
        hexCode: '#000000',
        description: '',
        colorFamily: 'red',
        sortOrder: 0,
        isActive: true
      });
    }
    setErrors({});
  }, [color, mode, isOpen]);

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

  const handleColorChange = (e) => {
    const hexValue = e.target.value;
    setFormData(prev => ({
      ...prev,
      hexCode: hexValue
    }));

    // Clear error
    if (errors.hexCode) {
      setErrors(prev => ({ ...prev, hexCode: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Color name is required';
    }
    
    if (formData.name.length > 50) {
      newErrors.name = 'Color name must be less than 50 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Color code is required';
    }

    if (formData.code.length > 20) {
      newErrors.code = 'Color code must be less than 20 characters';
    }
    
    if (!formData.hexCode || !isValidHexColor(formData.hexCode)) {
      newErrors.hexCode = 'Please enter a valid hex color code';
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

  const isValidHexColor = (hex) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbString = hexToRgb(formData.hexCode);
  const rgbValue = rgbString ? `${rgbString.r}, ${rgbString.g}, ${rgbString.b}` : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'view') return;
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Add RGB conversion to form data
      const submitData = {
        ...formData,
        rgbCode: rgbValue
      };
      await onSubmit(submitData);
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
      case 'create': return 'Create New Color';
      case 'edit': return 'Edit Color';
      case 'view': return 'Color Details';
      default: return 'Color';
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-pink-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Palette className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {getModalTitle()}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === 'create' && 'Add a new product color'}
                {mode === 'edit' && 'Update color information'}
                {mode === 'view' && 'View color details'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-pink-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Color Picker Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Color Selection</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Picker
                  </label>
                  <div className="space-y-3">
                    <input
                      type="color"
                      value={formData.hexCode}
                      onChange={handleColorChange}
                      disabled={mode === 'view'}
                      className="w-full h-12 rounded-lg border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="hexCode"
                        value={formData.hexCode}
                        onChange={handleInputChange}
                        disabled={mode === 'view'}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors font-mono ${
                          errors.hexCode ? 'border-red-300' : 'border-gray-300'
                        } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                        placeholder="#000000"
                      />
                    </div>
                    {errors.hexCode && (
                      <p className="text-sm text-red-600">{errors.hexCode}</p>
                    )}
                  </div>
                </div>

                {/* Color Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="space-y-3">
                    <div 
                      className="w-full h-12 rounded-lg border-2 border-white shadow-lg"
                      style={{ backgroundColor: formData.hexCode }}
                    />
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>HEX:</span>
                        <span className="font-mono">{formData.hexCode.toUpperCase()}</span>
                      </div>
                      {rgbValue && (
                        <div className="flex items-center justify-between">
                          <span>RGB:</span>
                          <span className="font-mono">rgb({rgbValue})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                    placeholder="e.g., Royal Blue"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors ${
                      errors.code ? 'border-red-300' : 'border-gray-300'
                    } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                    placeholder="e.g., ROYAL_BLUE"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                  )}
                </div>
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                  placeholder="Enter color description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Color Family and Sort Order */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Family
                  </label>
                  <select
                    name="colorFamily"
                    value={formData.colorFamily}
                    onChange={handleInputChange}
                    disabled={mode === 'view'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors ${
                      errors.colorFamily ? 'border-red-300' : 'border-gray-300'
                    } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                  >
                    {colorFamilies.map(family => (
                      <option key={family} value={family}>
                        {family.charAt(0).toUpperCase() + family.slice(1)}
                      </option>
                    ))}
                  </select>
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors ${
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
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Color Swatch Preview */}
            {formData.name && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Final Preview</h3>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div 
                    className="w-16 h-16 rounded-lg border-2 border-white shadow-md"
                    style={{ backgroundColor: formData.hexCode }}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{formData.name}</h4>
                    <p className="text-sm text-gray-500 mb-1">{formData.code}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span className="font-mono">{formData.hexCode.toUpperCase()}</span>
                      {rgbValue && <span className="font-mono">RGB({rgbValue})</span>}
                      <span className="capitalize">{formData.colorFamily} Family</span>
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
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Color' : 'Update Color'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ColorModal; 