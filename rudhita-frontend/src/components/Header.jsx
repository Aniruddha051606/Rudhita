// src/components/Header.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header({ onOpenAuth, onOpenCart, onLogout, cartCount = 0 }) {
  const { user, loggedIn, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const firstName = user?.name?.split(' ')?.[0] ?? null;

  return (
    <>
      {/* Marquee announcement */}
      <div className="bg-ink text-paper overflow-hidden border-b-2 border-ink">
        <div className="flex whitespace-nowrap animate-marquee py-2">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 font-mono text-[11px] uppercase tracking-[0.2em]">
              {['Complimentary shipping above ₹3,000', 'Handcrafted with intention', 'Monsoon Edit 2026 — now live', 'Made to order across India']
                .map((t, i) => <span key={i} className="mx-6 flex items-center gap-6">{t}<span className="text-punch">✦</span></span>)}
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className={`sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-brutal' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 h-16">
          <div className="hidden md:flex items-center gap-6 font-sans font-medium text-sm">
            <Link to="/products" className="hover:text-punch transition-colors">Shop</Link>
            <Link to="/#philosophy" className="hover:text-punch transition-colors">Story</Link>
            <a href="mailto:hello@rudhita.com" className="hover:text-punch transition-colors">Contact</a>
          </div>

          <Link to="/" className="font-display text-2xl font-bold tracking-tight absolute left-1/2 -translate-x-1/2">
            Rudhita
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            {loggedIn && loading ? (
              <span className="w-20" aria-hidden />
            ) : loggedIn ? (
              <>
                <Link to="/account" className="flex items-center gap-1.5 font-sans font-medium text-sm hover:text-punch transition-colors">
                  <User size={16} /> {firstName ? firstName : 'Account'}
                </Link>
                <button onClick={onLogout} className="font-sans font-medium text-sm text-muted hover:text-punch transition-colors px-2">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={onOpenAuth} className="flex items-center gap-1.5 font-sans font-medium text-sm hover:text-punch transition-colors">
                <User size={16} /> Account
              </button>
            )}

            <button onClick={onOpenCart} className="relative flex items-center gap-1.5 border-2 border-ink px-3 h-9 font-sans font-semibold text-sm hover:bg-ink hover:text-paper transition-colors">
              <ShoppingBag size={16} /> Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-punch text-paper text-[10px] font-bold w-5 h-5 flex items-center justify-center border-2 border-ink">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
