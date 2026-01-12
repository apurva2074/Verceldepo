// backend/src/routes/tenants.js
// Usage: const tenantsRouter = require('./routes/tenants')({ admin, db });
// then app.use('/api/tenants', tenantsRouter);

const express = require("express");

module.exports = ({ admin, db }) => {
  const router = express.Router();

  // middleware: verify ID token from Authorization header
  async function verifyTokenMiddleware(req, res, next) {
    try {
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
      }

      const idToken = authHeader.split("Bearer ")[1].trim();
      if (!idToken) return res.status(401).json({ message: "Missing ID token" });

      // verify token using Admin SDK
      const decoded = await admin.auth().verifyIdToken(idToken);
      req.auth = decoded; // attach decoded token (contains uid, email, etc.)
      next();
    } catch (err) {
      console.error("verifyTokenMiddleware error:", err);
      return res.status(401).json({ message: "Unauthorized: token verification failed", error: err.message });
    }
  }

  // POST /api/tenants/profile
  // body: { name, phone, email? , other optional fields }
  router.post("/profile", verifyTokenMiddleware, async (req, res) => {
    try {
      const uid = req.auth.uid;
      // prefer email from token if not provided
      const emailFromToken = req.auth.email || null;

      const { name, phone, email, ...other } = req.body || {};

      if (!name) {
        return res.status(400).json({ message: "Missing required field: name" });
      }

      // Build the profile doc
      const profileDoc = {
        uid,
        name: name || "",
        phone: phone || "",
        email: email || emailFromToken || "",
        role: "tenant",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        ...other,
      };

      // Write under 'users' collection (same as owners implementation)
      const usersRef = db.collection("users").doc(uid);
      await usersRef.set(profileDoc, { merge: true });

      return res.status(201).json({ message: "Tenant profile created/updated", uid });
    } catch (err) {
      console.error("tenants.profile error:", err);
      return res.status(500).json({ message: "Server error creating tenant profile", error: err.message });
    }
  });

  // optional: GET profile for signed-in tenant (uses token)
  router.get("/me", verifyTokenMiddleware, async (req, res) => {
    try {
      const uid = req.auth.uid;
      const snap = await db.collection("users").doc(uid).get();
      if (!snap.exists) return res.status(404).json({ message: "Profile not found" });
      return res.json({ uid, ...snap.data() });
    } catch (err) {
      console.error("tenants.me error:", err);
      return res.status(500).json({ message: "Server error retrieving profile", error: err.message });
    }
  });

  return router;
};
