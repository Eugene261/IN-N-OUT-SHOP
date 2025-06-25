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
  Image,
  Tag
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
  createCategory, 
  updateCategory, 
  deleteCategory,
  fetchCategories,
  fetchAllTaxonomyData
} from '../../../store/superAdmin/taxonomy-slice/index';
import CategoryModal from './CategoryModal';

const CategoryManager = ({ searchTerm, isLoading, error }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector(state => state.taxonomy);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [showInactive, setShowInactive] = useState(false);

  // Filter categories based on search term and active status
  const filteredCategories = useMemo(() => {
    let filtered = categories;
    
    if (!showInactive) {
      filtered = filtered.filter(category => category.isActive);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [categories, searchTerm, showInactive]);

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await dispatch(deleteCategory(categoryId)).unwrap();
        toast.success('Category deleted successfully');
      } catch (error) {
        toast.error(error || 'Failed to delete category');
      }
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await dispatch(updateCategory({ 
        id: category._id, 
        data: { ...category, isActive: !category.isActive }
      })).unwrap();
      toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error(error || 'Failed to update category status');
    }
  };

  const handleModalSubmit = async (categoryData) => {
    try {
      if (modalMode === 'create') {
        await dispatch(createCategory(categoryData)).unwrap();
        dispatch(fetchAllTaxonomyData());
        toast.success('Category created successfully');
      } else if (modalMode === 'edit') {
        await dispatch(updateCategory({ 
          id: selectedCategory._id, 
          data: categoryData 
        })).unwrap();
        dispatch(fetchAllTaxonomyData());
        toast.success('Category updated successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error || `Failed to ${modalMode} category`);
    }
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Categories</h2>
          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
            {filteredCategories.length} total
          </span>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
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
            onClick={handleCreateCategory}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first category'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateCategory}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all ${
                  !category.isActive ? 'opacity-60 border-gray-200' : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          {category.icon ? (
                            <span className="text-blue-600 text-lg">{category.icon}</span>
                          ) : (
                            <Folder className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.slug}</p>
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
                  
                  {category.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Order: {category.sortOrder || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleViewCategory(category)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Edit category"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(category)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title={category.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {category.isActive ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="p-2 hover:bg-red-100 rounded transition-colors"
                        title="Delete category"
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

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        category={selectedCategory}
        mode={modalMode}
      />
    </div>
  );
};

export default CategoryManager; 