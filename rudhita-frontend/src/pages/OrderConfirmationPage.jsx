// src/pages/OrderConfirmationPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import './Pages.css';

export function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]        = useState('');

  // useCallback so the effect dep-array stays stable across re-renders
  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setError('No order ID provided.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await API.orders.get(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Error loading order:', err);
      setError(err.message || 'Failed to load order details.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) return <Loader />;

  if (error || !order) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ marginBottom: '12px' }}>Order not found</h2>
        <p style={{ opacity: 0.6, marginBottom: '24px' }}>
          {error || 'We could not locate this order.'}
        </p>
        <Link to="/products" className="btn-solid">Continue Shopping</Link>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  // FIX: backend returns `total_amount`, not `total`
  const totalAmount = parseFloat(order.total_amount || 0);

  // FIX: backend returns `shipping_address` as a flat string, not an object.
  // Do NOT try to access order.shipping_address.city — render the string directly.
  const shippingAddress = order.shipping_address || 'Not available';

  // Estimated delivery: 7 days from order date
  const estimatedDelivery = order.created_at
    ? new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-2xl)', textAlign: 'center' }}>

      {/* Success icon + headline */}
      <div style={{ marginBottom: '32px', animation: 'slideUp 0.6s var(--ease)' }}>
        <div style={{
          width: '80px', height: '80px', margin: '0 auto 24px', borderRadius: '50%',
          background: 'rgba(107,122,94,0.1)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '40px',
        }}>
          ✓
        </div>
        <h1 style={{ fontSize: '36px', fontFamily: 'var(--font-serif)', margin: '0 0 12px' }}>
          Order Confirmed!
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.7, margin: 0 }}>
          Thank you for your purchase. Your order has been placed successfully.
        </p>
      </div>

      {/* Order details grid */}
      <div style={{
        padding: 'var(--spacing-2xl)', background: 'var(--cream-d)',
        borderRadius: 'var(--radius-lg)', marginBottom: '32px', textAlign: 'left',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-lg)', marginBottom: '24px',
        }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Order Number</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>#{order.id}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Order Date</p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Total Amount</p>
            {/* FIX: order.total_amount — backend does NOT return a `total` field */}
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Estimated Delivery</p>
            <p style={{ margin: 0, fontSize: '14px' }}>{estimatedDelivery}</p>
          </div>
        </div>

        {/* Shipping address — flat string, NOT an object */}
        <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(24,16,12,0.1)' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Shipping Address</p>
          {/* FIX: render order.shipping_address as plain text.
              Do NOT use order.shipping_address?.city / .state / etc. —
              the backend stores and returns the full address as a flat string. */}
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
            {shippingAddress}
          </p>
        </div>
      </div>

      {/* Order items */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', textAlign: 'left', marginBottom: '16px' }}>Order Items</h2>
        <div style={{ border: '1px solid rgba(24,16,12,0.1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {(order.items || []).map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex', gap: '16px', padding: 'var(--spacing-lg)',
                borderBottom: index < (order.items.length - 1)
                  ? '1px solid rgba(24,16,12,0.05)' : 'none',
              }}
            >
              <div style={{
                width: '80px', height: '80px', flexShrink: 0,
                background: 'var(--cream-d)', borderRadius: 'var(--radius-md)', overflow: 'hidden',
              }}>
                {item.product?.image_url && (
                  <img
                    src={item.product.image_url}
                    alt={item.product?.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                {/* FIX: item.product?.name — backend nests product data under .product */}
                <p style={{ margin: 0, fontWeight: '600' }}>{item.product?.name}</p>
                <p style={{ margin: '4px 0', fontSize: '13px', opacity: 0.6 }}>
                  Quantity: {item.quantity}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {/* FIX: item.product?.price — backend nests product data under .product */}
                <p style={{ margin: 0, fontWeight: '600' }}>
                  ₹{(parseFloat(item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to={`/order/${order.id}/tracking`} className="btn-solid">
          Track Order
        </Link>
        <Link to="/products" className="btn-outline">
          Continue Shopping
        </Link>
      </div>

      {/* Confirmation note */}
      <div style={{
        marginTop: '40px', padding: '16px',
        background: 'rgba(184,146,74,0.08)', borderRadius: 'var(--radius-lg)',
        fontSize: '13px', opacity: 0.8,
      }}>
        Order #{order.id} confirmed. Track your delivery using the button above.
      </div>

    </div>
  );
}

export default OrderConfirmationPage;