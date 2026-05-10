import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { API, isAuthenticated, clearAuthTokens } from './utils/api';
import { useCart } from './context/CartContext';

// Pages
import HomePage             from './pages/HomePage';
import ProductCatalogPage   from './pages/ProductCatalogPage';
import ProductDetailPage    from './pages/ProductDetailPage';
import CartPage             from './pages/CartPage';
import AuthPage             from './pages/AuthPage';
import UserAccountPage      from './pages/UserAccountPage';
import CheckoutPage         from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderTrackingPage    from './pages/OrderTrackingPage';
import AdminDashboardPage   from './pages/AdminDashboardPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Header         from './components/Header';
import AuthModal      from './components/AuthModal';

function AppLayout({ children, onLogout, onOpenAuth, onOpenCart, cartCount }) {
  const location = useLocation();
  const hideNavFooter = location.pathname === '/auth' || location.pathname.startsWith('/admin');

  // Nav scroll effect
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
      <Header
        onLogout={onLogout}
        onOpenAuth={onOpenAuth}
        onOpenCart={onOpenCart}
        cartCount={cartCount}
      />

      <main>
        {children}
      </main>

      <footer>
        <div className="foot-inner">
          <div className="foot-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <p className="foot-copy">Â© 2026 Rudhita. All rights reserved.</p>
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
  const isLoggedIn = isAuthenticated();
  const { count: cartCount, openDrawer, addItem } = useCart();

  // BUG 5 FIX: clear both tokens, call backend to blocklist JTI
  const handleLogout = async () => {
    try { await API.auth.logout(); } catch {}
    clearAuthTokens();
    window.location.href = '/';
  };

  const handleAddToCart = (productId) => {
    if (!isLoggedIn) {
      setIsAuthOpen(true);
      return;
    }
    addItem(productId, 1); // CartContext handles the API call, drawer, and error
  };

  return (
    <AppLayout
      onLogout={handleLogout}
      onOpenAuth={() => setIsAuthOpen(true)}
      onOpenCart={openDrawer}
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

        {/* --- MODALS --- */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </AppLayout>
  );
}

export default App;
