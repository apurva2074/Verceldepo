import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getBookingDetails, formatBookingStatus } from "../../services/rentalService";
import "./BookingSuccess.css";
import Header from "../../MyComponent/Header";

export default function BookingSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) {
      navigate('/dashboard');
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const bookingData = await getBookingDetails(id);
        
        // Check if booking belongs to current user
        if (bookingData.booking.tenantId !== user.uid) {
          throw new Error('Access denied');
        }

        // Check if booking is confirmed
        if (bookingData.booking.status !== 'confirmed') {
          throw new Error(`Booking is ${bookingData.booking.status}. This page is only for confirmed bookings.`);
        }

        setBooking(bookingData);
      } catch (error) {
        console.error("Error fetching booking:", error);
        alert(error.message || 'Failed to load booking details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [user, id, navigate]);

  const handleViewDetails = () => {
    navigate(`/booking-details/${id}`);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleContactOwner = () => {
    if (booking && booking.property.owner_uid) {
      navigate(`/chat/${[user.uid, booking.property.owner_uid].sort().join('_')}`);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="booking-success-loading">
          <div className="loading-container">
            <div className="spinner"></div>
            <h3>Loading Booking Details...</h3>
            <p>Preparing your booking confirmation</p>
          </div>
        </div>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <Header />
        <div className="booking-success-error">
          <div className="error-container">
            <h2>Booking Not Found</h2>
            <p>The booking you're looking for doesn't exist.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Go to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  const statusInfo = formatBookingStatus(booking.booking.status);
  const moveInDate = new Date(booking.booking.tenantDetails.moveInDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <Header />
      
      <div className="booking-success-wrapper">
        <div className="booking-success-container">
          {/* Success Header */}
          <div className="success-header">
            <div className="success-icon">Success</div>
            <h1>Booking Confirmed!</h1>
            <p>Your rental booking has been successfully confirmed</p>
          </div>

          {/* Booking Summary Card */}
          <div className="booking-summary-card">
            <div className="card-header">
              <h2>Booking Details</h2>
              <span className={`status-badge ${booking.booking.status}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>
            
            <div className="property-info">
              <h3>{booking.property.title}</h3>
              <p className="address">
                {typeof booking.property.address === 'string' 
                  ? booking.property.address 
                  : `${booking.property.address?.line1 || ''}, ${booking.property.address?.city || ''}, ${booking.property.address?.state || ''}`
                }
              </p>
            </div>

            <div className="booking-details-grid">
              <div className="detail-item">
                <label>Monthly Rent</label>
                <span>₹{booking.booking.propertyDetails.rent.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>Security Deposit</label>
                <span>₹{booking.booking.propertyDetails.securityDeposit.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>Lease Duration</label>
                <span>{booking.booking.tenantDetails.leaseDuration} months</span>
              </div>
              <div className="detail-item">
                <label>Move-in Date</label>
                <span>{moveInDate}</span>
              </div>
            </div>

            <div className="tenant-info">
              <h4>Tenant Information</h4>
              <div className="tenant-details">
                <p><strong>Name:</strong> {booking.booking.tenantDetails.fullName}</p>
                <p><strong>Email:</strong> {booking.booking.tenantDetails.email}</p>
                <p><strong>Phone:</strong> {booking.booking.tenantDetails.phone}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="next-steps-card">
            <h2>What's Next?</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Owner Contact</h4>
                  <p>The property owner will contact you within 24 hours to discuss move-in details.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Document Verification</h4>
                  <p>Complete any required document verification as requested by the owner.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Move-in Preparation</h4>
                  <p>Prepare for your move-in date and coordinate with the owner for key handover.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className="info-card">
            <h2>Important Information</h2>
            <div className="info-list">
              <div className="info-item">
                <div className="info-icon">Calendar</div>
                <div className="info-content">
                  <h4>Payment Schedule</h4>
                  <p>Monthly rent is due on the 1st day of each month. Set up automatic payments for convenience.</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">Key</div>
                <div className="info-content">
                  <h4>Security Deposit</h4>
                  <p>Your security deposit will be refunded at the end of the lease period, subject to property condition.</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">Phone</div>
                <div className="info-content">
                  <h4>Communication</h4>
                  <p>Use the in-app chat to communicate with the property owner for any questions or concerns.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn-primary" onClick={handleViewDetails}>
              View Full Details
            </button>
            <button className="btn-secondary" onClick={handleContactOwner}>
              Contact Owner
            </button>
            <button className="btn-outline" onClick={handleGoToDashboard}>
              Go to Dashboard
            </button>
          </div>

          {/* Support Section */}
          <div className="support-section">
            <h3>Need Help?</h3>
            <p>If you have any questions about your booking, our support team is here to help:</p>
            <div className="support-options">
              <div className="support-option">
                <span className="support-icon">Email</span>
                <span>support@rentit.com</span>
              </div>
              <div className="support-option">
                <span className="support-icon">Phone</span>
                <span>1800-RENT-IT (7368-48)</span>
              </div>
              <div className="support-option">
                <span className="support-icon">Chat</span>
                <span>24/7 Live Chat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
