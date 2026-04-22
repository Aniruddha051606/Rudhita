import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';

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
      // FIX: Use the centralized API utility instead of raw fetchAPI
      const data = await API.cart.get();
      setCart(data);
      if (onCartUpdate) onCartUpdate(data.items?.length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      // FIX: Use the centralized API utility
      await API.cart.remove(id);
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
          <button className="modal-x" style={{ position: 'static', fontSize: '26px', cursor: 'pointer', border: 'none', background: 'transparent' }} onClick={onClose}>×</button>
        </div>
        
        <div className="cart-body">
          {!token ? (
            <div className="cart-nil">
              <p className="cart-nil-text">Please sign in to view your cart.</p>
            </div>
          ) : loading ? (
            <div className="cart-nil"><p className="cart-nil-text">Loading...</p></div>
          ) : !cart || !cart.items || cart.items.length === 0 ? (
            <div className="cart-nil">
              <div className="cart-nil-icon">∅</div>
              <p className="cart-nil-text">Your cart is empty</p>
            </div>
          ) : (
            cart.items.map(it => {
              // FIX: Safely parse the price to avoid NaN crashes
              const price = parseFloat(it.product?.price || 0);
              return (
                <div className="cart-item" key={it.id}>
                  <div className="ci-img">
                    <div className="ci-img-bg" style={{ overflow: 'hidden' }}>
                      {it.product?.image_url && (
                        <img src={it.product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  </div>
                  <div>
                    {/* FIX: Safe navigation for product name */}
                    <p className="ci-name">{it.product?.name || "Unknown Item"}</p>
                    <p className="ci-qty">Qty: {it.quantity}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* FIX: Safe math calculation */}
                    <span className="ci-price">₹{(price * it.quantity).toLocaleString('en-IN')}</span>
                    <button className="ci-remove" onClick={() => handleRemove(it.id)} style={{ cursor: 'pointer', border: 'none', background: 'transparent', fontSize: '18px', marginLeft: '8px' }}>×</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="cart-foot">
          <div className="cart-total-row">
            <span className="cart-total-lbl">Total</span>
            <span className="cart-total-val">
              {/* FIX: Safely format the cart total to prevent .toLocaleString() crashes on undefined */}
              ₹{cart ? parseFloat(cart.cart_total || 0).toLocaleString('en-IN') : '0'}
            </span>
          </div>
          <button className="btn-checkout" onClick={() => window.location.href='/checkout'}>Proceed to Checkout</button>
        </div>
      </div>
    </>
  );
}