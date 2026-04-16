// src/firebaseAdmin.js
const admin = require("firebase-admin");

// Initialize Firebase Admin with environment-based configuration
let serviceAccount;

// Use environment variables for Firebase credentials (Render deployment)
if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
  // Decode base64 private key for environment variable deployment
  const privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString();
  
  // Ensure proper PEM formatting
  const formattedPrivateKey = privateKey.includes('-----BEGIN PRIVATE KEY-----') 
    ? privateKey 
    : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    
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
