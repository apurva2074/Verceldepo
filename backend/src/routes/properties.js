// backend/src/routes/properties.js

const express = require("express");

module.exports = ({ admin, db }) => {
  const router = express.Router();

  /* ================= TOKEN VERIFICATION MIDDLEWARE ================= */
  async function verifyTokenMiddleware(req, res, next) {
    try {
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
      }

      const idToken = authHeader.split("Bearer ")[1].trim();
      if (!idToken) {
        return res.status(401).json({ message: "Missing ID token" });
      }

      const decoded = await admin.auth().verifyIdToken(idToken);
      req.auth = decoded; // contains uid, email, etc.
      next();
    } catch (err) {
      console.error("verifyTokenMiddleware error:", err);
      return res.status(401).json({
        message: "Unauthorized: token verification failed",
        error: err.message,
      });
    }
  }

  /* ================= ADD PROPERTY (OWNER) ================= */
  // POST /api/properties
  router.post("/", verifyTokenMiddleware, async (req, res) => {
    try {
      const owner_uid = req.auth.uid;

      const { title, address, rent, description, amenities, type } = req.body;

      // Basic validation
      if (!title || !address || !rent) {
        return res.status(400).json({
          message: "Missing required fields: title, address, rent",
        });
      }

      const propertyDoc = {
        owner_uid,
        title,
        address,
        rent: Number(rent),
        description: description || "",
        amenities: amenities || [],
        type: type || "apartment",

        // 🔐 IMPORTANT: property starts as PENDING
        status: "APPROVED",
        approved_at: admin.firestore.FieldValue.serverTimestamp(),


        created_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      const propertiesRef = db.collection("properties");
      const newProperty = await propertiesRef.add(propertyDoc);

      return res.status(201).json({
        message: "Property submitted for approval",
        propertyId: newProperty.id,
        status: "PENDING",
      });
    } catch (err) {
      console.error("properties POST error:", err);
      return res.status(500).json({
        message: "Server error storing property",
        error: err.message,
      });
    }
  });

  /* ================= ADMIN: APPROVE PROPERTY ================= */
  // POST /api/properties/approve/:propertyId
  router.post("/approve/:propertyId", async (req, res) => {
    try {
      const { propertyId } = req.params;

      const propertyRef = db.collection("properties").doc(propertyId);
      const propertySnap = await propertyRef.get();

      if (!propertySnap.exists) {
        return res.status(404).json({ message: "Property not found" });
      }

      await propertyRef.update({
        status: "APPROVED",
        approved_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({
        message: "Property approved successfully",
        propertyId,
      });
    } catch (err) {
      console.error("approve property error:", err);
      return res.status(500).json({
        message: "Failed to approve property",
        error: err.message,
      });
    }
  });

  return router;
};
