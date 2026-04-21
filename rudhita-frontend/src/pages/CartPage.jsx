import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import './Pages.css';

export function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const data = await API.cart.get();
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // FIX: Now accepts both productId (for the API) and itemId (for UI updates)
  const updateQuantity = async (productId, itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }
    try {
      await API.cart.update(productId, newQuantity);
      setCartItems(items =>
        items.map(item =>
          item.id === itemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  // FIX: Deletes using the specific cart item ID, not the product ID
  const removeItem = async (itemId) => {
    try {
      await API.cart.remove(itemId);
      setCartItems(items => items.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const applyPromoCode = async () => {
    if (promoCode === 'SAVE10') {
      setDiscount(0.1);
    } else {
      alert('Invalid promo code');
    }
  };

  // FIX: Maps to item.product.price
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
  const discountAmount = subtotal * discount;
  const shipping = subtotal > 3000 ? 0 : 100;
  const tax = (subtotal - discountAmount) * 0.18;
  const total = subtotal - discountAmount + shipping + tax;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="cart-page">
      {cartItems.length === 0 ? (
        <div className="cart-empty-state">
          <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Your cart is empty</h2>
          <p style={{ opacity: '0.6', marginBottom: '32px' }}>
            Discover our premium luxury items and add them to your cart.
          </p>
          <Link to="/products" className="btn-solid">Continue Shopping</Link>
        </div>
      ) : (
        <div className="cart-container">
          {/* Cart Items */}
          <div className="cart-items-section">
            <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>
              Your Cart ({cartItems.length} items)
            </h2>

            {cartItems.map(item => (
              <div key={item.id} className="cart-item-row">
                <div className="cart-item-image">
                  {/* FIX: Mapped to item.product.image_url */}
                  {item.product?.image_url && (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>

                <div className="cart-item-details">
                  {/* FIX: Mapped to item.product.name */}
                  <h3 className="cart-item-name">{item.product?.name}</h3>
                  <p className="cart-item-meta">
                    {item.product?.color && <span>{item.product.color} · </span>}
                    {item.product?.size && <span>Size: {item.product.size}</span>}
                  </p>
                  <p style={{ marginTop: '8px', fontWeight: '600' }}>
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                  </p>
                </div>

                <div className="cart-item-controls">
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                      onClick={() => updateQuantity(item.product?.id, item.id, item.quantity - 1)}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--cream-d)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product?.id, item.id, Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '50px',
                        padding: '8px',
                        border: '1px solid rgba(24,16,12,0.1)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        fontFamily: 'var(--font-sans)'
                      }}
                      min="1"
                    />
                    <button
                      onClick={() => updateQuantity(item.product?.id, item.id, item.quantity + 1)}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--cream-d)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--terra)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h3 className="summary-title">Order Summary</h3>

            {/* Promo Code */}
            <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="promo-input"
              />
              <Button variant="outline" onClick={applyPromoCode} style={{ whiteSpace: 'nowrap' }}>
                Apply
              </Button>
            </div>

            {/* Summary Rows */}
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>

            {discount > 0 && (
              <div className="summary-row" style={{ color: 'var(--success)' }}>
                <span>Discount (-{(discount * 100).toFixed(0)}%)</span>
                <span>-₹{discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>

            <div className="summary-row">
              <span>Tax (18%)</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>

            <div className="summary-row summary-total">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>

            {shipping > 0 && (
              <p style={{ fontSize: '12px', opacity: '0.6', marginTop: '12px', textAlign: 'center' }}>
                Free shipping on orders above ₹3,000
              </p>
            )}

            {/* Checkout Button */}
            <Button
              variant="primary"
              onClick={() => navigate('/checkout')}
              style={{ width: '100%', marginTop: '24px' }}
            >
              Proceed to Checkout
            </Button>

            <Link
              to="/products"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '16px',
                color: 'var(--terra)',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;