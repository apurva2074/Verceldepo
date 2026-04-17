const http = require('http');

// Simulate how a user fills the form step by step
const userFormFillingSequence = [
  {
    step: 'Step 1: User selects property type',
    data: {
      propertyType: 'apartment',
      // Other fields empty initially
    }
  },
  {
    step: 'Step 2: User fills bedrooms',
    data: {
      propertyType: 'apartment',
      bedrooms: 4
    }
  },
  {
    step: 'Step 3: User fills bathrooms',
    data: {
      propertyType: 'apartment',
      bedrooms: 4,
      bathrooms: 4
    }
  },
  {
    step: 'Step 4: User fills square footage',
    data: {
      propertyType: 'apartment',
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 1900
    }
  },
  {
    step: 'Step 5: User selects furnishing',
    data: {
      propertyType: 'apartment',
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 1900,
      furnishing: 'semi-furnished'
    }
  },
  {
    step: 'Step 6: User fills location',
    data: {
      propertyType: 'apartment',
      bedrooms: 4,
      bathrooms: 4,
      squareFootage: 1900,
      furnishing: 'semi-furnished',
      area: 'Mumbai'
    }
  },
  {
    step: 'Step 7: User fills remaining details',
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
  }
];

function testStep(stepInfo) {
  return new Promise((resolve, reject) => {
    console.log(`\n${stepInfo.step}`);
    console.log('Form data:', stepInfo.data);
    
    // Check if we have enough data for prediction
    const hasRequiredFields = stepInfo.data.propertyType && 
                             stepInfo.data.bedrooms && 
                             stepInfo.data.bathrooms && 
                             stepInfo.data.squareFootage && 
                             stepInfo.data.furnishing && 
                             stepInfo.data.area;
    
    if (!hasRequiredFields) {
      console.log('Not enough data for prediction yet');
      resolve({ canPredict: false, reason: 'Missing required fields' });
      return;
    }

    const postData = JSON.stringify(stepInfo.data);
    
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
          console.log('Prediction result:', {
            success: response.success,
            predictedRent: response.predictedRent,
            confidence: response.confidenceScore
          });
          resolve({ canPredict: true, result: response });
        } catch (error) {
          console.log('Error parsing response:', error.message);
          resolve({ canPredict: false, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log('Request error:', error.message);
      resolve({ canPredict: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function simulateUserFilling() {
  console.log('=== Simulating User Form Filling in Real-Time ===');
  console.log('This shows exactly how data flows as user fills the form\n');
  
  for (const step of userFormFillingSequence) {
    await testStep(step);
    console.log('---');
    
    // Small delay to simulate user thinking time
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== Summary ===');
  console.log('This simulation shows:');
  console.log('1. When user has insufficient data -> No prediction');
  console.log('2. When user has all required data -> Prediction appears');
  console.log('3. Real-time data flow from form to prediction model');
  console.log('\nThe prediction should trigger when user clicks the rent input field');
  console.log('and all required fields are filled.');
}

simulateUserFilling();
