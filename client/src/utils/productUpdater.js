import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

/**
 * Utility function to update a product and ensure the UI reflects the changes
 * @param {string} productId - The ID of the product to update
 * @param {object} formData - The form data to send to the server
 * @param {function} setLocalProducts - Function to update local products state
 * @param {function} dispatch - Redux dispatch function
 * @param {function} updateProductList - Redux action to update product list
 * @param {function} setRefreshKey - Function to update refresh key
 * @param {function} toast - Toast notification function
 * @returns {Promise<object>} - The updated product data
 */
export const updateProduct = async (
  productId,
  formData,
  setLocalProducts,
  dispatch,
  updateProductList,
  setRefreshKey,
  toast
) => {
  // Show loading toast
  toast.loading('Updating product...', { id: 'product-update' });

  try {
    // Step 1: Update the product on the server
    const updateResponse = await axios.put(
      `${API_BASE_URL}/api/admin/products/edit/${productId}`,
      formData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    if (!updateResponse.data.success) {
      toast.error(updateResponse.data.message || 'Failed to update product', { id: 'product-update' });
      return null;
    }

    const updatedProduct = updateResponse.data.data;
    console.log('Product updated successfully:', updatedProduct);

    // Step 2: Fetch fresh data from the server to ensure consistency
    const freshDataResponse = await axios.get(
      `${API_BASE_URL}/api/admin/products/get`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    if (freshDataResponse.data.success) {
      // Get the fresh data from the server
      const freshProductList = freshDataResponse.data.data;
      
      // Update both local state and Redux store with fresh data
      setLocalProducts(freshProductList);
      dispatch(updateProductList(freshProductList));
      
      console.log('Successfully fetched fresh product data:', freshProductList.length);
      
      // Force a re-render to ensure UI updates
      setRefreshKey(prev => prev + 1);
      
      // Schedule another re-render after a short delay
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 100);
    }

    // Show success toast
    toast.success('Product updated successfully', { id: 'product-update' });
    
    return updatedProduct;
  } catch (error) {
    console.error('Error updating product:', error);
    toast.error('Failed to update product: ' + (error.message || 'Unknown error'), { id: 'product-update' });
    return null;
  }
};
