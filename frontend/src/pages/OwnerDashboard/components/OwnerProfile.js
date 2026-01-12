import React, { useEffect, useMemo, useState } from "react";
import "./OwnerProfile.css";
import { db } from "../../../firebase/firestore";
import { doc, onSnapshot } from "firebase/firestore";

export default function OwnerProfile({ uid, fallbackEmail }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      setProfile({ id: snap.id, ...(snap.data() || {}) });
    });
    return () => unsub();
  }, [uid]);

  const fields = useMemo(()=>["name","email","phone","address","city","state","pincode"],[]);

  const computed = useMemo(()=>{
    if (!profile) return { percent:0, p: { email: fallbackEmail } };
    const p = { email: fallbackEmail, ...profile };
    let filled = 0;
    fields.forEach(k => { if (p[k]?.toString().trim().length > 0) filled++; });
    return { percent: Math.round((filled/fields.length)*100), p };
  },[profile, fallbackEmail, fields]);

  const p = computed.p;

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar">{(p.name?.[0] || "O").toUpperCase()}</div>
        <div className="pmeta">
          <div className="pname">{p.name || "Owner"}</div>
          <div className="pemail">{p.email}</div>
          <div className="pphone">{p.phone || "— add phone"}</div>
        </div>
      </div>

      <div className="meter-wrap">
        <div className="meter-top">
          <div className="num">{computed.percent}%</div>
          <div className="sub">Profile completed</div>
        </div>
        <div className="meter-bar">
          <div className="meter-fill" style={{ width: `${computed.percent}%` }} />
        </div>
      </div>

      <div className="profile-info-grid">
        <div className="info"><div className="label">Address</div><div className="val">{p.address || "—"}</div></div>
        <div className="info"><div className="label">City</div><div className="val">{p.city || "—"}</div></div>
        <div className="info"><div className="label">State</div><div className="val">{p.state || "—"}</div></div>
        <div className="info"><div className="label">PIN</div><div className="val">{p.pincode || "—"}</div></div>
      </div>

      <div className="profile-actions">
        <a className="btn-p btn-primary" href="/owner/edit-profile">Edit Profile</a>
        <a className="btn-p btn-outline" href="/owner/view-profile">View Public</a>
      </div>
    </div>
  );
}