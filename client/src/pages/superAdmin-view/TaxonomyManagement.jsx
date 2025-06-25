import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  FolderOpen, 
  Award, 
  Palette, 
  Ruler,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  Database
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
  fetchAllTaxonomyData,
  fetchCategories,
  fetchSubcategories,
  fetchBrands,
  fetchSizes,
  fetchColors
} from '../../store/superAdmin/taxonomy-slice/index';
import axios from 'axios';
import CategoryManager from '../../components/superAdmin-view/taxonomy/CategoryManager';
import SubcategoryManager from '../../components/superAdmin-view/taxonomy/SubcategoryManager';
import BrandManager from '../../components/superAdmin-view/taxonomy/BrandManager';
import SizeManager from '../../components/superAdmin-view/taxonomy/SizeManager';
import ColorManager from '../../components/superAdmin-view/taxonomy/ColorManager';

const TaxonomyManagement = () => {
  const dispatch = useDispatch();
  const { 
    categories, 
    subcategories, 
    brands, 
    sizes, 
    colors, 
    isLoading, 
    error 
  } = useSelector(state => state.taxonomy);

  const [activeTab, setActiveTab] = useState('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPopulating, setIsPopulating] = useState(false);

  // Function to populate initial taxonomy data
  const handlePopulateTaxonomy = async () => {
    const confirmPopulate = window.confirm(
      '⚠️ This will CLEAR ALL existing taxonomy data and populate with sample data.\n\nAre you sure you want to continue?'
    );

    if (!confirmPopulate) return;

    setIsPopulating(true);
    try {
      const response = await axios.post('/api/superAdmin/taxonomy/populate');
      
      if (response.data.success) {
        toast.success('✅ Taxonomy populated successfully!', {
          description: `Created ${response.data.data.categories} categories, ${response.data.data.subcategories} subcategories, ${response.data.data.brands} brands, ${response.data.data.sizes} sizes, and ${response.data.data.colors} colors.`
        });
        
        // Refresh the taxonomy data
        dispatch(fetchAllTaxonomyData());
      }
    } catch (error) {
      console.error('Error populating taxonomy:', error);
      toast.error('❌ Failed to populate taxonomy', {
        description: error.response?.data?.message || 'Something went wrong'
      });
    } finally {
      setIsPopulating(false);
    }
  };

  const tabs = [
    {
      id: 'categories',
      label: 'Categories',
      icon: Folder,
      count: categories.length,
      description: 'Product categories'
    },
    {
      id: 'subcategories',
      label: 'Subcategories',
      icon: FolderOpen,
      count: subcategories.length,
      description: 'Category subdivisions'
    },
    {
      id: 'brands',
      label: 'Brands',
      icon: Award,
      count: brands.length,
      description: 'Product brands'
    },
    {
      id: 'sizes',
      label: 'Sizes',
      icon: Ruler,
      count: sizes.length,
      description: 'Product sizes'
    },
    {
      id: 'colors',
      label: 'Colors',
      icon: Palette,
      count: colors.length,
      description: 'Product colors'
    }
  ];

  useEffect(() => {
    // Fetch all taxonomy data on component mount
    dispatch(fetchAllTaxonomyData());
  }, [dispatch]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm('');
  };

  const renderActiveManager = () => {
    const managerProps = {
      searchTerm,
      isLoading,
      error
    };

    switch (activeTab) {
      case 'categories':
        return <CategoryManager {...managerProps} />;
      case 'subcategories':
        return <SubcategoryManager {...managerProps} />;
      case 'brands':
        return <BrandManager {...managerProps} />;
      case 'sizes':
        return <SizeManager {...managerProps} />;
      case 'colors':
        return <ColorManager {...managerProps} />;
      default:
        return <CategoryManager {...managerProps} />;
    }
  };

  if (error) {
    toast.error(error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                Taxonomy Management
              </h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">
                Manage categories, brands, sizes, colors and other product attributes
              </p>
            </div>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              {/* Populate Button */}
              <button
                onClick={handlePopulateTaxonomy}
                disabled={isPopulating}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                {isPopulating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Database className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm">{isPopulating ? 'Populating...' : 'Populate Sample Data'}</span>
              </button>

              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64 text-sm"
                />
              </div>

              {/* Quick stats */}
              <div className="hidden lg:flex items-center space-x-4 text-xs text-gray-600">
                <span>Total: {
                  categories.length + subcategories.length + brands.length + sizes.length + colors.length
                }</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 min-w-max pb-2 sm:pb-0" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  <span className="xs:hidden sm:hidden">{tab.label.substring(0, 3)}</span>
                  <span className={`px-1 sm:px-1.5 lg:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </div>
                
                {/* Active tab indicator */}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-50 rounded-t-lg -z-10"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderActiveManager()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Loading taxonomy data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxonomyManagement; 