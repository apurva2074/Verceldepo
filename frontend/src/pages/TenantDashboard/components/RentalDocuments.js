import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../../../utils/authToken';
import { 
  uploadDocumentWithVerification, 
  getDocumentsStatus, 
  formatVerificationStatus, 
  getStatusDescription,
  isVerificationComplete,
  isVerificationSuccessful,
  getStatusProgress
} from '../../../services/enhancedDocumentService';
import DocumentStatusDisplay from '../../../components/DocumentStatusDisplay';
import './RentalDocuments.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API call failed');
  }

  return response.json();
};

export default function RentalDocuments({ uid }) {
  console.log("RentalDocuments component rendered with UID:", uid);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Document verification status tracking
  const [documentStatuses, setDocumentStatuses] = useState({
    idProof: null,
    addressProof: null
  });
  
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    idType: '',
    idProofUrl: '',
    addressProofUrl: ''
  });

  const [uploadProgress, setUploadProgress] = useState({
    idProof: 0,
    addressProof: 0
  });

  // Fetch user profile data to pre-fill name and phone
  const fetchUserProfile = useCallback(async () => {
    try {
      console.log("Fetching user profile for UID:", uid);
      const response = await apiCall('/users/profile');
      console.log("User profile response:", response);
      
      if (response && (response.name || response.phone)) {
        setFormData(prev => ({
          ...prev,
          fullName: response.name || '',
          phone: response.phone || ''
        }));
        console.log("Pre-filled user data:", { name: response.name, phone: response.phone });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Don't show error for profile fetch, just continue with empty form
    }
  }, [uid]);

  // Fetch document verification status
  const fetchDocumentStatuses = useCallback(async () => {
    try {
      console.log("Fetching document verification status for UID:", uid);
      const response = await getDocumentsStatus();
      console.log("Document status response:", response);
      
      if (response.success && response.documents) {
        const statuses = {};
        
        response.documents.forEach(doc => {
          if (doc.documentType === 'idProof') {
            statuses.idProof = doc;
          } else if (doc.documentType === 'addressProof') {
            statuses.addressProof = doc;
          }
        });
        
        setDocumentStatuses(statuses);
        console.log("Updated document statuses:", statuses);
      }
    } catch (error) {
      console.error('Error fetching document statuses:', error);
    }
  }, [uid]);

  // Set up real-time listener for document status updates
  useEffect(() => {
    if (!uid) return;

    // Initial fetch
    fetchDocumentStatuses();

    // Set up polling for real-time updates (every 5 seconds)
    const interval = setInterval(() => {
      fetchDocumentStatuses();
    }, 5000);

    return () => clearInterval(interval);
  }, [uid, fetchDocumentStatuses]);

  const fetchExistingDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log("Fetching existing documents for UID:", uid);
      
      const response = await apiCall(`/tenant/details/${uid}`);
      console.log("Documents response:", response);
      
      if (response.success && response.data) {
        setFormData(prev => ({
          fullName: response.data.fullName || prev.fullName || '',
          dob: response.data.dob || prev.dob || '',
          phone: response.data.phone || prev.phone || '',
          address: response.data.address || prev.address || '',
          emergencyContactName: response.data.emergencyContactName || prev.emergencyContactName || '',
          emergencyContactPhone: response.data.emergencyContactPhone || prev.emergencyContactPhone || '',
          idType: response.data.idType || prev.idType || '',
          idProofUrl: response.data.idProofUrl || prev.idProofUrl || '',
          addressProofUrl: response.data.addressProofUrl || prev.addressProofUrl || ''
        }));
        
        // Check if documents are already complete and user was redirected from rent button
        const returnToProperty = localStorage.getItem('returnToProperty');
        const hasRequiredDocuments = !!(response.data.idProofUrl && response.data.addressProofUrl);
        
        if (returnToProperty && hasRequiredDocuments) {
          // Documents are complete, redirect to rental agreement/payment
          localStorage.removeItem('returnToProperty');
          navigate(`/property/${returnToProperty}`);
          return;
        }
      } else {
        console.log("No existing documents found, showing empty form");
        // Don't show error for first-time users, just continue with empty form
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Only show error if it's not a 404 (first-time user)
      if (!error.message.includes('Tenant details not found')) {
        setError('Failed to load your documents. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  }, [uid, navigate]);

  useEffect(() => {
    if (uid) {
      // Fetch user profile first to pre-fill name and phone
      fetchUserProfile();
      // Then fetch existing documents
      fetchExistingDocuments();
    }
  }, [uid, fetchUserProfile, fetchExistingDocuments, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess(false);
  };

  const handleFileUpload = async (fileType, file) => {
    if (!file) return;

    try {
      // Show initial upload progress
      setUploadProgress(prev => ({ ...prev, [fileType]: 10 }));
      
      console.log('🔍 ENHANCED UPLOAD: Uploading file:', file);
      console.log('🔍 ENHANCED UPLOAD: FileType:', fileType);
      console.log('🔍 ENHANCED UPLOAD: UID:', uid);
      
      // Use enhanced upload service with AI verification
      const result = await uploadDocumentWithVerification(file, fileType);
      
      console.log('🔍 ENHANCED UPLOAD: Result:', result);

      // Update form data with document URL
      setFormData(prev => ({ 
        ...prev, 
        [`${fileType}Url`]: result.documentUrl 
      }));
      
      // Show "verifying" status
      setUploadProgress(prev => ({ ...prev, [fileType]: 50 }));
      
      // Trigger immediate status fetch to show verification progress
      fetchDocumentStatuses();
      
      // Show success message
      setSuccess(true);
      setError('');
      
      console.log('🔍 ENHANCED UPLOAD: Upload successful, AI verification started');
      
    } catch (error) {
      console.error('🚨 ENHANCED UPLOAD ERROR:', error);
      setError(`Failed to upload ${fileType === 'idProof' ? 'ID document' : 'address proof'}: ${error.message}`);
      setUploadProgress(prev => ({ ...prev, [fileType]: 0 }));
      setSuccess(false);
    }
  };

  const validateForm = () => {
    // Only require at least one field to be filled to allow saving
    const hasAnyData = Object.values(formData).some(value => value && value.trim() !== '');
    
    if (!hasAnyData) {
      setError('Please fill in at least one field before saving');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Save button clicked');
    console.log('Current formData:', formData);
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      console.log('Sending data to backend:', {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      const response = await apiCall('/tenant/details', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          updatedAt: new Date().toISOString()
        })
      });

      console.log('Backend response:', response);

      if (response.success) {
        setSuccess(true);
        setError('');
        
        // Refresh the data to show updated values
        await fetchExistingDocuments();
        
        // Check if user was redirected from a property and should return
        const returnToProperty = localStorage.getItem('returnToProperty');
        if (returnToProperty) {
          localStorage.removeItem('returnToProperty');
          setTimeout(() => {
            navigate(`/property/${returnToProperty}`);
          }, 2000);
        }
        
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(response.message || 'Failed to save details');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Always render the form, even if there's an error or during loading
  return (
    <div className="rental-documents">
      <h2>Rental Documents</h2>
      
      {loading && (
        <div className="rental-documents-loading">
          <div className="loading-spinner"></div>
          <p>Loading your documents...</p>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          ✓ Documents saved successfully! 
          {localStorage.getItem('returnToProperty') && !!(formData.idProofUrl && formData.addressProofUrl) ? 
            <span>Documents are complete! Redirecting to property...</span>
            : 
            <span>You can now proceed with your rental booking.</span>
          }
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && localStorage.getItem('returnToProperty') && !(formData.idProofUrl && formData.addressProofUrl) && (
        <div className="warning-message">
          ⚠️ Please fill in all required documents before proceeding with your rental booking. This is required to complete your rental application.
        </div>
      )}

      {!loading && (
        <form onSubmit={handleSubmit} className="documents-form">
          <div className="form-section">
            <h3>Personal Information</h3>
            
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                placeholder="From your signup profile"
                className="prefilled"
              />
              <small className="form-hint">This name was pulled from your signup profile</small>
            </div>

            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                placeholder="From your signup profile"
                className="prefilled"
              />
              <small className="form-hint">This phone was pulled from your signup profile</small>
            </div>

            <div className="form-group">
              <label>Current Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                rows={3}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Emergency Contact</h3>
            
            <div className="form-group">
              <label>Emergency Contact Name</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Emergency Contact Phone</label>
              <input
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Document Upload</h3>
            
            <div className="upload-group">
              <label>Government ID Type *</label>
              <select
                value={formData.idType}
                onChange={(e) => handleInputChange('idType', e.target.value)}
                required
                className="id-type-select"
              >
                <option value="">Select ID Type</option>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="passport">Passport</option>
                <option value="voter">Voter ID Card</option>
                <option value="driving">Driving License</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="upload-group">
              <label>Upload Selected ID Document *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload('idProof', e.target.files[0])}
                disabled={uploadProgress.idProof > 0}
              />
              <DocumentStatusDisplay 
                documentStatus={documentStatuses.idProof}
                documentType="idProof"
                uploadProgress={uploadProgress.idProof}
              />
              {formData.idProofUrl && !documentStatuses.idProof && (
                <div className="uploaded-file">
                  ✓ ID document uploaded
                </div>
              )}
            </div>

            <div className="upload-group">
              <label>Address Proof *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload('addressProof', e.target.files[0])}
                disabled={uploadProgress.addressProof > 0}
              />
              <DocumentStatusDisplay 
                documentStatus={documentStatuses.addressProof}
                documentType="addressProof"
                uploadProgress={uploadProgress.addressProof}
              />
              {formData.addressProofUrl && !documentStatuses.addressProof && (
                <div className="uploaded-file">
                  ✓ Address proof uploaded
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Documents'}
          </button>
        </form>
      )}
    </div>
  );
}
