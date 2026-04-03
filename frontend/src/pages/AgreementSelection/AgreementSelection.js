import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getPropertyById } from "../../services/propertiesService";
import { getAuthToken } from "../../utils/authToken";
import "./AgreementSelection.css";
import Header from "../../MyComponent/Header";

export default function AgreementSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [property, setProperty] = useState(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [agreementType, setAgreementType] = useState(""); // 'builtin' or 'manual'
  const [submitting, setSubmitting] = useState(false);
  
  // Tenant personal details form
  const [tenantDetails, setTenantDetails] = useState({
    fullName: '',
    phone: '',
    email: '',
    currentAddress: '',
    occupation: '',
    moveInDate: '',
    leaseDuration: '12' // months
  });
  
  // Agreement document (for manual upload)
  const [agreementDocument, setAgreementDocument] = useState(null);
  
  // Agreement preview (for builtin generation)
  const [agreementPreview, setAgreementPreview] = useState(null);

  useEffect(() => {
    if (!user || !id) {
      return;
    }

    const fetchProperty = async () => {
      try {
        setLoadingProperty(true);
        const propData = await getPropertyById(id);
        
        if (!propData) {
          throw new Error('Property not found');
        }
        
        // Check if property is available
        const availableStatuses = ['approved', 'APPROVED', 'ACTIVE', 'active', 'available', 'Available', 'AVAILABLE'];
        const propertyStatus = propData.status?.toString().trim().toUpperCase();
        
        if (!availableStatuses.includes(propertyStatus)) {
          throw new Error(`Property is not available for rent. Current status: ${propData.status}`);
        }
        
        setProperty(propData);
        
        // Pre-fill tenant email if available
        if (user.email) {
          setTenantDetails(prev => ({ ...prev, email: user.email }));
        }
        
      } catch (error) {
        console.error("Error fetching property:", error);
        alert(error.message || 'Failed to load property details');
        navigate('/listings');
      } finally {
        setLoadingProperty(false);
      }
    };

    fetchProperty();
  }, [user, id, navigate]);

  const handleTenantDetailChange = (field, value) => {
    setTenantDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (file) => {
    // Validate file type and size
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or image file (JPEG/PNG)');
      return;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    setAgreementDocument(file);
  };

  const generateAgreementPreview = async () => {
    if (!property || !tenantDetails.fullName) {
      alert('Please fill in your details first');
      return;
    }

    const previewData = {
      propertyTitle: property.title,
      propertyAddress: typeof property.address === 'string' ? property.address : 
        `${property.address?.line1 || ''}, ${property.address?.city || ''}, ${property.address?.state || ''}`,
      rentAmount: property.rent,
      securityDeposit: property.securityDeposit || property.rent * 2,
      leaseDuration: tenantDetails.leaseDuration,
      moveInDate: tenantDetails.moveInDate,
      tenantName: tenantDetails.fullName,
      tenantPhone: tenantDetails.phone,
      tenantEmail: tenantDetails.email,
      ownerName: 'Property Owner', // This would come from property owner data
      agreementDate: new Date().toLocaleDateString(),
    };

    setAgreementPreview(previewData);
  };

  const validateForm = () => {
    if (!agreementType) {
      alert('Please select an agreement type');
      return false;
    }

    // Validate tenant details
    const requiredFields = ['fullName', 'phone', 'email', 'currentAddress', 'occupation', 'moveInDate'];
    for (const field of requiredFields) {
      if (!tenantDetails[field]) {
        alert(`Please fill in ${field.replace(/([A-Z])/g, ' $1').trim()}`);
        return false;
      }
    }

    // Validate agreement document or preview
    if (agreementType === 'manual' && !agreementDocument) {
      alert('Please upload your rental agreement document');
      return false;
    }

    if (agreementType === 'builtin' && !agreementPreview) {
      alert('Please generate and review the agreement preview');
      return false;
    }

    return true;
  };

  const handleSubmitAgreement = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const token = await getAuthToken();
      
      // Create rental booking with agreement
      const bookingData = {
        propertyId: id,
        tenantDetails,
        agreementType,
        agreementDocument: agreementType === 'manual' ? agreementDocument.name : null,
        agreementPreview: agreementType === 'builtin' ? agreementPreview : null,
        propertyDetails: {
          title: property.title,
          rent: property.rent,
          securityDeposit: property.securityDeposit || property.rent * 2,
          address: property.address
        }
      };

      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/rentals/create-booking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create rental booking');
      }

      const result = await response.json();
      
      // Show success message and redirect to dashboard
      alert(result.message || "Rental request sent to owner for approval.");
      navigate('/tenant-dashboard');
      
    } catch (error) {
      console.error("Error submitting agreement:", error);
      alert(error.message || 'Failed to submit agreement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingProperty) {
    return (
      <>
        <Header />
        <div className="agreement-selection-loading">
          <div className="loading-container">
            <div className="spinner"></div>
            <h3>Loading Rental Agreement...</h3>
            <p>Preparing your rental agreement options</p>
          </div>
        </div>
      </>
    );
  }

  if (!property) {
    return (
      <>
        <Header />
        <div className="agreement-selection-error">
          <div className="error-container">
            <h2>Property Not Found</h2>
            <p>The property you're trying to rent doesn't exist or is no longer available.</p>
            <button onClick={() => navigate('/listings')} className="btn-primary">
              Browse Properties
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <div className="agreement-selection-wrapper">
        <div className="agreement-selection-container">
          {/* Property Summary */}
          <div className="property-summary">
            <h1>Rental Agreement</h1>
            <div className="property-card">
              <h2>{property.title}</h2>
              <div className="property-details">
                <p className="price">
                  {property.type === "pg" 
                    ? `₹${property.rentPerPerson} / person`
                    : `₹${property.rent} / month`
                  }
                </p>
                <p className="address">
                  {typeof property.address === 'string' 
                    ? property.address 
                    : `${property.address?.line1 || ''}, ${property.address?.city || ''}, ${property.address?.state || ''}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Agreement Type Selection */}
          <div className="agreement-type-section">
            <h2>Choose Agreement Type</h2>
            <div className="agreement-options">
              <div 
                className={`agreement-option ${agreementType === 'builtin' ? 'selected' : ''}`}
                onClick={() => setAgreementType('builtin')}
              >
                <div className="option-icon">Document</div>
                <div className="option-content">
                  <h3>Generate Agreement Online</h3>
                  <p>Use our standardized rental agreement template with all legal terms included. Quick and easy setup.</p>
                  <ul className="option-features">
                    <li>Standard legal terms</li>
                    <li>Quick processing</li>
                    <li>Digital signing ready</li>
                    <li>Legally compliant</li>
                  </ul>
                </div>
              </div>
              
              <div 
                className={`agreement-option ${agreementType === 'manual' ? 'selected' : ''}`}
                onClick={() => setAgreementType('manual')}
              >
                <div className="option-icon">Folder</div>
                <div className="option-content">
                  <h3>Upload Existing Agreement</h3>
                  <p>Upload your own custom rental agreement with terms negotiated between you and the owner.</p>
                  <ul className="option-features">
                    <li>Flexible terms</li>
                    <li>Custom conditions</li>
                    <li>Negotiated rent</li>
                    <li>Personalized agreement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Details Form */}
          <div className="tenant-details-section">
            <h2>Tenant Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={tenantDetails.fullName}
                  onChange={(e) => handleTenantDetailChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={tenantDetails.phone}
                  onChange={(e) => handleTenantDetailChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={tenantDetails.email}
                  onChange={(e) => handleTenantDetailChange('email', e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
              <div className="form-group">
                <label>Current Address *</label>
                <textarea
                  value={tenantDetails.currentAddress}
                  onChange={(e) => handleTenantDetailChange('currentAddress', e.target.value)}
                  placeholder="Enter your current address"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Occupation *</label>
                <input
                  type="text"
                  value={tenantDetails.occupation}
                  onChange={(e) => handleTenantDetailChange('occupation', e.target.value)}
                  placeholder="Enter your occupation"
                />
              </div>
              <div className="form-group">
                <label>Preferred Move-in Date *</label>
                <input
                  type="date"
                  value={tenantDetails.moveInDate}
                  onChange={(e) => handleTenantDetailChange('moveInDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label>Lease Duration *</label>
                <select
                  value={tenantDetails.leaseDuration}
                  onChange={(e) => handleTenantDetailChange('leaseDuration', e.target.value)}
                >
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                  <option value="24">24 Months</option>
                </select>
              </div>
            </div>
          </div>

          {/* Agreement Handling */}
          {agreementType === 'builtin' && (
            <div className="builtin-agreement-section">
              <h2>Agreement Preview</h2>
              <button 
                className="generate-preview-btn"
                onClick={generateAgreementPreview}
                disabled={!tenantDetails.fullName}
              >
                Generate Agreement Preview
              </button>
              
              {agreementPreview && (
                <div className="agreement-preview">
                  <h3>RENTAL AGREEMENT PREVIEW</h3>
                  <div className="preview-content">
                    <p><strong>Property:</strong> {agreementPreview.propertyTitle}</p>
                    <p><strong>Address:</strong> {agreementPreview.propertyAddress}</p>
                    <p><strong>Monthly Rent:</strong> ₹{agreementPreview.rentAmount}</p>
                    <p><strong>Security Deposit:</strong> ₹{agreementPreview.securityDeposit}</p>
                    <p><strong>Lease Duration:</strong> {agreementPreview.leaseDuration} months</p>
                    <p><strong>Move-in Date:</strong> {agreementPreview.moveInDate}</p>
                    <p><strong>Tenant:</strong> {agreementPreview.tenantName}</p>
                    <p><strong>Contact:</strong> {agreementPreview.tenantPhone} | {agreementPreview.tenantEmail}</p>
                    <p><strong>Agreement Date:</strong> {agreementPreview.agreementDate}</p>
                  </div>
                  <div className="preview-terms">
                    <h4>Standard Terms & Conditions:</h4>
                    <ul>
                      <li>Rent is due on the 1st day of each month</li>
                      <li>Security deposit is refundable at lease end</li>
                      <li>Tenant is responsible for utilities and maintenance</li>
                      <li>Property must be maintained in good condition</li>
                      <li>30 days notice required for lease termination</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {agreementType === 'manual' && (
            <div className="manual-agreement-section">
              <h2>Upload Agreement Document</h2>
              <div className="upload-section">
                <div className="upload-area">
                  <input
                    type="file"
                    id="agreement-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="agreement-upload" className="upload-label">
                    <div className="upload-icon">Folder</div>
                    <p>Click to upload your rental agreement</p>
                    <span>Supported formats: PDF, JPEG, PNG (Max 10MB)</span>
                  </label>
                </div>
                
                {agreementDocument && (
                  <div className="uploaded-file">
                    <div className="file-info">
                      <span className="file-name">Document {agreementDocument.name}</span>
                      <span className="file-size">
                        ({(agreementDocument.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button 
                      className="remove-file"
                      onClick={() => setAgreementDocument(null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Section */}
          <div className="submit-section">
            <button 
              className="submit-btn"
              onClick={handleSubmitAgreement}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Proceed to Payment'}
            </button>
            <p className="submit-note">
              By proceeding, you confirm that all provided information is accurate and you agree to the rental terms.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
