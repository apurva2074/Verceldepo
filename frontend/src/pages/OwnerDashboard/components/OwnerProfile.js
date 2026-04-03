import React, { useEffect, useMemo, useState } from "react";
import "./OwnerProfileEnhanced.css";
import { db } from "../../../firebase/firestore";
import { doc, onSnapshot } from "firebase/firestore";
import { updateUserProfile, updateProfilePicture } from "../../../services/profileService";
import { getOwnerStats } from "../../../services/ownerStatsService";

export default function OwnerProfile({ uid, fallbackEmail }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const [ownerStats, setOwnerStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    company: '',
    website: '',
    description: ''
  });

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      const profileData = { id: snap.id, ...(snap.data() || {}) };
      setProfile(profileData);
      
      // Update form data when profile changes
      setFormData({
        name: profileData.name || '',
        phone: profileData.phone || '',
        address: typeof profileData.address === 'string' ? profileData.address : (profileData.address?.line || profileData.address?.line1 || ''),
        city: profileData.city || '',
        state: profileData.state || '',
        pincode: profileData.pincode || '',
        company: profileData.company || '',
        website: profileData.website || '',
        description: profileData.description || ''
      });
    });
    return () => unsub();
  }, [uid]);

  // Fetch owner statistics
  useEffect(() => {
    if (!uid) return;
    
    const fetchOwnerStats = async () => {
      try {
        setStatsLoading(true);
        const stats = await getOwnerStats();
        setOwnerStats(stats);
      } catch (error) {
        console.error('Error fetching owner stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchOwnerStats();
  }, [uid]);

  const fields = useMemo(() => ["name", "email", "phone", "address", "city", "state", "pincode", "company", "website"], []);

  const computed = useMemo(() => {
    if (!profile) return { percent: 0, p: { email: fallbackEmail } };
    const p = { email: fallbackEmail, ...profile };
    let filled = 0;
    fields.forEach(k => { if (p[k]?.toString().trim().length > 0) filled++; });
    return { percent: Math.round((filled / fields.length) * 100), p };
  }, [profile, fallbackEmail, fields]);

  const p = computed.p;

  const handleEditClick = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    // Reset form data to current profile
    setFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      address: typeof profile.address === 'string' ? profile.address : (profile.address?.line || profile.address?.line1 || ''),
      city: profile.city || '',
      state: profile.state || '',
      pincode: profile.pincode || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    const validationErrors = [];
    
    // Name validation
    if (!formData.name.trim()) {
      validationErrors.push('Name is required');
    } else if (formData.name.trim().length < 2) {
      validationErrors.push('Name must be at least 2 characters long');
    } else if (formData.name.trim().length > 100) {
      validationErrors.push('Name must be less than 100 characters');
    } else if (!/^[a-zA-Z\s.]+$/.test(formData.name.trim())) {
      validationErrors.push('Name can only contain letters, spaces, and dots');
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone.trim()) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone.trim().replace(/\D/g, ''))) {
        validationErrors.push('Please enter a valid 10-digit mobile number starting with 6-9');
      }
    }

    // Address validation (optional but if provided, must be valid)
    if (formData.address.trim()) {
      if (formData.address.trim().length < 5) {
        validationErrors.push('Address must be at least 5 characters long');
      } else if (formData.address.trim().length > 500) {
        validationErrors.push('Address must be less than 500 characters');
      }
    }

    // City validation (optional but if provided, must be valid)
    if (formData.city.trim()) {
      if (formData.city.trim().length < 2) {
        validationErrors.push('City must be at least 2 characters long');
      } else if (formData.city.trim().length > 50) {
        validationErrors.push('City must be less than 50 characters');
      } else if (!/^[a-zA-Z\s]+$/.test(formData.city.trim())) {
        validationErrors.push('City can only contain letters and spaces');
      }
    }

    // State validation (optional but if provided, must be valid)
    if (formData.state.trim()) {
      if (formData.state.trim().length < 2) {
        validationErrors.push('State must be at least 2 characters long');
      } else if (formData.state.trim().length > 50) {
        validationErrors.push('State must be less than 50 characters');
      } else if (!/^[a-zA-Z\s]+$/.test(formData.state.trim())) {
        validationErrors.push('State can only contain letters and spaces');
      }
    }

    // PIN Code validation (optional but if provided, must be valid)
    if (formData.pincode.trim()) {
      const pincodeRegex = /^\d{6}$/;
      if (!pincodeRegex.test(formData.pincode.trim())) {
        validationErrors.push('PIN code must be exactly 6 digits');
      }
    }

    return validationErrors;
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        setLoading(false);
        return;
      }

      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim()
      };

      console.log('🧪 OwnerProfile - Updating profile with data:', updateData);

      // Call backend API
      const response = await updateUserProfile(updateData);
      
      console.log('🧪 OwnerProfile - Profile updated successfully:', response);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      
    } catch (error) {
      console.error('🧪 OwnerProfile - Error updating profile:', error);
      
      // Handle validation errors from backend
      if (error.message && error.message.includes('Validation failed')) {
        setError('Please check your input and try again.');
      } else {
        setError(error.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profilePicture', file);

      // For now, we'll use a simple approach - in production, you'd upload to Firebase Storage first
      // then get the URL and update the profile
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imageUrl = event.target.result;
          await updateProfilePicture(imageUrl);
          setSuccess('Profile picture updated successfully!');
        } catch (error) {
          console.error('Error updating profile picture:', error);
          setError('Failed to update profile picture');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image');
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="profile-card editing">
        <div className="profile-header">
          <div className="avatar">
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} alt="Profile" className="profile-picture" />
            ) : (
              (formData.name?.[0] || "O").toUpperCase()
            )}
          </div>
          <div className="pmeta">
            <h3>Edit Profile</h3>
            <p>Update your personal information</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-edit-form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={p.email || fallbackEmail}
              disabled
              className="disabled"
              title="Email cannot be changed"
            />
            <small>Email cannot be changed</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your address"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pincode">PIN Code</label>
            <input
              type="text"
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              placeholder="Enter PIN code"
              pattern="[0-9]{6}"
              maxLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profilePicture">Profile Picture</label>
            <input
              type="file"
              id="profilePicture"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              disabled={loading}
            />
            <small>Upload a profile picture (max 5MB)</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-owner-profile">
      {/* Profile Navigation Tabs */}
      <div className="profile-tabs">
        <button 
          className={`profile-tab ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveSection('profile')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Profile
        </button>
        <button 
          className={`profile-tab ${activeSection === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveSection('statistics')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Statistics
        </button>
        <button 
          className={`profile-tab ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24"></path>
          </svg>
          Settings
        </button>
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-header">
              <div className="avatar-section">
                <div className="avatar">
                  {profile?.profilePicture ? (
                    <img src={profile.profilePicture} alt="Profile" className="profile-picture" />
                  ) : (
                    (p.name?.[0] || "O").toUpperCase()
                  )}
                  <button className="avatar-edit-btn" onClick={() => document.getElementById('profile-pic-input').click()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </button>
                  <input 
                    id="profile-pic-input"
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }}
                    onChange={handleProfilePictureUpload}
                  />
                </div>
                <div className="profile-meta">
                  <div className="profile-name">{p.name || "Property Owner"}</div>
                  <div className="profile-email">{p.email}</div>
                  <div className="profile-phone">{p.phone || "Add phone number"}</div>
                  {p.company && <div className="profile-company">{p.company}</div>}
                  {p.website && (
                    <div className="profile-website">
                      <a href={p.website} target="_blank" rel="noopener noreferrer">
                        {p.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="profile-actions">
                <button className="btn-primary" onClick={handleEditClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Profile
                </button>
                <button className="btn-outline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Public Profile
                </button>
              </div>
            </div>

            <div className="profile-completion">
              <div className="completion-header">
                <h3>Profile Completion</h3>
                <span className="completion-percentage">{computed.percent}%</span>
              </div>
              <div className="completion-bar">
                <div className="completion-fill" style={{ width: `${computed.percent}%` }} />
              </div>
              <div className="completion-suggestions">
                {computed.percent < 100 && (
                  <p>Complete your profile to increase visibility and trust with tenants</p>
                )}
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="info-item">
                <div className="info-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Address
                </div>
                <div className="info-value">
                  {typeof p.address === 'string' ? p.address : (p.address?.line || p.address?.line1 || "Not provided")}
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  City
                </div>
                <div className="info-value">{p.city || "Not provided"}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  State
                </div>
                <div className="info-value">{p.state || "Not provided"}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16,8 20,8 23,11 23,16 16,16"></polygon>
                  </svg>
                  PIN Code
                </div>
                <div className="info-value">{p.pincode || "Not provided"}</div>
              </div>
            </div>

            {p.description && (
              <div className="profile-description">
                <h3>About</h3>
                <p>{p.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Section */}
      {activeSection === 'statistics' && (
        <div className="statistics-content">
          <div className="stats-overview">
            <h3>Your Performance Overview</h3>
            {statsLoading ? (
              <div className="stats-loading">
                <div className="spinner"></div>
                <p>Loading statistics...</p>
              </div>
            ) : ownerStats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <h4>{ownerStats.totalProperties || 0}</h4>
                    <p>Total Properties</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <h4>{ownerStats.totalTenants || 0}</h4>
                    <p>Total Tenants</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <h4>₹{(ownerStats.totalRevenue || 0).toLocaleString()}</h4>
                    <p>Total Revenue</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <h4>{ownerStats.averageRating || 0}</h4>
                    <p>Average Rating</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-stats">
                <p>No statistics available yet. Start listing properties to see your performance metrics.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="settings-content">
          <div className="settings-card">
            <h3>Account Settings</h3>
            <div className="settings-sections">
              <div className="setting-group">
                <h4>Notification Preferences</h4>
                <div className="setting-item">
                  <label className="setting-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                    <span className="setting-label">Email notifications for new inquiries</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label className="setting-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                    <span className="setting-label">SMS notifications for rent payments</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label className="setting-toggle">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                    <span className="setting-label">Monthly performance reports</span>
                  </label>
                </div>
              </div>

              <div className="setting-group">
                <h4>Privacy Settings</h4>
                <div className="setting-item">
                  <label className="setting-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                    <span className="setting-label">Show profile to verified tenants only</span>
                  </label>
                </div>
                <div className="setting-item">
                  <label className="setting-toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                    <span className="setting-label">Display contact information publicly</span>
                  </label>
                </div>
              </div>

              <div className="setting-group">
                <h4>Account Actions</h4>
                <div className="setting-actions">
                  <button className="btn-secondary">Export My Data</button>
                  <button className="btn-secondary">Download Property Reports</button>
                  <button className="btn-danger">Delete Account</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="edit-profile-overlay">
          <div className="edit-profile-modal">
            <h3>Edit Profile</h3>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            <div className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Your company name (optional)"
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell tenants about yourself and your properties..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your complete address"
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                  />
                </div>
                <div className="form-group">
                  <label>PIN Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="PIN Code"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={handleCancel} disabled={loading}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={loading || !formData.name.trim()}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
