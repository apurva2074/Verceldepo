// Debug properties endpoint issue
const admin = require('./backend/src/firebaseAdmin').admin;
const db = admin.firestore();

async function debugPropertiesEndpoint() {
  console.log('🔍 Debugging Properties Endpoint Issue...\n');

  try {
    // Check if properties collection exists
    console.log('1. Checking properties collection...');
    const propertiesRef = db.collection("properties");
    const snapshot = await propertiesRef.get();
    
    if (snapshot.empty) {
      console.log('❌ No properties found in the collection');
      console.log('💡 This is likely the cause of the 500 error');
      console.log('🔧 Solution: Add some properties to the collection or handle empty case');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} properties in the collection`);
    
    // Check property statuses
    console.log('\n2. Checking property statuses...');
    const statuses = {};
    snapshot.forEach(doc => {
      const property = doc.data();
      const status = property.status || 'NO_STATUS';
      statuses[status] = (statuses[status] || 0) + 1;
    });
    
    console.log('Property statuses:', statuses);
    
    // Check for ACTIVE properties
    const activeProperties = snapshot.docs.filter(doc => 
      doc.data().status === 'ACTIVE'
    );
    
    console.log(`✅ Found ${activeProperties.length} ACTIVE properties`);
    
    // Check property_media collection
    console.log('\n3. Checking property_media collection...');
    const mediaSnapshot = await db.collection("property_media").get();
    
    if (mediaSnapshot.empty) {
      console.log('ℹ️  No media found in property_media collection');
    } else {
      console.log(`✅ Found ${mediaSnapshot.size} media items`);
      
      // Check media distribution
      const mediaByProperty = {};
      mediaSnapshot.forEach(doc => {
        const media = doc.data();
        const propertyId = media.propertyId || 'NO_PROPERTY_ID';
        mediaByProperty[propertyId] = (mediaByProperty[propertyId] || 0) + 1;
      });
      
      console.log('Media distribution by property:', mediaByProperty);
    }
    
    // Test the actual query that's failing
    console.log('\n4. Testing the actual query...');
    try {
      const testQuery = await propertiesRef.where("status", "==", "ACTIVE").get();
      console.log(`✅ Query successful: Found ${testQuery.size} ACTIVE properties`);
      
      // Test media query for first property
      if (testQuery.size > 0) {
        const firstPropertyId = testQuery.docs[0].id;
        const mediaQuery = await db.collection("property_media")
          .where("propertyId", "==", firstPropertyId)
          .where("type", "==", "image")
          .orderBy("createdAt", "asc")
          .get();
        
        console.log(`✅ Media query successful for ${firstPropertyId}: ${mediaQuery.size} images`);
      }
      
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
      console.error('Query error details:', queryError);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Full error:', error);
  }
}

debugPropertiesEndpoint().then(() => {
  console.log('\n🎯 Debug completed');
  console.log('\n💡 Most likely causes:');
  console.log('1. Properties collection is empty');
  console.log('2. No properties have status="ACTIVE"');
  console.log('3. property_media collection has issues');
  console.log('4. Indexing issues in Firestore');
}).catch((error) => {
  console.error('❌ Debug script failed:', error);
});
