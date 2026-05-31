// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { API } from '@/api/client';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import ProductCard from '@/components/ProductCard';
import { Spinner } from '@/components/ui/Spinner';

export default function HomePage() {
  const { addItem } = useCart();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.products.featured().then((d) => setFeatured(Array.isArray(d) ? d : (d.products || [])))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="grain">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 pt-16 pb-24 relative">
        <p className="eyebrow text-punch mb-6 animate-fade-up">Crafted Luxury · Est. 2026</p>
        <h1 className="h-display text-6xl md:text-8xl max-w-4xl animate-fade-up" style={{ animationDelay: '60ms' }}>
          Objects with<br /><span className="text-punch">intention.</span><br />Built to last.
        </h1>
        <p className="mt-8 max-w-md text-lg text-muted animate-fade-up" style={{ animationDelay: '120ms' }}>
          A small studio making considered pieces, by hand, across India. No trends. No waste. Just work that endures.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <Link to="/products"><Button size="lg" variant="punch">Explore the collection <ArrowRight size={18} /></Button></Link>
          <Link to="/#philosophy"><Button size="lg" variant="outline">Our story</Button></Link>
        </div>
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
            <div key={i}><p className="font-display text-xl font-semibold mb-2">{t}</p><p className="text-sm text-paper/70">{d}</p></div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-5 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="eyebrow text-punch mb-3">Featured</p>
            <h2 className="h-display text-4xl md:text-5xl">This season's edit.</h2>
          </div>
          <Link to="/products" className="hidden sm:inline-flex items-center gap-2 font-sans font-medium hover:text-punch transition-colors">
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-muted"><Spinner /></div>
        ) : featured.length === 0 ? (
          <p className="text-muted text-center py-20">New pieces arriving soon.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} onAdd={(id) => addItem(id, 1)} />)}
          </div>
        )}
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="border-t-2 border-ink bg-sand">
        <div className="max-w-3xl mx-auto px-5 py-24 text-center">
          <p className="eyebrow text-punch mb-4">Our Philosophy</p>
          <h2 className="h-display text-4xl md:text-5xl mb-6">Less, but better — and made to stay.</h2>
          <p className="text-muted text-lg leading-relaxed">
            Rudhita exists to push back against disposability. Every piece is designed to be repaired,
            not replaced; to age well, not wear out. We work with a small circle of artisans and pay them fairly.
          </p>
        </div>
      </section>
    </div>
  );
}
