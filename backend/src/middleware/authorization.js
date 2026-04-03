// backend/src/middleware/authorization.js

/**
 * Authorization middleware for property ownership verification
 * Ensures property.ownerId === loggedInOwnerId
 */

/**
 * Verify property ownership
 * @param {Object} admin - Firebase admin instance
 * @param {Object} db - Firestore database instance
 * @param {string} propertyIdParam - Parameter name containing property ID (default: 'id')
 * @returns {Function} Express middleware function
 */
const verifyPropertyOwnership = (admin, db, propertyIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const loggedInUserId = req.auth.uid;
      const propertyId = req.params[propertyIdParam];
      
      if (!propertyId) {
        return res.status(400).json({
          message: "Property ID is required",
          code: "MISSING_PROPERTY_ID"
        });
      }
      
      // Get property document
      const propertyDoc = await db.collection("properties").doc(propertyId).get();
      
      if (!propertyDoc.exists) {
        return res.status(404).json({
          message: "Property not found",
          code: "PROPERTY_NOT_FOUND"
        });
      }
      
      const propertyData = propertyDoc.data();
      
      // CRITICAL: Verify ownership
      if (propertyData.owner_uid !== loggedInUserId) {
        console.warn(`Authorization failed: User ${loggedInUserId} attempted to access property ${propertyId} owned by ${propertyData.owner_uid}`);
        
        return res.status(403).json({
          message: "Access denied - Not the property owner",
          code: "UNAUTHORIZED_ACCESS",
          details: {
            requestedProperty: propertyId,
            requestedBy: loggedInUserId,
            ownedBy: propertyData.owner_uid
          }
        });
      }
      
      // Attach property data to request for downstream use
      req.property = {
        id: propertyId,
        ...propertyData
      };
      
      next();
    } catch (error) {
      console.error("Property ownership verification error:", error);
      return res.status(500).json({
        message: "Authorization check failed",
        code: "AUTHORIZATION_ERROR",
        error: error.message
      });
    }
  };
};

/**
 * Verify rental ownership
 * @param {Object} admin - Firebase admin instance
 * @param {Object} db - Firestore database instance
 * @returns {Function} Express middleware function
 */
const verifyRentalOwnership = (admin, db) => {
  return async (req, res, next) => {
    try {
      const loggedInUserId = req.auth.uid;
      const rentalId = req.params.rentalId || req.params.id;
      
      if (!rentalId) {
        return res.status(400).json({
          message: "Rental ID is required",
          code: "MISSING_RENTAL_ID"
        });
      }
      
      // Get rental document
      const rentalDoc = await db.collection("rentals").doc(rentalId).get();
      
      if (!rentalDoc.exists) {
        return res.status(404).json({
          message: "Rental not found",
          code: "RENTAL_NOT_FOUND"
        });
      }
      
      const rentalData = rentalDoc.data();
      
      // CRITICAL: Verify ownership
      if (rentalData.ownerId !== loggedInUserId) {
        console.warn(`Authorization failed: User ${loggedInUserId} attempted to access rental ${rentalId} owned by ${rentalData.ownerId}`);
        
        return res.status(403).json({
          message: "Access denied - Not the rental owner",
          code: "UNAUTHORIZED_ACCESS",
          details: {
            requestedRental: rentalId,
            requestedBy: loggedInUserId,
            ownedBy: rentalData.ownerId
          }
        });
      }
      
      // Attach rental data to request for downstream use
      req.rental = {
        id: rentalId,
        ...rentalData
      };
      
      next();
    } catch (error) {
      console.error("Rental ownership verification error:", error);
      return res.status(500).json({
        message: "Authorization check failed",
        code: "AUTHORIZATION_ERROR",
        error: error.message
      });
    }
  };
};

/**
 * Verify agreement ownership
 * @param {Object} admin - Firebase admin instance
 * @param {Object} db - Firestore database instance
 * @returns {Function} Express middleware function
 */
const verifyAgreementOwnership = (admin, db) => {
  return async (req, res, next) => {
    try {
      const loggedInUserId = req.auth.uid;
      const agreementId = req.params.agreementId || req.params.id;
      
      if (!agreementId) {
        return res.status(400).json({
          message: "Agreement ID is required",
          code: "MISSING_AGREEMENT_ID"
        });
      }
      
      // Get agreement document
      const agreementDoc = await db.collection("agreements").doc(agreementId).get();
      
      if (!agreementDoc.exists) {
        return res.status(404).json({
          message: "Agreement not found",
          code: "AGREEMENT_NOT_FOUND"
        });
      }
      
      const agreementData = agreementDoc.data();
      
      // CRITICAL: Verify ownership
      if (agreementData.ownerId !== loggedInUserId) {
        console.warn(`Authorization failed: User ${loggedInUserId} attempted to access agreement ${agreementId} owned by ${agreementData.ownerId}`);
        
        return res.status(403).json({
          message: "Access denied - Not the agreement owner",
          code: "UNAUTHORIZED_ACCESS",
          details: {
            requestedAgreement: agreementId,
            requestedBy: loggedInUserId,
            ownedBy: agreementData.ownerId
          }
        });
      }
      
      // Attach agreement data to request for downstream use
      req.agreement = {
        id: agreementId,
        ...agreementData
      };
      
      next();
    } catch (error) {
      console.error("Agreement ownership verification error:", error);
      return res.status(500).json({
        message: "Authorization check failed",
        code: "AUTHORIZATION_ERROR",
        error: error.message
      });
    }
  };
};

/**
 * Verify payment session ownership (for tenants making payments)
 * @param {Object} admin - Firebase admin instance
 * @param {Object} db - Firestore database instance
 * @returns {Function} Express middleware function
 */
const verifyPaymentSessionOwnership = (admin, db) => {
  return async (req, res, next) => {
    try {
      const loggedInUserId = req.auth.uid;
      const sessionId = req.params.sessionId || req.body.sessionId;
      
      if (!sessionId) {
        return res.status(400).json({
          message: "Payment session ID is required",
          code: "MISSING_SESSION_ID"
        });
      }
      
      // Get payment session document
      const sessionDoc = await db.collection("payment_sessions").doc(sessionId).get();
      
      if (!sessionDoc.exists) {
        return res.status(404).json({
          message: "Payment session not found",
          code: "SESSION_NOT_FOUND"
        });
      }
      
      const sessionData = sessionDoc.data();
      
      // CRITICAL: Verify tenant ownership (only tenant can access their own payment sessions)
      if (sessionData.tenantId !== loggedInUserId) {
        console.warn(`Authorization failed: User ${loggedInUserId} attempted to access payment session ${sessionId} belonging to ${sessionData.tenantId}`);
        
        return res.status(403).json({
          message: "Access denied - Not your payment session",
          code: "UNAUTHORIZED_ACCESS",
          details: {
            requestedSession: sessionId,
            requestedBy: loggedInUserId,
            belongsTo: sessionData.tenantId
          }
        });
      }
      
      // Attach session data to request for downstream use
      req.paymentSession = {
        id: sessionId,
        ...sessionData
      };
      
      next();
    } catch (error) {
      console.error("Payment session ownership verification error:", error);
      return res.status(500).json({
        message: "Authorization check failed",
        code: "AUTHORIZATION_ERROR",
        error: error.message
      });
    }
  };
};

module.exports = {
  verifyPropertyOwnership,
  verifyRentalOwnership,
  verifyAgreementOwnership,
  verifyPaymentSessionOwnership
};
