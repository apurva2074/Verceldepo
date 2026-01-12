// src/routes/owners.js
const express = require('express');
const router = express.Router();

module.exports = ({ admin, db }) => {
  router.post('/profile', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const match = authHeader.match(/^Bearer (.*)$/);
      if (!match) return res.status(401).json({ message: 'Missing token' });
      const idToken = match[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      const { name, phone, kyc_docs = [], role } = req.body;
      if (role !== 'owner') return res.status(400).json({ message: 'role must be owner' });

      const ownerRef = db.collection('owner_profiles').doc(uid);
      const existing = await ownerRef.get();
      if (existing.exists) return res.status(400).json({ message: 'Owner profile exists' });

      const profile = { user_id: uid, name, phone, kyc_docs, status: 'pending', created_at: admin.firestore.FieldValue.serverTimestamp() };
      await ownerRef.set(profile);
      return res.json({ message: 'Owner profile created', profile });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
};

