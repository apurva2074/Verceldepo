// src/pages/Login_Signup/Login.js
import React, { useState } from "react";
import Header from "../../MyComponent/Header";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { professionalLogin, professionalLogout } from "../../utils/professionalAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("owner"); // For UI display only
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  };

  const validateField = (field, value) => {
    let error = "";
    switch (field) {
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, field === "email" ? email : password);
    setErrors({ ...errors, [field]: error });
  };

  const handleInputChange = (field, value) => {
    if (field === "email") {
      setEmail(value);
    } else if (field === "password") {
      setPassword(value);
    } else if (field === "userType") {
      setUserType(value);
    }
    
    // Clear error for this field if user starts typing
    if (touched[field]) {
      const error = validateField(field, field === "email" ? email : field === "password" ? password : userType);
      setErrors({ ...errors, [field]: error });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.email = validateEmail(email);
    newErrors.password = validatePassword(password);
    
    // Add role validation
    if (!userType || (userType !== "owner" && userType !== "tenant")) {
      newErrors.userType = "Please select your account type";
    }
    
    setErrors(newErrors);
    setTouched({ email: true, password: true, userType: true });
    return !newErrors.email && !newErrors.password && !newErrors.userType;
  };

  const friendlyFirebaseError = (code) => {
    switch (code) {
      case "auth/user-not-found":
        return "No account found with this email address. Please check your email or sign up.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again or reset your password.";
      case "auth/invalid-credential":
        return "Invalid email or password. Please check your credentials and try again.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please wait a few minutes before trying again.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection and try again.";
      case "auth/invalid-email":
        return "Invalid email format. Please enter a valid email address.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      case "auth/email-already-in-use":
        return "This email is already registered. Please use a different email or sign in.";
      case "auth/weak-password":
        return "Password is too weak. Please choose a stronger password.";
      default:
        return "Login failed. Please check your credentials and try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Use professional login with role verification
      const result = await professionalLogin(email, password, userType);
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
      
      console.log(`Professional login successful - Role: ${result.role}, Email: ${result.user.email}`);
      
      // Check if user's actual role matches their selection
      if (result.role !== userType) {
        // Role mismatch - logout user and show error
        await professionalLogout();
        throw new Error(`Incorrect role selected. You selected "${userType}" but your account is registered as "${result.role}". Please select the correct role and try again.`);
      }
      
      // Redirect based on verified role
      if (result.role === "owner") {
        navigate("/owner/dashboard");
      } else if (result.role === "tenant") {
        navigate("/dashboard");
      } else {
        throw new Error('Invalid user role detected.');
      }

    } catch (err) {
      console.error("Login error:", err);
      
      // Handle different error types
      let userMsg = "Login failed. Please try again.";
      
      if (err.code) {
        userMsg = friendlyFirebaseError(err.code);
      } else if (err.message) {
        userMsg = err.message;
      }
      
      setMsg(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // TODO: Implement social login
    console.log(`Login with ${provider}`);
  };

  return (
    <>
      <Header showAuthButtons={false} />
      <div className="login-page">
        <div className="login-container">
          {/* Left Side - Branding */}
          <div className="login-branding">
            <div className="branding-content">
              <div className="brand-logo">
                <h1>RentIt</h1>
                <p>Professional Property Rental Platform</p>
              </div>
              
              <div className="branding-features">
                <div className="feature-item">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <div className="feature-text">
                    <h4>10,000+ Properties</h4>
                    <p>Find your perfect home from thousands of listings</p>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                  </div>
                  <div className="feature-text">
                    <h4>Verified Listings</h4>
                    <p>All properties are verified by our team</p>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div className="feature-text">
                    <h4>Direct Communication</h4>
                    <p>Connect directly with property owners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="login-form-section">
            <div className="login-form-container">
              <div className="login-header">
                <h2>Welcome Back</h2>
                <p>Sign in to your account to continue</p>
              </div>

              {/* User Type Selection */}
              <div className="user-type-selector">
                <label className="selector-label">I am a *</label>
                <div className="user-type-options">
                  <button
                    type="button"
                    className={`user-type-btn ${userType === "owner" ? "active" : ""} ${errors.userType ? 'error' : ''}`}
                    onClick={() => {
                      setUserType("owner");
                      handleInputChange("userType", "owner");
                    }}
                  >
                    Property Owner
                  </button>
                  <button
                    type="button"
                    className={`user-type-btn ${userType === "tenant" ? "active" : ""} ${errors.userType ? 'error' : ''}`}
                    onClick={() => {
                      setUserType("tenant");
                      handleInputChange("userType", "tenant");
                    }}
                  >
                    Tenant
                  </button>
                </div>
                <small className="role-hint">Select your account type (required)</small>
                {touched.userType && errors.userType && (
                  <span className="error-message role-error">{errors.userType}</span>
                )}
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="login-form" noValidate>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <input
                      type="email"
                      id="email"
                      className={`form-input ${touched.email && errors.email ? 'error' : ''}`}
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      autoComplete="email"
                      required
                    />
                  </div>
                  {touched.email && errors.email && (
                    <span className="error-message">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      className={`form-input ${touched.password && errors.password ? 'error' : ''}`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      onBlur={() => handleBlur("password")}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <span className="error-message">{errors.password}</span>
                  )}
                </div>

                <div className="form-options">
                  <label className="checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Remember me
                  </label>
                  <a href="/forgot-password" className="forgot-link">
                    Forgot Password?
                  </a>
                </div>

                {msg && (
                  <div className={`message ${msg.includes("success") ? "success" : "error"}`}>
                    {msg}
                  </div>
                )}

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="login-divider">
                <span>OR</span>
              </div>

              <div className="social-login">
                <button type="button" className="social-btn google" onClick={() => handleSocialLogin('google')}>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="signup-link">
                <p>
                  Don't have an account? <a href="/signup" className="signup-link">Sign up</a>
                </p>
              </div>

              <div className="login-footer">
                <p>
                  By signing in, you agree to our{" "}
                  <a href="/terms">Terms of Service</a> and{" "}
                  <a href="/privacy">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
