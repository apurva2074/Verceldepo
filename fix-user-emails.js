// Fix existing users in Firestore by adding their emails
const admin = require('./backend/src/firebaseAdmin').admin;
const db = admin.firestore();

async function fixUserEmails() {
  console.log('🔧 Fixing User Emails in Firestore...\n');

  try {
    // 1. Get all Firebase Auth users
    console.log('1. Getting Firebase Auth users...');
    const listUsers = await admin.auth().listUsers(50);
    const authUsers = listUsers.users;
    
    console.log(`✅ Found ${authUsers.length} users in Firebase Auth`);

    // 2. Get all Firestore users
    console.log('\n2. Getting Firestore users...');
    const usersSnapshot = await db.collection('users').get();
    const firestoreUsers = [];
    
    usersSnapshot.forEach(doc => {
      firestoreUsers.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Found ${firestoreUsers.length} users in Firestore`);

    // 3. Match and update users
    console.log('\n3. Matching and updating users...');
    let updatedCount = 0;
    let skippedCount = 0;

    for (const firestoreUser of firestoreUsers) {
      // Find matching auth user by UID
      const authUser = authUsers.find(au => au.uid === firestoreUser.uid);
      
      if (authUser && authUser.email && !firestoreUser.email) {
        // Update Firestore user with email
        await db.collection('users').doc(firestoreUser.uid).update({
          email: authUser.email,
          emailVerified: authUser.emailVerified,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Updated ${firestoreUser.name || 'Unknown'} with email: ${authUser.email}`);
        updatedCount++;
      } else if (firestoreUser.email) {
        console.log(`ℹ️  Skipped ${firestoreUser.name || 'Unknown'} - already has email: ${firestoreUser.email}`);
        skippedCount++;
      } else {
        console.log(`⚠️  Could not find email for ${firestoreUser.name || 'Unknown'} (UID: ${firestoreUser.uid})`);
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`   - Updated: ${updatedCount} users`);
    console.log(`   - Skipped: ${skippedCount} users`);
    console.log(`   - Total processed: ${firestoreUsers.length} users`);

    // 4. Verify the updates
    console.log('\n4. Verifying updates...');
    const updatedSnapshot = await db.collection('users').get();
    let usersWithEmail = 0;
    
    updatedSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.email) {
        usersWithEmail++;
        console.log(`✅ ${userData.name || 'Unknown'} (${userData.email}) - Role: ${userData.role}`);
      }
    });
    
    console.log(`\n✅ ${usersWithEmail} users now have emails in Firestore`);

  } catch (error) {
    console.error('❌ Error fixing user emails:', error);
  }
}

// Also fix the manifest icon issue
function fixManifestIcon() {
  console.log('\n🔧 Fixing Manifest Icon Issue...');
  console.log('The manifest icon error is usually caused by:');
  console.log('1. Missing icon files in public folder');
  console.log('2. Incorrect paths in manifest.json');
  console.log('3. Icon files with wrong sizes');
  console.log('');
  console.log('To fix this:');
  console.log('1. Check if logo192.png exists in public folder');
  console.log('2. Check manifest.json for correct icon paths');
  console.log('3. Ensure icon files have correct dimensions (192x192, 512x512)');
}

fixUserEmails().then(() => {
  console.log('\n🎉 User email fix completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Try logging in with the tenant credentials again');
  console.log('2. The login should now work properly');
  console.log('3. Users will be redirected to correct dashboard');
  
  fixManifestIcon();
}).catch((error) => {
  console.error('❌ Fix script failed:', error);
});
