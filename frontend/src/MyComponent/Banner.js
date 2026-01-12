import React from "react";
import "./Banner.css";
import { useNavigate } from "react-router-dom";

export default function Banner() {
  const navigate = useNavigate();   

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/listings");
  };

  return (
    <section className="banner d-flex align-items-center">
      <div className="container text-center">
        {/* Headline */}
        <h1 className="banner-title">Find Your Perfect Rental Home</h1>

        {/* Subtitle */}
        <p className="banner-subtitle">
          Browse verified rental properties with ease. List, search, and book —
          all in one cloud-based platform.
        </p>

        {/* Search Bar */}
        <form
          className="search-bar d-flex justify-content-center"
          onSubmit={handleSearch}
        >
          <input
            type="text"
            placeholder="Enter city or location"
            className="form-control search-input"
          />
          <select className="form-select search-select">
            <option>Property Type</option>
            <option>House</option>
            <option>Flat</option>
            <option>PG</option>
          </select>
          <input
            type="number"
            placeholder="Max Budget (₹)"
            className="form-control search-input"
          />
          <button type="submit" className="btn btn-primary search-btn">
            Search
          </button>
        </form>

        {/* CTA Buttons */}
        <div className="cta-buttons mt-4">
          <button
            className="btn btn-outline-light me-2"
            onClick={() => navigate("/listings")}
          >
            Browse Properties
          </button>
        </div>
      </div>
    </section>
  );
}
