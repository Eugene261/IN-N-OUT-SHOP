import axios from 'axios';
import { refreshProductData } from '../store/shop/product-slice';
import { fetchAllProducts } from '../store/admin/product-slice';
import { API_BASE_URL } from '@/config/api';

/**
 * Utility function to force a complete refresh of product data
 * This ensures both admin and shop views are in sync
 * @param {Function} dispatch - Redux dispatch function
 */
export const forceProductRefresh = async (dispatch) => {
  console.log('Forcing complete product refresh...');
  
  try {
    // 1. Clear cached data in the shop slice
    dispatch(refreshProductData());
    
    // 2. Fetch fresh data for admin side
    dispatch(fetchAllProducts());
    
    // 3. Make a direct API call to invalidate any server-side cache
    await axios.get(`${API_BASE_URL}/api/shop/products/refresh-cache`, { 
      withCredentials: true 
    });
    
    console.log('Product data refresh completed successfully');
    return true;
  } catch (error) {
    console.error('Error refreshing product data:', error);
    return false;
  }
};
