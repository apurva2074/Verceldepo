import React from "react";
import Header from "../../MyComponent/Header";
import Banner from "../../MyComponent/Banner";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-page">
      {/* Header */}
      <Header />

      {/* Banner Section */}
      <Banner />

      {/* Future sections like Featured Properties, Footer can be added here */}
    </div>
  );
}
