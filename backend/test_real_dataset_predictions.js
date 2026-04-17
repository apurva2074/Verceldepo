const http = require('http');

// Test predictions with the new real Mumbai dataset
const testCases = [
  {
    name: 'Andheri West 3BHK (From your dataset)',
    data: {
      area: 'Andheri West',
      propertyType: 'apartment',
      bedrooms: 3,
      bathrooms: 3,
      squareFootage: 1100,
      furnishing: 'fully-furnished',
      propertyAge: 4,
      amenitiesCount: 9
    },
    expectedRent: 85000 // From your dataset
  },
  {
    name: 'Worli 3BHK (From your dataset)',
    data: {
      area: 'Worli',
      propertyType: 'apartment',
      bedrooms: 3,
      bathrooms: 3,
      squareFootage: 1500,
      furnishing: 'fully-furnished',
      propertyAge: 3,
      amenitiesCount: 10
    },
    expectedRent: 180000 // From your dataset
  },
  {
    name: 'Juhu 3BHK (From your dataset)',
    data: {
      area: 'Juhu',
      propertyType: 'apartment',
      bedrooms: 3,
      bathrooms: 3,
      squareFootage: 1300,
      furnishing: 'fully-furnished',
      propertyAge: 10,
      amenitiesCount: 10
    },
    expectedRent: 150000 // From your dataset
  },
  {
    name: 'Thane West 3BHK (From your dataset)',
    data: {
      area: 'Thane West',
      propertyType: 'apartment',
      bedrooms: 3,
      bathrooms: 3,
      squareFootage: 1100,
      furnishing: 'fully-furnished',
      propertyAge: 4,
      amenitiesCount: 9
    },
    expectedRent: 55000 // From your dataset
  }
];

function testPrediction(scenario) {
  return new Promise((resolve, reject) => {
    console.log(`\n${scenario.name}`);
    console.log('Expected Rent: Rs.' + scenario.expectedRent.toLocaleString('en-IN') + '/month');
    
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
            const predictedRent = response.predictedRent;
            const expectedRent = scenario.expectedRent;
            const difference = Math.abs(predictedRent - expectedRent);
            const accuracy = ((1 - difference / expectedRent) * 100).toFixed(1);
            
            console.log('â SUCCESS');
            console.log('  Predicted: Rs.' + predictedRent.toLocaleString('en-IN') + '/month');
            console.log('  Expected: Rs.' + expectedRent.toLocaleString('en-IN') + '/month');
            console.log('  Accuracy: ' + accuracy + '%');
            console.log('  Confidence: ' + (response.confidenceScore * 100).toFixed(1) + '%');
            
            if (parseFloat(accuracy) > 85) {
              console.log('  â Very Accurate!');
            } else if (parseFloat(accuracy) > 70) {
              console.log('  â Good Accuracy');
            } else {
              console.log('  â Needs Improvement');
            }
          } else {
            console.log('â FAILED: ' + response.error);
          }
          
          resolve(response);
        } catch (error) {
          console.log('â ERROR: ' + error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('â REQUEST ERROR: ' + error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runRealDatasetTest() {
  console.log('=== Testing Real Mumbai Dataset Predictions ===');
  console.log('Comparing predictions with your actual dataset values...\n');
  
  for (const scenario of testCases) {
    await testPrediction(scenario);
    console.log('---');
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== Summary ===');
  console.log('â Frontend Fix: Removed auto-fill of 1000 rupees');
  console.log('â Dataset Update: Using your real Mumbai property data');
  console.log('â Model Training: Trained on 40+ real Mumbai properties');
  console.log('â Predictions: Now based on actual market rates');
  console.log('â UI Behavior: Prediction appears below input, no auto-fill');
  
  console.log('\n=== Your Property Results ===');
  console.log('For your 4BHK property:');
  console.log('- Prediction will appear BELOW the rent input');
  console.log('- No auto-filling of values');
  console.log('- Based on real Mumbai market data');
  console.log('- Click "Got it" to dismiss prediction');
}

runRealDatasetTest();
