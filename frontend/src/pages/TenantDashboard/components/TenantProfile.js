import React, { useEffect, useMemo, useState } from "react";
import "../TenantDashboard.css";
import { db } from "../../../firebase/firestore";
import { doc, onSnapshot } from "firebase/firestore";
import { updateUserProfile, updateProfilePicture } from "../../../services/profileService";

export default function TenantProfile({ uid, fallbackEmail }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
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
        pincode: profileData.pincode || ''
      });
    });
    return () => unsub();
  }, [uid]);

  const fields = useMemo(() => ["name", "email", "phone", "address", "city", "state", "pincode"], []);

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

      console.log('🧪 TenantProfile - Updating profile with data:', updateData);

      // Call backend API
      const response = await updateUserProfile(updateData);
      
      console.log('🧪 TenantProfile - Profile updated successfully:', response);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      
    } catch (error) {
      console.error('🧪 TenantProfile - Error updating profile:', error);
      
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
          
          // Validate the generated data URL
          if (!imageUrl || !imageUrl.startsWith('data:image/')) {
            throw new Error('Invalid image format');
          }
          
          await updateProfilePicture(imageUrl);
          setSuccess('Profile picture updated successfully!');
        } catch (error) {
          console.error('Error updating profile picture:', error);
          setError('Failed to update profile picture: ' + (error.message || 'Unknown error'));
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read image file');
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="profile-section editing">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} alt="Profile" className="profile-picture" />
            ) : (
              (formData.name?.[0] || "T").toUpperCase()
            )}
          </div>
          <div className="profile-info">
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
    <div className="profile-section">
      <h2>My Profile</h2>
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile?.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="profile-picture" />
              ) : (
                (p.name?.[0] || "T").toUpperCase()
              )}
            </div>
            <div className="profile-info">
              <h3>{p.name || "Tenant"}</h3>
              <p>{p.email}</p>
              {p.phone && <p>Phone: {p.phone}</p>}
            </div>
          </div>
          
          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">
                {profile?.created_at ? (profile.created_at.toDate ? new Date(profile.created_at.toDate()).toLocaleDateString() : new Date(profile.created_at).toLocaleDateString()) : 'Unknown'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Profile Completion:</span>
              <span className="detail-value">{computed.percent}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Account Type:</span>
              <span className="detail-value">Tenant</span>
            </div>
          </div>

          <div className="profile-info-grid">
            <div className="info">
              <div className="label">Address</div>
              <div className="val">
                {typeof p.address === 'string' ? p.address : (p.address?.line || p.address?.line1 || "—")}
              </div>
            </div>
            <div className="info">
              <div className="label">City</div>
              <div className="val">{p.city || "—"}</div>
            </div>
            <div className="info">
              <div className="label">State</div>
              <div className="val">{p.state || "—"}</div>
            </div>
            <div className="info">
              <div className="label">PIN</div>
              <div className="val">{p.pincode || "—"}</div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn-secondary" onClick={handleEditClick}>
              Edit Profile
            </button>
            <button className="btn-secondary">Change Password</button>
            <button className="btn-danger">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
