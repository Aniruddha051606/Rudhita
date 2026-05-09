import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import { useCart } from '../context/CartContext';
import ProductReviews from '../components/ProductReviews';
import './Pages.css';

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const data = await API.products.get(id);
      setProduct(data);

      if (data.category) {
        try {
          const related = await API.products.byCategory(data.category);
          // BUG 18 FIX: Number(id) — useParams gives string, p.id is number
          setRelatedProducts(related.products?.filter(p => p.id !== Number(id)).slice(0, 4) || []);
        } catch (e) {
          console.error('Error loading related products:', e);
        }
      }

    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    addItem(product.id, quantity);
  };

  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Gray',  hex: '#808080' },
    { name: 'Navy',  hex: '#000080' },
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  if (isLoading) return <Loader />;

  if (!product) {
    return (
      <div className="product-detail-page" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Product not found</h2>
        <Link to="/products" className="btn-solid" style={{ marginTop: '20px' }}>Back to Shop</Link>
      </div>
    );
  }

  const rating = 4.5;
  const discount = product.original_price && product.price < product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  return (
    <div className="product-detail-page">
      {/* Breadcrumb */}
      <div style={{ marginBottom: '32px', fontSize: '12px' }}>
        <Link to="/products">Products</Link> / <span>{product.name}</span>
      </div>

      {/* Product Detail Container */}
      <div className="product-detail-container">
        {/* Gallery */}
        <div className="product-gallery">
          <div className="product-main-image">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div className="product-thumbnails">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`product-thumbnail ${mainImageIndex === i ? 'active' : ''}`} onClick={() => setMainImageIndex(i)}>
                {product.image_url && (
                  <img src={product.image_url} alt={`Thumbnail ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info-section">
          <div className="product-title-section">
            <h1 className="product-detail-title">{product.name}</h1>
            <p className="product-detail-sku">SKU: {product.sku || 'N/A'}</p>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: 'var(--gold)' }}>★★★★☆ ({rating})</div>
              {/* BUG 17 FIX: was style={{ fontSize: '12px\', opacity: 0.6' }} — broken escape */}
              <span style={{ fontSize: '12px', opacity: 0.6 }}>24 reviews</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="product-pricing">
            {/* BUG 27 FIX: parseFloat handles Decimal-as-string from backend */}
            <span className="product-current-price">₹{parseFloat(product.price || 0).toLocaleString('en-IN')}</span>
            {product.original_price && (
              <span className="product-original-price">₹{parseFloat(product.original_price).toLocaleString('en-IN')}</span>
            )}
            {discount && <Badge variant="error" size="sm">{discount}% OFF</Badge>}
          </div>

          <div className="product-description">{product.description}</div>

          {/* Colors */}
          <div className="product-colors">
            <div className="color-label">Color</div>
            <div className="color-options">
              {colors.map(color => (
                <div
                  key={color.name}
                  className={`color-option ${selectedColor === color.name ? 'active' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => setSelectedColor(color.name)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="product-sizes">
            <div className="size-label">Size</div>
            <div className="size-options">
              {sizes.map(size => (
                <button key={size} className={`size-option ${selectedSize === size ? 'active' : ''}`} onClick={() => setSelectedSize(size)}>
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="product-quantity">
            <span className="quantity-label">Quantity</span>
            <div className="quantity-control">
              <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <input
                type="number"
                className="qty-input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
              <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          {/* Actions */}
          <div className="product-actions">
            <Button variant="primary" onClick={handleAddToCart}>Add to Cart</Button>
            <Button variant="outline">♡ Wishlist</Button>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid rgba(24,16,12,0.1)' }}>
            <h3 style={{ marginBottom: '16px', fontWeight: '600' }}>Size & Fit Guide</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.7', opacity: '0.7' }}>
              Our oversized t-shirts are designed to provide comfort and style. Size up for an even more relaxed fit. Fabric: 100% Premium Cotton. Made-to-order, ships within 5-7 business days.
            </p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <ProductReviews productId={product.id} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: '64px', paddingTop: '64px', borderTop: '1px solid rgba(24,16,12,0.1)' }}>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', marginBottom: '32px', textAlign: 'center' }}>
            Related <em style={{ fontStyle: 'italic', color: 'var(--terra)' }}>Products</em>
          </h2>
          <div className="prod-grid">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} id={p.id} title={p.name} price={p.price} originalPrice={p.original_price} image={p.image_url} tag={p.category} onAddToCart={(id) => addItem(id, 1)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetailPage;
