// Centralized Firebase Authentication Middleware
const { admin } = require('../firebaseAdmin');

/**
 * Verify Firebase ID token with comprehensive security checks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyTokenMiddleware = async (req, res, next) => {
  try {
    // Step 1: Check Authorization header
    const authHeader = req.headers.authorization || "";
    
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        message: "Missing or invalid Authorization header",
        code: "INVALID_AUTH_HEADER",
        required: "Bearer <firebase_id_token>"
      });
    }

    // Step 2: Extract and validate token format
    const idToken = authHeader.split("Bearer ")[1].trim();
    
    if (!idToken) {
      return res.status(401).json({ 
        message: "Missing ID token",
        code: "MISSING_TOKEN"
      });
    }

    // Step 3: Basic token format validation (JWT should have 3 parts)
    const tokenParts = idToken.split('.');
    if (tokenParts.length !== 3) {
      return res.status(401).json({ 
        message: "Invalid token format",
        code: "INVALID_TOKEN_FORMAT"
      });
    }

    // Step 4: Verify token with Firebase Admin SDK
    // This automatically checks: signature, expiry, issuer, audience
    const decodedToken = await admin.auth().verifyIdToken(idToken, true); // true = check if revoked
    
    // Step 5: Additional security validations
    const now = Math.floor(Date.now() / 1000);
    
    // Explicit expiry check (redundant but explicit)
    if (decodedToken.exp <= now) {
      return res.status(401).json({ 
        message: "Token has expired",
        code: "TOKEN_EXPIRED",
        expiredAt: new Date(decodedToken.exp * 1000)
      });
    }

    // Step 6: Validate token issuer
    if (decodedToken.iss !== `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`) {
      return res.status(401).json({ 
        message: "Invalid token issuer",
        code: "INVALID_ISSUER",
        issuer: decodedToken.iss
      });
    }

    // Step 7: Validate token audience
    if (decodedToken.aud !== process.env.FIREBASE_PROJECT_ID) {
      return res.status(401).json({ 
        message: "Invalid token audience",
        code: "INVALID_AUDIENCE",
        audience: decodedToken.aud
      });
    }

    // Step 8: Validate user exists in Firebase Auth
    try {
      await admin.auth().getUser(decodedToken.uid);
    } catch (userError) {
      return res.status(401).json({ 
        message: "User not found in Firebase Auth",
        code: "USER_NOT_FOUND",
        uid: decodedToken.uid
      });
    }

    // Step 9: Attach decoded token and additional security info to request
    req.auth = decodedToken;
    req.auth.tokenVerifiedAt = new Date().toISOString();
    req.auth.tokenExpiresAt = new Date(decodedToken.exp * 1000).toISOString();
    
    // Log successful verification (in production, use proper logging)
    console.log(`✅ Token verified - UID: ${decodedToken.uid}, Email: ${decodedToken.email || 'anonymous'}`);
    
    next();
    
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    
    // Handle specific Firebase Auth errors
    let errorMessage = "Token verification failed";
    let errorCode = "VERIFICATION_FAILED";
    
    if (error.code) {
      switch (error.code) {
        case 'auth/id-token-expired':
          errorMessage = "ID token has expired";
          errorCode = "TOKEN_EXPIRED";
          break;
        case 'auth/id-token-revoked':
          errorMessage = "ID token has been revoked";
          errorCode = "TOKEN_REVOKED";
          break;
        case 'auth/invalid-id-token':
          errorMessage = "Invalid ID token";
          errorCode = "INVALID_TOKEN";
          break;
        case 'auth/user-disabled':
          errorMessage = "User account is disabled";
          errorCode = "USER_DISABLED";
          break;
        case 'auth/user-not-found':
          errorMessage = "User not found";
          errorCode = "USER_NOT_FOUND";
          break;
        case 'auth/project-not-found':
          errorMessage = "Firebase project not found";
          errorCode = "PROJECT_NOT_FOUND";
          break;
        case 'auth/insufficient-permission':
          errorMessage = "Insufficient permission to verify token";
          errorCode = "INSUFFICIENT_PERMISSION";
          break;
      }
    }
    
    return res.status(401).json({
      message: errorMessage,
      code: errorCode,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Optional: Middleware to verify UID matches parameter
 * @param {string} paramPath - Request parameter path (e.g., 'uid', 'userId')
 * @returns {Function} Express middleware
 */
const verifyUidMatch = (paramPath = 'uid') => {
  return (req, res, next) => {
    try {
      const authenticatedUid = req.auth.uid;
      const requestedUid = req.params[paramPath] || req.body[paramPath];
      
      if (!authenticatedUid || !requestedUid) {
        return res.status(400).json({
          message: "UID verification failed - missing UIDs",
          code: "MISSING_UIDS"
        });
      }
      
      if (authenticatedUid !== requestedUid) {
        console.warn(`❌ UID mismatch - Authenticated: ${authenticatedUid}, Requested: ${requestedUid}`);
        return res.status(403).json({
          message: "Access denied - UID mismatch",
          code: "UID_MISMATCH",
          authenticatedUid,
          requestedUid
        });
      }
      
      console.log(`✅ UID match verified - ${authenticatedUid}`);
      next();
    } catch (error) {
      console.error("UID verification error:", error);
      return res.status(500).json({
        message: "UID verification failed",
        code: "UID_VERIFICATION_ERROR",
        error: error.message
      });
    }
  };
};

module.exports = {
  verifyTokenMiddleware,
  verifyUidMatch
};
