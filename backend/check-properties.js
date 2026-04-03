const admin = require('firebase-admin');

// Check if service account key exists
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.log('❌ Service account key not found, trying to use environment variables');
  // Try to initialize with environment variables if service account key doesn't exist
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'rentit-app-4b3f5'
  });
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkProperties() {
  try {
    console.log('🔍 Checking properties in Firestore...');
    
    const propertiesSnapshot = await db.collection('properties').get();
    
    if (propertiesSnapshot.empty) {
      console.log('❌ No properties found in Firestore');
      return;
    }
    
    console.log(`📊 Found ${propertiesSnapshot.size} properties:`);
    
    const statuses = {};
    
    propertiesSnapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status || 'NO_STATUS';
      statuses[status] = (statuses[status] || 0) + 1;
      console.log(`🏠 Property ID: ${doc.id} - Status: '${status}' - Title: ${data.title || 'No title'}`);
    });
    
    console.log('\n📈 Status Summary:');
    Object.entries(statuses).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} properties`);
    });
    
  } catch (error) {
    console.error('❌ Error checking properties:', error);
  } finally {
    process.exit(0);
  }
}

checkProperties();
