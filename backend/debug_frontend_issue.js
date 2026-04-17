const http = require('http');

// Test different scenarios to identify the frontend issue
const testScenarios = [
  {
    name: 'Test 1: Minimal valid data',
    data: {
      area: 'Andheri',
      propertyType: 'apartment',
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 750,
      furnishing: 'semi-furnished',
      propertyAge: 2,
      amenitiesCount: 5
    }
  },
  {
    name: 'Test 2: Missing propertyAge (should still work)',
    data: {
      area: 'Andheri',
      propertyType: 'apartment',
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 750,
      furnishing: 'semi-furnished'
      // Missing propertyAge and amenitiesCount
    }
  },
  {
    name: 'Test 3: Invalid property type (should fail)',
    data: {
      area: 'Andheri',
      propertyType: 'invalid_type',
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 750,
      furnishing: 'semi-furnished',
      propertyAge: 2,
      amenitiesCount: 5
    }
  },
  {
    name: 'Test 4: Missing required field (should fail)',
    data: {
      area: 'Andheri',
      // Missing propertyType
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 750,
      furnishing: 'semi-furnished',
      propertyAge: 2,
      amenitiesCount: 5
    }
  }
];

function testFrontendScenario(scenario) {
  return new Promise((resolve, reject) => {
    console.log(`\n${scenario.name}`);
    console.log('Data being sent:', JSON.stringify(scenario.data, null, 2));
    
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
      console.log('Status Code:', res.statusCode);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          
          if (response.success) {
            console.log('â SUCCESS: Prediction worked!');
            console.log('  Predicted Rent: Rs.' + response.predictedRent?.toLocaleString('en-IN') + '/month');
            console.log('  Confidence: ' + (response.confidenceScore * 100).toFixed(1) + '%');
          } else {
            console.log('â FAILED: ' + response.error);
            console.log('  This is likely the error you\'re seeing in the frontend');
          }
          
          resolve(response);
        } catch (error) {
          console.log('â PARSE ERROR: ' + error.message);
          console.log('  Raw response:', body);
          resolve({ error: 'parse_error', raw: body });
        }
      });
    });

    req.on('error', (error) => {
      console.log('â REQUEST ERROR: ' + error.message);
      console.log('  Check if Node.js backend is running on port 5000');
      resolve({ error: 'request_error', message: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function debugFrontendIssue() {
  console.log('=== Frontend Issue Debugging ===');
  console.log('Testing different scenarios to identify the exact error...\n');
  
  for (const scenario of testScenarios) {
    await testFrontendScenario(scenario);
    console.log('---');
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== Frontend Troubleshooting Checklist ===');
  console.log('If you\'re still seeing errors in the frontend, check:');
  console.log('1. Browser console (F12) for JavaScript errors');
  console.log('2. Network tab for failed API requests');
  console.log('3. Make sure all required fields are filled:');
  console.log('   - area (location)');
  console.log('   - propertyType (apartment/house/villa/pg)');
  console.log('   - bedrooms (1-5)');
  console.log('   - bathrooms (1-5)');
  console.log('   - squareFootage (300-3000)');
  console.log('   - furnishing (unfurnished/semi-furnished/fully-furnished)');
  console.log('4. Check that both servers are running:');
  console.log('   - Python ML Server: http://localhost:5001');
  console.log('   - Node.js Backend: http://localhost:5000');
}

debugFrontendIssue();
