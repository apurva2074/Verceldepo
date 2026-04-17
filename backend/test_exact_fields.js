const http = require('http');

// Test with exact field names that backend expects
const exactFieldData = {
  area: 'Mumbai',
  propertyType: 'apartment',
  bedrooms: 4,
  bathrooms: 4,
  squareFootage: 1900,
  furnishing: 'semi-furnished',
  propertyAge: 2,
  amenitiesCount: 5
};

function testExactFields() {
  const postData = JSON.stringify(exactFieldData);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/rent-prediction/predict',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('Raw Response:', body);
      
      try {
        const response = JSON.parse(body);
        console.log('Parsed Response:', response);
        
        if (response.success) {
          console.log('SUCCESS: Exact fields work!');
          console.log('Predicted Rent:', response.predictedRent);
        } else {
          console.log('FAILED:', response.error);
        }
      } catch (error) {
        console.log('Parse Error:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  console.log('Testing with exact field names:', exactFieldData);
  req.write(postData);
  req.end();
}

console.log('=== Testing Exact Field Names ===');
testExactFields();
