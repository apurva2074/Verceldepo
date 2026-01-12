import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./PropertyDetails.css";

import Header from "../../MyComponent/Header";
import { auth } from "../../firebase/auth";
import { db } from "../../firebase/firestore";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { toggleWishlist, isWishlisted } from "../../utils/wishlist";

export default function PropertyDetails() {
  const { id } = useParams();
  const user = auth.currentUser;

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const propSnap = await getDoc(doc(db, "properties", id));
        if (!propSnap.exists()) return;

        const propData = propSnap.data();

        const mediaSnap = await getDocs(collection(db, "property_media"));
        let imgs = [];

        mediaSnap.forEach((doc) => {
          if (doc.data().propertyId === id) {
            imgs = doc.data().images || [];
          }
        });

        setProperty(propData);
        setImages(imgs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    isWishlisted(id, user.uid).then(setLiked);
  }, [user, id]);

  if (loading) return <p>Loading...</p>;
  if (!property) return <p>Property not found</p>;

  const address = [
    property.address?.line,
    property.address?.city,
    property.address?.state,
    property.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    address
  )}&output=embed`;

  return (
    <>
      <Header />

      <div className="pd-wrapper">
        <div className="pd-top">
          {/* LEFT: IMAGE CAROUSEL */}
          <div className="pd-carousel">
            {images.length > 0 ? (
              <>
                <img
                  src={images[activeIndex]?.url}
                  alt="property"
                  className="pd-main-img"
                />

                <button
                  className="pd-nav left"
                  onClick={() =>
                    setActiveIndex(
                      activeIndex === 0
                        ? images.length - 1
                        : activeIndex - 1
                    )
                  }
                >
                  ‹
                </button>

                <button
                  className="pd-nav right"
                  onClick={() =>
                    setActiveIndex(
                      activeIndex === images.length - 1
                        ? 0
                        : activeIndex + 1
                    )
                  }
                >
                  ›
                </button>

                <div className="pd-thumbs">
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      alt="thumb"
                      className={i === activeIndex ? "active" : ""}
                      onClick={() => setActiveIndex(i)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="pd-placeholder">No images</div>
            )}
          </div>

          {/* RIGHT: DETAILS */}
          <div className="pd-info">
            <h2>{property.title}</h2>
            <p className="pd-location"> {address}</p>

            <div className="pd-price">
              ₹
              {property.type === "pg"
                ? property.rentPerPerson
                : property.rent}
              {property.type === "pg" ? " / person" : " / month"}
            </div>

            <div className="pd-tags">
              <span>{property.type}</span>
              {property.pgGender && <span>{property.pgGender}</span>}
            </div>

            {/* ❤️ WISHLIST */}
            {user && user.uid !== property.owner_uid && (
              <button
                className={`pd-like ${liked ? "active" : ""}`}
                onClick={async () => {
                  const res = await toggleWishlist(id, user.uid);
                  setLiked(res);
                }}
              >
                {liked ? "❤️ Saved" : "🤍 Save"}
              </button>
            )}

            {/* CTA */}
            {user && user.uid !== property.owner_uid && (
              <button className="btn-primary" style={{ marginTop: "14px" }}>
                I’m Interested
              </button>
            )}
          </div>
        </div>

        {/* PROPERTY STATS */}
        <div className="pd-cards">
          <div className="pd-card">
            <span>Bedrooms</span>
            <strong>{property.rooms?.bedroom || "-"}</strong>
          </div>
          <div className="pd-card">
            <span>Bathrooms</span>
            <strong>{property.rooms?.bathroom || "-"}</strong>
          </div>
          <div className="pd-card">
            <span>Toilets</span>
            <strong>{property.rooms?.toilet || "-"}</strong>
          </div>
        </div>

        {/* MAP */}
        <div className="pd-map">
          <h3>Location</h3>
          <iframe title="map" src={mapUrl} loading="lazy"></iframe>
        </div>
      </div>
    </>
  );
}
