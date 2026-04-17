const http = require('http');

// Test the specific step 6 case that's failing
const step6Data = {
  propertyType: 'apartment',
  bedrooms: 4,
  bathrooms: 4,
  squareFootage: 1900,
  furnishing: 'semi-furnished',
  area: 'Mumbai'
  // Missing propertyAge and amenitiesCount
};

function testStep6() {
  const postData = JSON.stringify(step6Data);
  
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
    console.log('Headers:', res.headers);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('Raw Response Body:', body);
      
      try {
        const response = JSON.parse(body);
        console.log('Parsed Response:', response);
        
        if (response.success) {
          console.log('SUCCESS: Step 6 prediction worked!');
        } else {
          console.log('FAILED: Step 6 prediction failed');
          console.log('Error:', response.error);
        }
      } catch (error) {
        console.log('Parse Error:', error.message);
        console.log('This suggests the response is not valid JSON');
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.write(postData);
  req.end();
}

console.log('Testing Step 6 (missing propertyAge and amenitiesCount):');
console.log('Data being sent:', step6Data);
console.log('');

testStep6();
