import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import AuthModal from './components/AuthModal';
import CartSidebar from './components/CartSidebar';
import { fetchAPI } from './utils/api';

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const isLoggedIn = !!localStorage.getItem("rudhita_token");

  // Nav Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch initial cart count on load so the little red dot shows up
  useEffect(() => {
    if (isLoggedIn) {
      fetchAPI('/cart/').then(data => setCartCount(data.items.length)).catch(() => {});
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("rudhita_token");
    window.location.reload();
  };

  // --- THE MAGIC BUTTON LOGIC ---
  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) {
      setIsAuthOpen(true); // Not logged in? Open the login modal!
      return;
    }
    try {
      const data = await fetchAPI('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      setCartCount(data.items.length); // Update the red dot
      setIsCartOpen(true);             // Slide the cart open!
    } catch (error) {
      alert(error.message || "Failed to add item to cart.");
    }
  };

  return (
    <Router>
      <div className="announce">
        <div className="marquee">
          <span>Complimentary shipping on orders above ₹3,000</span>
          <span>Handcrafted with intention, designed for life</span>
          <span>New arrivals — Monsoon Edit 2026 now live</span>
          <span>All pieces made to order across India</span>
        </div>
      </div>

      <nav id="nav">
        <div className="nav-inner">
          <div className="nav-left">
            <a href="#collections">Collections</a>
            <a href="#products">Shop</a>
            <a href="#philosophy">Story</a>
          </div>
          <Link to="/" className="nav-logo">Rudhita</Link>
          <div className="nav-right">
            {isLoggedIn ? (
              <button className="nav-link" onClick={handleLogout}>Logout</button>
            ) : (
              <button className="nav-link" onClick={() => setIsAuthOpen(true)}>Account</button>
            )}
            <button className="cart-pill" onClick={() => setIsCartOpen(true)}>
              Cart <span className="cart-dot" style={{ display: cartCount > 0 ? 'flex' : 'none' }}>{cartCount}</span>
            </button>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home onAddToCart={handleAddToCart} />} />
        </Routes>
      </main>

      <footer>
        <div className="foot-inner">
          <div className="foot-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <p className="foot-copy">© 2026 Rudhita. All rights reserved.</p>
            <div className="foot-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* --- MODALS DEPLOYED --- */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCartUpdate={setCartCount} />
    </Router>
  );
}

export default App;