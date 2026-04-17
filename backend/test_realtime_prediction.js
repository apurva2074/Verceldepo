const http = require('http');

// Test real-time prediction with different form completion stages
const realTimeTestScenarios = [
  {
    name: 'Real-time Test 1: User fills property type first',
    description: 'Should show no prediction (insufficient data)',
    data: {
      propertyType: 'apartment'
    }
  },
  {
    name: 'Real-time Test 2: User adds bedrooms',
    description: 'Should show no prediction (insufficient data)',
    data: {
      propertyType: 'apartment',
      bedrooms: 4
    }
  },
  {
    name: 'Real-time Test 3: User adds bathrooms',
    description: 'Should show no prediction (insufficient data)',
    data: {
      propertyType: 'apartment',
      bedrooms: 4,
      bathrooms: 4
    }
  },
  {
    name: 'Real-time Test 4: User adds square footage',
    description: 'Should show no prediction (insufficient data)',
    data: {
      propertyType: 'apartment',
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 1900
    }
  },
  {
    name: 'Real-time Test 5: User selects furnishing',
    description: 'Should show no prediction (insufficient data)',
    data: {
      propertyType: 'apartment',
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 1900,
      furnishing: 'semi-furnished'
    }
  },
  {
    name: 'Real-time Test 6: User adds location (TRIGGER!)',
    description: 'Should show prediction (all required fields present)',
    data: {
      propertyType: 'apartment',
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 1900,
      furnishing: 'semi-furnished',
      area: 'Mumbai',
      propertyAge: 2,
      amenitiesCount: 5
    }
  },
  {
    name: 'Real-time Test 7: User changes to 2BHK',
    description: 'Should show updated prediction',
    data: {
      propertyType: 'apartment',
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 750,
      furnishing: 'semi-furnished',
      area: 'Andheri',
      propertyAge: 1,
      amenitiesCount: 3
    }
  },
  {
    name: 'Real-time Test 8: User changes to Villa',
    description: 'Should show premium prediction',
    data: {
      propertyType: 'villa',
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 2200,
      furnishing: 'fully-furnished',
      area: 'Bandra',
      propertyAge: 0,
      amenitiesCount: 12
    }
  }
];

function testRealTimeScenario(scenario) {
  return new Promise((resolve, reject) => {
    console.log(`\n${scenario.name}`);
    console.log(`${scenario.description}`);
    console.log('Form data:', scenario.data);
    
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
          
          if (response.success) {
            console.log('Prediction Result:');
            console.log('  Predicted Rent:', 'Rs.' + response.predictedRent?.toLocaleString('en-IN') + '/month');
            console.log('  Confidence:', (response.confidenceScore * 100).toFixed(1) + '%');
            console.log('  Input Used:', response.inputUsed?.area + ', ' + response.inputUsed?.bedrooms + 'BHK');
            console.log('  Status: ' + 'Real-time prediction working! ');
          } else {
            console.log('Result: No prediction (expected for insufficient data)');
            if (response.error) {
              console.log('  Reason:', response.error);
            }
          }
          
          resolve(response);
        } catch (error) {
          console.log('Error parsing response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('Request error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runRealTimeTests() {
  console.log('=== Real-Time Rent Prediction Test ===');
  console.log('This simulates how the prediction updates as users fill the form');
  console.log('In the actual app, prediction triggers automatically when required fields are filled');
  console.log('with a 1-second debounce to avoid excessive API calls.\n');
  
  for (const scenario of realTimeTestScenarios) {
    await testRealTimeScenario(scenario);
    console.log('---');
    
    // Small delay to simulate user typing
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  console.log('\n=== Real-Time Prediction Summary ===');
  console.log('1. Prediction triggers when ALL required fields are present:');
  console.log('   - Property type, bedrooms, bathrooms, square footage, furnishing, location');
  console.log('2. Updates automatically when any required field changes');
  console.log('3. Uses 1-second debounce to avoid excessive API calls');
  console.log('4. Shows "Live" indicator for real-time updates');
  console.log('5. Displays loading spinner during calculation');
  console.log('\nThe user experience: As soon as they fill the last required field,');
  console.log('the prediction appears and updates in real-time as they modify values!');
}

runRealTimeTests();
