import React from "react";
import Header from "../../MyComponent/Header";
import Footer from "../../MyComponent/Footer";
import "./TermsConditions.css";

export default function TermsConditions() {
  return (
    <div className="terms-conditions-page">
      <Header />
      
      <main className="terms-main">
        <div className="container">
          <div className="terms-header">
            <h1>Terms & Conditions</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="terms-content">
            <section className="terms-section">
              <h2>Acceptance of Terms</h2>
              <p>
                By accessing and using RentIt, you accept and agree to be bound by the terms 
                and conditions outlined in this agreement. If you do not agree to these terms, 
                you should not use our platform.
              </p>
            </section>

            <section className="terms-section">
              <h2>Platform Description</h2>
              <p>
                RentIt is an online platform that connects tenants with property owners for 
                rental properties. We provide the technology and infrastructure to facilitate 
                rental transactions but do not own, manage, or lease properties directly.
              </p>
            </section>

            <section className="terms-section">
              <h2>User Responsibilities</h2>
              <h3>Tenants Must:</h3>
              <ul>
                <li>Provide accurate personal and identity information</li>
                <li>Verify property details before booking</li>
                <li>Make timely rental payments through platform</li>
                <li>Follow property rules and local regulations</li>
                <li>Maintain property in good condition</li>
                <li>Communicate respectfully with property owners</li>
              </ul>
              
              <h3>Property Owners Must:</h3>
              <ul>
                <li>Ensure property listings are authentic and accurate</li>
                <li>Maintain properties in safe, habitable condition</li>
                <li>Respond to tenant inquiries within 24 hours</li>
                <li>Honor confirmed rental agreements</li>
                <li>Follow all applicable landlord-tenant laws</li>
                <li>Provide required property documents</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>Property Listing Authenticity</h2>
              <p>
                Property owners are solely responsible for the authenticity of their listings. 
                RentIt is not responsible for verifying property ownership or details. Users 
                should independently verify property information before making bookings.
              </p>
            </section>

            <section className="terms-section">
              <h2>Platform as Intermediary</h2>
              <p>
                RentIt acts as an intermediary connecting tenants and property owners. We are 
                not a party to rental agreements and do not own, manage, or lease properties. 
                All rental transactions are between tenants and property owners directly.
              </p>
            </section>

            <section className="terms-section">
              <h2>Payment Terms</h2>
              <p>
                All payments are processed through Razorpay secure payment gateway:
              </p>
              <ul>
                <li>Security deposits and advance rent must be paid before booking confirmation</li>
                <li>Monthly payments are due as per rental agreement terms</li>
                <li>Late payments may incur penalties as specified in agreements</li>
                <li>All payment disputes are subject to Razorpay's refund policy</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>Account Suspension</h2>
              <p>
                RentIt reserves the right to suspend or terminate accounts for:
              </p>
              <ul>
                <li>Providing false or misleading information</li>
                <li>Posting fraudulent property listings</li>
                <li>Harassment or abuse of other users</li>
                <li>Violation of local laws or regulations</li>
                <li>Non-payment of platform fees or rents</li>
                <li>Multiple serious complaints from other users</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>Account Registration</h2>
              <p>
                To use RentIt, you must create an account and provide accurate information. 
                You are responsible for maintaining the confidentiality of your account 
                credentials and for all activities under your account.
              </p>
            </section>

            <section className="terms-section">
              <h2>Contact Information</h2>
              <p>
                If you have questions about these terms and conditions, please contact us at:
              </p>
              <ul>
                <li>Email: legal@rentit.com</li>
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
