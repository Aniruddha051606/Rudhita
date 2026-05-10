// src/components/ProductCard.jsx
import React, { useState } from 'react';
import './ProductCard.css';

export function ProductCard({
  id,
  title,
  price,
  originalPrice,
  image,
  tag,
  onAddToCart,
  onQuickView,
  href
}) {
  const [isHovering, setIsHovering] = useState(false);
  // FIX: track add-to-cart async state so button disables and shows feedback
  const [isAdding,  setIsAdding]   = useState(false);

  // FIX: parseFloat handles Decimal strings from backend; || 0 prevents crash on null/undefined
  const numericPrice    = parseFloat(price    || 0);
  const numericOriginal = originalPrice ? parseFloat(originalPrice) : null;

  const discount = numericOriginal && numericPrice < numericOriginal
    ? Math.round(((numericOriginal - numericPrice) / numericOriginal) * 100)
    : null;

  const handleAddClick = async (e) => {
    e.preventDefault();
    if (!onAddToCart || isAdding) return;
    setIsAdding(true);
    try {
      await onAddToCart(id);
    } finally {
      // Always re-enable — callers handle their own success/error feedback
      setIsAdding(false);
    }
  };

  const handleQuickViewClick = (e) => {
    e.preventDefault();
    if (onQuickView) onQuickView(id);
  };

  return (
    <a href={href || `/product/${id}`} className="product-card-link">
      <div
        className="product-card"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Product Image */}
        <div className="product-image-wrapper">
          <div
            className="product-image-bg"
            style={{
              backgroundImage: image
                ? `url(${image})`
                : 'linear-gradient(148deg, #2C1F17, #4A2E22)'
            }}
          />

          {/* Discount Badge */}
          {discount && (
            <div className="product-discount-badge">{discount}% OFF</div>
          )}

          {/* Tag Badge */}
          {tag && (
            <div className="product-tag-badge">{tag}</div>
          )}

          {/* Hover Actions — only shown when parent wires up onQuickView */}
          {onQuickView && (
            <div className={`product-hover-actions ${isHovering ? 'visible' : ''}`}>
              <button className="product-quick-view-btn" onClick={handleQuickViewClick}>
                Quick View
              </button>
            </div>
          )}

          {/* Add to Cart — disabled + spinner while request is in-flight */}
          <button
            className="product-add-btn"
            onClick={handleAddClick}
            aria-label="Add to cart"
            disabled={isAdding}
            style={{ opacity: isAdding ? 0.7 : 1, cursor: isAdding ? 'default' : 'pointer' }}
          >
            {isAdding ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>

        {/* Product Info */}
        <div className="product-info">
          {tag && <p className="product-category">{tag}</p>}
          <h3 className="product-title">{title || 'Unnamed Product'}</h3>
          <div className="product-price-wrapper">
            {/* FIX: parseFloat + toLocaleString — safe for Decimal strings and null */}
            <span className="product-price">
              ₹{numericPrice.toLocaleString('en-IN')}
            </span>
            {numericOriginal && (
              <span className="product-original-price">
                ₹{numericOriginal.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

export default ProductCard;