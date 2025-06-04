/**
 * Authentication Debugger Utility
 * Helps diagnose super admin authentication issues
 */

import { apiClient, API_BASE_URL } from '@/config/api';

export const authDebugger = {
  /**
   * Check if user has a valid token in localStorage
   */
  checkToken() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🔍 Auth Debug - Token Check:');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    
    if (token) {
      try {
        // Decode JWT payload (without verification - just for debugging)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        const isExpired = payload.exp < now;
        
        console.log('Token payload:', payload);
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Token is expired:', isExpired);
        console.log('User role:', payload.role);
        
        return {
          hasToken: true,
          isExpired,
          role: payload.role,
          userId: payload.id,
          expiresAt: new Date(payload.exp * 1000)
        };
      } catch (error) {
        console.error('❌ Invalid token format:', error);
        return { hasToken: false, error: 'Invalid token format' };
      }
    }
    
    return { hasToken: false };
  },

  /**
   * Test API connectivity
   */
  async testApiConnection() {
    console.log('🔍 Auth Debug - API Connection Test:');
    console.log('API Base URL:', API_BASE_URL);
    
    try {
      // Test basic endpoint
      const response = await fetch(`${API_BASE_URL}/api/health`);
      console.log('Health check status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Health check response:', data);
        return { connected: true, status: response.status };
      } else {
        console.error('Health check failed:', response.status);
        return { connected: false, status: response.status };
      }
    } catch (error) {
      console.error('❌ API connection failed:', error);
      return { connected: false, error: error.message };
    }
  },

  /**
   * Test super admin authentication
   */
  async testSuperAdminAuth() {
    console.log('🔍 Auth Debug - Super Admin Auth Test:');
    
    const tokenCheck = this.checkToken();
    if (!tokenCheck.hasToken) {
      console.error('❌ No token found');
      return { success: false, error: 'No token found' };
    }
    
    if (tokenCheck.isExpired) {
      console.error('❌ Token is expired');
      return { success: false, error: 'Token is expired' };
    }
    
    if (tokenCheck.role !== 'superAdmin') {
      console.error('❌ User is not a super admin, role:', tokenCheck.role);
      return { success: false, error: `User role is ${tokenCheck.role}, not superAdmin` };
    }
    
    try {
      // Test super admin endpoint
      const response = await apiClient.get('/api/superAdmin/users/role/admin');
      console.log('✅ Super admin auth test successful:', response.status);
      return { success: true, status: response.status, data: response.data };
    } catch (error) {
      console.error('❌ Super admin auth test failed:', error.response?.status, error.response?.data);
      return { 
        success: false, 
        status: error.response?.status,
        error: error.response?.data?.message || error.message 
      };
    }
  },

  /**
   * Run complete diagnostic
   */
  async runDiagnostic() {
    console.log('🚀 Starting Super Admin Auth Diagnostic...');
    console.log('==========================================');
    
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        apiBaseUrl: API_BASE_URL,
        isProduction: window.location.hostname !== 'localhost'
      }
    };
    
    // 1. Check token
    results.tokenCheck = this.checkToken();
    
    // 2. Test API connection
    results.apiConnection = await this.testApiConnection();
    
    // 3. Test super admin auth
    results.superAdminAuth = await this.testSuperAdminAuth();
    
    console.log('🏁 Diagnostic Complete:');
    console.log('==========================================');
    console.log('Results:', results);
    
    // Provide recommendations
    if (!results.tokenCheck.hasToken) {
      console.log('💡 Recommendation: Login as super admin');
    } else if (results.tokenCheck.isExpired) {
      console.log('💡 Recommendation: Token expired, please login again');
    } else if (results.tokenCheck.role !== 'superAdmin') {
      console.log('💡 Recommendation: Current user is not a super admin');
    } else if (!results.apiConnection.connected) {
      console.log('💡 Recommendation: Check API server and VITE_API_URL environment variable');
    } else if (!results.superAdminAuth.success) {
      console.log('💡 Recommendation: Check JWT_SECRET environment variable on server');
    } else {
      console.log('🎉 All checks passed! Super admin authentication is working correctly.');
    }
    
    return results;
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.authDebugger = authDebugger;
}

export default authDebugger; 