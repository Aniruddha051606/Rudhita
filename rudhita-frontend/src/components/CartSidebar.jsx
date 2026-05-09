// src/components/CartSidebar.jsx
// ══════════════════════════════════════════════════════════════
// Slide-out cart drawer — matches Rudhita's warm editorial aesthetic.
// Driven entirely by CartContext; no local fetch calls.
//
// Usage:  <CartSidebar />  (place once in App.jsx or Layout.jsx)
// ══════════════════════════════════════════════════════════════
import React, { useEffect } from 'react';
import { useNavigate }      from 'react-router-dom';
import { useCart }          from '../context/CartContext';

// ── Design tokens (mirrors the site palette) ──────────────────
const T = {
  cream:'#F5EFE6', creamD:'#EDE4D7',
  dark:'#18100C',  darkMid:'#2C1F17',
  terra:'#A85538', terraL:'#C4704F',
  sage:'#6B7A5E',
  border:'rgba(24,16,12,0.1)',
  muted:'rgba(24,16,12,0.45)',
};

// ── Helpers ───────────────────────────────────────────────────
const fmtINR = (n) =>
  `\u20B9${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

function QtyControl({ value, onChange, min = 1, max = 99 }) {
  const btn = (label, delta, disabled) => (
    <button
      onClick={() => !disabled && onChange(value + delta)}
      disabled={disabled}
      style={{
        width:28, height:28, border:`1px solid ${T.border}`,
        background: disabled ? T.creamD : '#fff', borderRadius:4,
        fontSize:16, cursor: disabled ? 'not-allowed' : 'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        color: disabled ? T.muted : T.dark, transition:'all 0.15s',
      }}
    >{label}</button>
  );
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      {btn('−', -1, value <= min)}
      <span style={{ minWidth:20, textAlign:'center', fontSize:13, fontWeight:600 }}>{value}</span>
      {btn('+', +1, value >= max)}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function CartSidebar() {
  const navigate = useNavigate();
  const {
    items, count, total, loading,
    drawerOpen, closeDrawer,
    removeItem, updateQty, clearCart,
  } = useCart();

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeDrawer]);

  const handleCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────── */}
      <div
        onClick={closeDrawer}
        style={{
          position:'fixed', inset:0, background:'rgba(18,10,6,0.55)',
          backdropFilter:'blur(3px)', zIndex:900,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition:'opacity 0.3s ease',
        }}
      />

      {/* ── Drawer panel ──────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        style={{
          position:'fixed', top:0, right:0, bottom:0,
          width: 'min(420px, 100vw)',
          background:T.cream, zIndex:901,
          display:'flex', flexDirection:'column',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition:'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          boxShadow:'-8px 0 40px rgba(18,10,6,0.18)',
          fontFamily:'Jost, sans-serif',
        }}
      >

        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'20px 24px', borderBottom:`1px solid ${T.border}`,
          flexShrink:0,
        }}>
          <div>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:400, margin:0 }}>
              Your Cart
            </h2>
            {count > 0 && (
              <p style={{ margin:'2px 0 0', fontSize:12, color:T.muted }}>
                {count} item{count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={closeDrawer}
            aria-label="Close cart"
            style={{
              width:36, height:36, borderRadius:'50%', border:`1px solid ${T.border}`,
              background:'none', cursor:'pointer', fontSize:18, color:T.muted,
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.creamD; e.currentTarget.style.color = T.dark; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.muted; }}
          >×</button>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>

          {loading && (
            <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
              <div style={{
                width:28, height:28, border:`2px solid ${T.border}`,
                borderTopColor:T.terra, borderRadius:'50%',
                animation:'spin 0.7s linear infinite',
              }} />
            </div>
          )}

          {!loading && items.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 24px' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🛒</div>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, marginBottom:8 }}>
                Your cart is empty
              </p>
              <p style={{ fontSize:13, color:T.muted, marginBottom:24 }}>
                Discover our handcrafted collection
              </p>
              <button
                onClick={() => { closeDrawer(); navigate('/products'); }}
                style={{
                  padding:'11px 32px', background:T.dark, color:T.cream,
                  border:'none', fontSize:11, letterSpacing:'0.14em',
                  textTransform:'uppercase', cursor:'pointer',
                  fontFamily:'Jost, sans-serif', borderRadius:4,
                }}
              >
                Shop Now
              </button>
            </div>
          )}

          {!loading && items.map((item) => {
            const product = item.product || {};
            const itemTotal = parseFloat(product.price || 0) * item.quantity;
            const isTemp = String(item.id).startsWith('temp-');

            return (
              <div
                key={item.id}
                style={{
                  display:'grid',
                  gridTemplateColumns:'72px 1fr',
                  gap:14, padding:'16px 24px',
                  borderBottom:`1px solid ${T.border}`,
                  opacity: isTemp ? 0.6 : 1,
                  transition:'opacity 0.2s',
                }}
              >
                {/* Product image */}
                <div style={{
                  width:72, height:72, borderRadius:6, overflow:'hidden',
                  background:T.creamD, flexShrink:0,
                }}>
                  {product.image_url
                    ? <img src={product.image_url} alt={product.name}
                        style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%',
                                     background:'linear-gradient(135deg,#2C1F17,#3D2B1A)' }} />
                  }
                </div>

                {/* Details */}
                <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                    <p style={{ margin:0, fontWeight:600, fontSize:13,
                                 overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                 flex:1 }}>
                      {product.name || 'Loading…'}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                      style={{
                        background:'none', border:'none', cursor:'pointer',
                        color:T.muted, fontSize:15, padding:'0 2px', flexShrink:0,
                        transition:'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = T.terra}
                      onMouseLeave={e => e.currentTarget.style.color = T.muted}
                    >×</button>
                  </div>

                  {product.category && (
                    <p style={{ margin:0, fontSize:11, color:T.muted }}>{product.category}</p>
                  )}

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
                    <QtyControl
                      value={item.quantity}
                      onChange={(newQty) => updateQty(product.id || item.product_id, newQty)}
                    />
                    <span style={{ fontWeight:700, fontSize:14 }}>
                      {fmtINR(itemTotal)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer — subtotal + actions */}
        {items.length > 0 && (
          <div style={{
            flexShrink:0, padding:'20px 24px',
            borderTop:`1px solid ${T.border}`, background:'#fff',
          }}>
            {/* Subtotal */}
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color:T.muted }}>Subtotal</span>
              <span style={{ fontSize:14, fontWeight:600 }}>{fmtINR(total)}</span>
            </div>
            <p style={{ fontSize:11, color:T.muted, marginBottom:16 }}>
              Shipping & taxes calculated at checkout
            </p>

            {/* Checkout CTA */}
            <button
              onClick={handleCheckout}
              style={{
                width:'100%', padding:'14px', background:T.terra, color:'#fff',
                border:'none', borderRadius:4, fontSize:12,
                letterSpacing:'0.14em', textTransform:'uppercase',
                cursor:'pointer', fontFamily:'Jost, sans-serif',
                fontWeight:600, marginBottom:10,
                transition:'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.darkMid}
              onMouseLeave={e => e.currentTarget.style.background = T.terra}
            >
              Proceed to Checkout — {fmtINR(total)}
            </button>

            {/* Continue shopping */}
            <button
              onClick={closeDrawer}
              style={{
                width:'100%', padding:'11px', background:'none',
                border:`1px solid ${T.border}`, borderRadius:4,
                fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase',
                cursor:'pointer', fontFamily:'Jost, sans-serif',
                color:T.muted, transition:'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.dark; e.currentTarget.style.color = T.dark; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
            >
              Continue Shopping
            </button>

            {/* Clear cart */}
            <button
              onClick={clearCart}
              style={{
                display:'block', margin:'10px auto 0', background:'none',
                border:'none', fontSize:11, color:T.muted, cursor:'pointer',
                textDecoration:'underline', fontFamily:'Jost, sans-serif',
              }}
            >
              Clear cart
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
