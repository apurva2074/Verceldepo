// src/api/booking.js - Booking/Reservation API Abstraction
import { api } from './base';

export const bookingAPI = {
  /**
   * Create rental request (tenant only)
   * @param {string} propertyId - Property ID
   * @param {Object} requestData - Rental request data
   * @returns {Promise<Object>} Rental request result
   * @note Backend endpoint: POST /api/rentals/create-booking
   */
  createRentalRequest: async (propertyId, requestData) => {
    try {
      console.log(`📝 Creating rental request for property: ${propertyId}`);
      
      const response = await api.post('/rentals/create-booking', {
        propertyId,
        ...requestData
      });
      console.log('✅ Rental request created successfully:', response.bookingId);
      return response;
    } catch (error) {
      console.error(`❌ Failed to create rental request:`, error);
      
      if (error.status === 403) {
        throw new Error('Only tenants can create rental requests');
      } else if (error.status === 400) {
        if (error.message.includes('already submitted')) {
          throw new Error('You have already submitted a rental request for this property');
        } else if (error.message.includes('not available')) {
          throw new Error('This property is not available for rent');
        }
      }
      throw new Error('Failed to submit rental request. Please try again later.');
    }
  },

  /**
   * Get rental requests for a property (owner only)
   * @param {string} propertyId - Property ID (optional, filters by property if provided)
   * @returns {Promise<Array>} List of rental requests
   * @note Backend endpoint: GET /api/rentals/owner/requests
   */
  getPropertyRentalRequests: async (propertyId = null) => {
    try {
      console.log(`📋 Fetching rental requests for owner`);
      
      const response = await api.get('/rentals/owner/requests');
      
      // Filter by propertyId if provided
      if (propertyId && response.data && response.data.pendingRequests) {
        return response.data.pendingRequests.filter(req => req.propertyId === propertyId);
      }
      
      // Return pending requests from the new response structure
      return response.data?.pendingRequests || [];
    } catch (error) {
      console.error(`❌ Failed to fetch rental requests:`, error);
      
      if (error.status === 403) {
        throw new Error('Only property owners can view rental requests');
      }
      throw new Error('Unable to load rental requests. Please try again later.');
    }
  },

  /**
   * Approve rental request (owner only)
   * @param {string} propertyId - Property ID
   * @param {string} requestId - Rental request ID
   * @param {Object} approvalData - Approval details
   * @returns {Promise<Object>} Approval result
   * @note Backend endpoint: PATCH /api/rentals/booking/:id/status
   */
  approveRentalRequest: async (propertyId, requestId, approvalData) => {
    try {
      console.log(`✅ Approving rental request: ${requestId} for property: ${propertyId}`);
      
      const response = await api.patch(`/rentals/booking/${requestId}/status`, {
        status: 'approved_by_owner',
        ...approvalData
      });
      console.log('✅ Rental request approved successfully');
      return response;
    } catch (error) {
      console.error(`❌ Failed to approve rental request:`, error);
      
      if (error.status === 403) {
        throw new Error('Only property owners can approve rental requests');
      } else if (error.status === 404) {
        throw new Error('Rental request not found');
      } else if (error.status === 400) {
        if (error.message.includes('not available')) {
          throw new Error('Property is no longer available for rent');
        } else if (error.message.includes('already approved')) {
          throw new Error('This request has already been processed');
        }
      }
      throw new Error('Failed to approve rental request. Please try again later.');
    }
  },

  /**
   * Reject rental request (owner only)
   * @param {string} propertyId - Property ID
   * @param {string} requestId - Rental request ID
   * @param {Object} rejectionData - Rejection details
   * @returns {Promise<Object>} Rejection result
   * @note Backend endpoint: PATCH /api/rentals/booking/:id/status
   */
  rejectRentalRequest: async (propertyId, requestId, rejectionData) => {
    try {
      console.log(`❌ Rejecting rental request: ${requestId} for property: ${propertyId}`);
      
      const response = await api.patch(`/rentals/booking/${requestId}/status`, {
        status: 'rejected',
        ...rejectionData
      });
      console.log('✅ Rental request rejected successfully');
      return response;
    } catch (error) {
      console.error(`❌ Failed to reject rental request:`, error);
      
      if (error.status === 403) {
        throw new Error('Only property owners can reject rental requests');
      } else if (error.status === 404) {
        throw new Error('Rental request not found');
      } else if (error.status === 400) {
        if (error.message.includes('already processed')) {
          throw new Error('This request has already been processed');
        }
      }
      throw new Error('Failed to reject rental request. Please try again later.');
    }
  },

  /**
   * Get user's rental requests (tenant only)
   * @returns {Promise<Array>} List of user's rental requests
   * @note Backend endpoint: GET /api/rentals/tenant/bookings
   */
  getUserRentalRequests: async () => {
    try {
      console.log('📋 Fetching user rental requests');
      
      const response = await api.get('/rentals/tenant/bookings');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch user rental requests:', error);
      
      if (error.status === 403) {
        throw new Error('Only tenants can view their rental requests');
      }
      throw new Error('Unable to load your rental requests. Please try again later.');
    }
  },

  /**
   * Get rental agreements (owner or tenant)
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Array>} List of rental agreements
   * @note Backend doesn't have dedicated rental agreements endpoint.
   *       Use rental requests or user dashboard instead.
   * @deprecated This endpoint doesn't exist in backend. Use getUserRentalRequests() or getPaymentHistory() instead.
   */
  getRentalAgreements: async (userId = null) => {
    try {
      console.warn('⚠️ getRentalAgreements: Backend endpoint not available. Returning empty array.');
      // Backend doesn't have /rental-agreements endpoint
      // Return empty array to prevent errors
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch rental agreements:', error);
      throw new Error('Unable to load rental agreements. Please try again later.');
    }
  },

  /**
   * Get rental agreement by ID
   * @param {string} agreementId - Rental agreement ID
   * @returns {Promise<Object>} Rental agreement details
   * @note Backend doesn't have this endpoint.
   * @deprecated This endpoint doesn't exist in backend.
   */
  getRentalAgreementById: async (agreementId) => {
    try {
      console.warn(`⚠️ getRentalAgreementById: Backend endpoint not available for agreement ${agreementId}`);
      throw new Error('Rental agreement endpoint not available in backend');
    } catch (error) {
      console.error(`❌ Failed to fetch rental agreement:`, error);
      
      if (error.status === 404) {
        throw new Error('Rental agreement not found');
      } else if (error.status === 403) {
        throw new Error('You do not have permission to view this rental agreement');
      }
      throw new Error('Unable to load rental agreement. Please try again later.');
    }
  },

  /**
   * Create payment session (tenant only)
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Payment session
   */
  createPaymentSession: async (paymentData) => {
    try {
      console.log('💳 Creating payment session');
      
      const response = await api.post('/payments/create-session', paymentData);
      console.log('✅ Payment session created successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to create payment session:', error);
      
      if (error.status === 403) {
        throw new Error('Only tenants can create payment sessions');
      }
      throw new Error('Failed to create payment session. Please try again later.');
    }
  },

  /**
   * Confirm payment (tenant only)
   * @param {Object} paymentData - Payment confirmation data
   * @returns {Promise<Object>} Payment confirmation
   */
  confirmPayment: async (paymentData) => {
    try {
      console.log('✅ Confirming payment');
      
      const response = await api.post('/payments/confirm', paymentData);
      console.log('✅ Payment confirmed successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to confirm payment:', error);
      
      if (error.status === 403) {
        throw new Error('Only tenants can confirm payments');
      }
      throw new Error('Failed to confirm payment. Please try again later.');
    }
  },

  /**
   * Get payment history (tenant only)
   * @returns {Promise<Array>} Payment history
   */
  getPaymentHistory: async () => {
    try {
      console.log('💳 Fetching payment history');
      
      const response = await api.get('/user/payments');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch payment history:', error);
      throw new Error('Unable to load payment history. Please try again later.');
    }
  },

  /**
   * Get upcoming payments (tenant only)
   * @returns {Promise<Array>} Upcoming payments
   * @note Backend doesn't have /user/payments/upcoming endpoint.
   *       Uses getPaymentHistory() and extracts pendingPayments.
   *       Backend response: { success: true, data: { pendingPayments: [...], ... } }
   */
  getUpcomingPayments: async () => {
    try {
      console.log('📅 Fetching upcoming payments');
      
      // Backend doesn't have dedicated upcoming payments endpoint
      // Get payment history and filter for pending payments
      const response = await api.get('/user/payments');
      
      // Backend returns: { success: true, data: { pendingPayments: [...], ... } }
      // api.get() returns response.data, so response = { success: true, data: {...} }
      if (response && response.data && Array.isArray(response.data.pendingPayments)) {
        return response.data.pendingPayments;
      }
      
      // Fallback: return empty array if structure is different
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch upcoming payments:', error);
      throw new Error('Unable to load upcoming payments. Please try again later.');
    }
  },

  /**
   * Submit documents for rental (tenant only)
   * @param {string} propertyId - Property ID
   * @param {FormData} documentsData - Document files
   * @returns {Promise<Object>} Document submission result
   */
  submitRentalDocuments: async (propertyId, documentsData) => {
    try {
      console.log(`📄 Submitting documents for property: ${propertyId}`);
      
      const response = await api.post(`/rent/documents`, documentsData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Documents submitted successfully');
      return response;
    } catch (error) {
      console.error(`❌ Failed to submit documents:`, error);
      
      if (error.status === 403) {
        throw new Error('Only tenants can submit rental documents');
      }
      throw new Error('Failed to submit documents. Please try again later.');
    }
  },

  /**
   * Get document status (tenant or owner)
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Document status
   */
  getDocumentStatus: async (propertyId) => {
    try {
      console.log(`📄 Fetching document status for property: ${propertyId}`);
      
      const response = await api.get(`/rent/documents/${propertyId}`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to fetch document status:`, error);
      throw new Error('Unable to load document status. Please try again later.');
    }
  },

  /**
   * Approve/reject documents (owner only)
   * @param {string} documentId - Document ID
   * @param {Object} decisionData - Decision details (should contain 'decision': 'approved'|'rejected' and optional 'feedback')
   * @returns {Promise<Object>} Decision result
   * @note Backend endpoint: POST /api/rent/documents/:id/decision
   */
  makeDocumentDecision: async (documentId, decisionData) => {
    try {
      console.log(`📄 Making document decision: ${documentId}`);
      
      const response = await api.post(`/rent/documents/${documentId}/decision`, decisionData);
      console.log('✅ Document decision made successfully');
      return response;
    } catch (error) {
      console.error(`❌ Failed to make document decision:`, error);
      
      if (error.status === 403) {
        throw new Error('Only property owners can make document decisions');
      }
      throw new Error('Failed to process document decision. Please try again later.');
    }
  },

  /**
   * Get pending documents (owner only)
   * @returns {Promise<Array>} Pending documents
   */
  getPendingDocuments: async () => {
    try {
      console.log('📄 Fetching pending documents');
      
      const response = await api.get('/rent/documents');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch pending documents:', error);
      
      if (error.status === 403) {
        throw new Error('Only property owners can view pending documents');
      }
      throw new Error('Unable to load pending documents. Please try again later.');
    }
  },
};

export default bookingAPI;
