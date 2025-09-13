import React from "react";
import "../App.css";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landingPageContainer">
      <header className="navbar">
        <h2 className="logo">Video Call</h2>
        <nav className="navMenu">
          <a href="#guest" className="navLink">Join as Guest</a>
          <a href="#register" className="navLink">Register</a>
          <button className="loginButton">Login</button>
        </nav>
      </header>

      <main className="landingMain">
        <section className="landingText">
          <h1>
            <span className="highlight">Connect</span> with your loved ones
          </h1>
          <p>Cover a distance by Video Call</p>

          {/* ✅ Use Link styled as a button */}
          <Link to="/auth" className="loginButton">Get Started</Link>
        </section>
        
        <section className="landingImage">
          <img src="/mobile.png" alt="Video Call Illustration" />
        </section>
      </main>
    </div>
  );
}
