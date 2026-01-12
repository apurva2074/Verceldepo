import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home/Home";
import Login from "./pages/Login_Signup/Login";
import Signup from "./pages/Login_Signup/Signup";
import Listings from "./pages/Listings/Listings";

import OwnerDashboard from "./pages/OwnerDashboard/OwnerDashboard";
import AddPropertyPage from "./pages/AddProperty/AddProperty";
import ProtectedRoute from "./utils/ProtectedRoute";
import PropertyDetails from "./pages/PropertyDetails/PropertyDetails";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/property/:id" element={<PropertyDetails />} />


        {/* Owner routes */}
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/add-property"
          element={
            <ProtectedRoute>
              <AddPropertyPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
