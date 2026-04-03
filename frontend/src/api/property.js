// src/api/property.js - Property API Abstraction
import { api } from './base';

export const propertyAPI = {
  /**
   * Get all properties (public access)
   * @returns {Promise<Array>} List of properties
   */
  getAllProperties: async () => {
    try {
      console.log('Fetching all properties');
      const response = await api.get('/properties');
      return response;
    } catch (error) {
      console.error('Failed to fetch all properties:', error);
      throw new Error('Unable to load properties. Please try again later.');
    }
  },

  /**
   * Get property by ID (public access)
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Property details
   */
  getPropertyById: async (propertyId) => {
    try {
      console.log(`Fetching property: ${propertyId}`);
      const response = await api.get(`/properties/${propertyId}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch property ${propertyId}:`, error);
      
      if (error.status === 404) {
        throw new Error('Property not found');
      }
      throw new Error('Unable to load property details. Please try again later.');
    }
  },

  /**
   * Get property media (public access)
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Property media (images, videos)
   */
  getPropertyMedia: async (propertyId) => {
    try {
      console.log(`Fetching property media: ${propertyId}`);
      const response = await api.get(`/properties/${propertyId}/media`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch property media ${propertyId}:`, error);
      throw new Error('Unable to load property media. Please try again later.');
    }
  },

  /**
   * Add new property (owner only)
   * @param {Object} propertyData - Property details
   * @returns {Promise<Object>} Created property
   */
  addProperty: async (propertyData) => {
    try {
      console.log('➕ Adding new property:', propertyData.title);
      
      // Validate required fields
      const requiredFields = ['title', 'address', 'type'];
      const missingFields = requiredFields.filter(field => !propertyData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      const response = await api.post('/properties', propertyData);
      console.log('Property added successfully:', response.propertyId);
      return response;
    } catch (error) {
      console.error('Failed to add property:', error);
      
      if (error.status === 403) {
        throw new Error('Only property owners can add properties');
      }
      throw new Error('Failed to add property. Please check your information and try again.');
    }
  },

  /**
   * Update property (owner only)
   * @param {string} propertyId - Property ID
   * @param {Object} updates - Property updates
   * @returns {Promise<Object>} Updated property
   */
  updateProperty: async (propertyId, updates) => {
    try {
      console.log(`Updating property: ${propertyId}`);
      
      const response = await api.put(`/properties/${propertyId}`, updates);
      console.log('Property updated successfully');
      return response;
    } catch (error) {
      console.error(`Failed to update property ${propertyId}:`, error);
      
      if (error.status === 403) {
        throw new Error('Only property owners can update properties');
      } else if (error.status === 404) {
        throw new Error('Property not found');
      }
      throw new Error('Failed to update property. Please try again later.');
    }
  },

  /**
   * Delete property (owner only)
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  deleteProperty: async (propertyId) => {
    try {
      console.log(`Deleting property: ${propertyId}`);
      
      const response = await api.delete(`/properties/${propertyId}`);
      console.log('Property deleted successfully');
      return response;
    } catch (error) {
      console.error(`Failed to delete property ${propertyId}:`, error);
      
      if (error.status === 403) {
        throw new Error('Only property owners can delete properties');
      } else if (error.status === 404) {
        throw new Error('Property not found');
      } else if (error.status === 400) {
        throw new Error('Cannot delete rented property. Please mark as available first.');
      }
      throw new Error('Failed to delete property. Please try again later.');
    }
  },

  /**
   * Get properties by owner (owner only)
   * @param {string} ownerUid - Owner UID
   * @returns {Promise<Array>} List of owner's properties
   */
  getOwnerProperties: async (ownerUid) => {
    try {
      console.log(`Fetching properties for owner: ${ownerUid}`);
      const response = await api.get(`/properties/owner/${ownerUid}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch owner properties:', error);
      throw new Error('Unable to load your properties. Please try again later.');
    }
  },

  /**
   * Upload property media (owner only)
   * @param {string} propertyId - Property ID
   * @param {FormData} mediaData - Media files
   * @returns {Promise<Object>} Upload result
   */
  uploadPropertyMedia: async (propertyId, mediaData) => {
    try {
      console.log(`Uploading media for property: ${propertyId}`);
      
      // For file uploads, we need to use FormData and different headers
      const response = await api.post(`/properties/${propertyId}/media`, mediaData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Media uploaded successfully');
      return response;
    } catch (error) {
      console.error('Failed to upload property media:', error);
      
      if (error.status === 403) {
        throw new Error('Only property owners can upload media');
      }
      throw new Error('Failed to upload media. Please try again later.');
    }
  },

  /**
   * Search properties with filters
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Filtered properties
   * @note Backend doesn't have a dedicated search endpoint. This filters client-side.
   */
  searchProperties: async (filters = {}) => {
    try {
      console.log('Searching properties with filters:', filters);
      
      // Backend doesn't have /properties/search endpoint
      // Get all properties and filter client-side
      const response = await api.get('/properties');
      
      // Client-side filtering
      let filtered = Array.isArray(response) ? response : [];
      
      if (filters.type) {
        filtered = filtered.filter(p => p.type === filters.type);
      }
      if (filters.minRent) {
        filtered = filtered.filter(p => (p.rent || 0) >= filters.minRent);
      }
      if (filters.maxRent) {
        filtered = filtered.filter(p => (p.rent || 0) <= filters.maxRent);
      }
      if (filters.bedrooms) {
        filtered = filtered.filter(p => p.bedrooms === filters.bedrooms);
      }
      if (filters.city) {
        filtered = filtered.filter(p => 
          p.address?.city?.toLowerCase().includes(filters.city.toLowerCase())
        );
      }
      if (filters.state) {
        filtered = filtered.filter(p => 
          p.address?.state?.toLowerCase().includes(filters.state.toLowerCase())
        );
      }
      if (filters.furnishing) {
        filtered = filtered.filter(p => p.furnishing === filters.furnishing);
      }
      
      return filtered;
    } catch (error) {
      console.error('Failed to search properties:', error);
      throw new Error('Search failed. Please try again later.');
    }
  },

  /**
   * Track property view (analytics)
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} View tracking result
   */
  trackPropertyView: async (propertyId) => {
    try {
      console.log(`Tracking property view: ${propertyId}`);
      
      const response = await api.post('/owner/stats/track-view', { propertyId });
      return response;
    } catch (error) {
      console.error('Failed to track property view:', error);
      // Don't throw error for tracking failures - it's not critical
      return { success: false };
    }
  },

  /**
   * Track property inquiry (analytics)
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Inquiry tracking result
   */
  trackPropertyInquiry: async (propertyId) => {
    try {
      console.log(`Tracking property inquiry: ${propertyId}`);
      
      const response = await api.post('/owner/stats/track-inquiry', { propertyId });
      return response;
    } catch (error) {
      console.error(`Failed to track property inquiry:`, error);
      // Don't throw error for tracking failures - it's not critical
      return { success: false };
    }
  },

  /**
   * Get property statistics (owner only)
   * @returns {Promise<Object>} Property statistics
   */
  getPropertyStats: async () => {
    try {
      console.log('Fetching property statistics');
      
      const response = await api.get('/owner/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch property statistics:', error);
      throw new Error('Unable to load property statistics. Please try again later.');
    }
  },
};

export default propertyAPI;
