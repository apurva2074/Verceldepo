// frontend/src/services/propertyMediaService.js
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
    const fullUrl = `${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}${endpoint}`;
    console.log("Full API URL:", fullUrl);
    
    const response = await fetch(fullUrl, config);
    
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

// Upload property photos using Backend API
export const uploadPropertyPhotos = async ({
  propertyId,
  ownerId,
  files
}) => {
  if (!propertyId || !ownerId || !files?.length) {
    throw new Error("Missing propertyId / ownerId / files");
  }

  try {
    console.log("Sending photos to backend API:", { propertyId, ownerId, filesCount: files.length });
    console.log("API endpoint:", `/api/properties/${propertyId}/photos`);
    
    const response = await apiCall(`/api/properties/${propertyId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ photos: files })
    });
    
    console.log("Photos uploaded successfully via backend:", response);
    return response;
  } catch (error) {
    console.error('Upload photos error:', error);
    throw error;
  }
};

// Alias for backward compatibility
export const uploadPropertyImages = uploadPropertyPhotos;

// Get property media
export const getPropertyMedia = async (propertyId) => {
  try {
    console.log("Getting property media:", propertyId);
    const response = await apiCall(`/api/properties/${propertyId}/media`);
    console.log("Property media retrieved successfully:", response);
    return response;
  } catch (error) {
    console.error('Get property media error:', error);
    throw error;
  }
};

// Create property media
export const createPropertyMedia = async (propertyId, mediaData) => {
  try {
    console.log("Creating property media:", propertyId, mediaData);
    const response = await apiCall(`/properties/${propertyId}/media`, {
      method: 'POST',
      body: JSON.stringify(mediaData)
    });
    console.log("Property media created successfully:", response);
    return response;
  } catch (error) {
    console.error('Create property media error:', error);
    throw error;
  }
};

// Update property media
export const updatePropertyMedia = async (propertyId, mediaData) => {
  try {
    console.log("Updating property media:", propertyId, mediaData);
    const response = await apiCall(`/properties/${propertyId}/media`, {
      method: 'PUT',
      body: JSON.stringify(mediaData)
    });
    console.log("Property media updated successfully:", response);
    return response;
  } catch (error) {
    console.error('Update property media error:', error);
    throw error;
  }
};
