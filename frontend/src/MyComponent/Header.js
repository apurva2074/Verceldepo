import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import { auth } from "../firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { fetchUserRole } from "../utils/fetchUserRole";


export default function Header({ showAuthButtons = true }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setRole(null);
        return;
      }

      setUser(u);
      const fetchedRole = await fetchUserRole(u.uid);
      setRole(fetchedRole);
    });

    return () => unsub();
  }, []);

  const handleProfileClick = () => {
    if (role === "owner") {
      navigate("/owner/dashboard");
    } else if (role === "tenant") {
      navigate("/tenant/dashboard");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/", { replace: true });
  };

  return (
    <header className="rentit-header d-flex flex-wrap align-items-center justify-content-center justify-content-md-between py-3 mb-4 shadow-sm">
      {/* Logo */}
      <div className="col-md-3 mb-2 mb-md-0">
        <Link to="/" className="d-inline-flex align-items-center text-decoration-none">
          <img
            src="/Rentit-logo.png"
            alt="RentIt Logo"
            className="rentit-logo"
          />
        </Link>
      </div>

      {/* Navigation */}
      <ul className="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0 rentit-nav">
        <li><Link to="/" className="nav-link px-3">Home</Link></li>
        <li><Link to="/listings" className="nav-link px-3">Find a Home</Link></li>
        <li><Link to="/contact" className="nav-link px-3">Contact</Link></li>
        <li><Link to="/about" className="nav-link px-3">About</Link></li>
      </ul>

      {/* Right side */}
      <div className="col-md-3 text-end">
        {/* Guest */}
        {!user && showAuthButtons && (
          <>
            <Link to="/login">
              <button
                type="button"
                className="btn btn-outline-primary me-2 rentit-login-btn"
              >
                Login
              </button>
            </Link>
            <Link to="/signup">
              <button
                type="button"
                className="btn btn-primary rentit-cta-btn"
              >
                Sign-Up
              </button>
            </Link>
          </>
        )}

        {/* Logged-in user */}
        {user && (
          <div className="d-inline-flex align-items-center gap-2" >
            <button
              onClick={handleProfileClick}
              className="btn btn-primary userbutton"
            >
              {user.email}
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-outline-primary me-2 lougoutbtn"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
