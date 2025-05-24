import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  Award,
  Search,
  Eye,
  EyeOff,
  ExternalLink,
  Globe
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {   createBrand,   updateBrand,   deleteBrand,  fetchBrands,  fetchAllTaxonomyData} from '../../../store/superAdmin/taxonomy-slice/index';
import BrandModal from './BrandModal';

const BrandManager = ({ searchTerm, isLoading, error }) => {
  const dispatch = useDispatch();
  const { brands } = useSelector(state => state.taxonomy);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [showInactive, setShowInactive] = useState(false);

  // Filter brands based on search term and active status
  const filteredBrands = useMemo(() => {
    let filtered = brands;
    
    if (!showInactive) {
      filtered = filtered.filter(brand => brand.isActive);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [brands, searchTerm, showInactive]);

  const handleCreateBrand = () => {
    setSelectedBrand(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditBrand = (brand) => {
    setSelectedBrand(brand);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewBrand = (brand) => {
    setSelectedBrand(brand);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleDeleteBrand = async (brandId) => {
    if (window.confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      try {
        await dispatch(deleteBrand(brandId)).unwrap();
        toast.success('Brand deleted successfully');
      } catch (error) {
        toast.error(error || 'Failed to delete brand');
      }
    }
  };

  const handleToggleStatus = async (brand) => {
    try {
      await dispatch(updateBrand({ 
        id: brand._id, 
        data: { ...brand, isActive: !brand.isActive }
      })).unwrap();
      toast.success(`Brand ${brand.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error(error || 'Failed to update brand status');
    }
  };

  const handleModalSubmit = async (brandData) => {
    try {
      if (modalMode === 'create') {
        await dispatch(createBrand(brandData)).unwrap();
        // Refresh all taxonomy data to update other components
        dispatch(fetchAllTaxonomyData());
        toast.success('Brand created successfully');
      } else if (modalMode === 'edit') {
        await dispatch(updateBrand({ 
          id: selectedBrand._id, 
          data: brandData 
        })).unwrap();
        // Refresh all taxonomy data to update other components
        dispatch(fetchAllTaxonomyData());
        toast.success('Brand updated successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error || `Failed to ${modalMode} brand`);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Brands</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {filteredBrands.length} total
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
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
            onClick={handleCreateBrand}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      {/* Brands Grid */}
      {filteredBrands.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first brand'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateBrand}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Brand
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredBrands.map((brand, index) => (
              <motion.div
                key={brand._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all ${
                  !brand.isActive ? 'opacity-60 border-gray-200' : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                          <Award className="w-6 h-6 text-purple-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                        <p className="text-sm text-gray-500">{brand.slug}</p>
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
                  
                  {brand.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {brand.description}
                    </p>
                  )}

                  {brand.website && (
                    <div className="mb-4">
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 text-sm hover:text-blue-700 transition-colors"
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        Visit Website
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        brand.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {brand.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Order: {brand.sortOrder || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleViewBrand(brand)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleEditBrand(brand)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Edit brand"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(brand)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title={brand.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {brand.isActive ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(brand._id)}
                        className="p-2 hover:bg-red-100 rounded transition-colors"
                        title="Delete brand"
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

      {/* Brand Modal */}
      <BrandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        brand={selectedBrand}
        mode={modalMode}
      />
    </div>
  );
};

export default BrandManager; 