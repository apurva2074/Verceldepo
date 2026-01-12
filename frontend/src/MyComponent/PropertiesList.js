import React from "react";
import "./PropertiesList.css";
import PropertyCard from "./PropertyCard";

export default function PropertiesList({ properties = [], viewMode = "grid" }) {
  if (!properties.length) {
    return <div className="empty">No properties yet — add your first property.</div>;
  }

  return (
    <div className={viewMode === "grid" ? "prop-grid" : "prop-list"}>
      {properties.map(p => <PropertyCard key={p.id} p={p} viewMode={viewMode} />)}
    </div>
  );
}
