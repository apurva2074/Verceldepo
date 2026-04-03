// Frontend service for property actions
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
    const error = await response.json();
    throw new Error(error.message || 'API call failed');
  }

  return response.json();
};

// Edit property
export const editProperty = async (propertyId, propertyData) => {
  try {
    logger.log("Editing property:", propertyId, propertyData);
    const response = await apiCall(`/properties/${propertyId}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
    logger.log("Property edited successfully:", response);
    return response;
  } catch (error) {
    logger.error('Edit property error:', error);
    throw error;
  }
};

// Delete property
export const deleteProperty = async (propertyId) => {
  try {
    logger.log("Deleting property:", propertyId);
    const response = await apiCall(`/properties/${propertyId}`, {
      method: 'DELETE',
    });
    logger.log("Property deleted successfully:", response);
    return response;
  } catch (error) {
    logger.error('Delete property error:', error);
    throw error;
  }
};

// Toggle property availability
export const togglePropertyAvailability = async (propertyId, status) => {
  try {
    logger.log("Toggling property availability:", propertyId, status);
    const response = await apiCall(`/properties/${propertyId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    logger.log("Property availability updated successfully:", response);
    return response;
  } catch (error) {
    logger.error('Toggle availability error:', error);
    throw error;
  }
};

// Get property rent history
export const getPropertyRentHistory = async (propertyId) => {
  try {
    logger.log("Fetching rent history for property:", propertyId);
    const response = await apiCall(`/properties/${propertyId}/rent-history`);
    logger.log("Rent history fetched successfully:", response);
    return response;
  } catch (error) {
    logger.error('Get rent history error:', error);
    throw error;
  }
};

// Get all rented properties with tenant information
export const getRentedPropertiesWithTenants = async () => {
  try {
    logger.log("Fetching rented properties with tenant info...");
    const response = await apiCall('/properties/rented-with-tenants');
    logger.log("Rented properties fetched successfully:", response);
    return response;
  } catch (error) {
    logger.error('Get rented properties with tenants error:', error);
    throw error;
  }
};

// Mark property as rented
export const markPropertyAsRented = async (propertyId, rentalData) => {
  try {
    logger.log("Marking property as rented:", propertyId, rentalData);
    const response = await apiCall(`/properties/${propertyId}/mark-rented`, {
      method: 'POST',
      body: JSON.stringify(rentalData)
    });
    logger.log("Property marked as rented successfully:", response);
    return response;
  } catch (error) {
    logger.error('Mark property as rented error:', error);
    throw error;
  }
};
