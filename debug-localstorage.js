// Debug script to check localStorage contents
console.log('=== LOCALSTORAGE DEBUG ===');
console.log('userRole:', localStorage.getItem('userRole'));
console.log('idToken:', localStorage.getItem('idToken') ? 'Present' : 'Missing');
console.log('All localStorage keys:', Object.keys(localStorage));

// Check if user is authenticated
const token = localStorage.getItem('idToken');
if (token) {
  try {
    // Parse JWT token to get user info
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('User UID from token:', payload.user_id);
    console.log('Token expires at:', new Date(payload.exp * 1000));
  } catch (error) {
    console.error('Error parsing token:', error);
  }
} else {
  console.log('No token found in localStorage');
}

console.log('=== END DEBUG ===');
