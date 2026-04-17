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
      '/etc/secrets/firebase-service-account.json',
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
        // Parse JSON with proper handling of private key newlines
        serviceAccount = JSON.parse(secretContent);
        console.log('Successfully parsed Firebase secret JSON');
        
        // Debug: Check private key format
        if (serviceAccount.private_key) {
          console.log('Private key exists in secret file');
          console.log('Private key starts with -----BEGIN:', serviceAccount.private_key.startsWith('-----BEGIN'));
          
          // Fix the private key by ensuring proper newlines
          if (serviceAccount.private_key.includes('\\n')) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }
          console.log('Private key contains actual newlines:', serviceAccount.private_key.includes('\n'));
        }
      } catch (parseError) {
        console.error('Failed to parse secret JSON:', parseError.message);
        console.error('Attempting to fix JSON formatting...');
        
        // Try to fix common JSON issues
        try {
          // Remove any control characters and fix formatting
          const cleanedContent = secretContent
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .replace(/\\n/g, '\\n') // Escape newlines in JSON
            .replace(/\n/g, '\\n');  // Convert actual newlines to escaped newlines
          
          serviceAccount = JSON.parse(cleanedContent);
          console.log('Successfully parsed Firebase secret JSON after cleaning');
          
          // Fix private key newlines
          if (serviceAccount.private_key && serviceAccount.private_key.includes('\\n')) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }
        } catch (secondError) {
          console.error('Failed to parse even after cleaning:', secondError.message);
          console.error('Secret content preview:', secretContent.substring(0, 200) + '...');
          throw new Error('Unable to parse Firebase secret file. Please check the JSON format.');
        }
      }
    } else {
      // Fallback to environment variables
      console.log('No secret file found, using Firebase environment variables');
      
      if (!process.env.FIREBASE_PRIVATE_KEY_BASE64 || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('Missing required Firebase environment variables. Please check FIREBASE_PRIVATE_KEY_BASE64, FIREBASE_PROJECT_ID, and FIREBASE_CLIENT_EMAIL');
      }
      
      // Create temporary service account file with correct PEM format
      console.log('Creating temporary service account file');
      
      // Decode base64 private key
      const privateKeyBuffer = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64');
      let privateKeyContent = privateKeyBuffer.toString('utf8');
      
      console.log('Decoded private key length:', privateKeyContent.length);
      console.log('Decoded private key starts with MIIE:', privateKeyContent.startsWith('MIIE'));
      
      // Ensure proper PEM formatting
      if (!privateKeyContent.includes('-----BEGIN PRIVATE KEY-----')) {
        privateKeyContent = `-----BEGIN PRIVATE KEY-----\n${privateKeyContent}\n-----END PRIVATE KEY-----\n`;
      }
      
      // Create complete service account object
      const serviceAccountData = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "firebase-admin-key",
        private_key: privateKeyContent,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || "115408859884381730014",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
        universe_domain: "googleapis.com"
      };
      
      // Write to temporary file
      const tempServiceAccountPath = '/tmp/serviceAccountKey.json';
      fs.writeFileSync(tempServiceAccountPath, JSON.stringify(serviceAccountData, null, 2));
      console.log('Temporary service account file created at:', tempServiceAccountPath);
      
      // Load from temporary file
      serviceAccount = require(tempServiceAccountPath);
      console.log('Service account loaded from temporary file');
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
