// backend/src/utils/activityLogger.js
// Centralized activity logging utility

const { admin, db } = require("../firebaseAdmin");

/**
 * Log user activity for audit trail
 * @param {string} userId - User ID who performed the action
 * @param {string} action - Action type (CREATE, UPDATE, DELETE, LOGIN, VIEW, etc.)
 * @param {string} resourceType - Type of resource (property, rental, agreement, profile, etc.)
 * @param {string} resourceId - ID of the resource (optional)
 * @param {string} details - Human-readable description of the action
 * @param {Object} metadata - Additional metadata (IP, user agent, etc.)
 */
const logActivity = async (userId, action, resourceType, resourceId, details, metadata = {}) => {
  try {
    const activityLog = {
      userId,
      action, // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'VIEW', 'MARK_RENTED', 'TOGGLE_AVAILABILITY', etc.
      resourceType, // 'property', 'rental', 'agreement', 'profile', 'wishlist', 'payment', etc.
      resourceId: resourceId || null,
      details,
      metadata: {
        userAgent: metadata.userAgent || 'Unknown',
        ipAddress: metadata.ipAddress || 'Unknown',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        sessionId: metadata.sessionId || 'Unknown',
        requestId: metadata.requestId || 'Unknown',
        ...metadata
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("activity_logs").add(activityLog);
    console.log(`✅ Activity logged: ${action} ${resourceType}${resourceId ? ':' + resourceId : ''} by user ${userId}`);
    
    return {
      success: true,
      logId: activityLog.id
    };
  } catch (error) {
    console.error("❌ Failed to log activity:", error);
    // Don't throw error to avoid breaking main functionality
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Log property-related activities
 */
const logPropertyActivity = async (userId, action, propertyId, details, metadata = {}) => {
  return await logActivity(userId, action, 'property', propertyId, details, metadata);
};

/**
 * Log rental-related activities
 */
const logRentalActivity = async (userId, action, rentalId, details, metadata = {}) => {
  return await logActivity(userId, action, 'rental', rentalId, details, metadata);
};

/**
 * Log agreement-related activities
 */
const logAgreementActivity = async (userId, action, agreementId, details, metadata = {}) => {
  return await logActivity(userId, action, 'agreement', agreementId, details, metadata);
};

/**
 * Log payment-related activities
 */
const logPaymentActivity = async (userId, action, paymentId, details, metadata = {}) => {
  return await logActivity(userId, action, 'payment', paymentId, details, metadata);
};

/**
 * Log user authentication activities
 */
const logAuthActivity = async (userId, action, details, metadata = {}) => {
  return await logActivity(userId, action, 'auth', null, details, metadata);
};

/**
 * Log wishlist activities
 */
const logWishlistActivity = async (userId, action, propertyId, details, metadata = {}) => {
  return await logActivity(userId, action, 'wishlist', propertyId, details, metadata);
};

/**
 * Middleware to automatically log API requests
 */
const createActivityLogger = (action, resourceType) => {
  return async (req, res, next) => {
    const userId = req.auth?.uid;
    const resourceId = req.params.id || req.params.propertyId || req.params.rentalId || req.params.agreementId;
    
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the activity after successful response
      if (res.statusCode >= 200 && res.statusCode < 300 && userId) {
        const details = `${action} ${resourceType}${resourceId ? ` (${resourceId})` : ''}`;
        
        logActivity(userId, action, resourceType, resourceId, details, {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip || req.connection.remoteAddress,
          method: req.method,
          endpoint: req.originalUrl,
          statusCode: res.statusCode,
          responseData: data
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  logActivity,
  logPropertyActivity,
  logRentalActivity,
  logAgreementActivity,
  logPaymentActivity,
  logAuthActivity,
  logWishlistActivity,
  createActivityLogger
};
