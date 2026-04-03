import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firestore";
import { auth } from "../firebase/auth";
import { getAuthToken } from "./authToken";

/**
 * Fetch user role from Firestore or backend API
 * Falls back to backend API if Firestore access is denied
 */
export async function fetchUserRole(uid) {
  try {
    // Try Firestore first
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return data?.role || null;
    }
  } catch (error) {
    // If Firestore access is denied (permission error), try backend API
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      console.log('Firestore permission denied, trying backend API for role...');
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.uid !== uid) {
          return null;
        }

        const token = await getAuthToken();
        if (!token) {
          return null;
        }

        const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const response = await fetch(`${API_BASE}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const profile = await response.json();
          return profile?.role || null;
        }
      } catch (apiError) {
        console.error('Error fetching role from backend API:', apiError);
        // Re-throw the original Firestore error
        throw error;
      }
    } else {
      // Re-throw non-permission errors
      throw error;
    }
  }

  return null;
}
