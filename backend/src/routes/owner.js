// backend/src/routes/owner.js
const express = require("express");
const { requireRole } = require("../middleware/roleBasedAccess");
const { verifyTokenMiddleware } = require("../middleware/auth");

module.exports = ({ admin, db }) => {
  const router = express.Router();

  // ================= OWNER DASHBOARD SUMMARY =================
  // GET /api/owner/dashboard
  router.get("/dashboard", verifyTokenMiddleware, requireRole('owner'), async (req, res) => {
    try {
      // Validate req.auth is properly set by middleware
      if (!req.auth || !req.auth.uid) {
        return res.status(401).json({ 
          message: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      const ownerUid = req.auth.uid;
      console.log(`Fetching dashboard for owner: ${ownerUid}`);

      // Validate Firestore database connection
      if (!db) {
        return res.status(500).json({ 
          message: "Database connection error",
          code: "DB_ERROR"
        });
      }

      // Fetch properties with error handling
      let snapshot;
      try {
        snapshot = await db
          .collection("properties")
          .where("ownerId", "==", ownerUid)
          .get();
        
        // Fallback to owner_uid if no results found
        if (snapshot.empty) {
          console.log("No properties found with ownerId, trying owner_uid fallback");
          snapshot = await db
            .collection("properties")
            .where("owner_uid", "==", ownerUid)
            .get();
        }
      } catch (dbError) {
        console.error("Firestore query error:", dbError);
        return res.status(500).json({ 
          message: "Failed to fetch properties",
          code: "QUERY_ERROR",
          error: dbError.message
        });
      }

      // Validate query results
      if (!snapshot) {
        return res.status(500).json({ 
          message: "Failed to execute query",
          code: "QUERY_FAILED"
        });
      }

      let total = 0,
        rented = 0,
        available = 0,
        monthlyEarnings = 0;

      // Process properties safely
      const properties = snapshot.docs.map((doc) => {
        try {
          const p = doc.data();
          total++;

          // Handle different status values safely
          const status = (p.status || "").toLowerCase();
          if (status === "rented") {
            rented++;
            monthlyEarnings += Number(p.rent || p.monthlyRent || 0);
          } else {
            available++;
          }

          // Return property with safe data structure
          return { 
            id: doc.id, 
            ...p
            // Remove hardcoded images: [] to allow actual images to come through
          };
        } catch (docError) {
          console.error(`Error processing property ${doc.id}:`, docError);
          // Return minimal property data on error
          return {
            id: doc.id,
            title: "Error loading property",
            status: "error"
            // Remove hardcoded images: [] to allow actual images to come through if they exist
          };
        }
      });

      // Return successful response
      return res.json({
        totalProperties: total,
        rentedProperties: rented,
        availableProperties: available,
        totalMonthlyEarnings: monthlyEarnings,
        properties,
      });
    } catch (err) {
      console.error("Owner dashboard error:", err);
      // Always return a JSON response
      return res.status(500).json({ 
        message: "Failed to fetch dashboard data", 
        code: "INTERNAL_ERROR",
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // ================= OWNER RENTAL DETAILS =================
  // GET /api/owner/rentals/:rentalId
  router.get("/rentals/:rentalId", verifyTokenMiddleware, async (req, res) => {
    try {
      // Validate req.auth is properly set by middleware
      if (!req.auth || !req.auth.uid) {
        return res.status(401).json({ 
          message: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      const ownerUid = req.auth.uid;
      const { rentalId } = req.params;

      // Validate rentalId parameter
      if (!rentalId) {
        return res.status(400).json({ 
          message: "Rental ID is required",
          code: "MISSING_RENTAL_ID"
        });
      }

      const rentalDoc = await db.collection("rentals").doc(rentalId).get();
      
      if (!rentalDoc.exists) {
        return res.status(404).json({ 
          message: "Rental not found",
          code: "RENTAL_NOT_FOUND"
        });
      }

      const rental = rentalDoc.data();
      
      // Validate ownership
      if (rental.ownerId !== ownerUid) {
        return res.status(403).json({ 
          message: "Access denied",
          code: "ACCESS_DENIED"
        });
      }

      return res.json({ id: rentalId, ...rental });
    } catch (err) {
      console.error("Owner rental details error:", err);
      return res.status(500).json({ 
        message: "Failed to fetch rental details", 
        code: "INTERNAL_ERROR",
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
};
