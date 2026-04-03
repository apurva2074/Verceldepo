const admin = require('firebase-admin');

// Check if service account key exists
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.log('❌ Service account key not found, trying to use environment variables');
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

async function fixPropertyStatuses() {
  try {
    console.log('🔧 Fixing property statuses in Firestore...');
    
    const propertiesSnapshot = await db.collection('properties').get();
    
    if (propertiesSnapshot.empty) {
      console.log('❌ No properties found in Firestore');
      return;
    }
    
    console.log(`📊 Found ${propertiesSnapshot.size} properties to check:`);
    
    let fixedCount = 0;
    
    for (const doc of propertiesSnapshot.docs) {
      const data = doc.data();
      const currentStatus = data.status || 'NO_STATUS';
      const propertyId = doc.id;
      
      console.log(`\n🏠 Property ID: ${propertyId}`);
      console.log(`   Current Status: '${currentStatus}'`);
      console.log(`   Title: ${data.title || 'No title'}`);
      
      // Fix status values
      if (currentStatus === 'APPROVED' || currentStatus === 'ACTIVE') {
        console.log(`   ✏️  Updating status from '${currentStatus}' to 'approved'`);
        await db.collection('properties').doc(propertyId).update({
          status: 'approved'
        });
        fixedCount++;
        console.log(`   ✅ Status updated successfully`);
      } else if (currentStatus === 'approved') {
        console.log(`   ✅ Status already correct`);
      } else {
        console.log(`   ⚠️  Unknown status: '${currentStatus}' - leaving as is`);
      }
    }
    
    console.log(`\n🎉 Fix complete! Updated ${fixedCount} properties to status 'approved'`);
    
  } catch (error) {
    console.error('❌ Error fixing property statuses:', error);
  } finally {
    process.exit(0);
  }
}

fixPropertyStatuses();
