import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { API, isAuthenticated } from './utils/api';

// Pages
import HomePage from './pages/HomePage';
import ProductCatalogPage from './pages/ProductCatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import AuthPage from './pages/AuthPage';
import UserAccountPage from './pages/UserAccountPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Legacy Components (to be refactored)
import Home from './components/Home';
import AuthModal from './components/AuthModal';
import CartSidebar from './components/CartSidebar';

function AppLayout({ children, isLoggedIn, onLogout, onOpenAuth, onOpenCart, cartCount }) {
  const location = useLocation();
  const hideNavFooter = location.pathname === '/auth' || location.pathname.startsWith('/admin');

  // Nav Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (hideNavFooter) {
    return children;
  }

  return (
    <>
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
            <Link to="/products">Shop</Link>
            <a href="#story">Story</a>
            <a href="#contact">Contact</a>
          </div>
          <Link to="/" className="nav-logo">Rudhita</Link>
          <div className="nav-right">
            {isLoggedIn ? (
              <>
                <Link to="/account" className="nav-link">Account</Link>
                <button className="nav-link" onClick={onLogout}>Logout</button>
              </>
            ) : (
              <button className="nav-link" onClick={onOpenAuth}>Account</button>
            )}
            <button className="cart-pill" onClick={onOpenCart}>
              Cart <span className="cart-dot" style={{ display: cartCount > 0 ? 'flex' : 'none' }}>{cartCount}</span>
            </button>
          </div>
        </div>
      </nav>

      <main>
        {children}
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
    </>
  );
}

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const isLoggedIn = isAuthenticated();

  // Fetch initial cart count on mount
  useEffect(() => {
    if (isLoggedIn) {
      API.cart.get()
        .then(data => setCartCount(data.items?.length || 0))
        .catch(() => {});
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("rudhita_token");
    window.location.reload();
  };

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const data = await API.cart.add(productId, 1);
      setCartCount(data.items?.length || 0);
      setIsCartOpen(true);
    } catch (error) {
      alert(error.message || "Failed to add item to cart.");
    }
  };

  return (
    <Router>
      <AppLayout
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cartCount}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage onAddToCart={handleAddToCart} />} />
          <Route path="/products" element={<ProductCatalogPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected Routes - User */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <UserAccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/:id/tracking"
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<div style={{ padding: '40px', textAlign: 'center' }}>Page not found</div>} />
        </Routes>
      </AppLayout>

      {/* --- MODALS --- */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCartUpdate={setCartCount} />
    </Router>
  );
}

export default App;
