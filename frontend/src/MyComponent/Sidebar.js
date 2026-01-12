import React from "react";
import "./Sidebar.css";
import { Link } from 'react-router-dom';

export default function Sidebar(){
  return (
    <aside className="od-side">
      <div className="brand">
        <div className="logo">
          <Link to="/" className="d-inline-flex align-items-center text-decoration-none">
            <img
              src="/Rentit-logo.png"
              alt="RentIt Logo"
              className="rentit-logo"
            />
          </Link>

        </div>
        <div className="title">
          <div className="big">RentIt</div>
        </div>
      </div>

      <nav className="od-nav">
        <a className="active" href="/owner/dashboard">Dashboard</a>
        <a href="/owner/add-property">Add Property</a>
        <a href="/owner/dashboard#my-properties">My Properties</a>
        <a href="/owner/dashboard#verification">Verification</a>
        <a href="/settings">Settings</a>
      </nav>

      <div className="od-side-footer">
        <a href="/logout" onClick={(e)=>{ e.preventDefault(); localStorage.clear(); window.location.href='/login'; }}>
          Logout
        </a>
      </div>
    </aside>
  );
}

