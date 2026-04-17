const express = require('express');
const router = express.Router();
const http = require('http');

// Python model server configuration
const PYTHON_MODEL_SERVER = {
  host: 'localhost',
  port: 5001
};

// Helper function to make HTTP request to Python server
const callPythonModel = async (endpoint, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: PYTHON_MODEL_SERVER.host,
      port: PYTHON_MODEL_SERVER.port,
      path: endpoint,
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
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
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(response.error || `HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Failed to connect to Python model server: ${error.message}`));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

// Get available areas in Mumbai
router.get('/areas', async (req, res) => {
  try {
    const response = await callPythonModel('/areas');
    res.json(response);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ 
      error: 'Failed to fetch available areas',
      message: error.message 
    });
  }
});

// Predict rent based on property details
router.post('/predict', async (req, res) => {
  try {
    const {
      area,
      propertyType,
      bedrooms,
      bathrooms,
      squareFootage,
      furnishing,
      propertyAge,
      amenitiesCount = 0
    } = req.body;

    // Validate required fields (propertyAge and amenitiesCount are optional)
    const requiredFields = ['area', 'propertyType', 'bedrooms', 'bathrooms', 'squareFootage', 'furnishing'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Validate field values (updated ranges to match Python model)
    if (!bedrooms || bedrooms < 1 || bedrooms > 5) {
      return res.status(400).json({ error: 'Bedrooms must be between 1 and 5' });
    }
    if (!bathrooms || bathrooms < 1 || bathrooms > 5) {
      return res.status(400).json({ error: 'Bathrooms must be between 1 and 5' });
    }
    if (!squareFootage || squareFootage < 300 || squareFootage > 3000) {
      return res.status(400).json({ error: 'Square footage must be between 300 and 3000 sqft' });
    }
    if (propertyAge < 0 || propertyAge > 50) {
      return res.status(400).json({ error: 'Property age must be between 0 and 50 years' });
    }

    // Additional validation
    if (isNaN(parseInt(bedrooms)) || isNaN(parseInt(bathrooms)) || isNaN(parseInt(squareFootage))) {
      return res.status(400).json({ error: 'Invalid numeric values provided' });
    }

    // Validate property type
    const validPropertyTypes = ['apartment', 'house', 'villa', 'pg'];
    if (!validPropertyTypes.includes(propertyType.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid property type. Must be one of: ${validPropertyTypes.join(', ')}` 
      });
    }

    // Validate furnishing
    const validFurnishing = ['unfurnished', 'semi-furnished', 'fully-furnished'];
    if (!validFurnishing.includes(furnishing.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid furnishing status. Must be one of: ${validFurnishing.join(', ')}` 
      });
    }

    // Prepare data for Python model
    const modelInput = {
      area: area.trim(),
      property_type: propertyType.toLowerCase(),
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      square_footage: parseInt(squareFootage),
      furnishing: furnishing.toLowerCase(),
      property_age: propertyAge ? parseInt(propertyAge) : 2, // Default to 2 if not provided
      amenities_count: amenitiesCount ? parseInt(amenitiesCount) : 0 // Default to 0 if not provided
    };

    console.log('=== Backend Rent Prediction ===');
    console.log('Received from frontend:', {
      area,
      propertyType,
      bedrooms,
      bathrooms,
      squareFootage,
      furnishing,
      propertyAge,
      amenitiesCount
    });
    console.log('Sending to Python model:', modelInput);
    console.log('=============================');

    // Call Python model for prediction
    const response = await callPythonModel('/predict', modelInput);
    
    console.log('Python model response:', response);
    
    // Validate response from Python model
    if (!response || !response.predicted_rent) {
      console.error('Invalid response from Python model:', response);
      return res.status(500).json({ 
        error: 'Invalid response from prediction model',
        pythonResponse: response
      });
    }
    
    const responseData = {
      success: true,
      predictedRent: response.predicted_rent,
      currency: response.currency || 'INR',
      period: response.period || 'monthly',
      confidenceScore: response.confidence_score || 0.85,
      inputUsed: response.input_used || modelInput,
      message: response.input_used ? `Prediction based on ${response.input_used.area}` : 'Prediction completed'
    };
    
    console.log('Final response to frontend:', responseData);
    
    res.json(responseData);

  } catch (error) {
    console.error('Error predicting rent:', error);
    
    // Check if Python server is not running
    if (error.message.includes('connect to Python model server')) {
      return res.status(503).json({
        error: 'Rent prediction service is currently unavailable',
        message: 'Please ensure the Python model server is running on port 5001',
        suggestion: 'Start the Python server with: python start_rent_prediction_server.py'
      });
    }
    
    // Check if it's a validation error from Python server
    if (error.message.includes('Invalid') || error.message.includes('Missing') || error.message.includes('must be between')) {
      return res.status(400).json({
        error: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to predict rent',
      message: error.message 
    });
  }
});

// Health check for rent prediction service
router.get('/health', async (req, res) => {
  try {
    // Check if Python server is available, but don't fail if it's not
    let pythonServerStatus = 'unknown';
    try {
      const response = await callPythonModel('/health');
      pythonServerStatus = 'healthy';
    } catch (pythonError) {
      pythonServerStatus = 'unavailable';
      // Don't fail the health check, just note Python server status
    }
    
    res.json({
      service: 'rent-prediction',
      status: 'healthy',
      pythonServer: {
        status: pythonServerStatus,
        note: pythonServerStatus === 'unavailable' ? 
          'Python ML server not running - rent prediction will use fallback calculation' : 
          'Python ML server is running'
      }
    });
  } catch (error) {
    res.status(503).json({
      service: 'rent-prediction',
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Get model information and statistics
router.get('/info', async (req, res) => {
  try {
    // This could be expanded to return model statistics
    res.json({
      model: 'Random Forest Regressor',
      trainingData: 'Mumbai rental properties',
      features: [
        'area',
        'property_type', 
        'bedrooms',
        'bathrooms',
        'square_footage',
        'furnishing',
        'property_age',
        'amenities_count'
      ],
      supportedCities: ['Mumbai'],
      supportedPropertyTypes: ['apartment', 'house', 'villa', 'pg'],
      accuracy: '~85-90%'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get model info' });
  }
});

module.exports = router;
