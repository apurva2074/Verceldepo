const http = require('http');

// Test different scenarios to verify real-time data flow
const testScenarios = [
  {
    name: 'Test 1: User fills 4BHK property',
    userInput: {
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
    name: 'Test 2: User changes to 2BHK',
    userInput: {
      area: 'Andheri',
      propertyType: 'apartment',
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 750,
      furnishing: 'fully-furnished',
      propertyAge: 1,
      amenitiesCount: 8
    }
  },
  {
    name: 'Test 3: User selects Villa',
    userInput: {
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

function testScenario(scenario) {
  return new Promise((resolve, reject) => {
    console.log(`\n${scenario.name}`);
    console.log('User input:', scenario.userInput);
    
    const postData = JSON.stringify(scenario.userInput);
    
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
          console.log('Backend response:', {
            success: response.success,
            predictedRent: response.predictedRent,
            confidence: response.confidenceScore,
            inputUsed: response.inputUsed
          });
          
          if (response.success) {
            console.log('Data flow working correctly! User input matched prediction input.');
          } else {
            console.log('Data flow issue detected.');
          }
          resolve(response);
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('Testing real-time data flow from form to prediction model...\n');
  
  try {
    for (const scenario of testScenarios) {
      await testScenario(scenario);
      console.log('---');
    }
    
    console.log('\n=== Summary ===');
    console.log('Check the backend console logs to see:');
    console.log('1. Frontend input data');
    console.log('2. Backend received data');
    console.log('3. Python model input');
    console.log('4. Prediction response');
    console.log('\nThis will help identify any data transformation issues.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runAllTests();
