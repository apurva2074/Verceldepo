// src/firebaseAdmin.js
const admin = require("firebase-admin");

// Initialize Firebase Admin with environment-based configuration
let serviceAccount;

// For production (Render), require environment variables
if (process.env.NODE_ENV === 'production' || process.env.DEV_MODE === 'false') {
  if (!process.env.FIREBASE_PRIVATE_KEY_BASE64 || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('Missing required Firebase environment variables. Please check FIREBASE_PRIVATE_KEY_BASE64, FIREBASE_PROJECT_ID, and FIREBASE_CLIENT_EMAIL');
  }
  
  // Decode base64 private key for environment variable deployment
  let privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString();
  
  // Remove any existing headers and clean up the key
  privateKey = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
    .trim();
  
  // Ensure proper PEM formatting with correct newlines
  const formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    
  serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: formattedPrivateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
} else {
  // Fallback to local file for development
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
