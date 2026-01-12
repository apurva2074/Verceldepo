import React, { useEffect, useState } from "react";

import "./AddProperty.css";
import { auth, app } from "../../firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import api from "../../utils/api";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/firestore";
import { useNavigate } from "react-router-dom";

const storage = getStorage(app);

/* ================= ROOM CONFIG ================= */
const ROOM_CONFIG = {
  flat: [
    "living_room",
    "bedroom",
    "kitchen",
    "bathroom",
    "toilet",
    "balcony",
    "dining_area",
    "store_room",
  ],
  house_villa: [
    "living_room",
    "bedroom",
    "kitchen",
    "bathroom",
    "toilet",
    "balcony",
    "dining_area",
    "store_room",
  ],
  pg: [
    "bedroom",
    "bathroom",
    "toilet",
    "common_area",
    "kitchen",
    "dining_area",
  ],
};

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  /* ================= BASIC DETAILS ================= */
  const [ptype, setPtype] = useState("");
  const [pgGender, setPgGender] = useState("");
  const [title, setTitle] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  /* ================= ROOMS ================= */
  const [rooms] = useState({
    bedroom: 1,
    bathroom: 1,
    toilet: 1,
  });

  /* ================= DYNAMIC ROOM UPLOADS ================= */
  const [roomUploads, setRoomUploads] = useState({});

  /* ================= VIDEO ================= */
  const [videoFile, setVideoFile] = useState(null);

  /* ================= RENT ================= */
  const [rentMonthly, setRentMonthly] = useState("");
  const [rentPerPerson, setRentPerPerson] = useState("");

  /* ================= UI ================= */
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* ================= INIT ROOMS ON TYPE CHANGE ================= */
  useEffect(() => {
    if (!ptype) return;

    const roomList = ROOM_CONFIG[ptype] || [];
    const initial = {};

    roomList.forEach((room) => {
      initial[room] = [];
    });

    setRoomUploads(initial);
  }, [ptype]);

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!currentUser) {
      setMsg("Please login again.");
      return false;
    }

    if (!ptype) {
      setMsg("Select property type.");
      return false;
    }

    if (ptype === "pg" && !pgGender) {
      setMsg("Select PG type.");
      return false;
    }

    if (!title.trim()) {
      setMsg("Enter property title.");
      return false;
    }

    if (!addressLine || !city || !state || !pincode) {
      setMsg("Complete address is required.");
      return false;
    }

    if (ptype !== "pg" && !rentMonthly) {
      setMsg("Enter monthly rent.");
      return false;
    }

    if (ptype === "pg" && !rentPerPerson) {
      setMsg("Enter rent per person.");
      return false;
    }

    return true;
  };


  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!validate()) return;

    try {
      setLoading(true);

      /* 1️⃣ CREATE PROPERTY VIA BACKEND */
      const res = await api.post("/api/properties", {
        title,
        address: { line: addressLine, city, state, pincode },
        type: ptype,
        pgGender: ptype === "pg" ? pgGender : null,
        rent: ptype === "pg" ? null : Number(rentMonthly),
        rentPerPerson: ptype === "pg" ? Number(rentPerPerson) : null,
        rooms,
      });

      const propertyId = res.data.propertyId;

      /* 2️⃣ UPLOAD ROOM IMAGES */
      const images = [];

      for (const room of Object.keys(roomUploads)) {
        for (let i = 0; i < roomUploads[room].length; i++) {
          const file = roomUploads[room][i];
          const path = `properties/${currentUser.uid}/${propertyId}/${room}_${i}`;
          const sref = ref(storage, path);
          await uploadBytes(sref, file);
          const url = await getDownloadURL(sref);
          images.push({ type: room, url });
        }
      }

      /* 3️⃣ UPLOAD VIDEO (OPTIONAL) */
      let videoUrl = null;
      if (videoFile) {
        const vref = ref(
          storage,
          `properties/${currentUser.uid}/${propertyId}/video`
        );
        await uploadBytes(vref, videoFile);
        videoUrl = await getDownloadURL(vref);
      }

      /* 4️⃣ SAVE MEDIA METADATA */
      await addDoc(collection(db, "property_media"), {
        propertyId,
        ownerId: currentUser.uid,
        images,
        video: videoUrl,
        created_at: Timestamp.now(),
      });

      setMsg("Property added successfully");
      navigate("/owner/dashboard", { replace: true });

    } catch (err) {
      console.error(err);
      setMsg(
        err?.response?.data?.message ||
          err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="ap-wrapper">
      <div className="ap-card">
        <h2>Add Property</h2>
        <p className="ap-sub">Fill property details and upload room photos.</p>

        <form onSubmit={handleSubmit} className="ap-form">
          {/* PROPERTY TYPE */}
          <div className="ap-field">
            <label>Property Type</label>
            <select value={ptype} onChange={(e) => setPtype(e.target.value)}>
              <option value="">Select</option>
              <option value="flat">Flat</option>
              <option value="house_villa">House / Villa</option>
              <option value="pg">PG</option>
            </select>
          </div>

          {/* PG TYPE */}
          {ptype === "pg" && (
            <div className="ap-field">
              <label>PG Type</label>
              <select
                value={pgGender}
                onChange={(e) => setPgGender(e.target.value)}
              >
                <option value="">Select</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="coed">Co-ed</option>
              </select>
            </div>
          )}

          {/* BASIC INFO */}
          <div className="ap-field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="ap-grid-2">
            <div className="ap-field">
              <label>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="ap-field">
              <label>State</label>
              <input value={state} onChange={(e) => setState(e.target.value)} />
            </div>
          </div>

          <div className="ap-field">
            <label>Address</label>
            <input
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
            />
          </div>

          <div className="ap-grid-2">
            <div className="ap-field">
              <label>Pincode</label>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </div>

            {ptype !== "pg" && (
              <div className="ap-field">
                <label>Monthly Rent</label>
                <input
                  type="number"
                  value={rentMonthly}
                  onChange={(e) => setRentMonthly(e.target.value)}
                />
              </div>
            )}
          </div>

          {ptype === "pg" && (
            <div className="ap-field">
              <label>Rent per person</label>
              <input
                type="number"
                value={rentPerPerson}
                onChange={(e) => setRentPerPerson(e.target.value)}
              />
            </div>
          )}

          {/* ROOM UPLOADS */}
          <div className="room-uploads">
            <h4>Room Photos</h4>

            {Object.keys(roomUploads).map((room) => (
              <div key={room} className="ap-field">
                <label>
                  {room.replace("_", " ").toUpperCase()} Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    setRoomUploads((prev) => ({
                      ...prev,
                      [room]: [...prev[room], ...Array.from(e.target.files)],
                    }))
                  }
                />
                {roomUploads[room]?.length > 0 && (
                  <p className="muted">
                    {roomUploads[room].length} image(s) selected
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* VIDEO */}
          <div className="ap-field">
            <label>Property Video (optional)</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
            />
          </div>

          <div className="ap-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Property"}
            </button>
          </div>

          {msg && <p className="form-msg">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
