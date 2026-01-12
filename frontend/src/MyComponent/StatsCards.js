import React from "react";
import "./StatsCards.css";

export default function StatsCards({ stats }) {
  const cards = [
    { title: "Total Listings", value: stats.total, accent: ["#6a9cfb","#4a5ff0"] },
    { title: "Approved", value: stats.approved, accent: ["#4de08a","#16a34a"] },
    { title: "Pending", value: stats.pending, accent: ["#ffd28a","#ff8a3d"] },
    { title: "Rejected", value: stats.rejected, accent: ["#ff9aa2","#ef4444"] },
  ];
  return (
    <div className="stats-wrap">
      {cards.map((c) => (
        <div key={c.title} className="stat-card" style={{ background: `linear-gradient(135deg, ${c.accent[0]}, ${c.accent[1]})` }}>
          <div className="stat-top">
            <div className="stat-val">{c.value}</div>
            <div className="stat-title">{c.title}</div>
          </div>
          <div className="stat-footer">View</div>
        </div>
      ))}
    </div>
  );
}
