import React from "react";
import Header from "../../MyComponent/Header";
import Footer from "../../MyComponent/Footer";
import "./About.css";

export default function About() {
  return (
    <div className="about-page">
      <Header />
      
      <main className="about-main">
        <div className="container">
          <div className="about-header">
            <h1>About RentIt</h1>
            <p>Your trusted platform for finding the perfect rental home</p>
          </div>

          <section className="about-section">
            <div className="section-content">
              <h2>About RentIt Platform</h2>
              <p>
                RentIt is a cloud-based rental management system that revolutionizes how people 
                find and manage rental properties. Our platform eliminates traditional brokers 
                by enabling direct interaction between tenants and property owners.
              </p>
            </div>
          </section>

          <section className="about-section">
            <div className="section-content">
              <h2>Key Features</h2>
              <div className="features-grid">
                <div className="feature-item">
                  <h3>AI-Powered Verification</h3>
                  <ul>
                    <li>Automated identity verification</li>
                    <li>Document authenticity checks</li>
                    <li>Fraud prevention system</li>
                    <li>Real-time background verification</li>
                  </ul>
                </div>
                <div className="feature-item">
                  <h3>Direct Owner-Tenant Interaction</h3>
                  <ul>
                    <li>No middleman or brokers</li>
                    <li>Direct chat and messaging</li>
                    <li>Transparent communication</li>
                    <li>Quick response times</li>
                  </ul>
                </div>
                <div className="feature-item">
                  <h3>Cloud-Based Management</h3>
                  <ul>
                    <li>24/7 platform accessibility</li>
                    <li>Secure data storage</li>
                    <li>Real-time updates</li>
                    <li>Mobile-friendly interface</li>
                  </ul>
                </div>
                <div className="feature-item">
                  <h3>Secure Payment Processing</h3>
                  <ul>
                    <li>Razorpay integrated payments</li>
                    <li>Automated rent collection</li>
                    <li>Security deposit management</li>
                    <li>Payment history tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="about-section">
            <div className="section-content">
              <h2>Our Technology</h2>
              <p>
                RentIt leverages cutting-edge technology to provide a seamless rental experience:
              </p>
              <ul>
                <li><strong>Firebase Backend:</strong> Scalable cloud infrastructure for real-time data</li>
                <li><strong>AI Verification:</strong> Machine learning for document and identity verification</li>
                <li><strong>Secure Authentication:</strong> Multi-factor authentication and encryption</li>
                <li><strong>Real-time Chat:</strong> Instant messaging between tenants and owners</li>
              </ul>
            </div>
          </section>

          <section className="about-section">
            <div className="section-content">
              <h2>Why Choose RentIt</h2>
              <p>
                RentIt stands out as the modern solution for rental management:
              </p>
              <ul>
                <li><strong>No Broker Commission:</strong> Direct owner-tenant interaction saves costs</li>
                <li><strong>AI-Powered Security:</strong> Advanced verification prevents fraud</li>
                <li><strong>24/7 Accessibility:</strong> Cloud-based platform available anytime</li>
                <li><strong>Secure Payments:</strong> Razorpay integration for safe transactions</li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
