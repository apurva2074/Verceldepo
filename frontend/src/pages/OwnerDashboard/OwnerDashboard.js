import React, { useEffect, useMemo, useState } from "react";
import "./OwnerDashboard.css";
import Sidebar from "../../MyComponent/Sidebar";
import Topbar from "../../MyComponent/Topbar";
import StatsCards from "../../MyComponent/StatsCards";
import PropertiesList from "../../MyComponent/PropertiesList";
import OwnerProfile from "./components/OwnerProfile";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/auth";
import { db } from "../../firebase/firestore";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserRole } from "../../utils/fetchUserRole";

export default function OwnerDashboard() {
  const [user, setUser] = useState(null);
  const [roleChecked, setRoleChecked] = useState(false);

  const [properties, setProperties] = useState([]);
  const [mediaMap, setMediaMap] = useState({});

  const [filterQ, setFilterQ] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const navigate = useNavigate();

  /* 🔐 AUTH + ROLE GUARD */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setRoleChecked(true);
        navigate("/login");
        return;
      }

      setUser(u);

      const role = await fetchUserRole(u.uid);
      if (role !== "owner") {
        navigate("/tenant/dashboard");
        return;
      }

      setRoleChecked(true);
    });

    return () => unsub();
  }, [navigate]);

  /* 📡 LISTEN TO PROPERTY MEDIA */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "property_media"), (snap) => {
      const map = {};
      snap.docs.forEach((doc) => {
        const data = doc.data();
        map[data.propertyId] = data;
      });
      setMediaMap(map);
    });

    return () => unsub();
  }, []);

  /* 📡 LISTEN TO OWNER PROPERTIES */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "properties"),
      where("owner_uid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const merged = rows.map((p) => ({
        ...p,
        images: mediaMap[p.id]?.images || [],
        video: mediaMap[p.id]?.video || null,
      }));

      setProperties(merged);
    });

    return () => unsub();
  }, [user, mediaMap]);

  /* 📊 STATS */
  const stats = useMemo(() => {
    const total = properties.length;
    const approved = properties.filter(p => p.status === "APPROVED").length;
    const pending = properties.filter(p => p.status === "PENDING").length;
    const rejected = properties.filter(p => p.status === "REJECTED").length;
    return { total, approved, pending, rejected };
  }, [properties]);

  /* 🔍 SEARCH */
  const filtered = useMemo(() => {
    const q = filterQ.trim().toLowerCase();
    if (!q) return properties;

    return properties.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.address?.line || "").toLowerCase().includes(q)
    );
  }, [properties, filterQ]);

  if (!roleChecked) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-area">
        <Topbar
          userEmail={user?.email}
          onSearch={(v) => setFilterQ(v)}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <div className="od-content">
          <div className="dash-grid">
            <div className="left-col">
              <OwnerProfile uid={user?.uid} fallbackEmail={user?.email} />
              <StatsCards stats={stats} />
            </div>

            <div className="right-col">
              <div className="properties-header">
                <div>
                  <h3>Your Properties</h3>
                  <p className="muted">Live preview of your listings</p>
                </div>

                <Link className="btn-add" to="/owner/add-property">
                  + Add Property
                </Link>
              </div>

              <PropertiesList
                properties={filtered}
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
