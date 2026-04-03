import React, { useEffect, useState } from "react";
import "./PropertyCard.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/auth";
import { toggleWishlist, isWishlisted } from "../services/wishlistService";
import { fetchUserRole } from "../utils/fetchUserRole";
import ConfirmModal from "./ConfirmModal";

const statusColor = {
  APPROVED: "#10b981",
  PENDING: "#f59e0b",
  REJECTED: "#ef4444",
};

export default function PropertyCard({ p, viewMode = "public", onDelete, layout = "grid" }) {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!user || !p?.id) {
      setWishlistLoading(false);
      return;
    }
    
    const checkWishlistStatus = async () => {
      try {
        console.log('PropertyCard: Checking wishlist for user:', user.uid, 'property:', p.id);
        
        const role = await fetchUserRole(user?.uid);
        setUserRole(role);
        if (role !== 'tenant') {
          console.log('PropertyCard: User is not tenant, skipping wishlist');
          setWishlistLoading(false);
          return;
        }
        
        // NEW: skip API call if no valid token
        const { getAuthToken } = await import('../utils/authToken');
        const token = await getAuthToken();
        console.log('PropertyCard: Token result:', token ? 'valid' : 'null');
        
        if (!token) {
          console.log('PropertyCard: No valid token, skipping wishlist check');
          setWishlistLoading(false);
          return;
        }
        
        console.log('PropertyCard: Making wishlist API call');
        const isLiked = await isWishlisted(p.id);
        setLiked(isLiked);
      } catch (error) {
        console.log('Wishlist check failed:', error.message);
        setLiked(false);
      } finally {
        setWishlistLoading(false);
      }
    };
    
    checkWishlistStatus();
  }, [user, p?.id, p.owner_uid]);

  const handleDelete = async () => {
    if (!user || user.uid !== p.owner_uid) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      // Delete property via backend API
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/properties/${p.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Property Delete API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: `${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/properties/${p.id}`,
          body: errorText
        });
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Delete property failed' };
        }
        
        console.error('Property Delete API Parsed Error:', errorData);
        throw new Error(errorData.message || 'Failed to delete property');
      }
      
      // Call parent callback to refresh list
      if (onDelete) {
        onDelete();
      }
      
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting property:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        propertyId: p.id
      });
      alert("Failed to delete property. Please try again.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const formatPropertyType = (type) => {
  const typeMap = {
    'apartment': 'Apartment',
    'house': 'House', 
    'pg': 'PG',
    'villa': 'Villa',
    'studio': 'Studio'
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

  const getImageUrl = (property) => {
    // Check if property has valid images
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      const firstImage = property.images[0];
      if (typeof firstImage === 'string') {
        return firstImage;
      } else if (firstImage && firstImage.url) {
        return firstImage.url;
      }
    }
    
    // Return null for no image - will be handled by empty state
    return null;
  };

  const imageUrl = getImageUrl(p);

  // Debug logging
  console.log("PropertyCard - Property data:", p);
  console.log("PropertyCard - Images:", p.images);
  console.log("PropertyCard - Images type:", typeof p.images);
  console.log("PropertyCard - Images length:", p.images?.length || 0);
  console.log("PropertyCard - First image:", p.images?.[0]);
  console.log("PropertyCard - First image type:", typeof p.images?.[0]);
  console.log("PropertyCard - Image URL:", imageUrl);
  console.log("PropertyCard - Property type:", p.type);
  console.log("PropertyCard - Address:", p.address);

  const price =
    p.type === "pg"
      ? p.rentPerPerson
        ? `₹${p.rentPerPerson} / person`
        : "—"
      : p.rent
      ? `₹${p.rent} / month`
      : "—";

  const fullAddress = [
    p.address?.line,
    p.address?.city,
    p.address?.state,
    p.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <article className={`pcard ${layout}`}>
        {/* IMAGE */}
        <div className="pcard-media">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={p.title || "Property"}
              onError={(e) => {
                console.error("PropertyCard image failed to load:", {
                  url: imageUrl,
                  imagesArray: p.images,
                  propertyId: p.id,
                  propertyTitle: p.title
                });
                // Hide the image and show empty state
                e.target.style.display = 'none';
                const emptyState = e.target.parentElement.querySelector('.empty-image-state');
                if (emptyState) {
                  emptyState.style.display = 'flex';
                }
              }}
            />
          ) : (
            <div className="empty-image-state">
              <div className="empty-image-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <div className="empty-image-text">No Image</div>
            </div>
          )}

          {p.status && (
            <span
              className="pcard-badge"
              style={{ background: statusColor[p.status] || "#334155" }}
            >
              {p.status}
            </span>
          )}

          {/* WISHLIST */}
          {user && user.uid !== p.owner_uid && (
            <button
              className={`pcard-like ${liked ? "active" : ""} ${wishlistLoading ? "loading" : ""}`}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (wishlistLoading) return;
                
                try {
                  // Check if user is tenant before allowing wishlist action
                  if (userRole !== 'tenant') {
                    alert('Only tenants can add properties to wishlist');
                    return;
                  }
                  
                  const res = await toggleWishlist(p.id);
                  setLiked(res);
                  
                  // You could add a toast notification here if needed
                  // For now, the button state change provides immediate feedback
                } catch (error) {
                  console.error('Failed to update wishlist:', error);
                  
                  // Show user-friendly error messages
                  if (error.message.includes('login')) {
                    alert('Please login to add properties to your wishlist');
                  } else if (error.message.includes('tenant')) {
                    alert('Only tenants can add properties to wishlist');
                  } else {
                    alert('Failed to update wishlist. Please try again.');
                  }
                  
                  // Revert the UI state on error
                  setLiked(!liked);
                }
              }}
              disabled={wishlistLoading}
            >
              {wishlistLoading ? (
                <span className="loading-spinner">⟳</span>
              ) : liked ? (
                <span className="heart-icon">❤️</span>
              ) : (
                <span className="heart-icon">🤍</span>
              )}
            </button>
          )}
        </div>

        {/* BODY */}
        <div className="pcard-body">
          <div className="pcard-price">{price}</div>

          <h4 className="pcard-title">
            {p.title || "Untitled Property"}
          </h4>

          {fullAddress && (
            <p className="pcard-address"> {fullAddress}</p>
          )}

          <div className="pcard-tags">
            <span className="chip">{formatPropertyType(p.type)}</span>
            {p.pgGender && <span className="chip">{p.pgGender}</span>}
            {p.bedrooms && (
              <span className="chip">{p.bedrooms} Bed</span>
            )}
            {p.bathrooms && (
              <span className="chip">{p.bathrooms} Bath</span>
            )}
          </div>

          <div className="pcard-actions">
            <button 
              className="btn-primary full" 
              onClick={() => navigate(`/property/${p.id}`)}
            >
              View Details
            </button>
            
            {/* Delete button for property owners */}
            {user && user.uid === p.owner_uid && (
              <button
                className="btn-danger full"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Property"}
              </button>
            )}
          </div>
        </div>
      </article>
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Property"
        message={`Are you sure you want to delete "${p.title || 'this property'}"? This action cannot be undone and will remove all associated images.`}
        confirmText="Delete Property"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}
