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
      <div className="signup-container d-flex align-items-center justify-content-center">
        <div className="signup-box">
          <h2 className="signup-title">Create an Account</h2>
          <p className="signup-subtitle">Join RentIt and start your journey</p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="mb-3">
              <label className="form-label">Full Name</label>
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
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                pattern="^[0-9+\-\s()]{6,}$"
                title="Enter a valid phone number"
              />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
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
            <div className="mb-3">
              <label className="form-label">Select User Type</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">-- Select --</option>
                <option value="owner">Owner</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 signup-btn"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>

          {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

          <div className="text-center mt-3">
            <p>
              Already have an account?{" "}
              <a href="/login" className="login-link">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
