import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  Palette,
  Search,
  Eye,
  EyeOff,
  Hash
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {   createColor,   updateColor,   deleteColor,  fetchColors,  fetchAllTaxonomyData} from '../../../store/superAdmin/taxonomy-slice/index';
import ColorModal from './ColorModal';

const ColorManager = ({ searchTerm, isLoading, error }) => {
  const dispatch = useDispatch();
  const { colors } = useSelector(state => state.taxonomy);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [showInactive, setShowInactive] = useState(false);
  const [selectedColorFamily, setSelectedColorFamily] = useState('all');

  const colorFamilies = ['all', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray'];

  // Filter colors based on search term, active status, and color family
  const filteredColors = useMemo(() => {
    let filtered = colors;
    
    if (!showInactive) {
      filtered = filtered.filter(color => color.isActive);
    }
    
    if (selectedColorFamily !== 'all') {
      filtered = filtered.filter(color => color.colorFamily === selectedColorFamily);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(color =>
        color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.hexCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [colors, searchTerm, showInactive, selectedColorFamily]);

  const handleCreateColor = () => {
    setSelectedColor(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditColor = (color) => {
    setSelectedColor(color);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewColor = (color) => {
    setSelectedColor(color);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleDeleteColor = async (colorId) => {
    if (window.confirm('Are you sure you want to delete this color? This action cannot be undone.')) {
      try {
        await dispatch(deleteColor(colorId)).unwrap();
        toast.success('Color deleted successfully');
      } catch (error) {
        toast.error(error || 'Failed to delete color');
      }
    }
  };

  const handleToggleStatus = async (color) => {
    try {
      await dispatch(updateColor({ 
        id: color._id, 
        data: { ...color, isActive: !color.isActive }
      })).unwrap();
      toast.success(`Color ${color.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error(error || 'Failed to update color status');
    }
  };

  const handleModalSubmit = async (colorData) => {
    try {
      if (modalMode === 'create') {
        await dispatch(createColor(colorData)).unwrap();
        // Refresh all taxonomy data to update other components
        dispatch(fetchAllTaxonomyData());
        toast.success('Color created successfully');
      } else if (modalMode === 'edit') {
        await dispatch(updateColor({ 
          id: selectedColor._id, 
          data: colorData 
        })).unwrap();
        // Refresh all taxonomy data to update other components
        dispatch(fetchAllTaxonomyData());
        toast.success('Color updated successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error || `Failed to ${modalMode} color`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
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
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Colors</h2>
          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
            {filteredColors.length} total
          </span>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <select
            value={selectedColorFamily}
            onChange={(e) => setSelectedColorFamily(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {colorFamilies.map(family => (
              <option key={family} value={family}>
                {family === 'all' ? 'All Families' : family.charAt(0).toUpperCase() + family.slice(1)}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${
              showInactive 
                ? 'bg-gray-100 text-gray-700' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {showInactive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showInactive ? 'Hide Inactive' : 'Show Inactive'}</span>
          </button>
          
          <button
            onClick={handleCreateColor}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Color</span>
          </button>
        </div>
      </div>

      {/* Colors Grid */}
      {filteredColors.length === 0 ? (
        <div className="text-center py-12">
          <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No colors found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first color'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateColor}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Color
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredColors.map((color, index) => (
              <motion.div
                key={color._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all ${
                  !color.isActive ? 'opacity-60 border-gray-200' : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg border-2 border-white shadow-md"
                        style={{ backgroundColor: color.hexCode || '#f3f4f6' }}
                        title={color.hexCode}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{color.name}</h3>
                        <p className="text-sm text-gray-500">{color.code}</p>
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
                  
                  {/* Color Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Hash className="w-3 h-3 mr-1" />
                      <span className="font-mono">{color.hexCode}</span>
                    </div>
                    {color.rgbCode && (
                      <div className="text-sm text-gray-600">
                        <span className="font-mono">rgb({color.rgbCode})</span>
                      </div>
                    )}
                    {color.colorFamily && (
                      <div className="text-sm text-gray-600">
                        <span className="capitalize">{color.colorFamily} Family</span>
                      </div>
                    )}
                  </div>

                  {color.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {color.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        color.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {color.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Order: {color.sortOrder || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleViewColor(color)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleEditColor(color)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Edit color"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(color)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title={color.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {color.isActive ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteColor(color._id)}
                        className="p-2 hover:bg-red-100 rounded transition-colors"
                        title="Delete color"
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

      {/* Color Modal */}
      <ColorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        color={selectedColor}
        mode={modalMode}
      />
    </div>
  );
};

export default ColorManager; 