// Frontend service for owner dashboard statistics
import { getAuthToken } from '../utils/authToken';
import { auth } from '../firebase/auth';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// API helper with auth (optional for some endpoints)
const apiCall = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Only add auth token if it's not an anonymous endpoint
  if (!endpoint.includes('/track-view')) {
    console.log("Adding auth token for endpoint:", endpoint);
    const token = await getAuthToken();
    console.log("Auth token:", token ? "Present" : "Missing");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } else {
    console.log("Skipping auth token for anonymous endpoint:", endpoint);
  }

  const config = {
    ...options,
    headers,
  };

  console.log("Making API call to:", `${API_BASE}${endpoint}`);
  console.log("Headers:", headers);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
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

// Get owner dashboard statistics
export const getOwnerStats = async () => {
  try {
    console.log("Fetching owner statistics...");
    console.log("API_BASE:", API_BASE);
    
    // Check if user is logged in
    const currentUser = auth.currentUser;
    console.log("Current user:", currentUser ? currentUser.uid : "Not logged in");
    
    const response = await apiCall('/api/owner/stats');
    console.log("Received owner statistics:", response);
    return response;
  } catch (error) {
    console.error('Get owner stats error:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Track property view
export const trackPropertyView = async (propertyId) => {
  try {
    console.log("Tracking property view:", propertyId);
    console.log("API_BASE:", API_BASE);
    
    const response = await apiCall('/api/owner/stats/track-view', {
      method: 'POST',
      body: JSON.stringify({ propertyId }),
    });
    console.log("View tracked successfully:", response);
    return response;
  } catch (error) {
    console.error('Track property view error:', error);
    console.error('Full error details:', error.message, error.stack);
    throw error;
  }
};

// Track property inquiry
export const trackPropertyInquiry = async (propertyId) => {
  try {
    console.log("Tracking property inquiry:", propertyId);
    const response = await apiCall('/api/owner/stats/track-inquiry', {
      method: 'POST',
      body: JSON.stringify({ propertyId }),
    });
    console.log("Inquiry tracked successfully:", response);
    return response;
  } catch (error) {
    console.error('Track property inquiry error:', error);
    throw error;
  }
};
