// src/components/CartSidebar.jsx
import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';

export default function CartSidebar({ isOpen, onClose, onCartUpdate }) {
  const [cart, setCart]       = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('rudhita_token');

  // ── Load cart whenever the panel opens (and the user is logged in) ────────
  useEffect(() => {
    if (isOpen && token) {
      loadCart();
    } else if (!token) {
      setLoading(false);
    }
  }, [isOpen, token]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await API.cart.get();
      setCart(data);
      if (onCartUpdate) onCartUpdate(data.items?.length || 0);
    } catch (err) {
      console.error('CartSidebar: failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Remove item ──────────────────────────────────────────────────────────
  // FIX: pass the CartItem ID (item.id), NOT the product ID.
  // The backend DELETE /cart/remove/{item_id} expects the CartItem row id.
  const handleRemove = async (cartItemId) => {
    try {
      await API.cart.remove(cartItemId);
      loadCart(); // re-fetch to get updated total
    } catch (err) {
      alert('Failed to remove item.');
    }
  };

  // ── Subtotal (calculated client-side as a fallback display) ──────────────
  // FIX: use item.product?.price — the backend nests product data under .product
  const subtotal = (cart?.items || []).reduce(
    (sum, item) => sum + (parseFloat(item.product?.price || 0) * item.quantity),
    0
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Dark backdrop */}
      <div
        className={`cart-veil ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Sliding panel */}
      <div className={`cart-panel ${isOpen ? 'open' : ''}`}>

        {/* Header */}
        <div className="cart-head">
          <h2 className="cart-head-title">Your Cart</h2>
          <button
            className="modal-x"
            onClick={onClose}
            aria-label="Close cart"
            style={{
              position: 'static',
              fontSize: '26px',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="cart-body">
          {!token ? (
            <div className="cart-nil">
              <p className="cart-nil-text">Please sign in to view your cart.</p>
            </div>

          ) : loading ? (
            <div className="cart-nil">
              <p className="cart-nil-text">Loading…</p>
            </div>

          ) : !cart || !cart.items || cart.items.length === 0 ? (
            <div className="cart-nil">
              <div className="cart-nil-icon">∅</div>
              <p className="cart-nil-text">Your cart is empty</p>
            </div>

          ) : (
            cart.items.map((item) => {
              // FIX: safe navigation — backend nests product info under item.product
              const price = parseFloat(item.product?.price || 0);
              const name  = item.product?.name      || 'Unknown Item';
              const img   = item.product?.image_url || null;

              return (
                <div className="cart-item" key={item.id}>
                  {/* Product thumbnail */}
                  <div className="ci-img">
                    <div
                      className="ci-img-bg"
                      style={{ overflow: 'hidden' }}
                    >
                      {img && (
                        <img
                          src={img}
                          alt={name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Name & qty */}
                  <div>
                    {/* FIX: item.product?.name */}
                    <p className="ci-name">{name}</p>
                    <p className="ci-qty">Qty: {item.quantity}</p>
                  </div>

                  {/* Price & remove */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* FIX: (item.product?.price || 0) * item.quantity */}
                    <span className="ci-price">
                      ₹{(price * item.quantity).toLocaleString('en-IN')}
                    </span>

                    {/* FIX: remove button passes the CartItem ID (item.id),
                        not the product ID (item.product?.id) */}
                    <button
                      className="ci-remove"
                      onClick={() => handleRemove(item.id)}
                      aria-label="Remove item"
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '18px',
                        marginLeft: '8px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer — always render, guard against null cart */}
        <div className="cart-foot">
          <div className="cart-total-row">
            <span className="cart-total-lbl">Total</span>
            <span className="cart-total-val">
              {/* FIX: safe parse of cart_total — it comes back as a Decimal string */}
              ₹{cart
                ? parseFloat(cart.cart_total || 0).toLocaleString('en-IN')
                : subtotal.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            className="btn-checkout"
            onClick={() => { window.location.href = '/checkout'; }}
            disabled={!cart || !cart.items || cart.items.length === 0}
          >
            Proceed to Checkout
          </button>
        </div>

      </div>
    </>
  );
}