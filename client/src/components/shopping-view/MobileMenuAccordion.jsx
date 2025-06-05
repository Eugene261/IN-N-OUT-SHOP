import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const MobileMenuAccordion = ({ menuItems, onNavigate, navigate }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const location = useLocation();

  const handleCategoryClick = (menuItem) => {
    if (menuItem.hasSubmenu) {
      // Toggle accordion
      setActiveCategory(activeCategory === menuItem.id ? null : menuItem.id);
    } else {
      // Direct navigation for items without submenu
      handleDirectNavigation(menuItem);
    }
  };

  const handleDirectNavigation = (menuItem) => {
    if (menuItem.id !== 'products' && menuItem.id !== 'shops') {
      // Store the category filter in session storage
      sessionStorage.removeItem('filters');
      const currentFilter = {
        category: [menuItem.id]
      };
      sessionStorage.setItem('filters', JSON.stringify(currentFilter));
      navigate('/shop/listing');
    } else {
      navigate(menuItem.path);
    }
    onNavigate();
  };

  const handleSubmenuClick = (path, category) => {
    // Extract category information from the URL if available
    if (path.includes('?')) {
      const url = new URL(`http://example.com${path}`);
      const categoryParam = url.searchParams.get('category');
      const subCategoryParam = url.searchParams.get('subCategory');
      
      // Set filter in session storage for the listing page
      if (categoryParam) {
        sessionStorage.removeItem('filters');
        const currentFilter = {
          category: [categoryParam]
        };
        
        // Add subcategory if available
        if (subCategoryParam) {
          currentFilter.subCategory = [subCategoryParam];
        }
        
        sessionStorage.setItem('filters', JSON.stringify(currentFilter));
      }
    } 
    // If direct category is provided but no query params in URL
    else if (category) {
      sessionStorage.removeItem('filters');
      const currentFilter = {
        category: [category]
      };
      sessionStorage.setItem('filters', JSON.stringify(currentFilter));
    }
    
    // Navigate to the specified path
    navigate(path);
    onNavigate();
  };

  return (
    <div className="py-6">
      {menuItems.map((menuItem) => (
        <div key={menuItem.id} className="border-b border-gray-100 last:border-b-0">
          {/* Main Category Button */}
          <button
            onClick={() => handleCategoryClick(menuItem)}
            className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors
              ${activeCategory === menuItem.id ? 'bg-gray-50 text-black' : 'text-gray-700 hover:text-black'}
              ${location.pathname.includes(menuItem.path) && menuItem.id !== 'products' ? 'bg-gray-50 text-black' : ''}`}
          >
            <span className="text-lg font-medium">{menuItem.label}</span>
            {menuItem.hasSubmenu && (
              <motion.div
                animate={{ rotate: activeCategory === menuItem.id ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-5 w-5" />
              </motion.div>
            )}
            {!menuItem.hasSubmenu && (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>

          {/* Submenu - Accordion Style */}
          <AnimatePresence>
            {menuItem.hasSubmenu && activeCategory === menuItem.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden bg-gray-50"
              >
                <div className="py-2">
                  {menuItem.submenu.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-4 last:mb-0">
                      <h4 className="px-6 py-2 text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        {section.title}
                      </h4>
                      {section.items.map((item, itemIndex) => (
                        <button
                          key={itemIndex}
                          onClick={() => handleSubmenuClick(item.path, item.category || section.category)}
                          className="w-full text-left px-8 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default MobileMenuAccordion; 