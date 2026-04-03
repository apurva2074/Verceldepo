import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home/Home";
import Login from "./pages/Login_Signup/Login";
import Signup from "./pages/Login_Signup/Signup";
import Listings from "./pages/Listings/Listings";

import OwnerDashboard from "./pages/OwnerDashboard/OwnerDashboard";
import AddPropertyPage from "./pages/AddProperty/AddProperty";
import TenantDashboard from "./pages/TenantDashboard/TenantDashboard";
import Chat from "./pages/Chat/Chat";
import ProtectedRoute from "./utils/ProtectedRoute";
import PropertyDetails from "./pages/PropertyDetails/PropertyDetails";
import DocumentVerificationTest from "./pages/DocumentVerificationTest";
import AgreementSelection from "./pages/AgreementSelection/AgreementSelection";
import TenantPaymentPage from './pages/TenantPayment/TenantPaymentPage';
import BookingSuccess from "./pages/BookingSuccess/BookingSuccess";
import TenantAgreement from "./pages/TenantAgreement";
import Contact from "./pages/Contact/Contact";
import About from "./pages/About/About";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy/RefundPolicy";

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
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />


        {/* Owner routes */}
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/add-property"
          element={
            <ProtectedRoute requiredRole="owner">
              <AddPropertyPage />
            </ProtectedRoute>
          }
        />

        {/* Tenant routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="tenant">
              <TenantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rent/:propertyId"
          element={
            <ProtectedRoute requiredRole="tenant">
              <AgreementSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/payment/:bookingId"
          element={
            <ProtectedRoute requiredRole="tenant">
              <TenantPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/agreement/:bookingId"
          element={
            <ProtectedRoute requiredRole="tenant">
              <TenantAgreement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-success/:bookingId"
          element={
            <ProtectedRoute requiredRole="tenant">
              <BookingSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-document-verification"
          element={<DocumentVerificationTest />}
        />
      </Routes>
    </Router>
  );
}

export default App;
