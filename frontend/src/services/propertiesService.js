// Frontend service for properties API calls
import { getAuthToken } from '../utils/authToken';
import { db } from "../firebase/firestore";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// API helper with auth
const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const fullUrl = `${API_BASE}/api${endpoint}`;
  console.log(`API Call: ${options.method || 'GET'} ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log(`API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response:`, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'API call failed' };
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`API Success:`, result);
    return result;
  } catch (error) {
    console.error(`API Call Failed:`, {
      url: fullUrl,
      method: options.method || 'GET',
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Create property using Firebase
export const createProperty = async (propertyData, ownerId) => {
  if (!ownerId) throw new Error("Owner not authenticated");

  const payload = {
    ...propertyData,
    owner_uid: ownerId,
    ownerId: ownerId, // important for consistency
    status: "approved", // enforce rule-safe value
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "properties"), payload);

  return docRef.id;
};

// Get property by ID using Firebase
export const getPropertyById = async (propertyId) => {
  try {
    const propertyDoc = await getDoc(doc(db, "properties", propertyId));
    if (!propertyDoc.exists()) {
      throw new Error("Property not found");
    }
    return { id: propertyDoc.id, ...propertyDoc.data() };
  } catch (error) {
    console.error("Get property by ID error:", error);
    throw error;
  }
};

// Get all properties using Firebase
export const getAllProperties = async () => {
  try {
    // First try with ordering, fallback to without ordering if index is missing
    try {
      const propertiesQuery = query(
        collection(db, "properties"),
        where("status", "==", "approved"),
        orderBy("created_at", "desc")
      );
      
      const querySnapshot = await getDocs(propertiesQuery);
      const properties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return properties;
    } catch (indexError) {
      if (indexError.message.includes('requires an index')) {
        console.log('Index not found, fetching without ordering...');
        // Fallback: fetch without ordering, then sort client-side
        const fallbackQuery = query(
          collection(db, "properties"),
          where("status", "==", "approved")
        );
        
        const querySnapshot = await getDocs(fallbackQuery);
        const properties = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort client-side by created_at
        return properties.sort((a, b) => {
          const dateA = a.created_at?.toDate?.() || a.created_at || new Date(0);
          const dateB = b.created_at?.toDate?.() || b.created_at || new Date(0);
          return dateB - dateA;
        });
      }
      throw indexError;
    }
  } catch (error) {
    console.error("Get all properties error:", error);
    throw error;
  }
};

// Get properties by owner using Firebase
export const getPropertiesByOwner = async (ownerId) => {
  try {
    const propertiesQuery = query(
      collection(db, "properties"),
      where("owner_uid", "==", ownerId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(propertiesQuery);
    const properties = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return properties;
  } catch (error) {
    console.error("Get properties by owner error:", error);
    throw error;
  }
};

// Get property by ID (public access)
export const getPropertyByIdPublic = async (propertyId) => {
  try {
    console.log(`Fetching property with ID: ${propertyId}`);
    const url = `/properties/${propertyId}`;
    console.log(`Making API call to: ${API_BASE}/api${url}`);
    
    const result = await apiCall(url);
    console.log(`Successfully fetched property:`, result);
    return result;
  } catch (error) {
    console.error('Get property by ID error:', error);
    console.error(`Failed to fetch property with ID: ${propertyId}`);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      propertyId: propertyId
    });
    // Fail loudly - no mock fallbacks that could cause data corruption
    throw new Error(`Property with ID ${propertyId} not found or unavailable. Please check the property ID and try again.`);
  }
};

// Get property media (public access)
export const getPropertyMedia = async (propertyId) => {
  try {
    return await apiCall(`/properties/${propertyId}/media`);
  } catch (error) {
    console.error('Get property media error:', error);
    throw error;
  }
};
