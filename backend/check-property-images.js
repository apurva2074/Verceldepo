const admin = require('firebase-admin');

// Try to initialize with environment variables
try {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'rentit-app-4b3f5'
  });
} catch (error) {
  console.log('Firebase already initialized or error:', error.message);
}

const db = admin.firestore();

async function checkPropertyImages() {
  try {
    console.log('🔍 Checking property images in Firestore...');
    
    // Get a few properties to check their images
    const propertiesSnapshot = await db.collection('properties').limit(3).get();
    
    if (propertiesSnapshot.empty) {
      console.log('❌ No properties found in Firestore');
      return;
    }
    
    console.log(`📊 Found ${propertiesSnapshot.size} properties:\n`);
    
    propertiesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`🏠 Property ID: ${doc.id}`);
      console.log(`   Title: ${data.title || 'No title'}`);
      console.log(`   Type: ${data.type || 'No type'}`);
      console.log(`   Images field:`, data.images);
      console.log(`   Images type: ${typeof data.images}`);
      console.log(`   Images length: ${data.images ? data.images.length : 'N/A'}`);
      
      if (data.images && data.images.length > 0) {
        console.log(`   First image:`, data.images[0]);
        console.log(`   First image type: ${typeof data.images[0]}`);
        if (data.images[0] && typeof data.images[0] === 'object') {
          console.log(`   First image.url: ${data.images[0].url}`);
        }
      }
      
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error checking properties:', error);
  } finally {
    process.exit(0);
  }
}

checkPropertyImages();
