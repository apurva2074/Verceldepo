import React from "react";
import "./PropertiesList.css";
import PropertyCard from "./PropertyCard";

export default function PropertiesList({ properties = [], viewMode = "grid", onDelete }) {
  // Ensure properties is always an array
  const safeProperties = Array.isArray(properties) ? properties : [];
  
  if (!safeProperties.length) {
    return <div className="empty">No properties yet — add your first property.</div>;
  }

  return (
    <div className={viewMode === "grid" ? "prop-grid" : "prop-list"}>
      {safeProperties.map(p => <PropertyCard key={p.id} p={p} viewMode={viewMode} onDelete={onDelete} />)}
    </div>
  );
}
