// src/firebaseAdmin.js
const admin = require("firebase-admin");

// Initialize Firebase Admin with environment-based configuration
let serviceAccount;

// For production (Render), require environment variables
if (process.env.NODE_ENV === 'production' || process.env.DEV_MODE === 'false') {
  console.log('=== Firebase Environment Variables Debug ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DEV_MODE:', process.env.DEV_MODE);
  console.log('FIREBASE_PROJECT_ID exists:', !!process.env.FIREBASE_PROJECT_ID);
  console.log('FIREBASE_CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
  console.log('FIREBASE_PRIVATE_KEY_BASE64 exists:', !!process.env.FIREBASE_PRIVATE_KEY_BASE64);
  console.log('FIREBASE_PRIVATE_KEY_BASE64 length:', process.env.FIREBASE_PRIVATE_KEY_BASE64?.length || 0);
  
  if (!process.env.FIREBASE_PRIVATE_KEY_BASE64 || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('Missing required Firebase environment variables. Please check FIREBASE_PRIVATE_KEY_BASE64, FIREBASE_PROJECT_ID, and FIREBASE_CLIENT_EMAIL');
  }
  
  // Decode base64 private key for environment variable deployment
  let privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString();
  
  console.log('Decoded private key length:', privateKey.length);
  console.log('Decoded private key starts with MIIE:', privateKey.startsWith('MIIE'));
  
  // Remove any existing headers and clean up the key
  privateKey = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
    .trim();
  
  console.log('Cleaned private key length:', privateKey.length);
  
  // Ensure proper PEM formatting with correct newlines
  const formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
  
  console.log('Formatted private key length:', formattedPrivateKey.length);
  console.log('Formatted private key starts correctly:', formattedPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----'));
  console.log('Formatted private key ends correctly:', formattedPrivateKey.endsWith('-----END PRIVATE KEY-----\n'));
    
  serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: formattedPrivateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
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
