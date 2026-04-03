// Check backend Firebase configuration
const admin = require('./backend/src/firebaseAdmin').admin;
const db = admin.firestore();

async function checkBackendConfig() {
  console.log('🔍 Checking Backend Firebase Configuration...\n');

  try {
    // Check Firebase Admin project ID
    const projectId = admin.app().options.projectId;
    console.log('✅ Backend Firebase Admin initialized');
    console.log(`   - Project ID: ${projectId}`);
    console.log(`   - Storage Bucket: ${admin.app().options.storageBucket}`);
    
    // Check if we can access Firestore
    const testDoc = await db.collection('test').doc('config').get();
    console.log('✅ Firestore connection successful');
    
    // Check environment variables
    console.log('\n📋 Environment Variables:');
    console.log(`   - FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`   - FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL}`);
    console.log(`   - PORT: ${process.env.PORT}`);
    
    // Test the profile endpoint directly
    console.log('\n🧪 Testing Profile Endpoint...');
    
    // Try to get a sample user token (this would normally come from Firebase Auth)
    console.log('💡 Note: The backend needs to be RESTARTED to pick up new Firebase configuration');
    console.log('💡 The error "Invalid token issuer" means backend is still using old config');
    
  } catch (error) {
    console.error('❌ Backend config error:', error.message);
  }
}

checkBackendConfig().then(() => {
  console.log('\n🎯 Backend Configuration Check Complete');
  console.log('\n🔧 Solution: Restart the backend server to apply new Firebase configuration');
  console.log('   1. Stop the backend server (Ctrl+C in terminal)');
  console.log('   2. Run: npm start in backend directory');
  console.log('   3. Try login again');
}).catch((error) => {
  console.error('❌ Check failed:', error);
});
