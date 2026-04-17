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
    // Check multiple possible secret file paths
    const possiblePaths = [
      '/etc/secrets/serviceAccountKey.json',
      '/etc/secrets/firebase-serviceAccountKey.json',
      '/tmp/serviceAccountKey.json',
      './serviceAccountKey.json'
    ];
    
    let secretFilePath = null;
    for (const path of possiblePaths) {
      console.log(`Checking secret file path: ${path}`);
      if (fs.existsSync(path)) {
        secretFilePath = path;
        console.log(`Found Firebase secret file at: ${path}`);
        break;
      }
    }
    
    if (secretFilePath) {
      console.log('Using Firebase secret file from Render');
      const secretContent = fs.readFileSync(secretFilePath, 'utf8');
      console.log('Secret file content length:', secretContent.length);
      
      try {
        serviceAccount = JSON.parse(secretContent);
        console.log('Successfully parsed Firebase secret JSON');
        
        // Debug: Check private key format
        if (serviceAccount.private_key) {
          console.log('Private key exists in secret file');
          console.log('Private key starts with -----BEGIN:', serviceAccount.private_key.startsWith('-----BEGIN'));
          console.log('Private key contains newlines:', serviceAccount.private_key.includes('\n'));
        }
      } catch (parseError) {
        console.error('Failed to parse secret JSON:', parseError.message);
        throw parseError;
      }
    } else {
      // Fallback to environment variables
      console.log('No secret file found, using Firebase environment variables');
      
      if (!process.env.FIREBASE_PRIVATE_KEY_BASE64 || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('Missing required Firebase environment variables. Please check FIREBASE_PRIVATE_KEY_BASE64, FIREBASE_PROJECT_ID, and FIREBASE_CLIENT_EMAIL');
      }
      
      // Create service account object directly from environment variables
      console.log('Creating service account from environment variables');
      
      // Decode base64 private key
      const privateKeyBuffer = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64');
      const privateKeyContent = privateKeyBuffer.toString('utf8');
      
      console.log('Decoded private key length:', privateKeyContent.length);
      console.log('Decoded private key starts with MIIE:', privateKeyContent.startsWith('MIIE'));
      
      // Create the complete service account object with proper private key formatting
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "firebase-admin-key",
        private_key: privateKeyContent, // Use the decoded key as-is
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || "123456789",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
        universe_domain: "googleapis.com"
      };
      
      console.log('Service account object created with project_id:', serviceAccount.project_id);
      console.log('Service account client_email:', serviceAccount.client_email);
      console.log('Private key starts with -----BEGIN:', serviceAccount.private_key.startsWith('-----BEGIN'));
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
