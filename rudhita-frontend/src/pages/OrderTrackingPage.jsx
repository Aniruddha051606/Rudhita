// src/pages/OrderTrackingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { API } from '../utils/api';
import './Pages.css';

// ── Static timeline steps ─────────────────────────────────────────────────
// Each `key` is matched against the normalized tracking event status
// returned in tracking.events[].status
const TIMELINE_STEPS = [
  { key: 'pending',          label: 'Order Confirmed',  description: 'Your order has been confirmed.',        icon: '✔' },
  { key: 'processing',       label: 'Processing',       description: 'We are preparing your order.',          icon: '⚙' },
  { key: 'shipped',          label: 'Shipped',          description: 'Your order has been dispatched.',       icon: '📦' },
  { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Your order is on its way to you.',     icon: '🚚' },
  { key: 'delivered',        label: 'Delivered',        description: 'Order delivered successfully.',         icon: '🏠' },
];

const STATUS_ORDER = TIMELINE_STEPS.map(s => s.key);

// Normalize a status string → lowercase_underscored for comparison
const normalize = (s = '') => s.toLowerCase().replace(/\s+/g, '_');

// Map normalized status → Badge variant
const badgeVariant = (status) => ({
  pending:          'warning',
  processing:       'info',
  shipped:          'info',
  out_for_delivery: 'info',
  delivered:        'success',
  cancelled:        'error',
}[status] || 'info');

export function OrderTrackingPage() {
  const { id } = useParams();

  const [order,     setOrder]     = useState(null);
  const [tracking,  setTracking]  = useState(null);
  // FIX (flicker): start true so the full-screen loader only shows on first load.
  // Subsequent 30-second polls use showLoader=false so setIsLoading is never
  // called again, preventing the component from remounting and flickering.
  const [isLoading, setIsLoading] = useState(true);

  // ── Data fetching ─────────────────────────────────────────────────────────
  // useCallback so the interval closure always has the latest reference,
  // and the effect's dep-array stays stable.
  const loadTrackingData = useCallback(async (showLoader = false) => {
    // FIX: only set loading state on the INITIAL call (showLoader=true).
    // Polling calls (showLoader=false) must NOT touch isLoading — doing so
    // would re-trigger the `if (isLoading) return <Loader />` guard and
    // cause the whole page to flicker back to a spinner every 30 seconds.
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
      // Always release the loader on the initial call; no-op on poll calls.
      if (showLoader) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Initial load — show the full-screen spinner
    loadTrackingData(true);

    // Poll every 30 s for live status updates WITHOUT showing the loader
    const interval = setInterval(() => loadTrackingData(false), 30_000);
    return () => clearInterval(interval);
  }, [loadTrackingData]);

  // ── Early returns ─────────────────────────────────────────────────────────
  if (isLoading) return <Loader />;

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Order not found</h2>
      </div>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  // FIX: backend returns `shipping_status`, not `status`
  const normalizedStatus   = normalize(order.shipping_status);
  const currentStepIndex   = STATUS_ORDER.indexOf(normalizedStatus);

  // FIX: backend returns `shipping_address` as a flat string, not an object.
  // Do NOT access .city / .state / .street on it.
  const shippingAddress = order.shipping_address || 'Not available';

  // FIX: `total_amount`, not `total`
  const totalAmount = parseFloat(order.total_amount || 0);

  // Find a tracking event matching a given step key
  const getEventDate = (key) => {
    const events = tracking?.events || [];
    const match  = events.find(e => normalize(e.status) === key
                                 || normalize(e.status) === key.replace(/_/g, ' '));
    return match?.created_at || null;
  };

  // Progress line height (percentage of the vertical connector that's filled)
  const progressPct = currentStepIndex >= 0
    ? ((currentStepIndex + 1) / TIMELINE_STEPS.length) * 100
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--spacing-2xl)' }}>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', margin: 0 }}>
          Track Your Order
        </h1>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Order ID</p>
            <p style={{ margin: 0, fontWeight: '600' }}>#{order.id}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Status</p>
            {/* FIX: order.shipping_status — backend does NOT expose a `status` field */}
            <Badge variant={badgeVariant(normalizedStatus)} size="sm">
              {(order.shipping_status || 'Pending').replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
          {tracking?.waybill && (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Tracking Number</p>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{tracking.waybill}</p>
            </div>
          )}
          {order.created_at && (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Order Date</p>
              <p style={{ margin: 0, fontSize: '14px' }}>
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delivery timeline */}
      <div style={{
        background: 'var(--cream-d)', padding: 'var(--spacing-2xl)',
        borderRadius: 'var(--radius-lg)', marginBottom: '32px',
      }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 24px' }}>Delivery Timeline</h2>

        <div style={{ position: 'relative' }}>
          {/* Vertical progress connector */}
          <div style={{
            position: 'absolute', left: '15px', top: '30px', bottom: 0,
            width: '2px',
            background: `linear-gradient(to bottom,
              var(--terra) 0%,
              var(--terra) ${progressPct}%,
              rgba(24,16,12,0.1) ${progressPct}%,
              rgba(24,16,12,0.1) 100%)`,
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {TIMELINE_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent   = index === currentStepIndex;
              const eventDate   = getEventDate(step.key);

              return (
                <div key={step.key} style={{ position: 'relative', paddingLeft: '60px' }}>
                  {/* Step indicator circle */}
                  <div style={{
                    position: 'absolute', left: 0, top: '2px',
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: isCurrent
                      ? 'var(--terra)'
                      : isCompleted
                        ? 'var(--success)'
                        : 'rgba(24,16,12,0.1)',
                    border:    isCurrent ? '3px solid var(--cream)' : 'none',
                    boxShadow: isCurrent ? '0 0 0 3px rgba(168,85,56,0.2)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px',
                    color: isCompleted ? 'var(--cream)' : 'rgba(24,16,12,0.4)',
                    transition: 'all var(--duration-base) var(--ease)',
                  }}>
                    {step.icon}
                  </div>

                  {/* Step card */}
                  <div style={{
                    padding: 'var(--spacing-lg)',
                    background: isCompleted ? 'var(--cream)' : 'transparent',
                    border: isCompleted
                      ? '1px solid rgba(24,16,12,0.08)'
                      : '1px dashed rgba(24,16,12,0.1)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all var(--duration-base) var(--ease)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          margin: 0, fontSize: '16px', fontWeight: '600',
                          color: isCompleted ? 'var(--dark)' : 'rgba(24,16,12,0.4)',
                        }}>
                          {step.label}
                        </h4>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.7 }}>
                          {step.key === 'shipped' && tracking?.waybill
                            ? `Waybill: ${tracking.waybill}`
                            : step.description}
                        </p>
                      </div>
                      {/* Timestamp from tracking events array */}
                      {eventDate && (
                        <div style={{ fontSize: '12px', opacity: 0.6, whiteSpace: 'nowrap', textAlign: 'right' }}>
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

      {/* Delivery address */}
      <div style={{
        padding: 'var(--spacing-lg)', border: '1px solid rgba(24,16,12,0.1)',
        borderRadius: 'var(--radius-lg)', marginBottom: '32px',
      }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px', textTransform: 'uppercase', opacity: 0.6 }}>
          Delivery Address
        </h3>
        {/* FIX: shipping_address is a flat string — render directly, not .city / .state */}
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
          {shippingAddress}
        </p>
      </div>

      {/* Order summary */}
      <div style={{
        padding: 'var(--spacing-lg)', background: 'var(--cream-d)',
        borderRadius: 'var(--radius-lg)', marginBottom: '32px',
      }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px', textTransform: 'uppercase', opacity: 0.6 }}>
          Order Summary
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', opacity: 0.7 }}>
            {(order.items || []).length} item(s)
          </span>
          {/* FIX: order.total_amount — backend does not return `total` or `subtotal` */}
          <p style={{ margin: 0, fontWeight: '600', fontSize: '16px' }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Support */}
      <div style={{
        padding: 'var(--spacing-lg)', background: 'rgba(184,146,74,0.08)',
        borderRadius: 'var(--radius-lg)', textAlign: 'center',
      }}>
        <p style={{ margin: 0, fontSize: '13px' }}>
          Have questions?{' '}
          <a href="#support" style={{ color: 'var(--terra)', textDecoration: 'none', fontWeight: '600' }}>
            Contact Support
          </a>
        </p>
      </div>

    </div>
  );
}

export default OrderTrackingPage;