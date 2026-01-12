import React, { useState } from "react";
import "./Topbar.css";

export default function Topbar({ userEmail="", onSearch=()=>{}, viewMode, setViewMode, sortBy, setSortBy }) {
  const [q, setQ] = useState("");

  const onSubmit = (e) => { e.preventDefault(); onSearch(q); };

  return (
    <header className="od-topbar">
      <div className="left">
        <form onSubmit={onSubmit} className="search-form">
          <input placeholder="Search by title or address..." value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="search-btn" type="submit">🔍</button>
        </form>

        <div className="controls">
          <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
            <option value="created_at">Newest</option>
            <option value="price">Price</option>
            <option value="status">Status</option>
          </select>

          <div className="view-toggle">
            <button className={viewMode==="grid"?"active":""} onClick={()=>setViewMode("grid")} aria-label="grid">▦</button>
            <button className={viewMode==="list"?"active":""} onClick={()=>setViewMode("list")} aria-label="list">≡</button>
          </div>
        </div>
      </div>

      <div className="right">
        <div className="user-badge">{userEmail}</div>
      </div>
    </header>
  );
}
