import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadTrackingData();
    // Poll for updates every 30 seconds
    const interval = setInterval(loadTrackingData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const loadTrackingData = async () => {
    try {
      setIsLoading(true);
      const orderData = await API.orders.get(id);
      setOrder(orderData);

      const trackingData = await API.orders.track(id);
      setTracking(trackingData);
    } catch (error) {
      console.error('Error loading tracking data:', error);
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
      </div>
    );
  }

  const timelineEvents = [
    {
      status: 'Order Confirmed',
      date: order.created_at,
      description: 'Your order has been confirmed',
      icon: '✓'
    },
    {
      status: 'Processing',
      date: order.processing_date,
      description: 'We are preparing your order',
      icon: '⚙'
    },
    {
      status: 'Shipped',
      date: order.shipped_date,
      description: `Waybill: ${tracking?.waybill || 'N/A'}`,
      icon: '📦'
    },
    {
      status: 'Out for Delivery',
      date: order.out_for_delivery_date,
      description: 'Your order is on its way to you',
      icon: '🚚'
    },
    {
      status: 'Delivered',
      date: order.delivered_date,
      description: 'Order delivered successfully',
      icon: '🏠'
    }
  ];

  const getStatusVariant = (status) => {
    const statusMap = {
      pending: 'warning',
      processing: 'info',
      shipped: 'info',
      out_for_delivery: 'info',
      delivered: 'success',
      cancelled: 'error'
    };
    return statusMap[order.status] || 'info';
  };

  const currentStatusIndex = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'].indexOf(order.status);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--spacing-2xl)' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', marginBottom: '12px', margin: 0 }}>
          Track Your Order
        </h1>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Order ID</p>
            <p style={{ margin: 0, fontWeight: '600' }}>#{order.id}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: '0.6', textTransform: 'uppercase' }}>Status</p>
            <Badge variant={getStatusVariant(order.status)} size="sm">
              {order.status?.replace('_', ' ').toUpperCase()}
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
        <h2 style={{ fontSize: '18px', marginBottom: '24px', margin: '0 0 24px' }}>Delivery Timeline</h2>

        <div style={{ position: 'relative' }}>
          {/* Timeline Line */}
          <div style={{
            position: 'absolute',
            left: '15px',
            top: '30px',
            bottom: 0,
            width: '2px',
            background: 'linear-gradient(to bottom, var(--terra) 0%, var(--terra) ' + ((currentStatusIndex + 1) / 5 * 100) + '%, rgba(24,16,12,0.1) ' + ((currentStatusIndex + 1) / 5 * 100) + '%, rgba(24,16,12,0.1) 100%)'
          }} />

          {/* Timeline Events */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {timelineEvents.map((event, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;

              return (
                <div key={index} style={{ position: 'relative', paddingLeft: '60px' }}>
                  {/* Timeline Dot */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '2px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--terra)' : isCompleted ? 'var(--success)' : 'rgba(24,16,12,0.1)',
                    border: isCurrent ? '3px solid var(--cream)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: isCompleted ? 'var(--cream)' : 'rgba(24,16,12,0.4)',
                    boxShadow: isCurrent ? '0 0 0 3px rgba(168,85,56,0.2)' : 'none',
                    transition: 'all var(--duration-base) var(--ease)'
                  }}>
                    {event.icon}
                  </div>

                  {/* Event Content */}
                  <div style={{
                    padding: 'var(--spacing-lg)',
                    background: isCompleted ? 'var(--cream)' : 'transparent',
                    border: isCompleted ? '1px solid rgba(24,16,12,0.08)' : '1px dashed rgba(24,16,12,0.1)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all var(--duration-base) var(--ease)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '600',
                          color: isCompleted ? 'var(--dark)' : 'rgba(24,16,12,0.4)'
                        }}>
                          {event.status}
                        </h4>
                        <p style={{
                          margin: '4px 0 0',
                          fontSize: '13px',
                          opacity: '0.7'
                        }}>
                          {event.description}
                        </p>
                      </div>
                      {event.date && (
                        <div style={{
                          fontSize: '12px',
                          opacity: '0.6',
                          whiteSpace: 'nowrap',
                          textAlign: 'right'
                        }}>
                          {new Date(event.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric'
                          })}
                          <br />
                          {new Date(event.date).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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

      {/* Delivery Address */}
      <div style={{
        padding: 'var(--spacing-lg)',
        border: '1px solid rgba(24,16,12,0.1)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '32px'
      }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px', textTransform: 'uppercase', opacity: '0.6' }}>
          Delivery Address
        </h3>
        <p style={{ margin: '0 0 4px', fontWeight: '600' }}>{order.address?.name}</p>
        <p style={{ margin: '0 0 4px', fontSize: '14px' }}>
          {order.address?.street}, {order.address?.city}, {order.address?.state} {order.address?.pincode}
        </p>
        <p style={{ margin: 0, fontSize: '14px' }}>{order.address?.phone}</p>
      </div>

      {/* Order Summary */}
      <div style={{
        padding: 'var(--spacing-lg)',
        background: 'var(--cream-d)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px', textTransform: 'uppercase', opacity: '0.6' }}>
          Order Summary
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--spacing-lg)',
          marginBottom: '16px'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', opacity: '0.6' }}>Subtotal</p>
            <p style={{ margin: '4px 0 0', fontWeight: '600' }}>₹{order.subtotal?.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', opacity: '0.6' }}>Shipping</p>
            <p style={{ margin: '4px 0 0', fontWeight: '600' }}>₹{order.shipping?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', opacity: '0.6' }}>Total</p>
            <p style={{ margin: '4px 0 0', fontWeight: '600', fontSize: '16px' }}>₹{order.total?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Support */}
      <div style={{
        marginTop: '32px',
        padding: 'var(--spacing-lg)',
        background: 'rgba(184, 146, 74, 0.08)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '13px' }}>
          Have questions? <a href="#support" style={{ color: 'var(--terra)', textDecoration: 'none', fontWeight: '600' }}>Contact Support</a>
        </p>
      </div>
    </div>
  );
}

export default OrderTrackingPage;
