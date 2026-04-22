import React, { useEffect, useState } from 'react';
import { fetchAPI } from '../utils/api';

export default function Home({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recreate your smooth scroll reveal animation!
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vis');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.11 });

    document.querySelectorAll('.rv').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [products]); // Re-run when products load

  // Fetch products from the Dell Optiplex
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchAPI('/products/');
        setProducts(data.products || []);
      } catch (err) {
        console.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">New Season â€” Monsoon Edit 2026</p>
          <h1 className="hero-h1">Wear what<br/><em>the earth</em><br/>remembers</h1>
          <p className="hero-body">
            Clothing, jewellery and objects made to last â€” sourced slow, crafted with care. Each piece carries the mark of the hands that made it.
          </p>
          <div className="hero-actions">
            <a href="#products" className="btn-solid">Explore the Edit</a>
            <a href="#philosophy" className="btn-text">Our Story</a>
          </div>
        </div>
        <div className="hero-canvas">
          <div className="hero-bg"></div>
          <div className="hero-glow1"></div>
          <div className="hero-glow2"></div>
          <p className="hero-caption">"In the age of excess,<br/>we chose the opposite."</p>
          <div className="hero-scroll">Scroll</div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="collections">
        <div className="sec-head rv">
          <p className="sec-eye">What we make</p>
          <h2 className="sec-title">Three worlds,<br/><em>one ethos</em></h2>
        </div>
        <div className="cat-grid">
          {['Apparel', 'Jewellery', 'Lifestyle'].map((cat, i) => (
            <div key={cat} className={`cat-card cat-${i+1} rv rv-${i}`}>
              <div className="cat-bg"></div><div className="cat-flare"></div>
              <div className="cat-content">
                <p className="cat-lbl">Collection 0{i+1}</p>
                <h3 className="cat-name">{cat}</h3>
                <div className="cat-arrow">Explore â†’</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section className="products-wrap" id="products">
        <div className="sec-head rv">
          <p className="sec-eye">The Catalog</p>
          <h2 className="sec-title">Curated <em>objects</em></h2>
        </div>
        <div className="prod-grid">
          {loading ? (
            <div className="catalog-loading">Curating the collectionâ€¦</div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="prod-card rv">
                <div className="prod-img">
                  <div className="prod-img-bg"></div>
                  <button className="prod-add" onClick={() => onAddToCart(p.id)}>Add to Cart</button>
                </div>
                <div className="prod-info">
                  <p className="prod-tag">Rudhita</p>
                  <h3 className="prod-name">{p.name}</h3>
                  <p className="prod-price">₹{parseFloat(p.price || 0).toLocaleString('en-IN')}</p>
                  <p className="prod-sku">{p.sku}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy">
        <div className="philo">
          <div>
            <p className="philo-eye rv">The Rudhita Way</p>
            <blockquote className="philo-quote rv rv-1">
              "We believe the most beautiful thing a garment can do is grow old with you."
            </blockquote>
            <div className="philo-rule rv rv-2"></div>
            <p className="philo-body rv rv-2">
              Rudhita was born from a simple refusal â€” to keep buying things that disappear. We work with artisans across India to create clothing, jewellery and objects that carry real stories.
            </p>
          </div>
          <div className="philo-visual rv rv-1">
            <div className="philo-v-bg"></div>
            <div className="philo-v-glow"></div>
            <p className="philo-v-cap">Artisan at work,<br/>Jaipur 2026</p>
          </div>
        </div>
      </section>
    </>
  );
}
