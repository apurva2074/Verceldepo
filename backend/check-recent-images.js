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

async function checkRecentPropertyImages() {
  try {
    console.log('🔍 Checking recent properties for image storage...\n');
    
    // Get properties sorted by creation date (most recent first)
    const propertiesSnapshot = await db.collection('properties')
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();
    
    if (propertiesSnapshot.empty) {
      console.log('❌ No properties found in Firestore');
      return;
    }
    
    console.log(`📊 Found ${propertiesSnapshot.size} most recent properties:\n`);
    
    propertiesSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`🏠 Recent Property #${index + 1}: ${doc.id}`);
      console.log(`   Title: ${data.title || 'No title'}`);
      console.log(`   Created: ${data.created_at ? data.created_at.toDate().toISOString() : 'Unknown'}`);
      
      // Check images field
      console.log(`   Images field exists: ${!!data.images}`);
      console.log(`   Images type: ${typeof data.images}`);
      console.log(`   Images is array: ${Array.isArray(data.images)}`);
      console.log(`   Images length: ${data.images ? data.images.length : 'N/A'}`);
      
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        console.log(`   ✅ HAS IMAGES!`);
        console.log(`   First image:`, data.images[0]);
        console.log(`   First image type: ${typeof data.images[0]}`);
        
        if (typeof data.images[0] === 'object') {
          console.log(`   ✅ CORRECT FORMAT - Object with url: ${data.images[0].url}`);
          console.log(`   Type: ${data.images[0].type}`);
          console.log(`   Room: ${data.images[0].room}`);
          console.log(`   Name: ${data.images[0].name}`);
        } else if (typeof data.images[0] === 'string') {
          console.log(`   ⚠️  STRING FORMAT - URL: ${data.images[0]}`);
        }
      } else {
        console.log(`   ❌ NO IMAGES OR EMPTY ARRAY`);
      }
      
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error checking recent properties:', error);
  } finally {
    process.exit(0);
  }
}

checkRecentPropertyImages();
