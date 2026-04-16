// backend/src/routes/wishlist.js
// Usage: const wishlistRouter = require('./routes/wishlist')({ admin, db });
// then app.use('/api/wishlist', wishlistRouter);

const express = require("express");
const { requireRole } = require("../middleware/roleBasedAccess");
const { verifyTokenMiddleware } = require("../middleware/auth");
const { ErrorHandler } = require("../middleware/errorHandler");
const { logWishlistActivity } = require("../utils/activityLogger");
const { getWishlistCollection, getWishlistCollections } = require("../utils/dataStandardization");

module.exports = ({ admin, db }) => {
  const router = express.Router();

  // POST /api/wishlist/toggle - Add or remove property from wishlist
  router.post("/toggle", verifyTokenMiddleware, requireRole('tenant'), async (req, res) => {
    try {
      const tenantId = req.auth.uid;
      const { propertyId } = req.body;

      if (!propertyId) {
        return ErrorHandler.badRequest(res, "propertyId is required");
      }

      // Check if property exists
      const propertyRef = db.collection("properties").doc(propertyId);
      const propertySnap = await propertyRef.get();
      
      if (!propertySnap.exists) {
        return ErrorHandler.notFound(res, "Property");
      }

      // Check if already in wishlist (try standard collection first)
      const wishlistRef = db.collection(getWishlistCollection());
      const existingQuery = await wishlistRef
        .where("tenantId", "==", tenantId)
        .where("propertyId", "==", propertyId)
        .get();

      if (!existingQuery.empty) {
        // Remove from wishlist
        await wishlistRef.doc(existingQuery.docs[0].id).delete();
        
        // Log wishlist removal activity
        await logWishlistActivity(tenantId, 'REMOVE', propertyId, `Removed property from wishlist`, {
          propertyId: propertyId,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip || req.connection.remoteAddress
        });
        
        return res.json({ message: "Property removed from wishlist", inWishlist: false });
      } else {
        // Add to wishlist
        await wishlistRef.add({
          tenantId,
          propertyId,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Log wishlist addition activity
        await logWishlistActivity(tenantId, 'ADD', propertyId, `Added property to wishlist`, {
          propertyId: propertyId,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip || req.connection.remoteAddress
        });
        
        return res.json({ message: "Property added to wishlist", inWishlist: true });
      }
    } catch (err) {
      console.error("wishlist toggle error:", err);
      return ErrorHandler.serverError(res, "Failed to toggle wishlist", err);
    }
  });

  // GET /api/wishlist - Get tenant's wishlist
  router.get("/", verifyTokenMiddleware, requireRole('tenant'), async (req, res) => {
    try {
      const tenantId = req.auth.uid;

      // Try standard collection first, fallback to old one during transition
      let wishlistQuery;
      try {
        wishlistQuery = await db.collection(getWishlistCollection())
          .where("tenantId", "==", tenantId)
          .get();
      } catch (error) {
        // Fallback to old collection name if standard doesn't exist
        wishlistQuery = await db.collection("wishlists")
          .where("tenantId", "==", tenantId)
          .get();
      }

      if (wishlistQuery.empty) {
        return res.json([]);
      }

      const propertyIds = wishlistQuery.docs.map(doc => doc.data().propertyId);
      
      // Fetch property details
      const properties = [];
      for (const propertyId of propertyIds) {
        const propertyRef = db.collection("properties").doc(propertyId);
        const propertySnap = await propertyRef.get();
        
        if (propertySnap.exists) {
          properties.push({
            id: propertySnap.id,
            ...propertySnap.data()
          });
        }
      }

      return res.json(properties);
    } catch (err) {
      console.error("get wishlist error:", err);
      return ErrorHandler.serverError(res, "Failed to fetch wishlist", err);
    }
  });

  // GET /api/wishlist/check/:propertyId - Check if property is in wishlist
  router.get("/check/:propertyId", verifyTokenMiddleware, requireRole('tenant'), async (req, res) => {
    try {
      const tenantId = req.auth.uid;
      const { propertyId } = req.params;

      // Try standard collection first, fallback to old one during transition
      let wishlistQuery;
      try {
        wishlistQuery = await db.collection(getWishlistCollection())
          .where("tenantId", "==", tenantId)
          .where("propertyId", "==", propertyId)
          .get();
      } catch (error) {
        // Fallback to old collection name if standard doesn't exist
        wishlistQuery = await db.collection("wishlists")
          .where("tenantId", "==", tenantId)
          .where("propertyId", "==", propertyId)
          .get();
      }

      return res.json({ inWishlist: !wishlistQuery.empty });
    } catch (err) {
      console.error("check wishlist error:", err);
      return ErrorHandler.serverError(res, "Failed to check wishlist status", err);
    }
  });

  // DELETE /api/wishlist/:propertyId - Remove property from wishlist
  router.delete("/:propertyId", verifyTokenMiddleware, requireRole('tenant'), async (req, res) => {
    try {
      const tenantId = req.auth.uid;
      const { propertyId } = req.params;

      // Try standard collection first, fallback to old one during transition
      let wishlistQuery;
      try {
        wishlistQuery = await db.collection(getWishlistCollection())
          .where("tenantId", "==", tenantId)
          .where("propertyId", "==", propertyId)
          .get();
      } catch (error) {
        // Fallback to old collection name if standard doesn't exist
        wishlistQuery = await db.collection("wishlists")
          .where("tenantId", "==", tenantId)
          .where("propertyId", "==", propertyId)
          .get();
      }

      if (wishlistQuery.empty) {
        return ErrorHandler.notFound(res, "Property in wishlist");
      }

      await db.collection(getWishlistCollection()).doc(wishlistQuery.docs[0].id).delete();
      return res.json({ message: "Property removed from wishlist" });
    } catch (err) {
      console.error("delete wishlist error:", err);
      return ErrorHandler.serverError(res, "Failed to remove from wishlist", err);
    }
  });

  return router;
};
