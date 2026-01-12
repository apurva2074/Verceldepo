import React, { useEffect, useState } from "react";
import Header from "../../MyComponent/Header";
import PropertyCard from "../../MyComponent/PropertyCard";
import "./Listings.css";

import { db } from "../../firebase/firestore";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export default function Listings() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        /* 1️⃣ Fetch APPROVED properties */
        const propQuery = query(
          collection(db, "properties"),
          where("status", "==", "APPROVED")
        );

        const propSnap = await getDocs(propQuery);
        const props = propSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        /* 2️⃣ Fetch media */
        const mediaSnap = await getDocs(collection(db, "property_media"));
        const mediaMap = {};

        mediaSnap.forEach((doc) => {
          const data = doc.data();
          mediaMap[data.propertyId] = data;
        });

        /* 3️⃣ Merge property + media */
        const finalList = props.map((p) => ({
          ...p,
          images: mediaMap[p.id]?.images || [],
          video: mediaMap[p.id]?.video || null,
        }));

        setProperties(finalList);
      } catch (err) {
        console.error("Error fetching listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  return (
    <div>
      <Header />

      <div className="listings-container">
        <h2 className="listings-title">Available Properties</h2>

        {loading && <p>Loading properties...</p>}

        {!loading && properties.length === 0 && (
          <p>No properties available at the moment.</p>
        )}

        <div className="listings-grid">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              p={property}
              viewMode="public"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
