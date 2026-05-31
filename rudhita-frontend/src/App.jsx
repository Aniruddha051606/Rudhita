// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import ProtectedRoute from '@/components/ProtectedRoute';

import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';

// Placeholder pages for routes that get built in the next phase.
const Stub = ({ title }) => (
  <div className="max-w-7xl mx-auto px-5 py-24 text-center">
    <p className="eyebrow mb-3">Coming soon</p>
    <h1 className="h-display text-4xl">{title}</h1>
  </div>
);

function Shell({ children, onOpenAuth, onLogout }) {
  const location = useLocation();
  const bare = location.pathname === '/auth' || location.pathname.startsWith('/admin');
  if (bare) return children;

  return (
    <>
      <Header onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenCart={() => {}} cartCount={0} />
      <main className="relative z-[2]">{children}</main>
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
  const [authOpen, setAuthOpen] = useState(false);

  // Close the modal the moment auth succeeds.
  useEffect(() => { if (loggedIn) setAuthOpen(false); }, [loggedIn]);

  return (
    <Shell onOpenAuth={() => setAuthOpen(true)} onLogout={logout}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/products" element={<Stub title="Catalog" />} />
        <Route path="/product/:id" element={<Stub title="Product" />} />
        <Route path="/cart" element={<Stub title="Cart" />} />
        <Route path="/account" element={<ProtectedRoute><Stub title="Account" /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Stub title="Checkout" /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Stub title="Admin" /></ProtectedRoute>} />
        <Route path="*" element={<Stub title="Page not found" />} />
      </Routes>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </Shell>
  );
}
