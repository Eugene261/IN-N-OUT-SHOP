import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  Folder,
  Search,
  Eye,
  EyeOff,
  FolderOpen
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {   createSubcategory,   updateSubcategory,   deleteSubcategory,  fetchSubcategories,  fetchAllTaxonomyData} from '../../../store/superAdmin/taxonomy-slice/index';
import SubcategoryModal from './SubcategoryModal';

const SubcategoryManager = ({ searchTerm, isLoading, error }) => {
  const dispatch = useDispatch();
  const { subcategories, categories } = useSelector(state => state.taxonomy);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [showInactive, setShowInactive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter subcategories based on search term, active status, and category
  const filteredSubcategories = useMemo(() => {
    let filtered = subcategories;
    
    if (!showInactive) {
      filtered = filtered.filter(subcategory => subcategory.isActive);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(subcategory => {
        const categoryId = typeof subcategory.category === 'object' 
          ? subcategory.category._id 
          : subcategory.category;
        return categoryId === selectedCategory;
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(subcategory =>
        subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subcategory.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [subcategories, searchTerm, showInactive, selectedCategory]);

  const handleCreateSubcategory = () => {
    setSelectedSubcategory(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditSubcategory = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewSubcategory = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (window.confirm('Are you sure you want to delete this subcategory? This action cannot be undone.')) {
      try {
        await dispatch(deleteSubcategory(subcategoryId)).unwrap();
        toast.success('Subcategory deleted successfully');
      } catch (error) {
        toast.error(error || 'Failed to delete subcategory');
      }
    }
  };

  const handleToggleStatus = async (subcategory) => {
    try {
      await dispatch(updateSubcategory({ 
        id: subcategory._id, 
        data: { ...subcategory, isActive: !subcategory.isActive }
      })).unwrap();
      toast.success(`Subcategory ${subcategory.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error(error || 'Failed to update subcategory status');
    }
  };

  const handleModalSubmit = async (subcategoryData) => {
    try {
      if (modalMode === 'create') {
        await dispatch(createSubcategory(subcategoryData)).unwrap();
        // Refresh all taxonomy data to update other components
        dispatch(fetchAllTaxonomyData());
        toast.success('Subcategory created successfully');
      } else if (modalMode === 'edit') {
        await dispatch(updateSubcategory({ 
          id: selectedSubcategory._id, 
          data: subcategoryData 
        })).unwrap();
        // Refresh all taxonomy data to update other components
        dispatch(fetchAllTaxonomyData());
        toast.success('Subcategory updated successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error || `Failed to ${modalMode} subcategory`);
    }
  };

  const getCategoryName = (categoryData) => {
    // Handle both populated category object and category ID
    if (typeof categoryData === 'object' && categoryData !== null) {
      // Category is already populated
      return categoryData.name || 'Unknown Category';
    } else if (typeof categoryData === 'string') {
      // Category is just an ID, find it in categories array
      const category = categories.find(cat => cat._id === categoryData);
    return category ? category.name : 'Unknown Category';
    }
    return 'Unknown Category';
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
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Subcategories</h2>
          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
            {filteredSubcategories.length} total
          </span>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
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
            onClick={handleCreateSubcategory}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subcategory</span>
          </button>
        </div>
      </div>

      {/* Subcategories Grid */}
      {filteredSubcategories.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subcategories found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : categories.length === 0 
                ? 'Create some categories first, then add subcategories'
                : 'Get started by creating your first subcategory'
            }
          </p>
          {!searchTerm && categories.length > 0 && (
            <button
              onClick={handleCreateSubcategory}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Subcategory
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSubcategories.map((subcategory, index) => (
              <motion.div
                key={subcategory._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all ${
                  !subcategory.isActive ? 'opacity-60 border-gray-200' : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {subcategory.image ? (
                        <img
                          src={subcategory.image}
                          alt={subcategory.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                          <FolderOpen className="w-6 h-6 text-green-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{subcategory.name}</h3>
                        <p className="text-sm text-gray-500">{subcategory.slug}</p>
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
                  
                  {/* Category Badge */}
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Folder className="w-3 h-3 mr-1" />
                      {getCategoryName(subcategory.category)}
                    </span>
                  </div>

                  {subcategory.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {subcategory.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        subcategory.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {subcategory.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Order: {subcategory.sortOrder || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleViewSubcategory(subcategory)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleEditSubcategory(subcategory)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Edit subcategory"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(subcategory)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title={subcategory.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {subcategory.isActive ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteSubcategory(subcategory._id)}
                        className="p-2 hover:bg-red-100 rounded transition-colors"
                        title="Delete subcategory"
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

      {/* Subcategory Modal */}
      <SubcategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        subcategory={selectedSubcategory}
        mode={modalMode}
        categories={categories}
      />
    </div>
  );
};

export default SubcategoryManager; 