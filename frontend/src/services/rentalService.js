// Professional Rental Service
// Handles all rental-related API calls

import { getAuthToken } from '../utils/authToken';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// Helper function for authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rental API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: `${API_BASE}/api${endpoint}`,
        headers: headers,
        body: errorText
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'API call failed' };
      }
      
      console.error('Rental API Parsed Error:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Rental API Call Failed:`, {
      url: `${API_BASE}/api${endpoint}`,
      method: options.method || 'GET',
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// ================= RENTAL BOOKING OPERATIONS =================

/**
 * Create a new rental booking
 * @param {Object} bookingData - Booking details
 * @returns {Promise<Object>} Created booking details
 */
export const createRentalBooking = async (bookingData) => {
  return apiCall('/rentals/create-booking', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
};

/**
 * Get booking details by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Booking details with property and agreement info
 */
export const getBookingDetails = async (bookingId) => {
  return apiCall(`/rentals/booking/${bookingId}`);
};

/**
 * Get all bookings for current tenant
 * @returns {Promise<Array>} List of tenant bookings
 */
export const getTenantBookings = async () => {
  return apiCall('/rentals/tenant/bookings');
};

/**
 * Get pending rental requests for current owner
 * @returns {Promise<Array>} List of pending rental requests
 */
export const getOwnerRentalRequests = async () => {
  const response = await apiCall('/rentals/owner/requests');
  
  // Handle the new categorized response structure
  if (response && response.data) {
    return response.data.pendingRequests || [];
  }
  
  // Fallback for old response format
  return response || [];
};

/**
 * Get all bookings for current owner
 * @returns {Promise<Object>} Categorized bookings data
 */
export const getOwnerBookings = async () => {
  const response = await apiCall('/rentals/owner/requests');
  
  // Handle the new categorized response structure
  if (response && response.data) {
    return {
      allBookings: response.data.allBookings || [],
      pendingRequests: response.data.pendingRequests || [],
      activeAgreements: response.data.activeAgreements || [],
      completedBookings: response.data.completedBookings || [],
      summary: response.data.summary || { total: 0, pending: 0, active: 0, completed: 0 }
    };
  }
  
  // Fallback for old response format
  return {
    allBookings: response || [],
    pendingRequests: response || [],
    activeAgreements: [],
    completedBookings: [],
    summary: { total: response?.length || 0, pending: response?.length || 0, active: 0, completed: 0 }
  };
};

/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @param {string} paymentId - Optional payment ID
 * @returns {Promise<Object>} Updated booking details
 */
export const updateBookingStatus = async (bookingId, status, paymentId = null) => {
  return apiCall(`/rentals/booking/${bookingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, paymentId }),
  });
};

// ================= AGREEMENT OPERATIONS =================

/**
 * Get agreement details by ID
 * @param {string} agreementId - Agreement ID
 * @returns {Promise<Object>} Agreement details with booking info
 */
export const getAgreementDetails = async (agreementId) => {
  return apiCall(`/rentals/agreement/${agreementId}`);
};

// ================= TENANT DOCUMENT OPERATIONS =================

/**
 * Check if tenant has completed required documents
 * @param {string} tenantId - Tenant user ID
 * @returns {Promise<Object>} Document status with completion flag
 */
export const checkTenantDocuments = async (tenantId) => {
  return apiCall(`/tenant/documents/check/${tenantId}`);
};

/**
 * Get tenant document details
 * @param {string} tenantId - Tenant user ID
 * @returns {Promise<Object>} Tenant document data
 */
export const getTenantDocuments = async (tenantId) => {
  return apiCall(`/tenant/details/${tenantId}`);
};

// ================= UTILITY FUNCTIONS =================

/**
 * Format booking status for display
 * @param {string} status - Booking status
 * @returns {Object} Formatted status with label and color
 */
export const formatBookingStatus = (status) => {
  const statusMap = {
    'pending_payment': {
      label: 'Pending Payment',
      color: '#ffc107',
      bgColor: '#fff3cd',
      icon: '⏳'
    },
    'confirmed': {
      label: 'Confirmed',
      color: '#28a745',
      bgColor: '#d4edda',
      icon: '✓'
    },
    'cancelled': {
      label: 'Cancelled',
      color: '#dc3545',
      bgColor: '#f8d7da',
      icon: '✕'
    },
    'completed': {
      label: 'Completed',
      color: '#6c757d',
      bgColor: '#e2e3e5',
      icon: '✓'
    }
  };

  return statusMap[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
    color: '#6c757d',
    bgColor: '#e2e3e5',
    icon: 'clipboard'
  };
};

/**
 * Format agreement type for display
 * @param {string} type - Agreement type
 * @returns {Object} Formatted type with label and description
 */
export const formatAgreementType = (type) => {
  const typeMap = {
    'builtin': {
      label: 'Generated Agreement',
      description: 'Standard agreement generated by the platform',
      icon: 'document'
    },
    'manual': {
      label: 'Custom Agreement',
      description: 'Custom agreement uploaded by tenant',
      icon: 'folder'
    }
  };

  return typeMap[type] || {
    label: type.charAt(0).toUpperCase() + type.slice(1),
    description: 'Unknown agreement type',
    icon: 'clipboard'
  };
};

/**
 * Calculate rental summary
 * @param {Object} booking - Booking data
 * @returns {Object} Rental summary with costs
 */
export const calculateRentalSummary = (booking) => {
  if (!booking || !booking.propertyDetails) {
    return null;
  }

  const { rent, securityDeposit } = booking.propertyDetails;
  const { leaseDuration } = booking.tenantDetails;
  
  const monthlyRent = parseFloat(rent) || 0;
  const deposit = parseFloat(securityDeposit) || monthlyRent * 2;
  const duration = parseInt(leaseDuration) || 12;
  
  return {
    monthlyRent,
    securityDeposit: deposit,
    leaseDuration: duration,
    totalRent: monthlyRent * duration,
    totalAmount: (monthlyRent * duration) + deposit,
    currency: '₹'
  };
};

/**
 * Check if booking can be cancelled
 * @param {Object} booking - Booking data
 * @returns {Object} Cancellation info
 */
export const canCancelBooking = (booking) => {
  if (!booking) {
    return { canCancel: false, reason: 'Invalid booking data' };
  }

  const { status, createdAt } = booking;
  const now = new Date();
  const createdDate = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  const hoursSinceCreation = (now - createdDate) / (1000 * 60 * 60);

  // Can cancel if pending payment and within 24 hours
  if (status === 'pending_payment' && hoursSinceCreation <= 24) {
    return { 
      canCancel: true, 
      reason: 'You can cancel within 24 hours of booking creation' 
    };
  }

  if (status === 'confirmed') {
    return { 
      canCancel: false, 
      reason: 'Confirmed bookings cannot be cancelled. Please contact the property owner.' 
    };
  }

  if (status === 'cancelled' || status === 'completed') {
    return { 
      canCancel: false, 
      reason: `Booking is already ${status}` 
    };
  }

  return { 
    canCancel: false, 
    reason: 'Booking cannot be cancelled at this stage' 
  };
};

/**
 * Get next action for booking
 * @param {Object} booking - Booking data
 * @returns {Object} Next action info
 */
export const getBookingNextAction = (booking) => {
  if (!booking) {
    return { action: null, label: 'Unknown', description: 'Invalid booking' };
  }

  const { status } = booking;

  switch (status) {
    case 'pending_payment':
      return {
        action: 'payment',
        label: 'Complete Payment',
        description: 'Proceed with payment to confirm your booking',
        route: `/rental-payment/${booking.id}`
      };
    
    case 'confirmed':
      return {
        action: 'view',
        label: 'View Details',
        description: 'Your booking is confirmed. View details and agreement.',
        route: `/booking-details/${booking.id}`
      };
    
    case 'cancelled':
      return {
        action: 'browse',
        label: 'Browse Properties',
        description: 'This booking was cancelled. Browse other properties.',
        route: '/listings'
      };
    
    case 'completed':
      return {
        action: 'review',
        label: 'Leave Review',
        description: 'Your rental is complete. Leave a review for the property.',
        route: `/review/${booking.id}`
      };
    
    default:
      return {
        action: 'view',
        label: 'View Booking',
        description: 'View booking details',
        route: `/booking-details/${booking.id}`
      };
  }
};

const rentalService = {
  // Booking operations
  createRentalBooking,
  getBookingDetails,
  getTenantBookings,
  getOwnerBookings,
  getOwnerRentalRequests, // New function for consistency
  updateBookingStatus,
  
  // Agreement operations
  getAgreementDetails,
  
  // Utility functions
  formatBookingStatus,
  formatAgreementType,
  calculateRentalSummary,
  canCancelBooking,
  getBookingNextAction,
  
  // Tenant document operations
  checkTenantDocuments,
  getTenantDocuments
};

export default rentalService;
