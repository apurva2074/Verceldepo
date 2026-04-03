/**
 * Document Service
 * Handles AI document verification API calls
 */

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

/**
 * Verify a single document using AI
 * @param {File} file - Document file to verify
 * @returns {Promise<Object>} - Verification result
 */
export const verifyDocument = async (file) => {
  try {
    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${API_BASE}/api/ai/verify-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Document verification failed');
    }

    return result;
  } catch (error) {
    console.error('Document verification error:', error);
    throw error;
  }
};

/**
 * Verify multiple documents using AI
 * @param {File[]} files - Array of document files
 * @returns {Promise<Object>} - Verification results
 */
export const verifyMultipleDocuments = async (files) => {
  try {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('documents', file);
    });

    const response = await fetch(`${API_BASE}/api/ai/verify-multiple-documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Document verification failed');
    }

    return result;
  } catch (error) {
    console.error('Multiple document verification error:', error);
    throw error;
  }
};

/**
 * Get user's document verification history
 * @returns {Promise<Object>} - Verification history
 */
export const getVerificationHistory = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/ai/verification-history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch verification history');
    }

    return result;
  } catch (error) {
    console.error('Get verification history error:', error);
    throw error;
  }
};

/**
 * Delete a document record
 * @param {string} documentId - Document ID to delete
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteDocument = async (documentId) => {
  try {
    const response = await fetch(`${API_BASE}/api/ai/document/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete document');
    }

    return result;
  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
};

/**
 * Get authentication token
 * @returns {Promise<string>} - Auth token
 */
const getAuthToken = async () => {
  // This should be imported from your existing auth utilities
  // For now, assuming it's available globally or via context
  if (window.gapi && window.gapi.auth2) {
    const user = window.gapi.auth2.getAuthInstance().currentUser.get();
    return user.getAuthResponse().id_token;
  }
  
  // Fallback for Firebase auth
  if (window.firebase && window.firebase.auth) {
    const user = window.firebase.auth().currentUser;
    if (user) {
      return await user.getIdToken();
    }
  }
  
  throw new Error('No authentication method available');
};

/**
 * Format verification status for display
 * @param {string} status - Verification status
 * @returns {Object} - Formatted status with color and icon
 */
export const formatVerificationStatus = (status) => {
  switch (status) {
    case 'Approved':
      return {
        color: '#10b981',
        bgColor: '#d1fae5',
        icon: '✅',
        text: 'Verified'
      };
    case 'Rejected':
      return {
        color: '#ef4444',
        bgColor: '#fee2e2',
        icon: '❌',
        text: 'Rejected'
      };
    case 'Needs Review':
      return {
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: '⚠️',
        text: 'Needs Review'
      };
    default:
      return {
        color: '#6b7280',
        bgColor: '#f3f4f6',
        icon: '📄',
        text: 'Unknown'
      };
  }
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export const validateDocumentFile = (file) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 10MB.'
    };
  }

  return {
    valid: true,
    error: null
  };
};
