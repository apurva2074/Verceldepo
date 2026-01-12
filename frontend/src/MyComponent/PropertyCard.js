import React, { useEffect, useState } from "react";
import "./PropertyCard.css";
import { auth } from "../firebase/auth";
import { toggleWishlist, isWishlisted } from "../utils/wishlist";

const statusColor = {
  APPROVED: "#10b981",
  PENDING: "#f59e0b",
  REJECTED: "#ef4444",
};

export default function PropertyCard({ p, viewMode = "public" }) {
  const user = auth.currentUser;
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!user || !p?.id) return;
    isWishlisted(p.id, user.uid).then(setLiked);
  }, [user, p?.id]);

  const imageUrl =
    p.images && p.images.length > 0
      ? p.images[0].url
      : "https://images.unsplash.com/photo-1560185127-6c6d6f4b4f8d?w=1200&q=80&auto=format&fit=crop";

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
    <article className="pcard">
      {/* IMAGE */}
      <div className="pcard-media">
        <img src={imageUrl} alt={p.title || "Property"} />

        {p.status && (
          <span
            className="pcard-badge"
            style={{ background: statusColor[p.status] || "#334155" }}
          >
            {p.status}
          </span>
        )}

        {/* ❤️ WISHLIST */}
        {user && user.uid !== p.owner_uid && (
          <button
            className={`pcard-like ${liked ? "active" : ""}`}
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const res = await toggleWishlist(p.id, user.uid);
              setLiked(res);
            }}
          >
            {liked ? "❤️" : "🤍"}
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
          <span className="chip">{p.type}</span>
          {p.pgGender && <span className="chip">{p.pgGender}</span>}
          {p.rooms?.bedroom && (
            <span className="chip">{p.rooms.bedroom} Bed</span>
          )}
        </div>

        <div className="pcard-actions">
          <a className="btn-primary full" href={`/property/${p.id}`}>
            View Details
          </a>
        </div>
      </div>
    </article>
  );
}
