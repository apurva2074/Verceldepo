// src/utils/api.js
import axios from "axios";

const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const api = axios.create({
  baseURL: apiBase,
  timeout: 15000,
});

// Attach id token (if present) on each request
api.interceptors.request.use(async (config) => {
  try {
    const token = localStorage.getItem("idToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (err) => Promise.reject(err));

export default api;
