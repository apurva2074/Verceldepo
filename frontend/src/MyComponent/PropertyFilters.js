import React, { useState } from "react";
import "./PropertyFilters.css";

export default function PropertyFilters({ filters, onFilterChange }) {
  const [expandedSections, setExpandedSections] = useState({
    propertyType: true,
    priceRange: true,
    bedrooms: true,
    amenities: false,
    location: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (filterType, value) => {
    onFilterChange(filterType, value);
  };

  return (
    <aside className="property-filters">
      <div className="filters-header">
        <h3 className="filters-title">Filters</h3>
        <button 
          className="clear-filters-btn"
          onClick={() => onFilterChange('clearAll', null)}
        >
          Clear All
        </button>
      </div>

      {/* Property Type */}
      <div className="filter-section">
        <div 
          className="filter-section-header"
          onClick={() => toggleSection('propertyType')}
        >
          <h4>Property Type</h4>
          <svg 
            className={`chevron ${expandedSections.propertyType ? 'expanded' : ''}`}
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {expandedSections.propertyType && (
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.propertyType?.includes('flat') || false}
                onChange={(e) => {
                  const current = filters.propertyType || [];
                  const updated = e.target.checked 
                    ? [...current, 'flat']
                    : current.filter(type => type !== 'flat');
                  handleFilterChange('propertyType', updated);
                }}
              />
              <span className="checkmark"></span>
              <div className="option-content">
                <span className="option-label">Apartment</span>
                <span className="option-count">245</span>
              </div>
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.propertyType?.includes('house_villa') || false}
                onChange={(e) => {
                  const current = filters.propertyType || [];
                  const updated = e.target.checked 
                    ? [...current, 'house_villa']
                    : current.filter(type => type !== 'house_villa');
                  handleFilterChange('propertyType', updated);
                }}
              />
              <span className="checkmark"></span>
              <div className="option-content">
                <span className="option-label">House/Villa</span>
                <span className="option-count">189</span>
              </div>
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.propertyType?.includes('pg') || false}
                onChange={(e) => {
                  const current = filters.propertyType || [];
                  const updated = e.target.checked 
                    ? [...current, 'pg']
                    : current.filter(type => type !== 'pg');
                  handleFilterChange('propertyType', updated);
                }}
              />
              <span className="checkmark"></span>
              <div className="option-content">
                <span className="option-label">PG/Co-living</span>
                <span className="option-count">67</span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="filter-section">
        <div 
          className="filter-section-header"
          onClick={() => toggleSection('priceRange')}
        >
          <h4>Price Range</h4>
          <svg 
            className={`chevron ${expandedSections.priceRange ? 'expanded' : ''}`}
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {expandedSections.priceRange && (
          <div className="filter-options">
            <div className="price-range-inputs">
              <div className="price-input-group">
                <label>Min</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
              </div>
              <div className="price-input-group">
                <label>Max</label>
                <input
                  type="number"
                  placeholder="100000"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>
            </div>
            <div className="price-presets">
              <button 
                className="price-preset-btn"
                onClick={() => handleFilterChange('priceRange', { min: 0, max: 10000 })}
              >
                Under ₹10K
              </button>
              <button 
                className="price-preset-btn"
                onClick={() => handleFilterChange('priceRange', { min: 10000, max: 20000 })}
              >
                ₹10K - ₹20K
              </button>
              <button 
                className="price-preset-btn"
                onClick={() => handleFilterChange('priceRange', { min: 20000, max: 35000 })}
              >
                ₹20K - ₹35K
              </button>
              <button 
                className="price-preset-btn"
                onClick={() => handleFilterChange('priceRange', { min: 35000, max: 999999 })}
              >
                Above ₹35K
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bedrooms */}
      <div className="filter-section">
        <div 
          className="filter-section-header"
          onClick={() => toggleSection('bedrooms')}
        >
          <h4>Bedrooms</h4>
          <svg 
            className={`chevron ${expandedSections.bedrooms ? 'expanded' : ''}`}
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {expandedSections.bedrooms && (
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                name="bedrooms"
                checked={filters.bedrooms === '1' || false}
                onChange={() => handleFilterChange('bedrooms', '1')}
              />
              <span className="radio-mark"></span>
              <span className="option-label">1 BHK</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="bedrooms"
                checked={filters.bedrooms === '2' || false}
                onChange={() => handleFilterChange('bedrooms', '2')}
              />
              <span className="radio-mark"></span>
              <span className="option-label">2 BHK</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="bedrooms"
                checked={filters.bedrooms === '3' || false}
                onChange={() => handleFilterChange('bedrooms', '3')}
              />
              <span className="radio-mark"></span>
              <span className="option-label">3 BHK</span>
            </label>
            <label className="filter-option">
              <input
                type="radio"
                name="bedrooms"
                checked={filters.bedrooms === '4+' || false}
                onChange={() => handleFilterChange('bedrooms', '4+')}
              />
              <span className="radio-mark"></span>
              <span className="option-label">4+ BHK</span>
            </label>
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="filter-section">
        <div 
          className="filter-section-header"
          onClick={() => toggleSection('amenities')}
        >
          <h4>Amenities</h4>
          <svg 
            className={`chevron ${expandedSections.amenities ? 'expanded' : ''}`}
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {expandedSections.amenities && (
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.amenities?.includes('parking') || false}
                onChange={(e) => {
                  const current = filters.amenities || [];
                  const updated = e.target.checked 
                    ? [...current, 'parking']
                    : current.filter(amenity => amenity !== 'parking');
                  handleFilterChange('amenities', updated);
                }}
              />
              <span className="checkmark"></span>
              <span className="option-label">Parking</span>
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.amenities?.includes('gym') || false}
                onChange={(e) => {
                  const current = filters.amenities || [];
                  const updated = e.target.checked 
                    ? [...current, 'gym']
                    : current.filter(amenity => amenity !== 'gym');
                  handleFilterChange('amenities', updated);
                }}
              />
              <span className="checkmark"></span>
              <span className="option-label">Gym</span>
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.amenities?.includes('pool') || false}
                onChange={(e) => {
                  const current = filters.amenities || [];
                  const updated = e.target.checked 
                    ? [...current, 'pool']
                    : current.filter(amenity => amenity !== 'pool');
                  handleFilterChange('amenities', updated);
                }}
              />
              <span className="checkmark"></span>
              <span className="option-label">Swimming Pool</span>
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.amenities?.includes('security') || false}
                onChange={(e) => {
                  const current = filters.amenities || [];
                  const updated = e.target.checked 
                    ? [...current, 'security']
                    : current.filter(amenity => amenity !== 'security');
                  handleFilterChange('amenities', updated);
                }}
              />
              <span className="checkmark"></span>
              <span className="option-label">24/7 Security</span>
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={filters.amenities?.includes('lift') || false}
                onChange={(e) => {
                  const current = filters.amenities || [];
                  const updated = e.target.checked 
                    ? [...current, 'lift']
                    : current.filter(amenity => amenity !== 'lift');
                  handleFilterChange('amenities', updated);
                }}
              />
              <span className="checkmark"></span>
              <span className="option-label">Lift</span>
            </label>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="filter-section">
        <div 
          className="filter-section-header"
          onClick={() => toggleSection('location')}
        >
          <h4>Location</h4>
          <svg 
            className={`chevron ${expandedSections.location ? 'expanded' : ''}`}
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {expandedSections.location && (
          <div className="filter-options">
            <div className="location-search">
              <input
                type="text"
                placeholder="Search by area, city, or locality"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
            <div className="popular-locations">
              <span className="locations-label">Popular Areas:</span>
              <div className="location-chips">
                <button 
                  className="location-chip"
                  onClick={() => handleFilterChange('location', 'Mumbai')}
                >
                  Mumbai
                </button>
                <button 
                  className="location-chip"
                  onClick={() => handleFilterChange('location', 'Delhi')}
                >
                  Delhi
                </button>
                <button 
                  className="location-chip"
                  onClick={() => handleFilterChange('location', 'Bangalore')}
                >
                  Bangalore
                </button>
                <button 
                  className="location-chip"
                  onClick={() => handleFilterChange('location', 'Pune')}
                >
                  Pune
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
