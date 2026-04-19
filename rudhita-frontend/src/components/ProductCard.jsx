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

  const handleAddClick = (e) => {
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart(id);
    }
  };

  const handleQuickViewClick = (e) => {
    e.preventDefault();
    if (onQuickView) {
      onQuickView(id);
    }
  };

  const discount = originalPrice && price < originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

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
              backgroundImage: image ? `url(${image})` : 'linear-gradient(148deg, #2C1F17, #4A2E22)'
            }}
          />
          
          {/* Discount Badge */}
          {discount && (
            <div className="product-discount-badge">
              {discount}% OFF
            </div>
          )}

          {/* Tag Badge */}
          {tag && (
            <div className="product-tag-badge">
              {tag}
            </div>
          )}

          {/* Hover Actions */}
          <div className={`product-hover-actions ${isHovering ? 'visible' : ''}`}>
            <button 
              className="product-quick-view-btn"
              onClick={handleQuickViewClick}
            >
              Quick View
            </button>
          </div>

          {/* Add to Cart Button */}
          <button 
            className="product-add-btn"
            onClick={handleAddClick}
            aria-label="Add to cart"
          >
            Add to Cart
          </button>
        </div>

        {/* Product Info */}
        <div className="product-info">
          {tag && <p className="product-category">{tag}</p>}
          <h3 className="product-title">{title}</h3>
          <div className="product-price-wrapper">
            <span className="product-price">₹{price.toLocaleString()}</span>
            {originalPrice && (
              <span className="product-original-price">
                ₹{originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

export default ProductCard;
