// Backend script to check user roles
const admin = require('./backend/src/firebaseAdmin').admin;
const db = admin.firestore();

async function checkUserRoles() {
  console.log('🔍 Checking User Roles in Firestore...\n');

  try {
    // Get all users from the users collection
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in Firestore users collection');
      return;
    }

    console.log(`✅ Found ${usersSnapshot.size} users in Firestore:\n`);

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`👤 User ID: ${doc.id}`);
      console.log(`   - Email: ${userData.email || 'N/A'}`);
      console.log(`   - Role: ${userData.role || 'NOT ASSIGNED'}`);
      console.log(`   - Created: ${userData.createdAt?.toDate?.() || 'N/A'}`);
      console.log(`   - Name: ${userData.name || 'N/A'}`);
      console.log('');
    });

    // Check Firebase Auth users
    console.log('🔍 Checking Firebase Auth users...');
    const listUsers = await admin.auth().listUsers(10);
    console.log(`✅ Found ${listUsers.users.length} users in Firebase Auth:`);

    listUsers.users.forEach((user) => {
      console.log(`👤 Auth User - UID: ${user.uid}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Email Verified: ${user.emailVerified}`);
      console.log(`   - Created: ${user.metadata.creationTime}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking user roles:', error);
  }
}

// Run the check
checkUserRoles().then(() => {
  console.log('✅ User role check completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
