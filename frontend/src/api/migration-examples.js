// Example: How to migrate Login component to use new API layer
// src/pages/Login_Signup/LoginExample.js

import React, { useState } from "react";
import { authAPI } from '../../api'; // Use centralized API

export default function LoginExample() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // NEW: Use centralized auth API
      const result = await authAPI.signIn(email, password, 'owner');
      
      console.log('Login successful:', result.user);
      
      // Navigate based on user role
      if (result.user.role === 'owner') {
        navigate('/owner-dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (error) {
      // Enhanced error handling
      console.error('Login failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Form fields */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

// Example: How to migrate PropertyList component
// src/components/PropertyListExample.js

import React, { useState, useEffect } from "react";
import { propertyAPI } from '../../api'; // Use centralized API

export default function PropertyListExample() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProperties = async () => {
      try {
        // NEW: Use centralized property API
        const data = await propertyAPI.getAllProperties();
        setProperties(data);
      } catch (error) {
        console.error('Failed to load properties:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  if (loading) return <div>Loading properties...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h2>Available Properties</h2>
      {properties.map(property => (
        <div key={property.id} className="property-card">
          <h3>{property.title}</h3>
          <p>{property.address.city}, {property.address.state}</p>
          <p>₹{property.rent}/month</p>
        </div>
      ))}
    </div>
  );
}

// Example: How to migrate AddProperty component
// src/pages/AddProperty/AddPropertyExample.js

import React, { useState } from "react";
import { propertyAPI } from '../../api'; // Use centralized API

export default function AddPropertyExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (propertyData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // NEW: Use centralized property API
      const result = await propertyAPI.addProperty(propertyData);
      
      console.log('Property added:', result);
      setSuccess('Property added successfully!');
      
      // Reset form or redirect
      // resetForm();
      // navigate('/my-properties');
      
    } catch (error) {
      console.error('Failed to add property:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Property form */}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
}
