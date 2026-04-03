// backend/src/routes/owners.js
const express = require("express");

module.exports = ({ admin, db }) => {
  const router = express.Router();

  // 🔐 Verify Firebase ID token
  async function verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing auth token" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = await admin.auth().verifyIdToken(token);
      req.auth = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }

  // ================= CREATE OWNER PROFILE =================
  // POST /api/owners/profile
  router.post("/profile", verifyToken, async (req, res) => {
    try {
      const uid = req.auth.uid;
      const { name, phone, kyc_docs = [] } = req.body;

      const profileRef = db.collection("owner_profiles").doc(uid);
      const existing = await profileRef.get();

      if (existing.exists) {
        return res.status(400).json({ message: "Owner profile already exists" });
      }

      const profile = {
        user_id: uid,
        name,
        phone,
        kyc_docs,
        status: "pending",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      await profileRef.set(profile);

      return res.json({
        message: "Owner profile created successfully",
        profile,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ================= GET OWNER PROFILE =================
  // GET /api/owners/profile
  router.get("/profile", verifyToken, async (req, res) => {
    try {
      const uid = req.auth.uid;
      const profileRef = db.collection("owner_profiles").doc(uid);
      const profile = await profileRef.get();

      if (!profile.exists) {
        return res.status(404).json({ message: "Owner profile not found" });
      }

      return res.json({ id: profile.id, ...profile.data() });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ================= UPDATE OWNER PROFILE =================
  // PUT /api/owners/profile
  router.put("/profile", verifyToken, async (req, res) => {
    try {
      const uid = req.auth.uid;
      const { name, phone, kyc_docs } = req.body;

      const profileRef = db.collection("owner_profiles").doc(uid);
      const existing = await profileRef.get();

      if (!existing.exists) {
        return res.status(404).json({ message: "Owner profile not found" });
      }

      const updateData = {
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (kyc_docs) updateData.kyc_docs = kyc_docs;

      await profileRef.update(updateData);
      const updatedProfile = await profileRef.get();

      return res.json({
        message: "Owner profile updated successfully",
        profile: { id: updatedProfile.id, ...updatedProfile.data() },
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ================= DELETE OWNER PROFILE =================
  // DELETE /api/owners/profile
  router.delete("/profile", verifyToken, async (req, res) => {
    try {
      const uid = req.auth.uid;
      const profileRef = db.collection("owner_profiles").doc(uid);
      const profile = await profileRef.get();

      if (!profile.exists) {
        return res.status(404).json({ message: "Owner profile not found" });
      }

      await profileRef.delete();

      return res.json({ message: "Owner profile deleted successfully" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ================= GET OWNER NOTIFICATIONS =================
  // GET /api/owners/notifications
  router.get("/notifications", verifyToken, async (req, res) => {
    try {
      const ownerId = req.auth.uid;
      const snap = await db.collection('notifications')
        .where('userId', '==', ownerId)
        .orderBy('createdAt', 'desc').limit(50).get();
      const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unreadCount = notifications.filter(n => !n.read).length;
      return res.json({ notifications, unreadCount });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ================= MARK NOTIFICATION AS READ =================
  // POST /api/owners/notifications/:id/read
  router.post("/notifications/:id/read", verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const ownerId = req.auth.uid;
      
      // Verify notification belongs to this owner
      const notificationRef = db.collection('notifications').doc(id);
      const notificationSnap = await notificationRef.get();
      
      if (!notificationSnap.exists) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      const notification = notificationSnap.data();
      if (notification.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await notificationRef.update({ 
        read: true, 
        readAt: admin.firestore.FieldValue.serverTimestamp() 
      });
      
      return res.json({ message: "Notification marked as read" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ================= MARK ALL NOTIFICATIONS AS READ =================
  // POST /api/owners/notifications/read-all
  router.post("/notifications/read-all", verifyToken, async (req, res) => {
    try {
      const ownerId = req.auth.uid;
      
      // Get all unread notifications for this owner
      const unreadSnap = await db.collection('notifications')
        .where('userId', '==', ownerId)
        .where('read', '==', false)
        .get();
      
      // Batch update all unread notifications
      const batch = db.batch();
      unreadSnap.docs.forEach(doc => {
        batch.update(doc.ref, { 
          read: true, 
          readAt: admin.firestore.FieldValue.serverTimestamp() 
        });
      });
      
      await batch.commit();
      
      return res.json({ 
        message: "All notifications marked as read",
        count: unreadSnap.size
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
};
