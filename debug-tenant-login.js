// Debug tenant login issue
const admin = require('./backend/src/firebaseAdmin').admin;
const db = admin.firestore();

async function debugTenantLogin() {
  console.log('🔍 Debugging Tenant Login Issue...\n');

  try {
    // 1. Check if user exists in Firebase Auth
    console.log('1. Checking Firebase Auth users...');
    const listUsers = await admin.auth().listUsers(20);
    const authUsers = listUsers.users.filter(user => user.email);
    
    console.log(`✅ Found ${authUsers.length} users with emails in Firebase Auth:`);
    authUsers.forEach(user => {
      console.log(`   - ${user.email} (UID: ${user.uid}, Verified: ${user.emailVerified})`);
    });

    // 2. Check Firestore user profiles
    console.log('\n2. Checking Firestore user profiles...');
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in Firestore users collection');
      return;
    }
    
    console.log(`✅ Found ${usersSnapshot.size} users in Firestore:`);
    const firestoreUsers = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      firestoreUsers.push({
        uid: doc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        created_at: userData.created_at
      });
      console.log(`   - ${userData.name} (${userData.email || 'No email'}) - Role: ${userData.role || 'NOT ASSIGNED'}`);
    });

    // 3. Find tenant users specifically
    console.log('\n3. Finding tenant users...');
    const tenants = firestoreUsers.filter(user => user.role === 'tenant');
    console.log(`✅ Found ${tenants.length} tenant users:`);
    tenants.forEach(tenant => {
      console.log(`   - ${tenant.name} (${tenant.email})`);
    });

    // 4. Check for mismatched users (Auth vs Firestore)
    console.log('\n4. Checking for user mismatches...');
    const authEmails = new Set(authUsers.map(u => u.email));
    const firestoreEmails = new Set(firestoreUsers.map(u => u.email).filter(e => e));
    
    const authOnly = [...authEmails].filter(email => !firestoreEmails.has(email));
    const firestoreOnly = [...firestoreEmails].filter(email => !authEmails.has(email));
    
    if (authOnly.length > 0) {
      console.log(`⚠️  Users in Auth but not in Firestore: ${authOnly.join(', ')}`);
    }
    
    if (firestoreOnly.length > 0) {
      console.log(`⚠️  Users in Firestore but not in Auth: ${firestoreOnly.join(', ')}`);
    }

    // 5. Test backend API
    console.log('\n5. Testing backend API...');
    try {
      const response = await fetch('http://localhost:5000/api/users/test');
      if (response.ok) {
        console.log('✅ Backend API is reachable');
      } else {
        console.log('❌ Backend API returned error:', response.status);
      }
    } catch (error) {
      console.log('❌ Backend API not reachable:', error.message);
    }

    // 6. Test profile endpoint with a sample tenant
    if (tenants.length > 0) {
      console.log('\n6. Testing profile endpoint for a tenant...');
      const sampleTenant = tenants[0];
      
      try {
        // Get the Firebase Auth user to get a token
        const authUser = authUsers.find(u => u.email === sampleTenant.email);
        if (authUser) {
          const token = await authUser.getIdToken(true);
          
          const response = await fetch('http://localhost:5000/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const profile = await response.json();
            console.log(`✅ Profile endpoint works for ${sampleTenant.email}:`);
            console.log(`   - Name: ${profile.name}`);
            console.log(`   - Role: ${profile.role}`);
            console.log(`   - Email: ${profile.email}`);
          } else {
            console.log(`❌ Profile endpoint failed for ${sampleTenant.email}:`, response.status);
            const errorText = await response.text();
            console.log(`   - Error: ${errorText}`);
          }
        } else {
          console.log(`❌ Could not find Auth user for ${sampleTenant.email}`);
        }
      } catch (error) {
        console.log(`❌ Error testing profile endpoint: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugTenantLogin().then(() => {
  console.log('\n🎯 Debug completed');
  console.log('\n💡 Possible Issues:');
  console.log('1. User exists in Firestore but not in Firebase Auth');
  console.log('2. Backend API is not running');
  console.log('3. Profile endpoint has an error');
  console.log('4. User email is not stored in Firestore');
  console.log('5. Token generation is failing');
}).catch((error) => {
  console.error('❌ Debug script failed:', error);
});
