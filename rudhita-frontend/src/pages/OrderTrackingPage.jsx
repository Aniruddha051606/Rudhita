import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import './Pages.css';

export function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // BUG 25 FIX: useCallback prevents stale closure in setInterval
  // BUG 16 FIX: showLoader param stops full-screen flicker on every 30s poll
  const loadTrackingData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const [orderData, trackingData] = await Promise.all([
        API.orders.get(id),
        API.orders.track(id),
      ]);
      setOrder(orderData);
      setTracking(trackingData);
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrackingData(true);
    const interval = setInterval(() => loadTrackingData(false), 30000);
    return () => clearInterval(interval);
  }, [loadTrackingData]);

  if (isLoading) return <Loader />;

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Order not found</h2>
      </div>
    );
  }

  // BUG 16 FIX: use tracking.events (array from API) instead of non-existent date fields
  const staticSteps = [
    { status: 'Order Confirmed', key: 'pending',          description: 'Your order has been confirmed',          icon: '✓' },
    { status: 'Processing',      key: 'processing',       description: 'We are preparing your order',            icon: '⚙' },
    { status: 'Shipped',         key: 'shipped',          description: `Waybill: ${tracking?.waybill || 'N/A'}`, icon: '📦' },
    { status: 'Out for Delivery',key: 'out_for_delivery', description: 'Your order is on its way to you',        icon: '🚚' },
    { status: 'Delivered',       key: 'delivered',        description: 'Order delivered successfully',           icon: '🏠' },
  ];

  // Find matching tracking event for each step (from API events array)
  const getEventDate = (key) => {
    const events = tracking?.events || [];
    const match = events.find(e =>
      (e.status || '').toLowerCase().replace(/\s+/g, '_') === key
    );
    return match?.created_at || null;
  };

  const getStatusVariant = (status) => {
    const map = {
      pending: 'warning', processing: 'info', shipped: 'info',
      out_for_delivery: 'info', delivered: 'success', cancelled: 'error',
    };
    return map[status] || 'info';
  };

  // BUG 16 FIX: backend returns shipping_status not status
  const normalizedStatus = (order.shipping_status || '').toLowerCase().replace(/\s+/g, '_');
  const currentStatusIndex = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered']
    .indexOf(normalizedStatus);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--spacing-2xl)' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', margin: 0 }}>Track Your Order</h1>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Order ID</p>
            <p style={{ margin: 0, fontWeight: '600' }}>#{order.id}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Status</p>
            {/* BUG 23 FIX: shipping_status not status */}
            <Badge variant={getStatusVariant(normalizedStatus)} size="sm">
              {(order.shipping_status || 'Pending').replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
          {tracking?.waybill && (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Tracking Number</p>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{tracking.waybill}</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: 'var(--cream-d)', padding: 'var(--spacing-2xl)', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 24px' }}>Delivery Timeline</h2>
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '15px', top: '30px', bottom: 0, width: '2px',
            background: `linear-gradient(to bottom, var(--terra) 0%, var(--terra) ${((currentStatusIndex + 1) / 5 * 100)}%, rgba(24,16,12,0.1) ${((currentStatusIndex + 1) / 5 * 100)}%, rgba(24,16,12,0.1) 100%)`
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {staticSteps.map((event, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const eventDate = getEventDate(event.key);

              return (
                <div key={index} style={{ position: 'relative', paddingLeft: '60px' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: '2px', width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--terra)' : isCompleted ? 'var(--success)' : 'rgba(24,16,12,0.1)',
                    border: isCurrent ? '3px solid var(--cream)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    color: isCompleted ? 'var(--cream)' : 'rgba(24,16,12,0.4)',
                    boxShadow: isCurrent ? '0 0 0 3px rgba(168,85,56,0.2)' : 'none',
                    transition: 'all var(--duration-base) var(--ease)'
                  }}>
                    {event.icon}
                  </div>
                  <div style={{
                    padding: 'var(--spacing-lg)',
                    background: isCompleted ? 'var(--cream)' : 'transparent',
                    border: isCompleted ? '1px solid rgba(24,16,12,0.08)' : '1px dashed rgba(24,16,12,0.1)',
                    borderRadius: 'var(--radius-md)', transition: 'all var(--duration-base) var(--ease)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: isCompleted ? 'var(--dark)' : 'rgba(24,16,12,0.4)' }}>
                          {event.status}
                        </h4>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: '0.7' }}>{event.description}</p>
                      </div>
                      {eventDate && (
                        <div style={{ fontSize: '12px', opacity: '0.6', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {new Date(eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          <br />
                          {new Date(eventDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BUG 16 FIX: shipping_address is a flat string, not an object */}
      <div style={{ padding: 'var(--spacing-lg)', border: '1px solid rgba(24,16,12,0.1)', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px', textTransform: 'uppercase', opacity: '0.6' }}>Delivery Address</h3>
        <p style={{ margin: 0, fontSize: '14px', opacity: '0.8' }}>
          {order.shipping_address || 'Not available'}
        </p>
      </div>

      {/* Order Summary */}
      {/* BUG 16 FIX: subtotal/shipping don't exist — use total_amount only */}
      <div style={{ padding: 'var(--spacing-lg)', background: 'var(--cream-d)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px', textTransform: 'uppercase', opacity: '0.6' }}>Order Summary</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '12px', opacity: '0.6' }}>Total</p>
          {/* BUG 16 FIX: total_amount not total */}
          <p style={{ margin: 0, fontWeight: '600', fontSize: '16px' }}>
            ₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '32px', padding: 'var(--spacing-lg)', background: 'rgba(184,146,74,0.08)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px' }}>
          Have questions? <a href="#support" style={{ color: 'var(--terra)', textDecoration: 'none', fontWeight: '600' }}>Contact Support</a>
        </p>
      </div>
    </div>
  );
}

export default OrderTrackingPage;
