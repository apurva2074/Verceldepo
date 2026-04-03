import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserRole } from "./fetchUserRole";
import { logger } from "./logger";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children, requiredRole }) {
  const [ready, setReady] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only process auth state when auth loading is complete
    if (authLoading) {
      logger.log('🔍 ProtectedRoute - Auth still loading, waiting...');
      return;
    }

    const processAuthState = async () => {
      // Safe user check - only redirect if auth is ready and user is missing
      if (!authUser || !authUser.uid) {
        logger.log('🚨 CRITICAL ERROR ProtectedRoute - No user after auth loaded, redirecting to login');
        logger.log('🚨 CRITICAL ERROR ProtectedRoute - User object:', authUser);
        logger.log('🚨 CRITICAL ERROR ProtectedRoute - UID check:', !authUser?.uid);
        setLoading(false);
        setReady(false);
        navigate("/login");
        return;
      }
      
      logger.log('✅ ProtectedRoute - User authenticated, proceeding with role check');
      
      // If role is required, check user role
      if (requiredRole) {
        try {
          logger.log('🔍 CRITICAL DEBUG ProtectedRoute - Checking role for user:', authUser.uid, 'required role:', requiredRole);
          setLoading(true);
          setError(null);
          
          const role = await fetchUserRole(authUser.uid);
          logger.log('🔍 CRITICAL DEBUG ProtectedRoute - User role from Firestore:', role);
          logger.log('🔍 CRITICAL DEBUG ProtectedRoute - Role fetch successful');
          setUserRole(role);
          
          if (role !== requiredRole) {
            logger.log('🚨 CRITICAL ERROR ProtectedRoute - Role mismatch, redirecting. User role:', role, 'Required:', requiredRole);
            // Redirect based on actual role
            if (role === 'owner') {
              navigate('/owner/dashboard');
            } else if (role === 'tenant') {
              navigate('/dashboard');
            } else {
              logger.log('🚨 CRITICAL ERROR ProtectedRoute - No valid role found, redirecting to role selection');
              // Redirect to role selection instead of login for better UX
              navigate('/role-selection');
            }
            setLoading(false);
            setReady(false);
            return;
          } else {
            logger.log('✅ CRITICAL DEBUG ProtectedRoute - Role match, allowing access');
          }
        } catch (error) {
          logger.error('🚨 CRITICAL ERROR ProtectedRoute - Error fetching user role:', error);
          logger.error('🚨 CRITICAL ERROR ProtectedRoute - Error code:', error.code);
          logger.error('🚨 CRITICAL ERROR ProtectedRoute - Error message:', error.message);
          
          // Handle permission errors specifically - these should have been caught by fetchUserRole fallback
          // If we still get here, it means both Firestore and backend API failed
          if (error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('Missing or insufficient permissions')) {
            logger.error('🚨 CRITICAL ERROR ProtectedRoute - Permission denied after fallback attempts. User may need to complete registration.');
            setError('Unable to verify your account permissions. Please ensure you have completed registration and try logging in again.');
          } else {
            setError(error.message || 'Failed to verify user role');
          }
          
          // Retry logic for network errors only
          if (retryCount < 2 && (error.code === 'unavailable' || error.code === 'deadline-exceeded')) {
            logger.log(`🔍 CRITICAL DEBUG ProtectedRoute - Retrying role fetch (${retryCount + 1}/3)`);
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              // Retry will happen on next render cycle
            }, 1000 * (retryCount + 1)); // Exponential backoff
            return;
          }
          
          // For permission errors, show error UI with helpful message
          // Don't redirect immediately - let user see the error and retry
          setLoading(false);
          setReady(false);
          return;
        }
      }
      
      setLoading(false);
      setReady(true);
      logger.log('✅ CRITICAL DEBUG ProtectedRoute - Access granted, user authenticated and role verified');
    };

    // Process auth state immediately if auth is ready
    processAuthState();
    
  }, [authUser, authLoading, navigate, requiredRole, retryCount]);

  // Show loading UI while checking auth/role
  if (loading || authLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e3e3e3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>Loading...</p>
        {retryCount > 0 && (
          <p style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>
            Retrying... ({retryCount}/3)
          </p>
        )}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show error UI with retry option
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '32px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h3 style={{ color: '#dc3545', marginBottom: '16px' }}>Connection Error</h3>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setError(null);
                setRetryCount(0);
                setLoading(true);
              }}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If role is required, only render when role matches and user exists
  if (requiredRole) {
    return ready && userRole === requiredRole ? children : null;
  }

  // For routes without required role, only render when ready (user exists)
  return ready ? children : null;
}
