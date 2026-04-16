// backend/src/utils/dataStandardization.js
// Data standardization utilities for backward compatibility

/**
 * Get property owner ID with backward compatibility
 * @param {Object} property - Property object
 * @returns {String} Owner ID
 */
const getOwnerId = (property) => {
  return property.ownerId || property.owner_uid;
};

/**
 * Set property owner ID with standardization
 * @param {Object} property - Property object
 * @param {String} ownerId - Owner ID to set
 * @returns {Object} Updated property object
 */
const setOwnerId = (property, ownerId) => {
  // Always save as ownerId (standard)
  property.ownerId = ownerId;
  // Keep owner_uid for backward compatibility during transition
  property.owner_uid = ownerId;
  return property;
};

/**
 * Standardize property status values
 * @param {String} status - Original status
 * @returns {String} Standardized status
 */
const standardizeStatus = (status) => {
  const statusMap = {
    'ACTIVE': 'approved',
    'active': 'available', 
    'Available': 'available',
    'confirmed': 'booked',
    'completed': 'booked',
    'rented': 'booked'
  };
  
  return statusMap[status] || status;
};

/**
 * Check if property is available for booking (supports all status variants)
 * @param {String} status - Property status
 * @returns {Boolean} Whether property is available
 */
const isPropertyAvailable = (status) => {
  const bookableStatuses = ['ACTIVE', 'active', 'approved', 'available', 'Available'];
  return bookableStatuses.includes(status);
};

/**
 * Get wishlist collection name with fallback
 * @returns {String} Collection name
 */
const getWishlistCollection = () => {
  return 'wishlist'; // Standard name
};

/**
 * Get wishlist collection name for queries (supports both during transition)
 * @returns {Array} Array of collection names to try
 */
const getWishlistCollections = () => {
  return ['wishlist', 'wishlists']; // Try both during transition
};

module.exports = {
  getOwnerId,
  setOwnerId,
  standardizeStatus,
  isPropertyAvailable,
  getWishlistCollection,
  getWishlistCollections
};
