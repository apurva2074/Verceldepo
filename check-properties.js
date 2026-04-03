const admin = require('firebase-admin');
const serviceAccount = require('./backend/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkPropertyStatuses() {
  try {
    const snapshot = await db.collection('properties').get();
    console.log('Total properties:', snapshot.size);
    
    const statuses = {};
    snapshot.forEach(doc => {
      const status = doc.data().status;
      statuses[status] = (statuses[status] || 0) + 1;
      console.log(`Property ${doc.id}: status='${status}'`);
    });
    
    console.log('\nStatus summary:');
    Object.entries(statuses).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} properties`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkPropertyStatuses();
