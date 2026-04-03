import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/auth';

/**
 * Custom hook to handle Firebase auth state properly and avoid race conditions
 * Returns { user, loading, error }
 * - user: Firebase user object or null
 * - loading: true while auth state is being determined
 * - error: any error that occurred
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('useAuth - Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log('useAuth - Auth state changed:', { 
          user: user?.email, 
          uid: user?.uid, 
          exists: !!user 
        });
        setUser(user);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(error);
        setLoading(false);
        setUser(null);
      }
    );

    return unsubscribe;
  }, []);

  return { user, loading, error };
};
