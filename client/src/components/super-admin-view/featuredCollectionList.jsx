import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { fetchFeaturedCollections, deleteFeaturedCollection, updateFeaturedCollection } from '../../store/superAdmin/featured-collection-slice';

const FeaturedCollectionList = ({ onEdit }) => {
  const dispatch = useDispatch();
  const { collections, isLoading, error } = useSelector(state => state.featuredCollections);
  
  // Debug the Redux state
  console.log('FeaturedCollectionList: Redux state =>', {
    collections,
    isLoading,
    error,
    collectionsCount: collections ? collections.length : 'null/undefined'
  });
  
  // Removed redundant useEffect - parent component handles fetching
  // This was causing infinite loading loops
  
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      dispatch(deleteFeaturedCollection(id))
        .unwrap()
        .then(() => {
          // Redux state will automatically update, no need to fetch again
          console.log('Collection deleted successfully');
        })
        .catch(error => {
          console.error('Failed to delete collection:', error);
        });
    }
  };
  
  const handleToggleActive = (collection) => {
    const formData = new FormData();
    formData.append('isActive', !collection.isActive);
    
    dispatch(updateFeaturedCollection({ 
      id: collection._id, 
      data: formData 
    }))
      .unwrap()
      .then(() => {
        // Redux state will automatically update, no need to fetch again
        console.log('Collection status updated successfully');
      })
      .catch(error => {
        console.error('Failed to update collection:', error);
      });
  };
  
  const handleMovePosition = (collection, direction) => {
    const newPosition = direction === 'up' 
      ? Math.max(0, collection.position - 1)
      : collection.position + 1;
    
    const formData = new FormData();
    formData.append('position', newPosition);
    
    dispatch(updateFeaturedCollection({ 
      id: collection._id, 
      data: formData 
    }))
      .unwrap()
      .then(() => {
        // Redux state will automatically update, no need to fetch again
        console.log('Collection position updated successfully');
      })
      .catch(error => {
        console.error('Failed to update collection position:', error);
      });
  };
  
  if (isLoading) {
    console.log('FeaturedCollectionList: Component is in loading state');
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error) {
    console.log('FeaturedCollectionList: Component has error:', error);
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>Error: {error}</p>
      </div>
    );
  }
  
  console.log('FeaturedCollectionList: Checking collections.length:', {
    collections,
    collectionsType: typeof collections,
    isArray: Array.isArray(collections),
    length: collections ? collections.length : 'no length property',
    truthyCheck: !!collections,
    lengthCheck: collections && collections.length > 0
  });
  
  if (!collections || collections.length === 0) {
    console.log('FeaturedCollectionList: Showing empty state - collections:', collections);
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
        <p className="text-gray-500">No featured collections found. Create one to get started!</p>
      </div>
    );
  }
  
  // Sort collections by position
  const sortedCollections = [...collections].sort((a, b) => a.position - b.position);
  
  console.log('FeaturedCollectionList: Rendering table with collections:', sortedCollections);
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Link
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCollections.map((collection) => (
              <motion.tr 
                key={collection._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {collection.image ? (
                    <img 
                      src={collection.image} 
                      alt={collection.title} 
                      className="h-12 w-20 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-12 w-20 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-xs text-gray-500">No image</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{collection.title}</div>
                  {collection.description && (
                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                      {collection.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-blue-600 hover:underline">
                    {collection.linkTo}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900">{collection.position}</span>
                    <div className="flex flex-col">
                      <button 
                        onClick={() => handleMovePosition(collection, 'up')}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        onClick={() => handleMovePosition(collection, 'down')}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(collection)}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      collection.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {collection.isActive ? (
                      <>
                        <Eye size={12} className="mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} className="mr-1" />
                        Inactive
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(collection)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(collection._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeaturedCollectionList;
