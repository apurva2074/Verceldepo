// frontend/src/services/ownerDashboardService.js
import { getAuthToken } from "../utils/authToken";

// Generic API call function with authentication
const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
};

// Get owner dashboard summary
export const getOwnerDashboardSummary = async () => {
  try {
    console.log("OwnerDashboardService - Fetching owner dashboard summary...");
    const response = await apiCall('/api/owner/dashboard');
    console.log("OwnerDashboardService - Dashboard summary fetched successfully:", response);
    return response;
  } catch (error) {
    console.error('OwnerDashboardService - Get dashboard summary error:', error);
    throw error;
  }
};
