import React from "react";
import Header from "../../MyComponent/Header";
import Footer from "../../MyComponent/Footer";
import "./PrivacyPolicy.css";

export default function PrivacyPolicy() {
  return (
    <div className="privacy-policy-page">
      <Header />
      
      <main className="privacy-main">
        <div className="container">
          <div className="policy-header">
            <h1>Privacy Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="policy-content">
            <section className="policy-section">
              <h2>Information We Collect</h2>
              <p>
                RentIt collects essential information to provide secure rental services:
              </p>
              <ul>
                <li>Personal information (name, email, phone number)</li>
                <li>Identity verification documents (ID proof, address proof)</li>
                <li>Property details and rental agreements</li>
                <li>Communication data (messages, chat logs)</li>
                <li>Payment information (processed securely through Razorpay)</li>
                <li>Device and usage data for platform security</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>Purpose of Data Collection</h2>
              <p>We collect data specifically for:</p>
              <ul>
                <li>Property booking and rental verification</li>
                <li>User identity verification and fraud prevention</li>
                <li>Secure communication between tenants and owners</li>
                <li>Payment processing and transaction records</li>
                <li>Legal compliance and dispute resolution</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>Data Security</h2>
              <p>
                Your data security is our priority. We implement:
              </p>
              <ul>
                <li>Firebase secure cloud storage with encryption</li>
                <li>SSL/TLS encryption for all data transmission</li>
                <li>Secure authentication with Firebase Auth</li>
                <li>Regular security audits and updates</li>
                <li>Restricted access to sensitive information</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>No Data Selling</h2>
              <p>
                <strong>We never sell your personal information.</strong> Your data is used only for 
                providing rental services and platform functionality. We do not share, sell, or 
                rent your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section className="policy-section">
              <h2>Information Sharing</h2>
              <p>
                We share information only when necessary:
              </p>
              <ul>
                <li>With other users for rental transactions (with consent)</li>
                <li>With payment processors (Razorpay) for payments</li>
                <li>When required by law or legal authorities</li>
                <li>To prevent fraud or protect user safety</li>
              </ul>
            </section>
              <section className="policy-section">
              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>Contact for Privacy Concerns</h2>
              <p>
                For privacy-related questions or concerns, please contact us:
              </p>
              <ul>
                <li>Email: privacy@rentit.com</li>
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
