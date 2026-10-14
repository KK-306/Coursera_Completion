import React, { useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Admin from './pages/Admin.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner container">
        <Link className="brand-logo" to="/">
          <div className="brand-icon-wrap">
            <span className="brand-name">Course<span className="brand-pilot">Pilot</span></span>
            <span className="brand-sub">LEARN &bull; GROW &bull; ACHIEVE</span>
          </div>
        </Link>

        <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="/#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works</a>
          <a href="/#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <a href="/#why-us" onClick={() => setMobileMenuOpen(false)}>Why us</a>
          <a href="/#faqs" onClick={() => setMobileMenuOpen(false)}>FAQs</a>
          <a href="/#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          <a className="nav-action-btn mobile-only" href="/#pricing" onClick={() => setMobileMenuOpen(false)}>
            Explore packages &rarr;
          </a>
        </nav>

        <div className="header-right desktop-only">
          <a className="nav-action-btn" href="/#pricing">
            Explore packages &rarr;
          </a>
        </div>

        <button
          className="mobile-toggle"
          aria-label="Toggle navigation"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-name">Course<span className="brand-pilot">Pilot</span></span>
            <span className="brand-sub">LEARN &bull; GROW &bull; ACHIEVE</span>
            <a href="mailto:support.Coursepilot@gmail.com" className="footer-email-link">
              &#9993;&#65039; support.Coursepilot@gmail.com
            </a>
          </div>

          <div className="footer-nav">
            <a href="/#how-it-works">How it works</a>
            <a href="/#pricing">Pricing</a>
            <a href="/#faqs">FAQs</a>
            <a href="/#contact">Contact</a>
            <Link to="/admin">Admin Portal</Link>
          </div>

          <div className="footer-payment-badges">
            <span className="payment-powered-text">&#128274; Secure Payment through UPI</span>
            <div className="payment-logos-row">
              <span className="pay-badge upi">UPI</span>
              <span className="pay-badge gpay">GPay</span>
              <span className="pay-badge phonepe">PhonePe</span>
              <span className="pay-badge paytm">Paytm</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright-text">&copy; 2025 CoursePilot. All rights reserved.</p>
          <p className="credit-text">Developed by P K developers IND Pvt. Ltd.</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="app-layout">
      {!isAdmin && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <Admin />
            </ProtectedAdminRoute>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
      {!isAdmin && <Footer />}
    </div>
  );
}
