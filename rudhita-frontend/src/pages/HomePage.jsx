import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import './Pages.css';

export function HomePage({ onAddToCart }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribeMessage, setSubscribeMessage] = useState('');

  useEffect(() => {
    loadFeaturedProducts();
    observeAnimations();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      const data = await API.products.featured();
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const observeAnimations = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vis');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.rv').forEach(el => observer.observe(el));
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    // TODO: Connect to newsletter API
    setSubscribeMessage('Thank you for subscribing!');
    setEmail('');
    setTimeout(() => setSubscribeMessage(''), 3000);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow rv rv-1">Premium Oversized Luxury</p>
          <h1 className="hero-h1 rv rv-2">
            Crafted for <em>Life</em>
          </h1>
          <p className="hero-body rv rv-3">
            Experience the perfect blend of comfort and style. Our oversized t-shirts are designed with premium fabrics and timeless aesthetics for the modern, conscious consumer.
          </p>
          <div className="hero-actions rv rv-4">
            <Link to="/products" className="btn-solid">Explore Collection</Link>
            <button className="btn-text">Learn Our Story</button>
          </div>
        </div>

        <div className="hero-canvas">
          <div className="hero-bg" />
          <div className="hero-glow1" />
          <div className="hero-glow2" />
          <p className="hero-caption">
            Handcrafted with intention, designed for those who value quality over quantity.
          </p>
          <div className="hero-scroll">
            <span>Scroll</span>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="products-wrap">
        <div className="sec-head">
          <p className="sec-eye">Curated Selection</p>
          <h2 className="sec-title">Featured <em>Pieces</em></h2>
        </div>

        {isLoading ? (
          <Loader />
        ) : (
          <div className="prod-grid">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.name}
                price={product.price}
                originalPrice={product.original_price}
                image={product.image_url}
                tag={product.category}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
          <Link to="/products" className="btn-solid">View All Products</Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="sec-head">
          <p className="sec-eye">Shop By</p>
          <h2 className="sec-title">Category</h2>
        </div>

        <div className="cat-grid">
          <div className="cat-card cat-1 rv rv-1">
            <div className="cat-bg" />
            <div className="cat-flare" />
            <div className="cat-content">
              <p className="cat-lbl">Collection</p>
              <h3 className="cat-name">Essentials</h3>
              <div className="cat-arrow">
                <span>Explore</span> →
              </div>
            </div>
          </div>

          <div className="cat-card cat-2 rv rv-2">
            <div className="cat-bg" />
            <div className="cat-flare" />
            <div className="cat-content">
              <p className="cat-lbl">Collection</p>
              <h3 className="cat-name">Premium</h3>
              <div className="cat-arrow">
                <span>Explore</span> →
              </div>
            </div>
          </div>

          <div className="cat-card cat-3 rv rv-3">
            <div className="cat-bg" />
            <div className="cat-flare" />
            <div className="cat-content">
              <p className="cat-lbl">Collection</p>
              <h3 className="cat-name">Limited</h3>
              <div className="cat-arrow">
                <span>Explore</span> →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy/Brand Story Section */}
      <section className="philo">
        <div className="rv rv-1">
          <p className="philo-eye">Our Philosophy</p>
          <h2 className="philo-quote">
            Oversized isn't just a fit. It's a lifestyle choice.
          </h2>
          <div className="philo-rule" />
          <p className="philo-body">
            We believe in creating pieces that transcend seasons and trends. Each oversized t-shirt is a canvas for self-expression, designed to make you feel confident and comfortable in your own style.
          </p>
          <Link to="/products" className="btn-solid">Start Shopping</Link>
        </div>

        <div className="philo-visual rv rv-2">
          <div className="philo-v-bg" />
          <div className="philo-v-glow" />
          <p className="philo-v-cap">
            Every piece tells a story of quality, intention, and timeless design.
          </p>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter">
        <div className="newsletter-inner">
          <h2 className="newsletter-title">Stay Updated</h2>
          <p className="newsletter-subtitle">
            Subscribe to get early access to new collections and exclusive offers.
          </p>

          <form className="nl-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="nl-input"
              required
            />
            <button type="submit" className="btn-solid">Subscribe</button>
          </form>

          {subscribeMessage && (
            <p className="newsletter-success">{subscribeMessage}</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
