import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="rentit-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <img
                src="/Rentit-logo.png"
                alt="RentIt Logo"
                className="footer-logo-img"
              />
              <h3>RentIt</h3>
            </div>
            <p>
              Your trusted platform for finding the perfect rental home. 
              Connecting tenants and property owners since 2024.
            </p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/listings">Find a Home</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions">Terms & Conditions</Link></li>
              <li><Link to="/refund-policy">Refund Policy</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact Info</h4>
            <ul className="contact-info">
              <li>
                <strong>Email:</strong> support@rentit.com
              </li>
              <li>
                <strong>Phone:</strong> +1 (555) 123-4567
              </li>
              <li>
                <strong>Address:</strong> 123 RentIt Street, New York, NY 10001
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-divider"></div>
          <div className="footer-bottom-content">
            <p>&copy; 2024 RentIt. All rights reserved.</p>
            <div className="social-links">
              <button className="social-link" aria-label="Facebook">
                <span className="social-icon">f</span>
              </button>
              <button className="social-link" aria-label="Twitter">
                <span className="social-icon">𝕏</span>
              </button>
              <button className="social-link" aria-label="LinkedIn">
                <span className="social-icon">in</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
