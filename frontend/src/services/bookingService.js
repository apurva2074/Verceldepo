// Frontend service for booking operations
import { getAuthToken } from '../utils/authToken';

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

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Booking API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        method: options.method || 'GET',
        headers: headers,
        body: errorText
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'API call failed' };
      }
      
      console.error('Booking API Parsed Error:', errorData);
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Booking API Call Failed:`, {
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

// Create new booking with pending_payment status
export const createBooking = async (bookingData) => {
  try {
    const result = await apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
    return result;
  } catch (error) {
    console.error('Create booking error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      bookingData: bookingData
    });
    throw new Error(`Failed to create booking: ${error.message}`);
  }
};

// Get booking by ID
export const getBookingById = async (bookingId) => {
  try {
    return await apiCall(`/bookings/${bookingId}`);
  } catch (error) {
    console.error('Get booking error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      bookingId: bookingId
    });
    throw error;
  }
};

// Update booking status
export const updateBookingStatus = async (bookingId, status) => {
  try {
    return await apiCall(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    console.error('Update booking status error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      bookingId: bookingId,
      status: status
    });
    throw error;
  }
};

// Get tenant's bookings
export const getTenantBookings = async (tenantId) => {
  try {
    return await apiCall(`/bookings/tenant/${tenantId}`);
  } catch (error) {
    console.error('Get tenant bookings error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      tenantId: tenantId
    });
    throw error;
  }
};

// Get owner's bookings
export const getOwnerBookings = async (ownerId) => {
  try {
    return await apiCall(`/bookings/owner/${ownerId}`);
  } catch (error) {
    console.error('Get owner bookings error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      ownerId: ownerId
    });
    throw error;
  }
};
