// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Foundation placeholder — full catalog/featured grid comes in the Pages phase.
export default function HomePage() {
  return (
    <div className="grain">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 pt-16 pb-24 relative">
        <p className="eyebrow text-punch mb-6 animate-fade-up">Crafted Luxury · Est. 2026</p>
        <h1 className="h-display text-6xl md:text-8xl max-w-4xl animate-fade-up" style={{ animationDelay: '60ms' }}>
          Objects with<br />
          <span className="text-punch">intention.</span><br />
          Built to last.
        </h1>
        <p className="mt-8 max-w-md text-lg text-muted animate-fade-up" style={{ animationDelay: '120ms' }}>
          A small studio making considered pieces, by hand, across India.
          No trends. No waste. Just work that endures.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <Link to="/products"><Button size="lg" variant="punch">Explore the collection <ArrowRight size={18} /></Button></Link>
          <Link to="/#philosophy"><Button size="lg" variant="outline">Our story</Button></Link>
        </div>

        {/* Decorative geometric block */}
        <div className="hidden lg:block absolute top-16 right-5 w-64 h-64 border-2 border-ink bg-sand shadow-brutalLg -rotate-3" />
        <div className="hidden lg:block absolute top-32 right-24 w-40 h-40 bg-punch border-2 border-ink shadow-brutal rotate-6" />
      </section>

      {/* Feature strip */}
      <section className="border-y-2 border-ink bg-ink text-paper">
        <div className="max-w-7xl mx-auto px-5 py-10 grid sm:grid-cols-3 gap-8">
          {[
            ['Made to order', 'Nothing sits in a warehouse. We make each piece when you order it.'],
            ['Lifetime repair', 'Bring it back when it wears. We fix what we make, for as long as you own it.'],
            ['Carbon-neutral shipping', 'Every order ships offset, in plastic-free packaging.'],
          ].map(([t, d], i) => (
            <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <p className="font-display text-xl font-semibold mb-2">{t}</p>
              <p className="text-sm text-paper/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-24 text-center">
        <p className="eyebrow mb-4">Coming together</p>
        <h2 className="h-display text-4xl mb-4">The full storefront lands next.</h2>
        <p className="text-muted max-w-md mx-auto">
          This is the foundation — design system, auth, and layout. Catalog, product
          pages, cart and checkout build on top of it.
        </p>
      </section>
    </div>
  );
}
