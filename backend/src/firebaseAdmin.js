// src/firebaseAdmin.js
const admin = require("firebase-admin");

// Initialize Firebase Admin with environment-based configuration
let serviceAccount;

// For production (Render), check for secret file first, then environment variables
if (process.env.NODE_ENV === 'production' || process.env.DEV_MODE === 'false') {
  console.log('=== Firebase Production Setup ===');
  
  // Try to read from secret file first (Render)
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Check if secret file exists (Render mounts secrets at /etc/secrets/)
    const secretFilePath = '/etc/secrets/serviceAccountKey.json';
    if (fs.existsSync(secretFilePath)) {
      console.log('Using Firebase secret file from Render');
      serviceAccount = require(secretFilePath);
    } else {
      // Fallback to environment variables
      console.log('Using Firebase environment variables');
      
      if (!process.env.FIREBASE_PRIVATE_KEY_BASE64 || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('Missing required Firebase environment variables. Please check FIREBASE_PRIVATE_KEY_BASE64, FIREBASE_PROJECT_ID, and FIREBASE_CLIENT_EMAIL');
      }
      
      // Decode base64 private key for environment variable deployment
      const privateKeyBuffer = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64');
      let privateKey = privateKeyBuffer.toString('utf8');
      
      // Check if it already has headers
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        // Add headers if not present with REAL line breaks
        privateKey = `-----BEGIN PRIVATE KEY-----
        ${privateKey}
        -----END PRIVATE KEY-----
        `;
      }
      
      serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };
    }
  } catch (error) {
    console.error('Error loading Firebase credentials:', error.message);
    throw error;
  }
} else {
  // Fallback to local file for development
  console.log('Using local service account key file');
  serviceAccount = require("../serviceAccountKey.json");
}

const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || "rentit-562ce",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || "rentit-562ce"}.firebasestorage.app`
};

admin.initializeApp(firebaseConfig);

const db = admin.firestore();
module.exports = { admin, db };
