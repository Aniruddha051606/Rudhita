// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Site-wide header: announcement bar + primary nav.
 *
 * Auth state now comes from AuthContext, so the "Account / Logout" controls
 * update the instant login/logout happens — no reload, no stale closure, no
 * separate /auth/me fetch here (the context already has the profile).
 */
export default function Header({ onLogout, onOpenAuth, onOpenCart, cartCount }) {
  const { user, isLoggedIn, loading } = useAuth();

  // Optional-chaining prevents a crash if the profile hasn't loaded yet.
  const firstName = user?.name?.split(' ')?.[0] ?? null;

  return (
    <>
      {/* Announcement bar */}
      <div className="announce">
        <div className="marquee">
          <span>Complimentary shipping on orders above ₹3,000</span>
          <span>Handcrafted with intention, designed for life</span>
          <span>New arrivals – Monsoon Edit 2026 now live</span>
          <span>All pieces made to order across India</span>
        </div>
      </div>

      {/* Primary navigation */}
      <nav id="nav">
        <div className="nav-inner">
          <div className="nav-left">
            <Link to="/products">Shop</Link>
            <Link to="/#philosophy">Story</Link>
            <a href="mailto:hello@rudhita.com">Contact</a>
          </div>

          <Link to="/" className="nav-logo">Rudhita</Link>

          <div className="nav-right">
            {/* While the initial profile probe is in flight AND we're logged in,
                show an invisible placeholder to avoid a flicker. Once settled,
                show the real controls. If logged out, show Account immediately. */}
            {isLoggedIn && loading ? (
              <span
                className="nav-link"
                aria-hidden="true"
                style={{ opacity: 0, pointerEvents: 'none' }}
              >
                Account
              </span>
            ) : isLoggedIn ? (
              <>
                <Link to="/account" className="nav-link">
                  {firstName ? `Hi, ${firstName}` : 'Account'}
                </Link>
                <button className="nav-link" onClick={onLogout}>Logout</button>
              </>
            ) : (
              <button className="nav-link" onClick={onOpenAuth}>Account</button>
            )}

            <button className="cart-pill" onClick={onOpenCart}>
              Cart{' '}
              <span
                className="cart-dot"
                style={{ display: cartCount > 0 ? 'flex' : 'none' }}
              >
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
