import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  Ruler,
  Search,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {   createSize,   updateSize,   deleteSize,  fetchSizes,  fetchAllTaxonomyData} from '../../../store/superAdmin/taxonomy-slice/index';
import SizeModal from './SizeModal';

const SizeManager = ({ searchTerm, isLoading, error }) => {
  const dispatch = useDispatch();
  const { sizes } = useSelector(state => state.taxonomy);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [showInactive, setShowInactive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const sizeCategories = ['all', 'clothing', 'footwear', 'accessories', 'general'];

  // Filter sizes based on search term, active status, and category
  const filteredSizes = useMemo(() => {
    let filtered = sizes;
    
    if (!showInactive) {
      filtered = filtered.filter(size => size.isActive);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(size => size.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(size =>
        size.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        size.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [sizes, searchTerm, showInactive, selectedCategory]);

  const handleCreateSize = () => {
    setSelectedSize(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditSize = (size) => {
    setSelectedSize(size);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewSize = (size) => {
    setSelectedSize(size);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleDeleteSize = async (sizeId) => {
    if (window.confirm('Are you sure you want to delete this size? This action cannot be undone.')) {
      try {
        await dispatch(deleteSize(sizeId)).unwrap();
        toast.success('Size deleted successfully');
      } catch (error) {
        toast.error(error || 'Failed to delete size');
      }
    }
  };

  const handleToggleStatus = async (size) => {
    try {
      await dispatch(updateSize({ 
        id: size._id, 
        data: { ...size, isActive: !size.isActive }
      })).unwrap();
      toast.success(`Size ${size.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error(error || 'Failed to update size status');
    }
  };

  const handleModalSubmit = async (sizeData) => {
    try {
      if (modalMode === 'create') {
        await dispatch(createSize(sizeData)).unwrap();
        // Refresh all taxonomy data to update other components
        dispatch(fetchAllTaxonomyData());
        toast.success('Size created successfully');
      } else if (modalMode === 'edit') {
        await dispatch(updateSize({ 
          id: selectedSize._id, 
          data: sizeData 
        })).unwrap();
        // Refresh all taxonomy data to update other components
        dispatch(fetchAllTaxonomyData());
        toast.success('Size updated successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error || `Failed to ${modalMode} size`);
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

  const formatMeasurements = (measurements) => {
    if (!measurements) return '';
    const parts = [];
    if (measurements.chest) parts.push(`Chest: ${measurements.chest}`);
    if (measurements.waist) parts.push(`Waist: ${measurements.waist}`);
    if (measurements.hip) parts.push(`Hip: ${measurements.hip}`);
    if (measurements.footLength) parts.push(`Length: ${measurements.footLength}`);
    if (measurements.footWidth) parts.push(`Width: ${measurements.footWidth}`);
    return parts.length > 0 ? parts.join(', ') : '';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                <div>
                  <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-48"></div>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Sizes</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {filteredSizes.length} total
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sizeCategories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showInactive 
                ? 'bg-gray-100 text-gray-700' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {showInactive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showInactive ? 'Hide Inactive' : 'Show Inactive'}</span>
          </button>
          
          <button
            onClick={handleCreateSize}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Size</span>
          </button>
        </div>
      </div>

      {/* Sizes Grid */}
      {filteredSizes.length === 0 ? (
        <div className="text-center py-12">
          <Ruler className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sizes found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first size'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateSize}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Size
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSizes.map((size, index) => (
              <motion.div
                key={size._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all ${
                  !size.isActive ? 'opacity-60 border-gray-200' : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center text-xl">
                        {getCategoryIcon(size.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{size.name}</h3>
                        <p className="text-sm text-gray-500">{size.code}</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <button
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          // Toggle dropdown menu
                        }}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Size Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="capitalize font-medium text-gray-900">{size.category}</span>
                    </div>
                    
                    {size.measurements && formatMeasurements(size.measurements) && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Measurements:</span>
                        <p className="text-xs mt-1 text-gray-500">
                          {formatMeasurements(size.measurements)}
                        </p>
                      </div>
                    )}
                  </div>

                  {size.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {size.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        size.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {size.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Order: {size.sortOrder || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleViewSize(size)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleEditSize(size)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Edit size"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(size)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title={size.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {size.isActive ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteSize(size._id)}
                        className="p-2 hover:bg-red-100 rounded transition-colors"
                        title="Delete size"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Size Modal */}
      <SizeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        size={selectedSize}
        mode={modalMode}
      />
    </div>
  );
};

export default SizeManager; 