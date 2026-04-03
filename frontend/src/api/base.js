// src/api/base.js - Centralized API Client with Error Handling
import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const REQUEST_TIMEOUT = 15000;

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add authentication token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get token from localStorage (set by Firebase auth)
      const token = localStorage.getItem('idToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add request timestamp for debugging
      config.metadata = { startTime: new Date() };
      
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`✅ API Response: ${response.status} (${duration}ms) - ${response.config.url}`);
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Calculate request duration
    const duration = originalRequest.metadata ? 
      new Date() - originalRequest.metadata.startTime : 0;
    
    console.error(`❌ API Error: ${error.response?.status} (${duration}ms) - ${originalRequest.url}`);
    
    // Handle 401 with auto-retry
    if (error.response?.status === 401 && !originalRequest._retried) {
      console.warn('🔐 401 received, attempting token refresh and retry');
      
      try {
        const { getAuth } = await import('firebase/auth');
        const freshToken = await getAuth().currentUser?.getIdToken(true);
        
        if (freshToken) {
          console.log('🔄 Retrying request with fresh token');
          return apiClient({
            ...originalRequest,
            _retried: true,
            headers: { ...originalRequest.headers, Authorization: `Bearer ${freshToken}` }
          });
        }
      } catch (retryError) {
        console.error('❌ Token refresh failed:', retryError);
      }
      
      // If retry failed, clear local storage and redirect to login
      console.warn('🔐 Authentication failed - clearing token');
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
      
      // Redirect to login (only if not already on login page)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      console.error('🌐 Network error - check connection');
    }
    
    // Create enhanced error object
    const enhancedError = {
      message: error.response?.data?.message || error.message || 'API request failed',
      status: error.response?.status,
      code: error.response?.data?.code,
      url: originalRequest.url,
      method: originalRequest.method?.toUpperCase(),
      duration,
      originalError: error,
    };
    
    return Promise.reject(enhancedError);
  }
);

// Generic API request wrapper with error handling
export const apiRequest = async (config) => {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    // Log detailed error for debugging
    console.error('🔍 API Request Failed:', {
      url: error.url,
      method: error.method,
      status: error.status,
      message: error.message,
      duration: error.duration,
    });
    
    throw error;
  }
};

// HTTP method helpers
export const api = {
  get: (url, config = {}) => apiRequest({ ...config, method: 'GET', url }),
  post: (url, data = {}, config = {}) => apiRequest({ ...config, method: 'POST', url, data }),
  put: (url, data = {}, config = {}) => apiRequest({ ...config, method: 'PUT', url, data }),
  patch: (url, data = {}, config = {}) => apiRequest({ ...config, method: 'PATCH', url, data }),
  delete: (url, config = {}) => apiRequest({ ...config, method: 'DELETE', url }),
};

// Export the axios instance for advanced usage
export default apiClient;
