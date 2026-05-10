// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link }                        from 'react-router-dom';
import { API, isAuthenticated }        from '../utils/api';

/**
 * Site-wide header: announcement bar + primary nav.
 *
 * WHY the loading guard exists:
 *   After Google OAuth the page hard-reloads. isAuthenticated() is true
 *   immediately, but the user profile fetch is async. Without a guard, code
 *   that accesses user.name.split(' ') would throw because user is still null,
 *   producing a white-screen crash. We render a transparent placeholder until
 *   the fetch settles, then swap in the real content.
 */
export default function Header({ onLogout, onOpenAuth, onOpenCart, cartCount }) {
  const [user,  setUser]  = useState(null);
  const [ready, setReady] = useState(false);
  const loggedIn = isAuthenticated();

  useEffect(() => {
    if (!loggedIn) { setReady(true); return; }
    let cancelled = false;
    API.auth.me()
      .then(data  => { if (!cancelled) setUser(data); })
      .catch(()   => {})
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [loggedIn]);

  // Optional-chaining prevents a crash if user or user.name is null/undefined
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
            {/* Loading guard: invisible placeholder while profile fetch is in-flight */}
            {!ready ? (
              <span
                className="nav-link"
                aria-hidden="true"
                style={{ opacity: 0, pointerEvents: 'none' }}
              >
                Account
              </span>
            ) : loggedIn ? (
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
