// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import CartDrawer from '@/components/CartDrawer';
import ProtectedRoute from '@/components/ProtectedRoute';

import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import ProductCatalogPage from '@/pages/ProductCatalogPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderConfirmationPage from '@/pages/OrderConfirmationPage';
import OrderTrackingPage from '@/pages/OrderTrackingPage';
import UserAccountPage from '@/pages/UserAccountPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';

const Stub = ({ title }) => (
  <div className="max-w-7xl mx-auto px-5 py-24 text-center">
    <p className="eyebrow mb-3">Coming soon</p>
    <h1 className="h-display text-4xl">{title}</h1>
  </div>
);

function Shell({ children, onOpenAuth, onLogout, onOpenCart, cartCount }) {
  const location = useLocation();
  const bare = location.pathname === '/auth' || location.pathname.startsWith('/admin');
  if (bare) return children;
  return (
    <>
      <Header onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenCart={onOpenCart} cartCount={cartCount} />
      <main className="relative z-[2] min-h-[60vh]">{children}</main>
      <footer className="border-t-2 border-ink mt-24">
        <div className="max-w-7xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-muted">© 2026 Rudhita. All rights reserved.</p>
          <div className="flex gap-6 font-sans text-sm">
            <a href="#" className="hover:text-punch">Privacy</a>
            <a href="#" className="hover:text-punch">Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  const { loggedIn, logout } = useAuth();
  const { count, openDrawer } = useCart();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => { if (loggedIn) setAuthOpen(false); }, [loggedIn]);
  const requireAuth = () => setAuthOpen(true);

  return (
    <Shell
      onOpenAuth={() => setAuthOpen(true)}
      onLogout={logout}
      onOpenCart={openDrawer}
      cartCount={count}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/products" element={<ProductCatalogPage />} />
        <Route path="/product/:id" element={<ProductDetailPage onRequireAuth={requireAuth} />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />
        <Route path="/order/:id/tracking" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><UserAccountPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="*" element={<Stub title="Page not found" />} />
      </Routes>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <CartDrawer />
    </Shell>
  );
}
