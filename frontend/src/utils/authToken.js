// Shared authentication token helper
import { auth } from '../firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

// Wait for Firebase Auth to finish initialising, then get token
export const getAuthToken = () => {
  console.log('getAuthToken: Starting, auth.currentUser:', auth.currentUser);
  return new Promise((resolve) => {
    // If already signed in, get fresh token immediately
    if (auth.currentUser) {
      console.log('getAuthToken: User exists, getting fresh token');
      auth.currentUser.getIdToken(true)
        .then(token => {
          console.log('getAuthToken: Fresh token received, length:', token.length);
          localStorage.setItem('idToken', token);
          resolve(token);
        })
        .catch((error) => {
          console.log('getAuthToken: Token refresh failed:', error);
          resolve(null); // Don't fall back to stale token on error
        });
      return;
    }

    console.log('getAuthToken: No current user, waiting for auth state change');
    // Wait up to 3 seconds for auth to initialise
    const timeout = setTimeout(() => {
      console.log('getAuthToken: Timeout reached, resolving null');
      unsubscribe();
      resolve(null); // Don't fall back to potentially stale token
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('getAuthToken: Auth state changed, user:', user?.uid);
      clearTimeout(timeout);
      unsubscribe();
      if (user) {
        user.getIdToken(true)
          .then(token => {
            console.log('getAuthToken: Token from auth change, length:', token.length);
            localStorage.setItem('idToken', token);
            resolve(token);
          })
          .catch((error) => {
            console.log('getAuthToken: Token from auth change failed:', error);
            resolve(null); // Don't fall back to stale token on error
          });
      } else {
        console.log('getAuthToken: No user from auth change, resolving null');
        resolve(null); // Not logged in — return null, not stale token
      }
    });
  });
};

/**
 * Get authentication token synchronously from localStorage
 * @returns {string|null} The stored ID token or null if not found
 */
export const getAuthTokenSync = () => {
  return localStorage.getItem('idToken');
};

/**
 * Clear stored authentication token
 */
export const clearAuthToken = () => {
  localStorage.removeItem('idToken');
  console.log("AUTH TOKEN - Token cleared from localStorage");
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('idToken') && !!auth.currentUser;
};
