// Debug authentication and wishlist functionality
console.log('🔍 Debugging Authentication and Wishlist...\n');

// Check if user is logged in
import { auth } from './firebase/auth.js';
import { getAuthToken } from './utils/authToken.js';

async function debugAuth() {
  console.log('1. Checking Firebase Auth current user...');
  const currentUser = auth.currentUser;
  console.log('   - Current user:', currentUser ? {
    uid: currentUser.uid,
    email: currentUser.email,
    emailVerified: currentUser.emailVerified
  } : 'None');

  console.log('\n2. Checking stored token...');
  const storedToken = localStorage.getItem('idToken');
  console.log('   - Token in localStorage:', storedToken ? 'Present' : 'Missing');
  console.log('   - Token length:', storedToken ? storedToken.length : 0);
  console.log('   - Token preview:', storedToken ? storedToken.substring(0, 50) + '...' : 'N/A');

  console.log('\n3. Getting fresh token...');
  try {
    const freshToken = await getAuthToken();
    console.log('   - Fresh token:', freshToken ? 'Success' : 'Failed');
    console.log('   - Fresh token length:', freshToken ? freshToken.length : 0);
    console.log('   - Fresh token preview:', freshToken ? freshToken.substring(0, 50) + '...' : 'N/A');
  } catch (error) {
    console.error('   - Error getting fresh token:', error.message);
  }

  console.log('\n4. Testing wishlist API...');
  try {
    const token = await getAuthToken();
    if (!token) {
      console.log('   - No token available, skipping API test');
      return;
    }

    // Test the wishlist check endpoint
    const response = await fetch('http://localhost:5000/api/wishlist/check/testPropertyId', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   - Response status:', response.status);
    console.log('   - Response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('   - Response body:', responseText);

  } catch (error) {
    console.error('   - API test error:', error.message);
  }
}

// Run debug function
debugAuth();
