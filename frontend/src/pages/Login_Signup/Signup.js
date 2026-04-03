// src/pages/Login_Signup/Signup.js
import React, { useState } from "react";
import Header from "../../MyComponent/Header";
import "./Signup.css";
import { auth } from "../../firebase/auth";
import {
  createUserWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState(""); // "owner" | "tenant"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  const friendlyFirebaseError = (code) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/network-request-failed":
        return "Network error. Check your connection.";
      default:
        return "Signup failed. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!role) {
      setMsg("Please select a user type (Owner or Tenant).");
      return;
    }
    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    let user = null;

    try {
      // 1) Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      user = userCred.user;

      // 2) Get ID token
      const idToken = await user.getIdToken(true);

      // 3) Call backend to create profile
      await axios.post(
        `${apiBase}/api/users/profile`,
        { name, phone, role },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      // 4) Store user role in localStorage for immediate use
      localStorage.setItem('userRole', role);

      setMsg(`Signup successful — ${role === "owner" ? "Owner" : "Tenant"} profile created!`);
      // Optional: redirect after a short delay
      setTimeout(() => navigate("/login"), 800);

      // Clear form
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirm("");
      setRole("");

    } catch (err) {
      console.error(err);

      // If backend failed after user was created, delete the auth user to avoid orphans
      if (user && err?.response?.status >= 400) {
        try { await deleteUser(user); } catch (_) {}
      }

      // Prefer backend message, else Firebase friendly message, else generic
      const backendMsg = err?.response?.data?.message;
      const fbMsg = err?.code ? friendlyFirebaseError(err.code) : null;
      setMsg(backendMsg || fbMsg || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header showAuthButtons={false} />
      <div className="signup-container">
        <div className="signup-wrapper">
          <div className="signup-box">
            <div className="signup-header">
              <div className="signup-logo">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <h2 className="signup-title">Create Account</h2>
              <p className="signup-subtitle">Join RentIt and start your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="signup-form" noValidate>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  pattern="[0-9+\-\s()]{6,}"
                  title="Enter a valid phone number"
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Role Selection */}
              <div className="form-group">
                <label className="form-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  I want to
                </label>
                <div className="role-selector">
                  <div className={`role-option ${role === "owner" ? "active" : ""}`}>
                    <input
                      type="radio"
                      id="owner"
                      name="role"
                      value="owner"
                      checked={role === "owner"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <label htmlFor="owner" className="role-label">
                      <div className="role-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                      </div>
                      <div className="role-content">
                        <h4>Property Owner</h4>
                        <p>List and manage your properties</p>
                      </div>
                    </label>
                  </div>
                  <div className={`role-option ${role === "tenant" ? "active" : ""}`}>
                    <input
                      type="radio"
                      id="tenant"
                      name="role"
                      value="tenant"
                      checked={role === "tenant"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <label htmlFor="tenant" className="role-label">
                      <div className="role-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="8.5" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div className="role-content">
                        <h4>Tenant</h4>
                        <p>Find and rent your perfect home</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="signup-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {msg && (
              <div className={`message ${msg.includes("successful") ? "success" : "error"}`}>
                {msg}
              </div>
            )}

            <div className="signup-footer">
              <p>
                Already have an account?{" "}
                <a href="/login" className="login-link">
                  Sign In
                </a>
              </p>
              <div className="terms-text">
                By creating an account, you agree to our{" "}
                <a href="/terms" className="terms-link">Terms of Service</a> and{" "}
                <a href="/privacy" className="terms-link">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
