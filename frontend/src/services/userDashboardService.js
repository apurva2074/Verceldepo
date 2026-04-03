// frontend/src/services/userDashboardService.js

import { getAuthToken } from "../utils/authToken";

// Generic API call function with authentication
const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  
  console.log("FRONTEND API CALL - Making request to:", endpoint);
  console.log("FRONTEND API CALL - Token available:", token ? "Yes" : "No");
  console.log("FRONTEND API CALL - Full URL:", `${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}${endpoint}`);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  };

  console.log("FRONTEND API CALL - Request headers:", {
    'Content-Type': config.headers['Content-Type'],
    'Authorization': config.headers.Authorization ? `Bearer ${token.substring(0, 20)}...` : 'Missing'
  });

  try {
    console.log("FRONTEND API CALL - Sending request...");
    const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}${endpoint}`, config);
    
    console.log("FRONTEND API CALL - Response status:", response.status);
    console.log("FRONTEND API CALL - Response ok:", response.ok);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("FRONTEND API CALL - Error response:", errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log("FRONTEND API CALL - Success response received");
    return responseData;
  } catch (error) {
    console.error(`FRONTEND API CALL - API call error for ${endpoint}:`, error);
    console.error("FRONTEND API CALL - Error name:", error.name);
    console.error("FRONTEND API CALL - Error message:", error.message);
    throw error;
  }
};

// Test backend connectivity (no auth required)
export const testBackendConnection = async () => {
  try {
    console.log("TESTING BACKEND CONNECTION...");
    const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/users/test`);
    console.log("Test response status:", response.status);
    console.log("Test response ok:", response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log("BACKEND CONNECTION TEST SUCCESS:", data);
      return data;
    } else {
      console.error("BACKEND CONNECTION TEST FAILED:", response.status);
      return null;
    }
  } catch (error) {
    console.error("BACKEND CONNECTION TEST ERROR:", error);
    return null;
  }
};

// Get user dashboard data
export const getUserDashboard = async () => {
  try {
    const response = await apiCall('/api/users/dashboard');
    console.log('getUserDashboard - Raw response:', response);
    
    // Handle wrapped response structure
    if (response && response.success && response.data) {
      console.log('getUserDashboard - Using wrapped data:', response.data);
      return response.data;
    }
    
    // Fallback to direct response if not wrapped
    console.log('getUserDashboard - Using direct response:', response);
    return response;
  } catch (error) {
    console.error('Get user dashboard error:', error);
    throw error;
  }
};
