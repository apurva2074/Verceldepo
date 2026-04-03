// src/api/auth.js - Authentication API Abstraction
import { auth } from '../firebase/auth';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  reload as firebaseReload
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firestore';

// User profile management
export const authAPI = {
  /**
   * Sign in user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} userType - 'owner' or 'tenant'
   * @returns {Promise<Object>} User data with profile
   */
  signIn: async (email, password, userType = 'owner') => {
    try {
      console.log('🔐 Signing in user:', { email, userType });
      
      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get ID token for backend API calls
      const idToken = await user.getIdToken();
      localStorage.setItem('idToken', idToken);
      
      // Get or create user profile in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userProfile = userDoc.data();
      
      if (!userProfile) {
        console.log('📝 Creating new user profile');
        userProfile = {
          uid: user.uid,
          email: user.email,
          role: userType,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };
        
        await setDoc(doc(db, 'users', user.uid), userProfile);
      } else {
        // Update last login
        await setDoc(doc(db, 'users', user.uid), {
          lastLoginAt: serverTimestamp(),
        }, { merge: true });
      }
      
      // Store user data in localStorage for easy access
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: userProfile.role,
        displayName: userProfile.name || user.displayName,
      }));
      
      console.log('✅ Sign in successful:', { uid: user.uid, role: userProfile.role });
      
      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: userProfile.name || user.displayName,
          role: userProfile.role,
        },
        profile: userProfile,
        token: idToken,
      };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Sign in failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Account has been disabled';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Try again later';
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Register new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User display name
   * @param {string} userType - 'owner' or 'tenant'
   * @param {Object} additionalData - Additional user data
   * @returns {Promise<Object>} User data with profile
   */
  signUp: async (email, password, name, userType = 'owner', additionalData = {}) => {
    try {
      console.log('📝 Registering new user:', { email, name, userType });
      
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, { displayName: name });
      
      // Get ID token
      const idToken = await user.getIdToken();
      localStorage.setItem('idToken', idToken);
      
      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: userType,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        ...additionalData,
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: name,
        role: userType,
      }));
      
      console.log('✅ Registration successful:', { uid: user.uid, role: userType });
      
      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: userType,
        },
        profile: userProfile,
        token: idToken,
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak (minimum 6 characters)';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    try {
      console.log('👋 Signing out user');
      
      await firebaseSignOut(auth);
      
      // Clear localStorage
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
      
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw new Error('Sign out failed');
    }
  },

  /**
   * Send password reset email
   * @param {string} email - User email
   */
  resetPassword: async (email) => {
    try {
      console.log('📧 Sending password reset email:', email);
      
      await sendPasswordResetEmail(auth, email);
      
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Password reset error:', error);
      
      let errorMessage = 'Password reset failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  getCurrentUser: async () => {
    try {
      const user = auth.currentUser;
      if (!user || !user.uid) {
        throw new Error('No user is currently signed in');
      }
      
      // Get fresh user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userProfile = userDoc.data();
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: userProfile.name || user.displayName,
        role: userProfile.role,
        profile: userProfile,
      };
    } catch (error) {
      console.error('❌ Get current user error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: async (updates) => {
    try {
      const user = auth.currentUser;
      if (!user || !user.uid) {
        throw new Error('No user is currently signed in');
      }
      
      console.log('📝 Updating user profile:', updates);
      
      // Update Firebase auth profile if name is provided
      if (updates.name) {
        await updateProfile(user, { displayName: updates.name });
      }
      
      // Update Firestore profile
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('✅ Profile updated successfully');
      
      return updatedUser;
    } catch (error) {
      console.error('❌ Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  },

  /**
   * Listen to auth state changes
   * @param {Function} callback - Callback function for auth state changes
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userProfile = await authAPI.getCurrentUser();
          callback({ user: userProfile, isAuthenticated: true });
        } catch (error) {
          console.error('❌ Auth state change error:', error);
          callback({ user: null, isAuthenticated: false, error });
        }
      } else {
        callback({ user: null, isAuthenticated: false });
      }
    });
  },

  /**
   * Refresh user token
   * @returns {Promise<string>} New ID token
   */
  refreshToken: async () => {
    try {
      const user = auth.currentUser;
      if (!user || !user.uid) {
        throw new Error('No user is currently signed in');
      }
      
      // Force token refresh
      await firebaseReload(user);
      const idToken = await user.getIdToken(true);
      
      // Update localStorage
      localStorage.setItem('idToken', idToken);
      
      console.log('🔄 Token refreshed successfully');
      return idToken;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      throw new Error('Failed to refresh authentication token');
    }
  },
};

export default authAPI;
