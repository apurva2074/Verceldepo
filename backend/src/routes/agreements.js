// backend/src/routes/agreements.js
// Dedicated agreements router

const express = require("express");
const { verifyTokenMiddleware } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleBasedAccess");

module.exports = ({ admin, db }) => {
  const router = express.Router();

  // ================= GET TENANT AGREEMENTS =================
  // GET /api/agreements/tenant/:tenantId
  router.get("/tenant/:tenantId", verifyTokenMiddleware, requireRole('tenant'), async (req, res) => {
    try {
      const { tenantId } = req.params;
      const userId = req.auth.uid;

      // Security check: users can only access their own agreements
      if (tenantId !== userId) {
        return res.status(403).json({ message: "Access denied: You can only access your own agreements" });
      }

      console.log(`Fetching agreements for tenant: ${tenantId}`);

      // Query Firestore agreements collection
      // Try multiple query approaches to find agreements
      let agreementsQuery;
      
      // First try: tenantDetails.tenantId (new structure)
      agreementsQuery = await db.collection("agreements")
        .where("tenantDetails.tenantId", "==", tenantId)
        .get();

      let agreements = [];
      
      // If no results, try: tenantId (old structure)
      if (agreementsQuery.empty) {
        console.log("No agreements found with tenantDetails.tenantId, trying tenantId field...");
        agreementsQuery = await db.collection("agreements")
          .where("tenantId", "==", tenantId)
          .get();
      }

      // If still no results, try checking if there are agreements with this tenant as participant
      if (agreementsQuery.empty) {
        console.log("No agreements found with tenantId, checking all agreements for this tenant...");
        const allAgreementsQuery = await db.collection("agreements")
          .where("participants", "array-contains", tenantId)
          .get();
        
        if (!allAgreementsQuery.empty) {
          agreementsQuery = allAgreementsQuery;
        }
      }
      
      for (const doc of agreementsQuery.docs) {
        const agreement = doc.data();
        console.log("Found agreement:", {
          id: doc.id,
          status: agreement.status,
          createdAt: agreement.createdAt,
          propertyId: agreement.propertyId
        });
        agreements.push({
          id: doc.id,
          ...agreement
        });
      }

      console.log(`Found ${agreements.length} total agreements for tenant ${tenantId}`);
      
      // Return all agreements (frontend will filter by propertyId)
      return res.json(agreements);

    } catch (err) {
      console.error("Get tenant agreements error:", err);
      return res.status(500).json({
        message: "Failed to fetch tenant agreements",
        error: err.message,
      });
    }
  });

  return router;
};
