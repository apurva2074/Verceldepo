// Professional authentication utilities
import { auth } from '../firebase/auth';
import { getAuthToken } from './authToken';

/**
 * Get current authenticated user with role verification
 * @returns {Promise<{user: any, role: string|null, profile: any|null}>}
 */
export const getCurrentUserWithRole = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { user: null, role: null, profile: null };
    }

    const token = await getAuthToken();
    if (!token) {
      return { user: currentUser, role: null, profile: null };
    }

    // Get user profile from backend
    const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { user: currentUser, role: null, profile: null };
      }
      throw new Error('Failed to fetch user profile');
    }

    const profile = await response.json();
    const role = profile.role;

    // Store role in localStorage for UI components
    if (role) {
      localStorage.setItem('userRole', role);
    }

    return { user: currentUser, role, profile };
  } catch (error) {
    console.error('Error getting user with role:', error);
    return { user: auth.currentUser, role: null, profile: null };
  }
};

/**
 * Check if current user has specific role
 * @param {string} requiredRole - 'owner' | 'tenant'
 * @returns {Promise<boolean>}
 */
export const hasRole = async (requiredRole) => {
  const { role } = await getCurrentUserWithRole();
  return role === requiredRole;
};

/**
 * Check if current user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!auth.currentUser && !!localStorage.getItem('idToken');
};

/**
 * Professional login with role verification
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{success: boolean, user: any, role: string, error?: string}>}
 */
export const professionalLogin = async (email, password) => {
  try {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    const token = await userCredential.user.getIdToken(true);
    localStorage.setItem('idToken', token);
    
    // Verify role from backend
    const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Profile not found. Please complete your registration.');
      }
      const errorText = await response.text();
      console.error('Profile endpoint error:', errorText);
      throw new Error('Profile verification failed. Please try again.');
    }
    
    const profile = await response.json();
    const role = profile.role;
    
    if (!role) {
      throw new Error('User role not assigned. Please contact support.');
    }
    
    localStorage.setItem('userRole', role);
    
    return {
      success: true,
      user: userCredential.user,
      role,
      profile
    };
  } catch (error) {
    // Clean up on failure
    localStorage.removeItem('idToken');
    localStorage.removeItem('userRole');
    
    // Better error messages
    if (error.code === 'auth/user-not-found') {
      return {
        success: false,
        user: null,
        role: null,
        error: 'No account found with this email. Please check your email or sign up.'
      };
    } else if (error.code === 'auth/wrong-password') {
      return {
        success: false,
        user: null,
        role: null,
        error: 'Incorrect password. Please try again.'
      };
    } else if (error.code === 'auth/invalid-email') {
      return {
        success: false,
        user: null,
        role: null,
        error: 'Invalid email format. Please enter a valid email address.'
      };
    } else if (error.message.includes('Profile not found')) {
      return {
        success: false,
        user: null,
        role: null,
        error: error.message
      };
    }
    
    return {
      success: false,
      user: null,
      role: null,
      error: error.message || 'Login failed. Please try again.'
    };
  }
};

/**
 * Professional logout with cleanup
 */
export const professionalLogout = async () => {
  try {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  } catch (error) {
    console.error('Firebase signout error:', error);
  }
  
  // Clean up local storage
  localStorage.removeItem('idToken');
  localStorage.removeItem('userRole');
};

/**
 * Role-based route protection
 * @param {string} requiredRole 
 * @returns {Promise<{authorized: boolean, user: any, role: string|null}>}
 */
export const authorizeRoute = async (requiredRole) => {
  const { user, role } = await getCurrentUserWithRole();
  
  if (!user) {
    return { authorized: false, user: null, role: null };
  }
  
  if (!role) {
    return { authorized: false, user, role: null };
  }
  
  if (role !== requiredRole) {
    return { authorized: false, user, role };
  }
  
  return { authorized: true, user, role };
};
