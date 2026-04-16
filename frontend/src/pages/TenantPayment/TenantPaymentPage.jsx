import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getBookingDetails } from "../../services/rentalService";
import "./TenantPayment.css";
import Header from "../../MyComponent/Header";

export default function TenantPaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');

  useEffect(() => {
    // Check if bookingId exists
    if (!bookingId) {
      navigate("/dashboard");
      return;
    }

    // Wait for auth to complete
    if (authLoading) {
      return;
    }

    // Only redirect to login if auth is complete and user is missing
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const bookingData = await getBookingDetails(bookingId);
        
        // Check if booking belongs to current user
        if (bookingData.booking.tenantId !== user.uid) {
          throw new Error('Access denied');
        }

        // Check if booking is in correct status for payment
        if (bookingData.booking.status !== 'pending_payment') {
          throw new Error(`Booking is ${bookingData.booking.status}. Payment is not required.`);
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
  }, [user, authLoading, bookingId, navigate]);

  const getRazorpayMethodConfig = () => {
    switch (selectedPaymentMethod) {
      case 'upi':
        return {
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay using UPI",
                  instruments: [
                    {
                      method: "upi"
                    }
                  ]
                }
              },
              sequence: ["upi"],
              preferences: {
                show_default_blocks: false
              }
            }
          },
          method: {
            upi: true
          }
        };
      case 'card':
        return {
          config: {
            display: {
              blocks: {
                card: {
                  name: "Pay using Card",
                  instruments: [
                    { method: "card" }
                  ]
                }
              },
              sequence: ["card"],
              preferences: {
                show_default_blocks: false
              }
            }
          }
        };
      case 'netbanking':
        return {
          config: {
            display: {
              blocks: {
                netbanking: {
                  name: "Pay using Net Banking",
                  instruments: [
                    { method: "netbanking" }
                  ]
                }
              },
              sequence: ["netbanking"],
              preferences: {
                show_default_blocks: false
              }
            }
          }
        };
      case 'wallet':
        return {
          config: {
            display: {
              blocks: {
                wallet: {
                  name: "Pay using Wallet",
                  instruments: [
                    { method: "wallet" }
                  ]
                }
              },
              sequence: ["wallet"],
              preferences: {
                show_default_blocks: false
              }
            }
          }
        };
      default:
        return {};
    }
  };

  const handlePayment = async () => {
    // We always have a selected method (default: 'upi')
    console.log('🔍 Selected payment method:', selectedPaymentMethod);

    setProcessing(true);
    try {
      // Step 1: Call backend to create Razorpay order
      console.log('🔍 Creating Razorpay order for booking:', bookingId);
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create payment order');
      }

      console.log('🔍 Razorpay order created:', result);

      // Step 2: Initialize Razorpay checkout
      const options = {
        key: result.key,
        amount: result.amount * 100, // Convert to paise
        currency: "INR",
        name: "RentIt",
        description: "Security Deposit Payment",
        order_id: result.orderId,
        
        ...getRazorpayMethodConfig(),
        
        // Removed duplicate to fix build error - keeping the better version below
        // prefill: {
        //   name: user.displayName || "Tenant",
        //   email: user.email || "",
        //   contact: user.phoneNumber || ""
        // },
        
        notes: {
          bookingId: bookingId,
          type: "security_deposit"
        },
        handler: async function (response) {
          console.log('🔍 Razorpay payment successful:', response);
          
          try {
            // Step 3: Verify payment with backend
            const verifyResponse = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${await user.getIdToken()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ...response,
                bookingId
              })
            });

            const verifyResult = await verifyResponse.json();
            
            if (verifyResult.success) {
              alert('Payment Successful! Your booking has been confirmed.');
              navigate(`/tenant/agreement/${bookingId}`);
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.displayName || user.email,
          email: user.email,
          contact: user.phoneNumber || ''
        },
        theme: {
          color: "#3399cc"
        },
        modal: {
          ondismiss: function() {
            console.log('🔍 Razorpay modal dismissed');
            setProcessing(false);
          },
          escape: function() {
            console.log('🔍 Razorpay modal escaped');
            setProcessing(false);
          }
        }
      };

      // Show helpful message before opening Razorpay
      alert("You will be asked to enter your phone number for secure payment verification. Your details have been pre-filled for convenience.");

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Payment error:", error);
      alert('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const calculateTotalAmount = () => {
    if (!booking) return 0;
    
    // Only charge security deposit for initial payment
    const deposit = booking.booking.proposedDeposit || 0;
    return deposit;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="tenant-payment-loading">
          <div className="loading-container">
            <div className="spinner"></div>
            <h3>Loading Payment Details...</h3>
            <p>Preparing your payment information</p>
          </div>
        </div>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <Header />
        <div className="tenant-payment-error">
          <div className="error-container">
            <h2>Booking Not Found</h2>
            <p>The booking you're trying to pay for doesn't exist.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Go to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  const totalAmount = calculateTotalAmount();

  return (
    <>
      <Header />
      
      <div className="tenant-payment-wrapper">
        <div className="tenant-payment-container">
          {/* Booking Summary Card */}
          <div className="booking-summary-card">
            <h1>Complete Your Rental Booking</h1>
            <div className="property-info">
              <h2>{booking.property.title}</h2>
              <p className="address">
                {typeof booking.property.address === 'string' 
                  ? booking.property.address 
                  : `${booking.property.address?.line || ''}, ${booking.property.address?.city || ''}, ${booking.property.address?.state || ''}`
                }
              </p>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="payment-details-card">
            <h2>Payment Details</h2>
            <div className="payment-breakdown">
              <div className="payment-row">
                <span>Monthly Rent:</span>
                <span>₹{booking.booking.proposedRent?.toLocaleString() || 0} <small style={{color: '#666', fontSize: '12px'}}>(to be paid monthly)</small></span>
              </div>
              <div className="payment-row">
                <span>Security Deposit:</span>
                <span>₹{booking.booking.proposedDeposit?.toLocaleString() || 0}</span>
              </div>
              <div className="payment-row">
                <span>Lease Duration:</span>
                <span>{booking.booking.tenantDetails?.leaseDuration || 1} months</span>
              </div>
              <div className="payment-row total">
                <span>Security Deposit (Payable Now):</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="payment-method-card">
            <h2>Select Payment Method</h2>
            <div className="payment-options">
              <div 
                className={`payment-option ${selectedPaymentMethod === 'upi' ? 'selected' : ''}`}
                onClick={() => setSelectedPaymentMethod('upi')}
              >
                <div className="payment-icon">📱</div>
                <div className="payment-content">
                  <h3>UPI</h3>
                  <p>Pay using UPI apps like GPay, PhonePe, Paytm</p>
                </div>
              </div>
              
              <div 
                className={`payment-option ${selectedPaymentMethod === 'card' ? 'selected' : ''}`}
                onClick={() => setSelectedPaymentMethod('card')}
              >
                <div className="payment-icon">💳</div>
                <div className="payment-content">
                  <h3>Credit/Debit Card</h3>
                  <p>Pay securely with your credit or debit card</p>
                </div>
              </div>
              
              <div 
                className={`payment-option ${selectedPaymentMethod === 'netbanking' ? 'selected' : ''}`}
                onClick={() => setSelectedPaymentMethod('netbanking')}
              >
                <div className="payment-icon">🏦</div>
                <div className="payment-content">
                  <h3>Net Banking</h3>
                  <p>Pay through your bank's net banking portal</p>
                </div>
              </div>
              
              <div 
                className={`payment-option ${selectedPaymentMethod === 'wallet' ? 'selected' : ''}`}
                onClick={() => setSelectedPaymentMethod('wallet')}
              >
                <div className="payment-icon">👛</div>
                <div className="payment-content">
                  <h3>Wallet</h3>
                  <p>Pay using popular wallet services</p>
                </div>
              </div>
            </div>
          </div>

          {/* Proceed to Pay Button */}
          <div className="payment-action">
            <button 
              className="proceed-to-pay-btn"
              onClick={handlePayment}
              disabled={!selectedPaymentMethod || processing}
            >
              {processing ? (
                <>
                  <div className="payment-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Pay ₹{totalAmount.toLocaleString()}
                </>
              )}
            </button>
            
            <p className="security-note">
              🔒 Your payment information is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
