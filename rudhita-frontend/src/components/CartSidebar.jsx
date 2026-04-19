import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';

export default function CartSidebar({ isOpen, onClose, onCartUpdate }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('rudhita_token');

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
      const data = await fetchAPI('/cart/');
      setCart(data);
      if (onCartUpdate) onCartUpdate(data.items.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await fetchAPI(`/cart/remove/${id}`, { method: 'DELETE' });
      loadCart(); // Refresh the cart after removing an item
    } catch (err) {
      alert("Failed to remove item.");
    }
  };

  return (
    <>
      {/* The dark overlay behind the sidebar */}
      <div className={`cart-veil ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      
      {/* The sliding panel */}
      <div className={`cart-panel ${isOpen ? 'open' : ''}`}>
        <div className="cart-head">
          <h2 className="cart-head-title">Your Cart</h2>
          <button className="modal-x" style={{ position: 'static', fontSize: '26px' }} onClick={onClose}>×</button>
        </div>
        
        <div className="cart-body">
          {!token ? (
            <div className="cart-nil">
              <p className="cart-nil-text">Please sign in to view your cart.</p>
            </div>
          ) : loading ? (
            <div className="cart-nil"><p className="cart-nil-text">Loading...</p></div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="cart-nil">
              <div className="cart-nil-icon">∅</div>
              <p className="cart-nil-text">Your cart is empty</p>
            </div>
          ) : (
            cart.items.map(it => (
              <div className="cart-item" key={it.id}>
                <div className="ci-img"><div className="ci-img-bg"></div></div>
                <div>
                  <p className="ci-name">{it.product.name}</p>
                  <p className="ci-qty">Qty: {it.quantity}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="ci-price">₹{(it.product.price * it.quantity).toLocaleString('en-IN')}</span>
                  <button className="ci-remove" onClick={() => handleRemove(it.id)}>×</button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="cart-foot">
          <div className="cart-total-row">
            <span className="cart-total-lbl">Total</span>
            <span className="cart-total-val">
              ₹{cart ? cart.cart_total.toLocaleString('en-IN') : '0'}
            </span>
          </div>
          <button className="btn-checkout" onClick={() => alert("Checkout Engine Next!")}>Proceed to Checkout</button>
        </div>
      </div>
    </>
  );
}