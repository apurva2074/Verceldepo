// Frontend service for wishlist API calls
import { getAuthToken } from '../utils/authToken';
import { logger } from '../utils/logger';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// API helper with auth
const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Wishlist API Error Response:', {
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
    
    console.error('Wishlist API Parsed Error:', errorData);
    throw new Error(errorData.message || 'API call failed');
  }

  return response.json();
};

// Toggle wishlist (add/remove)
export const toggleWishlist = async (propertyId) => {
  try {
    const response = await apiCall('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ propertyId }),
    });
    return response.inWishlist;
  } catch (error) {
    console.error('Toggle wishlist error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      propertyId: propertyId
    });
    logger.error('Toggle wishlist error:', error);
    
    // Handle authentication errors with a user-friendly message
    if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('token')) {
      throw new Error('Please login to add properties to your wishlist');
    }
    
    // Handle role-based access errors (user might not be a tenant)
    if (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('role')) {
      throw new Error('Only tenants can add properties to wishlist');
    }
    
    // For other errors, rethrow with a generic message
    throw new Error('Failed to update wishlist. Please try again.');
  }
};

// Check if property is in wishlist
export const isWishlisted = async (propertyId) => {
  try {
    const response = await apiCall(`/wishlist/check/${propertyId}`);
    return response.inWishlist;
  } catch (error) {
    console.error('Check wishlist error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      propertyId: propertyId
    });
    logger.error('Check wishlist error:', error);
    
    // Handle authentication errors gracefully
    if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('token')) {
      logger.log('User not authenticated for wishlist check');
      return false; // Assume not wishlisted if user is not authenticated
    }
    
    // Handle role-based access errors gracefully
    if (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('role')) {
      logger.log('User is not a tenant, hiding wishlist functionality');
      return false; // Assume not wishlisted if user is not a tenant
    }
    
    // For other errors, also return false to avoid breaking the UI
    logger.log('Wishlist check failed, assuming not wishlisted');
    return false;
  }
};

// Get user's wishlist
export const getWishlist = async () => {
  try {
    const response = await apiCall('/wishlist');
    // Handle both direct array and wrapped response formats
    return Array.isArray(response) ? response : (response.data || response.properties || []);
  } catch (error) {
    console.error('Get wishlist error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    logger.error('Get wishlist error:', error);
    
    // Handle authentication errors gracefully
    if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('token')) {
      logger.log('User not authenticated for wishlist');
      return []; // Return empty array for unauthenticated users
    }
    
    // Handle role-based access errors gracefully
    if (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('role')) {
      logger.log('User is not a tenant, returning empty wishlist');
      return []; // Return empty array for non-tenants
    }
    
    // For other errors, return empty array to avoid breaking the UI
    logger.log('Wishlist fetch failed, returning empty array');
    return [];
  }
};

// Remove from wishlist
export const removeFromWishlist = async (propertyId) => {
  try {
    return await apiCall(`/wishlist/${propertyId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Remove from wishlist error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      propertyId: propertyId
    });
    logger.error('Remove from wishlist error:', error);
    
    // Handle authentication errors gracefully
    if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('token')) {
      throw new Error('Please login to remove properties from wishlist');
    }
    
    // Handle role-based access errors gracefully
    if (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('role')) {
      throw new Error('Only tenants can remove properties from wishlist');
    }
    
    // Handle not found errors gracefully
    if (error.message.includes('404') || error.message.includes('Not found')) {
      logger.log('Property not found in wishlist, assuming already removed');
      return { message: 'Property already removed from wishlist' };
    }
    
    // For other errors, rethrow with a generic message
    throw new Error('Failed to remove from wishlist. Please try again.');
  }
};
