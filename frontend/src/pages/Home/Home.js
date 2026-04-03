import React from "react";
import Header from "../../MyComponent/Header";
import Banner from "../../MyComponent/Banner";
import Footer from "../../MyComponent/Footer";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-page">
      {/* Header */}
      <Header />

      {/* Banner Section */}
      <Banner />

      {/* Footer */}
      <Footer />
    </div>
  );
}
