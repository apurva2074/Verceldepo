// Role-based access control middleware
const { admin, db } = require('../firebaseAdmin');

/**
 * Middleware to verify user role from Firestore
 * @param {string} requiredRole - Required role ('owner', 'tenant')
 * @returns {Function} Express middleware function
 */
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // First verify token (this should be called after verifyTokenMiddleware)
      if (!req.auth || !req.auth.uid) {
        return res.status(401).json({ 
          message: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      const userId = req.auth.uid;
      console.log(`Role check for user ${userId}, required role: ${requiredRole}`);

      // Get user role from Firestore
      const userDoc = await db.collection("users").doc(userId).get();
      
      if (!userDoc.exists) {
        console.log(`User ${userId} not found in Firestore`);
        return res.status(403).json({ 
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      const userData = userDoc.data();
      const userRole = userData.role;

      console.log(`User ${userId} role: ${userRole}`);

      if (!userRole) {
        console.log(`User ${userId} has no role assigned`);
        return res.status(403).json({ 
          message: "User role not assigned",
          code: "ROLE_NOT_ASSIGNED"
        });
      }

      if (userRole !== requiredRole) {
        console.log(`Access denied: User ${userId} has role '${userRole}' but required '${requiredRole}'`);
        return res.status(403).json({ 
          message: `Access denied. Required role: ${requiredRole}`,
          code: "INSUFFICIENT_ROLE",
          userRole: userRole,
          requiredRole: requiredRole
        });
      }

      // Attach user role to request for downstream use
      req.userRole = userRole;
      req.userData = userData;

      console.log(`Role check passed: User ${userId} with role '${userRole}' accessing ${requiredRole} resource`);
      next();
    } catch (error) {
      console.error("Role verification error:", error);
      return res.status(500).json({ 
        message: "Internal server error during role verification",
        code: "ROLE_VERIFICATION_ERROR",
        error: error.message
      });
    }
  };
};

/**
 * Middleware to check if user is owner of a specific property
 * @param {string} propertyIdParam - Parameter name containing property ID (default: 'id')
 * @returns {Function} Express middleware function
 */
const requirePropertyOwnership = (propertyIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.auth || !req.auth.uid) {
        return res.status(401).json({ 
          message: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      const userId = req.auth.uid;
      const propertyId = req.params[propertyIdParam];

      if (!propertyId) {
        return res.status(400).json({ 
          message: "Property ID is required",
          code: "PROPERTY_ID_REQUIRED"
        });
      }

      console.log(`Ownership check: User ${userId} for property ${propertyId}`);

      // Get property from Firestore
      const propertyDoc = await db.collection("properties").doc(propertyId).get();
      
      if (!propertyDoc.exists) {
        return res.status(404).json({ 
          message: "Property not found",
          code: "PROPERTY_NOT_FOUND"
        });
      }

      const propertyData = propertyDoc.data();

      if (propertyData.owner_uid !== userId) {
        console.log(`Access denied: User ${userId} does not own property ${propertyId}. Owner: ${propertyData.owner_uid}`);
        return res.status(403).json({ 
          message: "Access denied. You are not the owner of this property",
          code: "NOT_PROPERTY_OWNER"
        });
      }

      // Attach property data to request for downstream use
      req.property = propertyData;
      req.propertyId = propertyId;

      console.log(`Ownership check passed: User ${userId} owns property ${propertyId}`);
      next();
    } catch (error) {
      console.error("Property ownership verification error:", error);
      return res.status(500).json({ 
        message: "Internal server error during ownership verification",
        code: "OWNERSHIP_VERIFICATION_ERROR",
        error: error.message
      });
    }
  };
};

/**
 * Middleware to check if user is either owner or tenant of a specific property
 * @param {string} propertyIdParam - Parameter name containing property ID (default: 'id')
 * @returns {Function} Express middleware function
 */
const requirePropertyAccess = (propertyIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.auth || !req.auth.uid) {
        return res.status(401).json({ 
          message: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      const userId = req.auth.uid;
      const propertyId = req.params[propertyIdParam];

      if (!propertyId) {
        return res.status(400).json({ 
          message: "Property ID is required",
          code: "PROPERTY_ID_REQUIRED"
        });
      }

      console.log(`Property access check: User ${userId} for property ${propertyId}`);

      // Get property from Firestore
      const propertyDoc = await db.collection("properties").doc(propertyId).get();
      
      if (!propertyDoc.exists) {
        return res.status(404).json({ 
          message: "Property not found",
          code: "PROPERTY_NOT_FOUND"
        });
      }

      const propertyData = propertyDoc.data();

      // Check if user is owner or tenant
      const isOwner = propertyData.owner_uid === userId;
      let isTenant = false;

      // Check if user is tenant (has rental agreement for this property)
      if (!isOwner) {
        const rentalQuery = await db.collection("rental_agreements")
          .where("propertyId", "==", propertyId)
          .where("tenantId", "==", userId)
          .where("status", "in", ["active", "ACTIVE"])
          .get();

        isTenant = !rentalQuery.empty;
      }

      if (!isOwner && !isTenant) {
        console.log(`Access denied: User ${userId} is neither owner nor tenant of property ${propertyId}`);
        return res.status(403).json({ 
          message: "Access denied. You are not authorized to access this property",
          code: "NO_PROPERTY_ACCESS"
        });
      }

      // Attach property data and user's relationship to request
      req.property = propertyData;
      req.propertyId = propertyId;
      req.isPropertyOwner = isOwner;
      req.isPropertyTenant = isTenant;

      console.log(`Property access check passed: User ${userId} (${isOwner ? 'owner' : 'tenant'}) for property ${propertyId}`);
      next();
    } catch (error) {
      console.error("Property access verification error:", error);
      return res.status(500).json({ 
        message: "Internal server error during property access verification",
        code: "PROPERTY_ACCESS_VERIFICATION_ERROR",
        error: error.message
      });
    }
  };
};

module.exports = {
  requireRole,
  requirePropertyOwnership,
  requirePropertyAccess
};
