// src/firebaseAdmin.js
const admin = require("firebase-admin");

// Use the correct service account file for rentit-562ce project
const serviceAccount = require("../serviceAccountKey.json");

// Initialize Firebase Admin with environment-based configuration
const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || "rentit-562ce",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || "rentit-562ce"}.firebasestorage.app`
};

admin.initializeApp(firebaseConfig);

const db = admin.firestore();
module.exports = { admin, db };
