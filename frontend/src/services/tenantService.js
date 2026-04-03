// Tenant Service
// Handles tenant-specific API calls including document verification

import { getAuthToken } from '../utils/authToken';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// Helper function for authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tenant API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: `${API_BASE}/api${endpoint}`,
        headers: headers,
        body: errorText
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'API call failed' };
      }
      
      console.error('Tenant API Parsed Error:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Tenant API Call Failed:`, {
      url: `${API_BASE}/api${endpoint}`,
      method: options.method || 'GET',
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// ================= TENANT DOCUMENT OPERATIONS =================

/**
 * Check if tenant has completed required documents
 * @param {string} tenantId - Tenant user ID
 * @returns {Promise<Object>} Document status with completion flag
 */
export const checkTenantDocuments = async (tenantId) => {
  return apiCall(`/tenant/documents/check/${tenantId}`);
};

/**
 * Get tenant document details
 * @param {string} tenantId - Tenant user ID
 * @returns {Promise<Object>} Tenant document data
 */
export const getTenantDocuments = async (tenantId) => {
  return apiCall(`/tenant/details/${tenantId}`);
};

const tenantService = {
  checkTenantDocuments,
  getTenantDocuments
};

export default tenantService;
