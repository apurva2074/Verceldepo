import React, { useEffect, useState } from "react";
import Header from "../../MyComponent/Header";
import PropertyCard from "../../MyComponent/PropertyCard";
import PropertyFilters from "../../MyComponent/PropertyFilters";
import "./Listings.css";

import { getAllProperties } from "../../services/propertiesService";

export default function Listings() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        console.log("Fetching properties from backend API...");

        /* Fetch all properties with media from backend API */
        const props = await getAllProperties();
        console.log("Properties from API:", props);

        // Properties now include media from backend
        console.log("Properties with images:", props.map(p => ({
          id: p.id,
          title: p.title,
          imagesCount: p.images?.length || 0,
          imagesArray: p.images || [],
          firstImageType: p.images?.[0] ? typeof p.images[0] : 'none',
          firstImageUrl: p.images?.[0]?.url || p.images?.[0] || 'none'
        })));

        setProperties(props);
        setFilteredProperties(props);
        console.log("Final properties list:", props);
        console.log("Number of properties:", props.length);
        
        // If no properties, show a message
        if (props.length === 0) {
          console.log("No properties found in database.");
        }
      } catch (err) {
        console.error("Error fetching listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileFilterOpen(false); // Close mobile filter when switching to desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let filtered = [...properties];

    // Apply filters
    if (filters.propertyType && filters.propertyType.length > 0) {
      filtered = filtered.filter(p => {
        // Map frontend filter values to backend type values
        const typeMap = {
          'flat': 'apartment',
          'house_villa': 'house',
          'pg': 'pg'
        };
        return filters.propertyType.some(filterType => 
          p.type === typeMap[filterType]
        );
      });
    }

    if (filters.minPrice) {
      filtered = filtered.filter(p => {
        const price = p.type === 'pg' ? p.rentPerPerson : p.rent;
        return price >= parseInt(filters.minPrice);
      });
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(p => {
        const price = p.type === 'pg' ? p.rentPerPerson : p.rent;
        return price <= parseInt(filters.maxPrice);
      });
    }

    if (filters.priceRange) {
      filtered = filtered.filter(p => {
        const price = p.type === 'pg' ? p.rentPerPerson : p.rent;
        if (filters.priceRange.min) {
          if (price < filters.priceRange.min) return false;
        }
        if (filters.priceRange.max && filters.priceRange.max < 999999) {
          if (price > filters.priceRange.max) return false;
        }
        return true;
      });
    }

    if (filters.bedrooms) {
      if (filters.bedrooms === '4+') {
        filtered = filtered.filter(p => p.bedrooms >= 4);
      } else {
        filtered = filtered.filter(p => p.bedrooms === parseInt(filters.bedrooms));
      }
    }

    if (filters.location) {
      filtered = filtered.filter(p => {
        const address = p.address || {};
        const searchText = filters.location.toLowerCase();
        return (
          address.city?.toLowerCase().includes(searchText) ||
          address.state?.toLowerCase().includes(searchText) ||
          address.line?.toLowerCase().includes(searchText) ||
          address.landmark?.toLowerCase().includes(searchText)
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = a.type === 'pg' ? a.rentPerPerson : a.rent;
          const priceB = b.type === 'pg' ? b.rentPerPerson : b.rent;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = a.type === 'pg' ? a.rentPerPerson : a.rent;
          const priceB = b.type === 'pg' ? b.rentPerPerson : b.rent;
          return priceB - priceA;
        });
        break;
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.created_at?.toDate?.() || new Date(0);
          const dateB = b.created_at?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default:
        break;
    }

    setFilteredProperties(filtered);
  }, [properties, filters, sortBy]);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'clearAll') {
      setFilters({});
    } else {
      setFilters(prev => ({
        ...prev,
        [filterType]: value
      }));
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.propertyType?.length) count++;
    if (filters.minPrice || filters.maxPrice || filters.priceRange) count++;
    if (filters.bedrooms) count++;
    if (filters.location) count++;
    if (filters.amenities?.length) count++;
    return count;
  };

  return (
    <div>
      <Header />
      
      <div className="listings-page">
        <div className="listings-layout">
          {/* Mobile Filter Toggle Button */}
          {isMobile && (
            <button 
              className="mobile-filter-toggle"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
              Filters
              {getActiveFiltersCount() > 0 && (
                <span className="filter-count">{getActiveFiltersCount()}</span>
              )}
            </button>
          )}

          {/* Filters Sidebar - Hidden on mobile unless toggled */}
          <div className={`filters-sidebar ${isMobile ? 'mobile' : ''} ${isMobileFilterOpen ? 'open' : ''}`}>
            <PropertyFilters 
              filters={filters} 
              onFilterChange={handleFilterChange} 
            />
            {isMobile && (
              <button 
                className="mobile-filter-close"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Close Filters
              </button>
            )}
          </div>

          {/* Mobile Filter Overlay */}
          {isMobile && isMobileFilterOpen && (
            <div 
              className="mobile-filter-overlay"
              onClick={() => setIsMobileFilterOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="listings-main">
            {/* Header */}
            <div className="listings-header">
              <div className="listings-header-left">
                <h1 className="listings-title">
                  Available Properties
                  <span className="results-count">
                    {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'}
                  </span>
                </h1>
                {getActiveFiltersCount() > 0 && (
                  <button className="clear-filters-text" onClick={clearFilters}>
                    Clear {getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''}
                  </button>
                )}
              </div>

              <div className="listings-header-right">
                <div className="view-toggle">
                  <button 
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="sort-dropdown">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading properties...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredProperties.length === 0 && (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <h3>No properties found</h3>
                <p>
                  {properties.length === 0 
                    ? "There are no properties listed yet. Properties will appear here once they are added."
                    : "Try adjusting your filters or search criteria"
                  }
                </p>
                {properties.length === 0 && (
                  <div className="empty-state-actions">
                    <a href="/login" className="btn-primary">
                      Add Property
                    </a>
                    <a href="/signup" className="btn-secondary">
                      Create Account
                    </a>
                  </div>
                )}
                {properties.length > 0 && (
                  <button className="btn-primary" onClick={clearFilters}>
                    Clear All Filters
                  </button>
                )}
              </div>
            )}

            {/* Properties Grid/List */}
            {!loading && filteredProperties.length > 0 && (
              <div className={`listings-container ${viewMode}`}>
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    p={property}
                    viewMode="public"
                    layout={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
