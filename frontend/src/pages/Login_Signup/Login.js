// src/pages/Login_Signup/Login.js
import React, { useState } from "react";
import Header from "../../MyComponent/Header";
import "./Login.css";
import { auth } from "../../firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

// If you created db in src/firebase/firestore.js:
import { db } from "../../firebase/firestore";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const friendlyFirebaseError = (code) => {
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/user-not-found":
        return "No account found for this email.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Check your internet connection.";
      default:
        return "Login failed. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      // 1) Sign in
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // 2) Store token for backend calls (if needed)
      const token = await cred.user.getIdToken(true);
      localStorage.setItem("idToken", token);

      // 3) Fetch user role from Firestore
      const uid = cred.user.uid;
      const snap = await getDoc(doc(db, "users", uid));
      const role = snap.exists() ? snap.data().role : null;

      if (!role) {
        setMsg("Your profile is missing a role. Please sign up again or contact support.");
        return;
      }

      // 4) Redirect by role
      if (role === "owner") navigate("/owner/dashboard");
      else navigate("/tenant/dashboard");

    } catch (err) {
      console.error(err);
      const userMsg = err?.code ? friendlyFirebaseError(err.code) : (err?.message || "Login failed.");
      setMsg(userMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header showAuthButtons={false} />
      <div className="login-container d-flex align-items-center justify-content-center">
        <div className="login-box">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Login to continue to RentIt</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {msg && <p style={{marginTop:12}}>{msg}</p>}

          <div className="text-center mt-3">
            <p>Don’t have an account? <a href="/signup" className="signup-link">Sign Up</a></p>
          </div>
        </div>
      </div>
    </>
  );
}
