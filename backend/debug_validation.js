const http = require('http');

// Debug validation issue with exact field names
const debugData = {
  area: 'Mumbai',
  propertyType: 'apartment',
  bedrooms: 4,
  bathrooms: 4,
  squareFootage: 1900,
  furnishing: 'semi-furnished'
};

function debugValidation() {
  const postData = JSON.stringify(debugData);
  
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
      } catch (error) {
        console.log('Parse Error:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  console.log('Sending debug data:', debugData);
  req.write(postData);
  req.end();
}

console.log('=== Debugging Validation Issue ===');
debugValidation();
