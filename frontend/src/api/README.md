# Centralized API Layer Documentation

## Structure

```
src/api/
├── base.js          # Base API client with error handling
├── auth.js          # Authentication API abstraction
├── property.js      # Property management API
├── booking.js       # Booking/reservation API
└── index.js         # Central exports
```

## Purpose

The centralized API layer provides:
- **Single source of truth** for all API calls
- **Consistent error handling** across the application
- **Authentication management** with automatic token handling
- **Type safety** and validation
- **Separation of concerns** between UI and data layer

## 🔧 Usage Examples

### Import APIs

```javascript
// Import individual APIs
import { authAPI, propertyAPI, bookingAPI } from '../api';

// Or import all APIs
import api from '../api';
const { auth, property, booking } = api;
```

### Authentication

```javascript
// Sign in
try {
  const result = await authAPI.signIn(email, password, 'owner');
  console.log('User signed in:', result.user);
} catch (error) {
  console.error('Sign in failed:', error.message);
}

// Sign up
const result = await authAPI.signUp(email, password, name, 'tenant');

// Get current user
const user = await authAPI.getCurrentUser();

// Sign out
await authAPI.signOut();
```

### Property Management

```javascript
// Get all properties
const properties = await propertyAPI.getAllProperties();

// Get specific property
const property = await propertyAPI.getPropertyById('property123');

// Add new property (owner only)
const newProperty = await propertyAPI.addProperty({
  title: 'Beautiful Apartment',
  address: { line: '123 Main St', city: 'Mumbai' },
  type: 'apartment',
  rent: 15000
});

// Update property
await propertyAPI.updateProperty('property123', { rent: 16000 });

// Delete property
await propertyAPI.deleteProperty('property123');
```

### Booking & Rentals

```javascript
// Create rental request (tenant)
const request = await bookingAPI.createRentalRequest('property123', {
  paymentMethod: 'online',
  rentAmount: 15000
});

// Approve rental request (owner)
await bookingAPI.approveRentalRequest('property123', 'request456', {
  rentStartDate: '2024-02-01'
});

// Get user's rental requests
const myRequests = await bookingAPI.getUserRentalRequests();

// Create payment session
const paymentSession = await bookingAPI.createPaymentSession({
  propertyId: 'property123',
  tenantId: 'user789',
  amount: 15000
});
```

## Error Handling

The API layer provides consistent error handling:

```javascript
try {
  const result = await propertyAPI.getPropertyById('invalid-id');
} catch (error) {
  // Enhanced error object with:
  console.log(error.message);     // Human-readable error
  console.log(error.status);      // HTTP status code
  console.log(error.code);        // Error code from backend
  console.log(error.url);         // Failed endpoint
  console.log(error.method);      // HTTP method
  console.log(error.duration);    // Request duration in ms
}
```

## 🔐 Authentication

The API layer automatically handles authentication:

- **Token Management**: Automatically adds `Authorization: Bearer <token>` headers
- **Token Refresh**: Handles expired tokens automatically
- **Auth State**: Redirects to login on 401 errors
- **Local Storage**: Manages token and user data in localStorage

## Features

### Base API Client (`base.js`)
- Axios instance with default configuration
- Request/response interceptors
- Automatic authentication headers
- Comprehensive error handling
- Request logging and timing
- Network error handling

### Auth API (`auth.js`)
- Firebase authentication wrapper
- User profile management
- Token management
- Password reset
- Auth state listeners

### Property API (`property.js`)
- CRUD operations for properties
- Media upload handling
- Search and filtering
- Analytics tracking
- Owner-specific operations

### Booking API (`booking.js`)
- Rental request management
- Payment processing
- Document submission
- Agreement management
- Role-based access control

## Migration Guide

### Before (Direct Firebase/Backend Calls)

```javascript
// Old way - Direct Firebase import
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/auth';

await signInWithEmailAndPassword(auth, email, password);

// Old way - Direct fetch
const response = await fetch('/api/properties', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### After (Centralized API Layer)

```javascript
// New way - Centralized API
import { authAPI, propertyAPI } from '../api';

await authAPI.signIn(email, password, 'owner');
const properties = await propertyAPI.getAllProperties();
```

## 🧪 Testing

The API layer is designed to be testable:

```javascript
// Mock API for testing
jest.mock('../api', () => ({
  authAPI: {
    signIn: jest.fn(),
    signUp: jest.fn(),
  },
  propertyAPI: {
    getAllProperties: jest.fn(),
    getPropertyById: jest.fn(),
  }
}));
```

## Best Practices

### DO:
- Use the centralized API layer for all data operations
- Handle errors with try/catch blocks
- Check user roles before calling protected endpoints
- Use proper loading states during API calls

### DON'T:
- Make direct Firebase calls from components
- Hardcode API URLs
- Ignore error handling
- Store sensitive data in frontend state

## Debugging

The API layer includes comprehensive logging:

```javascript
// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('API Request: GET /properties');
  console.log('API Response: 200 (150ms)');
  console.log('API Error: 404 (200ms) - /properties/invalid');
}
```

## Performance

- **Request Caching**: Consider implementing caching for frequently accessed data
- **Request Debouncing**: Use debouncing for search/filter operations
- **Lazy Loading**: Load data only when needed
- **Error Boundaries**: Wrap API calls in error boundaries

---

**Result**: Clean, maintainable, and consistent API layer that separates concerns and improves code quality!
