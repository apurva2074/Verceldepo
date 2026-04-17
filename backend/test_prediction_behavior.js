const http = require('http');

// Test the improved prediction behavior
const testScenarios = [
  {
    name: 'Test 1: Initial prediction (should work)',
    data: {
      area: 'Mumbai',
      propertyType: 'apartment',
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 1900,
      furnishing: 'semi-furnished',
      propertyAge: 2,
      amenitiesCount: 5
    }
  },
  {
    name: 'Test 2: Change bedrooms (should not auto-predict again)',
    data: {
      area: 'Mumbai',
      propertyType: 'apartment',
      bedrooms: 2,
      bathrooms: 4,
      squareFootage: 1900,
      furnishing: 'semi-furnished',
      propertyAge: 2,
      amenitiesCount: 5
    }
  },
  {
    name: 'Test 3: Change to villa (should not auto-predict again)',
    data: {
      area: 'Bandra',
      propertyType: 'villa',
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 2200,
      furnishing: 'fully-furnished',
      propertyAge: 0,
      amenitiesCount: 12
    }
  }
];

function testPrediction(scenario) {
  return new Promise((resolve, reject) => {
    console.log(`\n${scenario.name}`);
    console.log('Data:', scenario.data);
    
    const postData = JSON.stringify(scenario.data);
    
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
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log('Status:', res.statusCode);
          console.log('Response:', {
            success: response.success,
            predictedRent: response.predictedRent,
            confidence: response.confidenceScore
          });
          resolve(response);
        } catch (error) {
          console.log('Parse Error:', error.message);
          console.log('Raw Response:', body);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('Request Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('=== Testing Improved Prediction Behavior ===');
  console.log('The prediction should:');
  console.log('1. Work once when all required fields are filled');
  console.log('2. NOT auto-predict on every parameter change');
  console.log('3. Allow manual refresh via refresh button');
  console.log('4. Show "prediction failed" only on actual errors\n');
  
  for (const scenario of testScenarios) {
    await testPrediction(scenario);
    console.log('---');
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== Expected Behavior ===');
  console.log('Frontend should now:');
  console.log('- Predict only ONCE when form is initially complete');
  console.log('- NOT send requests on every field change');
  console.log('- Allow users to manually refresh with the ? button');
  console.log('- Reduce server load and prevent "prediction failed" errors');
}

runTests();
