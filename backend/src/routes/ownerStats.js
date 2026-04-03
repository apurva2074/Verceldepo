// backend/src/routes/ownerStats.js
// Owner Dashboard Statistics API

const express = require("express");
const { requireRole } = require("../middleware/roleBasedAccess");
const { verifyTokenMiddleware } = require("../middleware/auth");

module.exports = ({ admin, db }) => {
  const router = express.Router();

  // GET /api/owner/stats - Get owner dashboard statistics
  router.get("/", verifyTokenMiddleware, requireRole('owner'), async (req, res) => {
    try {
      const ownerUid = req.auth.uid;
      console.log("Fetching owner stats for:", ownerUid);

      // Get all properties for this owner
      const propertiesQuery = await db.collection("properties")
        .where("owner_uid", "==", ownerUid)
        .get();

      const properties = propertiesQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("Found properties:", properties.length);

      // Calculate statistics
      let totalProperties = properties.length;
      let rentedCount = 0;
      let availableCount = 0;
      let totalMonthlyEarnings = 0;
      let totalViews = 0;
      let totalInquiries = 0;

      // Process each property
      for (const property of properties) {
        // Count by status
        if (property.status === "rented") {
          rentedCount++;
        } else if (property.status === "available" || property.status === "ACTIVE") {
          availableCount++;
        }

        // Add to monthly earnings (only for rented properties)
        if (property.status === "rented" && property.rent) {
          totalMonthlyEarnings += Number(property.rent) || 0;
        }

        // Add views and inquiries
        totalViews += property.viewCount || 0;
        totalInquiries += property.inquiries || 0;
      }

      // Get individual property statistics with view counts
      const propertyStats = properties.map(property => ({
        propertyId: property.id,
        title: property.title || "Untitled Property",
        status: property.status || "unknown",
        rent: property.rent || 0,
        viewCount: property.viewCount || 0,
        inquiries: property.inquiries || 0,
        address: property.address || {},
        type: property.type || "unknown",
        bedrooms: property.bedrooms || 0,
        createdAt: property.createdAt,
        lastUpdated: property.lastUpdated || property.createdAt
      }));

      // Sort properties by views (descending) for better visibility
      propertyStats.sort((a, b) => b.viewCount - a.viewCount);

      const statistics = {
        totalProperties,
        rentedCount,
        availableCount,
        totalMonthlyEarnings,
        totalViews,
        totalInquiries,
        avgRent: totalProperties > 0 ? Math.round(
          properties.reduce((sum, p) => sum + (Number(p.rent) || 0), 0) / totalProperties
        ) : 0,
        propertyStats, // Individual property stats with view counts
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      console.log("Owner statistics calculated:", {
        totalProperties,
        rentedCount,
        availableCount,
        totalMonthlyEarnings,
        totalViews
      });

      return res.json(statistics);
    } catch (err) {
      console.error("Owner stats error:", err);
      return res.status(500).json({ 
        message: "Server error", 
        error: err.message 
      });
    }
  });

  // POST /api/owner/stats/track-view - Track property view
  router.post("/track-view", async (req, res) => {
    try {
      const { propertyId } = req.body;

      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }

      console.log("Tracking view for property:", propertyId);

      // Get property to verify it exists
      const propertyDoc = await db.collection("properties").doc(propertyId).get();
      
      if (!propertyDoc.exists) {
        return res.status(404).json({ message: "Property not found" });
      }

      const propertyData = propertyDoc.data();

      // Create view record (optional: for detailed analytics)
      const viewData = {
        propertyId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userAgent: req.headers['user-agent'] || '',
        ip: req.ip || req.connection.remoteAddress || ''
      };

      // Add user ID if authenticated
      if (req.auth && req.auth.uid) {
        viewData.viewerUid = req.auth.uid;
        console.log("Authenticated view by user:", req.auth.uid);
      } else {
        console.log("Anonymous view tracking");
      }

      await db.collection("property_views").add(viewData);

      // Update property view count
      await db.collection("properties").doc(propertyId).update({
        viewCount: admin.firestore.FieldValue.increment(1),
        lastViewedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log("View tracked successfully for property:", propertyId);

      return res.json({ 
        success: true, 
        message: "View tracked successfully",
        viewCount: (propertyData.viewCount || 0) + 1,
        authenticated: !!req.auth
      });
    } catch (err) {
      console.error("Track view error:", err);
      return res.status(500).json({ 
        message: "Server error", 
        error: err.message 
      });
    }
  });

  // POST /api/owner/stats/track-inquiry - Track property inquiry
  router.post("/track-inquiry", verifyTokenMiddleware, async (req, res) => {
    try {
      const { propertyId } = req.body;
      const inquirerUid = req.auth.uid;

      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }

      console.log("Tracking inquiry for property:", propertyId, "by user:", inquirerUid);

      // Get property to verify it exists
      const propertyDoc = await db.collection("properties").doc(propertyId).get();
      
      if (!propertyDoc.exists) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Create inquiry record
      await db.collection("property_inquiries").add({
        propertyId,
        inquirerUid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: "chat_initiated"
      });

      // Update property inquiry count
      await db.collection("properties").doc(propertyId).update({
        inquiries: admin.firestore.FieldValue.increment(1),
        lastInquiredAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log("Inquiry tracked successfully for property:", propertyId);

      return res.json({ 
        success: true, 
        message: "Inquiry tracked successfully"
      });
    } catch (err) {
      console.error("Track inquiry error:", err);
      return res.status(500).json({ 
        message: "Server error", 
        error: err.message 
      });
    }
  });

  return router;
};
