const http = require('http');

// Test the rent prediction with the exact user input
const testData = {
  area: 'Mumbai',
  propertyType: 'apartment',
  bedrooms: 4,
  bathrooms: 4,
  squareFootage: 1900,
  furnishing: 'semi-furnished',
  propertyAge: 2,
  amenitiesCount: 5
};

function testPrediction() {
  const postData = JSON.stringify(testData);
  
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
        console.log('\n=== Focus-Based Rent Prediction Test ===');
        console.log('User will see this when they click on rent input:');
        console.log('Property: 4BHK, 4 bathrooms, 1900 sqft, Mumbai');
        console.log('Predicted Rent: Rs.' + response.predictedRent?.toLocaleString('en-IN') + '/month');
        console.log('Confidence: ' + (response.confidenceScore * 100).toFixed(1) + '%');
        console.log('Area used: ' + response.inputUsed?.area);
        console.log('==========================================\n');
        
        if (response.success && response.predictedRent) {
          console.log('Focus-based prediction is working! User will see suggestion when clicking rent input.');
        } else {
          console.log('Prediction failed.');
        }
      } catch (error) {
        console.error('Error parsing response:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.write(postData);
  req.end();
}

console.log('Testing focus-based rent prediction...');
testPrediction();
