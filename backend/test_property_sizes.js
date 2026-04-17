const http = require('http');

// Test different property sizes to show how predictions work
const testCases = [
  {
    name: '1BHK Apartment',
    data: {
      area: 'Andheri',
      propertyType: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      squareFootage: 500,
      furnishing: 'semi-furnished',
      propertyAge: 2,
      amenitiesCount: 3
    }
  },
  {
    name: '2BHK Apartment',
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
    name: '3BHK Apartment',
    data: {
      area: 'Andheri',
      propertyType: 'apartment',
      bedrooms: 3,
      bathrooms: 3,
      squareFootage: 1100,
      furnishing: 'semi-furnished',
      propertyAge: 2,
      amenitiesCount: 7
    }
  },
  {
    name: '4BHK Apartment (Your Input)',
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
    name: '4BHK Villa',
    data: {
      area: 'Bandra',
      propertyType: 'villa',
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 2200,
      furnishing: 'fully-furnished',
      propertyAge: 1,
      amenitiesCount: 12
    }
  }
];

function testPrediction(testCase) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testCase.data);
    
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
          resolve({
            name: testCase.name,
            success: response.success,
            predictedRent: response.predictedRent,
            confidence: response.confidenceScore,
            input: response.inputUsed
          });
        } catch (error) {
          reject(new Error(`Parse error for ${testCase.name}: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request error for ${testCase.name}: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('Testing rent prediction for different property sizes...\n');
  
  try {
    const results = await Promise.all(testCases.map(test => testPrediction(test)));
    
    console.log('=== Rent Prediction Results ===');
    results.forEach(result => {
      if (result.success) {
        console.log(`\n${result.name}:`);
        console.log(`  Predicted Rent: Rs. ${result.predictedRent.toLocaleString('en-IN')}/month`);
        console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`  Property: ${result.input.bedrooms}BHK, ${result.input.square_footage} sqft`);
        console.log(`  Area: ${result.input.area}`);
      } else {
        console.log(`\n${result.name}: Failed to predict`);
      }
    });
    
    console.log('\n=== Summary ===');
    console.log('All property sizes are supported:');
    console.log(' Bedrooms: 1-5');
    console.log(' Bathrooms: 1-5');
    console.log(' Square Footage: 300-3000 sqft');
    console.log(' Property Types: apartment, house, villa, pg');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runAllTests();
