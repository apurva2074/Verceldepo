const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.log('Using environment variables for Firebase...');
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'rentit-app-4b3f5'
  });
}

const db = admin.firestore();

async function checkPropertyImagesInFirestore() {
  try {
    console.log('🔍 Checking how images are stored in Firestore...\n');
    
    // Get all properties to check their image storage
    const propertiesSnapshot = await db.collection('properties').get();
    
    if (propertiesSnapshot.empty) {
      console.log('❌ No properties found in Firestore');
      return;
    }
    
    console.log(`📊 Found ${propertiesSnapshot.size} properties:\n`);
    
    propertiesSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`🏠 Property #${index + 1}: ${doc.id}`);
      console.log(`   Title: ${data.title || 'No title'}`);
      console.log(`   Type: ${data.type || 'No type'}`);
      console.log(`   Status: ${data.status || 'No status'}`);
      
      // Check images field
      console.log(`   Images field exists: ${!!data.images}`);
      console.log(`   Images type: ${typeof data.images}`);
      console.log(`   Images is array: ${Array.isArray(data.images)}`);
      console.log(`   Images length: ${data.images ? data.images.length : 'N/A'}`);
      
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        console.log(`   First image:`, data.images[0]);
        console.log(`   First image type: ${typeof data.images[0]}`);
        
        if (typeof data.images[0] === 'object') {
          console.log(`   First image.url: ${data.images[0].url}`);
          console.log(`   First image.type: ${data.images[0].type}`);
          console.log(`   First image.room: ${data.images[0].room}`);
          console.log(`   First image.name: ${data.images[0].name}`);
        } else if (typeof data.images[0] === 'string') {
          console.log(`   First image (string): ${data.images[0]}`);
        }
      } else if (data.images && data.images.length === 0) {
        console.log(`   Images: Empty array []`);
      }
      
      // Check media field as fallback
      if (!data.images && data.media) {
        console.log(`   Media field exists: ${!!data.media}`);
        console.log(`   Media type: ${typeof data.media}`);
        console.log(`   Media length: ${data.media ? data.media.length : 'N/A'}`);
      }
      
      console.log('---');
    });
    
    // Summary
    let withImages = 0;
    let withEmptyImages = 0;
    let withoutImages = 0;
    
    propertiesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.images && Array.isArray(data.images)) {
        if (data.images.length > 0) {
          withImages++;
        } else {
          withEmptyImages++;
        }
      } else {
        withoutImages++;
      }
    });
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Properties with images: ${withImages}`);
    console.log(`   Properties with empty images: ${withEmptyImages}`);
    console.log(`   Properties without images field: ${withoutImages}`);
    
  } catch (error) {
    console.error('❌ Error checking properties:', error);
  } finally {
    process.exit(0);
  }
}

checkPropertyImagesInFirestore();
