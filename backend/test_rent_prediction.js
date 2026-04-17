const http = require('http');

// Test data for rent prediction
const testData = {
  area: 'Andheri',
  propertyType: 'apartment',
  bedrooms: 2,
  bathrooms: 2,
  squareFootage: 750,
  furnishing: 'semi-furnished',
  propertyAge: 2,
  amenitiesCount: 5
};

function testRentPrediction() {
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
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(body);
        console.log('\n=== Rent Prediction Test Results ===');
        console.log('Success:', response.success);
        console.log('Predicted Rent:', `Rs. ${response.predictedRent?.toLocaleString('en-IN')}/month`);
        console.log('Confidence:', `${(response.confidenceScore * 100).toFixed(1)}%`);
        console.log('Property Type:', response.inputUsed?.property_type);
        console.log('Area:', response.inputUsed?.area);
        console.log('BHK:', `${response.inputUsed?.bedrooms}BHK`);
        console.log('Square Footage:', `${response.inputUsed?.square_footage} sqft`);
        console.log('=====================================\n');
        
        if (response.success && response.predictedRent) {
          console.log('Rent prediction service is working correctly! \u2705');
        } else {
          console.log('Rent prediction service has issues. \u274c');
        }
      } catch (error) {
        console.error('Error parsing response:', error.message);
        console.log('Raw response:', body);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
    console.log('Make sure both Node.js backend (port 5000) and Python server (port 5001) are running.');
  });

  req.write(postData);
  req.end();
}

console.log('Testing rent prediction service...');
testRentPrediction();
