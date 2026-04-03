import React from "react";
import Header from "../../MyComponent/Header";
import Footer from "../../MyComponent/Footer";
import "./RefundPolicy.css";

export default function RefundPolicy() {
  return (
    <div className="refund-policy-page">
      <Header />
      
      <main className="refund-main">
        <div className="container">
          <div className="refund-header">
            <h1>Refund Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="refund-content">
            <section className="refund-section">
              <h2>Overview</h2>
              <p>
                RentIt facilitates rental transactions between tenants and property owners. 
                This refund policy outlines the circumstances under which refunds may be 
                issued for various services and payments processed through our platform.
              </p>
            </section>

            <section className="refund-section">
              <h2>Booking Refunds</h2>
              <h3>Before Booking Confirmation</h3>
              <p>
                Refunds are allowed if the booking has not been confirmed:
              </p>
              <ul>
                <li>Full refund of advance payment and security deposit</li>
                <li>Platform fees may be deducted (maximum 10%)</li>
                <li>Processing time: 5-7 working days</li>
              </ul>

              <h3>After Agreement Confirmation</h3>
              <p>
                Refunds are <strong>not allowed</strong> after rental agreement confirmation:
              </p>
              <ul>
                <li>No refunds for confirmed bookings</li>
                <li>Security deposit handled as per agreement terms</li>
                <li>Monthly payments non-refundable once paid</li>
              </ul>
            </section>

            <section className="refund-section">
              <h2>Failed Payment Refunds</h2>
              <p>
                Automatic refunds are processed for failed payments:
              </p>
              <ul>
                <li>Payment gateway failures → Auto refund initiated</li>
                <li>Technical errors → Full refund within 24 hours</li>
                <li>Duplicate charges → Immediate refund processing</li>
                <li>Timeline: 5-7 working days for bank processing</li>
              </ul>
            </section>

            <section className="refund-section">
              <h2>Refund Processing Timeline</h2>
              <p>
                All approved refunds follow this timeline:
              </p>
              <ul>
                <li>Refund initiation: Within 24 hours of approval</li>
                <li>Payment gateway processing: 2-3 working days</li>
                <li>Bank processing: 3-4 working days</li>
                <li>Total timeline: 5-7 working days</li>
              </ul>
            </section>

            <section className="refund-section">
              <h2>Non-Refundable Items</h2>
              <p>The following items are non-refundable:</p>
              <ul>
                <li>Confirmed rental agreements</li>
                <li>Platform service fees (up to 10% of transaction)</li>
                <li>Document verification charges</li>
                <li>Monthly rent payments</li>
                <li>Penalty charges for late payments</li>
              </ul>
            </section>

            <section className="refund-section">
              <h2>Rental Payments</h2>
              <h3>Pre-move-in Cancellations</h3>
              <p>
                For rental payments made before move-in:
              </p>
              <ul>
                <li>30+ days before move-in: Full refund (excluding service fees)</li>
                <li>15-29 days before move-in: 50% refund (excluding service fees)</li>
                <li>Less than 15 days before move-in: No refund</li>
              </ul>

              <h3>Post-move-in Refunds</h3>
              <p>
                After move-in, refunds are at the discretion of the property owner and 
                subject to the terms of the rental agreement and local laws.
              </p>
            </section>

            <section className="refund-section">
              <h2>Application Fees</h2>
              <p>
                Application fees for background checks and verifications are generally 
                non-refundable as they cover third-party processing costs. Refunds may be 
                considered only if:
              </p>
              <ul>
                <li>Services were not rendered</li>
                <li>Processing errors occurred</li>
                <li>Duplicate charges were made</li>
              </ul>
            </section>

            <section className="refund-section">
              <h2>Dispute Resolution</h2>
              <p>
                If you believe you are entitled to a refund:
              </p>
              <ol>
                <li>Contact the other party directly to resolve the issue</li>
                <li>Document all communications and evidence</li>
                <li>Submit a dispute through our platform</li>
                <li>Our team will review and mediate if necessary</li>
              </ol>
            </section>

            <section className="refund-section">
              <h2>Refund Process</h2>
              <p>
                When a refund is approved:
              </p>
              <ul>
                <li>Refunds are processed to the original payment method</li>
                <li>Processing time: 5-10 business days</li>
                <li>You will receive email confirmation</li>
                <li>Bank processing times may vary</li>
              </ul>
            </section>

            <section className="refund-section">
              <h2>Non-Refundable Items</h2>
              <p>The following items are generally non-refundable:</p>
              <ul>
                <li>Service fees for completed transactions</li>
                <li>Background check and verification fees</li>
                <li>Premium feature subscriptions after 7 days</li>
                <li>Listing fees for active property listings</li>
                <li>Late payment fees</li>
              </ul>
            </section>

            <section className="refund-section">
              <h2>Force Majeure</h2>
              <p>
                RentIt is not responsible for refunds due to events beyond our control, 
                including but not limited to natural disasters, government actions, or 
                public health emergencies.
              </p>
            </section>

            <section className="refund-section">
              <h2>Policy Changes</h2>
              <p>
                We reserve the right to modify this refund policy at any time. Changes 
                will be effective immediately upon posting to our platform.
              </p>
            </section>

            <section className="refund-section">
              <h2>Contact Information</h2>
              <p>
                For refund inquiries, please contact us at:
              </p>
              <ul>
                <li>Email: refunds@rentit.com</li>
                <li>Phone: +1 (555) 123-4567</li>
                <li>Address: 123 RentIt Street, New York, NY 10001</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
