import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

/**
 * Calculate shipping fees for the given cart items and address
 * @param {Array} cartItems - Cart items array
 * @param {Object} addressInfo - Shipping address information
 * @returns {Promise} - Promise resolving to shipping information
 */
export const calculateShippingFees = async (cartItems, addressInfo) => {
    try {
        console.log('==== SHIPPING API REQUEST ====');
        console.log('Cart Items:', JSON.stringify(cartItems.map(item => ({
            productId: item.productId,
            adminId: item.adminId,
            title: item.title || 'unknown'
        }))));
        console.log('Address:', JSON.stringify(addressInfo));
        
        const response = await axios.post(`${API_URL}/api/shop/shipping/calculate`, {
            cartItems,
            addressInfo
        });
        
        console.log('==== SHIPPING API RESPONSE DATA ====');
        console.log('Response:', response.data);
        console.log('================================');
        
        return response.data;
    } catch (error) {
        console.error('Error calculating shipping fees:', error);
        throw error;
    }
};

/**
 * Get all shipping zones (admin only)
 * @param {string} token - Admin authentication token
 * @returns {Promise} - Promise resolving to shipping zones array
 */
export const getShippingZones = async (token) => {
    try {
        console.log('Fetching shipping zones with token:', token ? 'Token exists' : 'No token');
        
        if (!token) {
            console.error('No authentication token provided');
            return { success: false, message: 'Authentication token missing' };
        }
        
        const response = await axios.get(`${API_URL}/api/shop/shipping/zones`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching shipping zones:', error);
        console.error('Error details:', error.response?.data || 'No response data');
        console.error('Status code:', error.response?.status);
        
        return { 
            success: false, 
            message: error.response?.data?.message || 'Error fetching shipping zones' 
        };
    }
};

/**
 * Save the user's base region (admin only)
 * @param {string} baseRegion - The base region to save
 * @param {string} token - Admin authentication token
 * @returns {Promise} - Promise resolving to updated user data
 */
export const saveBaseRegion = async (baseRegion, token) => {
    try {
        const response = await axios.patch(`${API_URL}/api/users/settings/base-region`, 
            { baseRegion }, 
            { headers: { Authorization: `Bearer ${token}` }}
        );
        
        return response.data;
    } catch (error) {
        console.error('Error saving base region:', error);
        return { 
            success: false, 
            message: error.response?.data?.message || 'Error saving base region' 
        };
    }
};

/**
 * Get the vendor's shipping settings (admin only)
 * @param {string} token - Admin authentication token
 * @param {string} userId - Optional user ID to get settings for (for super admin)
 * @returns {Promise} - Promise resolving to the vendor's shipping settings
 */
export const getVendorShippingSettings = async (token, userId = null) => {
    try {
        // Determine the endpoint URL based on whether a userId is provided
        const url = userId 
            ? `${API_URL}/api/users/${userId}/settings/shipping`
            : `${API_URL}/api/users/settings/shipping`;
            
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching vendor shipping settings:', error);
        return { 
            success: false, 
            message: error.response?.data?.message || 'Error fetching shipping settings' 
        };
    }
};

/**
 * Save vendor shipping settings (admin only)
 * @param {Object} shippingSettings - The shipping settings to save
 * @param {string} token - Admin authentication token
 * @param {string} userId - Optional user ID to save settings for (for super admin)
 * @returns {Promise} - Promise resolving to updated user data
 */
export const saveVendorShippingSettings = async (shippingSettings, token, userId = null) => {
    try {
        // Determine which user ID to use (provided ID or from token)
        const url = userId
            ? `${API_URL}/api/users/${userId}/settings`
            : `${API_URL}/api/users/settings`;
            
        const response = await axios.patch(url, 
            shippingSettings, 
            { headers: { Authorization: `Bearer ${token}` }}
        );
        
        return response.data;
    } catch (error) {
        console.error('Error saving shipping settings:', error);
        return { 
            success: false, 
            message: error.response?.data?.message || 'Error saving shipping settings' 
        };
    }
};

/**
 * Legacy: Get the user's base region (admin only)
 * @param {string} token - Admin authentication token
 * @returns {Promise} - Promise resolving to the user's base region
 * @deprecated Use getVendorShippingSettings instead
 */
export const getBaseRegion = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/api/users/settings/base-region`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.warn('getBaseRegion is deprecated, use getVendorShippingSettings instead');
        
        return response.data;
    } catch (error) {
        console.error('Error fetching base region:', error);
        return { 
            success: false, 
            message: error.response?.data?.message || 'Error fetching base region' 
        };
    }
};

/**
 * Create a new shipping zone (admin only)
 * @param {Object} zoneData - Shipping zone data
 * @param {string} token - Admin authentication token
 * @returns {Promise} - Promise resolving to created shipping zone
 */
export const createShippingZone = async (zoneData, token) => {
    try {
        const response = await axios.post(`${API_URL}/api/shop/shipping/zones`, zoneData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error creating shipping zone:', error);
        throw error;
    }
};

/**
 * Update a shipping zone (admin only)
 * @param {string} zoneId - ID of the zone to update
 * @param {Object} zoneData - Updated shipping zone data
 * @param {string} token - Admin authentication token
 * @returns {Promise} - Promise resolving to updated shipping zone
 */
export const updateShippingZone = async (zoneId, zoneData, token) => {
    try {
        console.log(`Making API call to update zone ${zoneId} with data:`, zoneData);
        console.log(`Authorization token exists: ${!!token}`);
        
        const response = await axios.put(`${API_URL}/api/shop/shipping/zones/${zoneId}`, zoneData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`API response for zone ${zoneId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error updating shipping zone ${zoneId}:`, error);
        console.error('Error details:', error.response?.data);
        console.error('Status code:', error.response?.status);
        console.error('Full error:', error);
        throw error;
    }
};

/**
 * Delete a shipping zone (admin only)
 * @param {string} zoneId - ID of the zone to delete
 * @param {string} token - Admin authentication token
 * @returns {Promise} - Promise resolving to deletion confirmation
 */
export const deleteShippingZone = async (zoneId, token) => {
    try {
        const response = await axios.delete(`${API_URL}/api/shop/shipping/zones/${zoneId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error deleting shipping zone:', error);
        throw error;
    }
};

/**
 * Debug fix all shipping zones with the provided base region (admin only)
 * @param {string} baseRegion - The base region to set for all zones
 * @param {string} token - Admin authentication token
 * @returns {Promise} - Promise resolving to fix result
 */
export const debugFixShippingZones = async (baseRegion, token) => {
    try {
        console.log(`Calling debugFixZones API with base region: ${baseRegion}`);
        
        const response = await axios.post(
            `${API_URL}/api/shop/shipping/debug-fix-zones`, 
            { baseRegion }, 
            { headers: { Authorization: `Bearer ${token}` }}
        );
        
        console.log('Debug fix zones response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in debugFixShippingZones:', error);
        console.error('Error details:', error.response?.data);
        console.error('Status code:', error.response?.status);
        throw error;
    }
}; 