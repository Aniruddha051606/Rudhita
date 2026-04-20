import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import './Pages.css';

export function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const data = await API.orders.get(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Order not found</h2>
        <Link to="/products" className="btn-solid">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
      {/* Success Animation */}
      <div style={{
        marginBottom: '32px',
        animation: 'slideUp 0.6s var(--ease)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          borderRadius: '50%',
          background: 'rgba(107, 122, 94, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          animation: 'bounce 0.6s var(--ease)'
        }}>
          ✓
        </div>
        <h1 style={{ fontSize: '36px', fontFamily: 'var(--font-serif)', margin: '0 0 12px', color: 'var(--dark)' }}>
          Order Confirmed!
        </h1>
        <p style={{ fontSize: '16px', opacity: '0.7', margin: 0 }}>
          Thank you for your purchase. Your order has been placed successfully.
        </p>
      </div>

      {/* Order Details */}
      <div style={{
        padding: 'var(--spacing-2xl)',
        background: 'var(--cream-d)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '32px',
        textAlign: 'left'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: '24px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Order Number</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>#{order.id}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Order Date</p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Total Amount</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>₹{order.total?.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Estimated Delivery</p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Shipping Address */}
        <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(24,16,12,0.1)' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Shipping Address</p>
          <p style={{ margin: '0 0 4px', fontWeight: '600' }}>{order.address?.name}</p>
          <p style={{ margin: '0 0 4px', fontSize: '14px', opacity: '0.8' }}>
            {order.address?.street}, {order.address?.city}, {order.address?.state} {order.address?.pincode}
          </p>
          <p style={{ margin: 0, fontSize: '14px', opacity: '0.8' }}>{order.address?.phone}</p>
        </div>
      </div>

      {/* Order Items */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', textAlign: 'left', marginBottom: '16px' }}>Order Items</h2>
        <div style={{
          border: '1px solid rgba(24,16,12,0.1)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          {order.items?.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '16px',
                padding: 'var(--spacing-lg)',
                borderBottom: index < order.items.length - 1 ? '1px solid rgba(24,16,12,0.05)' : 'none'
              }}
            >
              <div style={{ width: '80px', height: '80px', background: 'var(--cream-d)', borderRadius: 'var(--radius-md)' }} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ margin: 0, fontWeight: '600' }}>{item.name}</p>
                <p style={{ margin: '4px 0', fontSize: '13px', opacity: '0.6' }}>Quantity: {item.quantity}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: '600' }}>₹{(item.price * item.quantity).toLocaleString()}</p>
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

      {/* Email Confirmation */}
      <div style={{
        marginTop: '40px',
        padding: '16px',
        background: 'rgba(184, 146, 74, 0.08)',
        borderRadius: 'var(--radius-lg)',
        fontSize: '13px',
        opacity: '0.8'
      }}>
        A confirmation email has been sent to <strong>{order.email}</strong>. You can also track your order using the link above.
      </div>
    </div>
  );
}

export default OrderConfirmationPage;
