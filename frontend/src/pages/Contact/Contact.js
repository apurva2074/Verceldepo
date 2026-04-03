import React from "react";
import Header from "../../MyComponent/Header";
import Footer from "../../MyComponent/Footer";
import "./Contact.css";

export default function Contact() {
  return (
    <div className="contact-page">
      <Header />
      
      <main className="contact-main">
        <div className="container">
          <div className="contact-header">
            <h1>Contact Us</h1>
            <p>Get in touch with the RentIt team for any questions or support</p>
          </div>

          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>Email Support</h3>
                <p>support@rentit.com</p>
                <p>For general inquiries and technical support</p>
              </div>
              
              <div className="contact-item">
                <h3>Phone Support</h3>
                <p>+1 (555) 123-4567</p>
                <p>Monday - Friday: 9AM - 6PM EST</p>
              </div>
              
              <div className="contact-item">
                <h3>Office Address</h3>
                <p>123 RentIt Street</p>
                <p>New York, NY 10001, United States</p>
              </div>
            </div>

            <div className="contact-form">
              <h2>Send us a Message</h2>
              <form>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input type="text" id="subject" name="subject" required />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows="5" required></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
