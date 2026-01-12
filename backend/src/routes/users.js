// backend/src/routes/users.js
const express = require("express");

module.exports = ({ admin, db }) => {
  const router = express.Router();

  // Create or update user profile (owner/tenant)
  router.post("/profile", async (req, res) => {
    try {
      // 1) Check token
      const hdr = req.headers.authorization || "";
      const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
      if (!token) return res.status(401).json({ message: "Missing token" });

      // 2) Verify Firebase ID token
      const decoded = await admin.auth().verifyIdToken(token);
      const uid = decoded.uid;

      // 3) Validate body
      const { name, phone, role } = req.body || {};
      if (!name || !role) {
        return res.status(400).json({ message: "name and role are required" });
      }
      if (!["owner", "tenant"].includes(role)) {
        return res.status(400).json({ message: "role must be 'owner' or 'tenant'" });
      }

      // 4) Write to Firestore
      await db.collection("users").doc(uid).set(
        {
          uid,
          name,
          phone: phone || "",
          role,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return res.json({ message: "Profile created successfully" });
    } catch (err) {
      console.error("users/profile error:", err);
      return res.status(500).json({ message: err.message || "Server error" });
    }
  });

  return router;
};
