// src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS (inline — no extra CSS file needed)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  cream:   '#F5EFE6', creamD: '#EDE4D7', parchment: '#E3D8C8',
  dark:    '#18100C', darkMid: '#2C1F17',
  terra:   '#A85538', terraL: '#C4704F',
  gold:    '#B8924A', sage:   '#6B7A5E',
  error:   '#A85538', success: '#6B7A5E', warning: '#D97706',
  border:  'rgba(24,16,12,0.1)', borderHover: 'rgba(24,16,12,0.25)',
  muted:   'rgba(24,16,12,0.5)',
};

const TAB_LABELS = ['Overview', 'Orders', 'Inventory', 'Products', 'Audit Log'];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Toast({ toasts, onDismiss }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => onDismiss(t.id)}
          style={{
            minWidth: 280, maxWidth: 420, padding: '12px 16px',
            borderRadius: 8, cursor: 'pointer',
            background: t.type === 'error' ? '#FEF2F2' : t.type === 'warning' ? '#FFFBEB' : '#F0FDF4',
            border: `1px solid ${t.type === 'error' ? '#FECACA' : t.type === 'warning' ? '#FDE68A' : '#BBF7D0'}`,
            color: t.type === 'error' ? '#991B1B' : t.type === 'warning' ? '#92400E' : '#166534',
            fontSize: 13, fontFamily: 'Jost, sans-serif',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            animation: 'slideInRight 0.25s ease',
          }}>
          <strong style={{ display: 'block', marginBottom: 2 }}>
            {t.type === 'error' ? '✕ Error' : t.type === 'warning' ? '⚠ Warning' : '✓ Success'}
          </strong>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: C.creamD, borderRadius: 12, padding: '20px 24px',
      border: `1px solid ${C.border}`,
    }}>
      <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted }}>{label}</p>
      <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 600, color: accent || C.dark }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{sub}</p>}
    </div>
  );
}

function StatusBadge({ value, type = 'shipping' }) {
  const v = (value || '').toLowerCase();
  const cfg = {
    paid:       { bg: '#ECFDF5', color: '#065F46', label: 'Paid' },
    pending:    { bg: '#FFFBEB', color: '#92400E', label: 'Pending' },
    processing: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Processing' },
    shipped:    { bg: '#F0F9FF', color: '#0C4A6E', label: 'Shipped' },
    delivered:  { bg: '#F0FDF4', color: '#166534', label: 'Delivered' },
    cancelled:  { bg: '#FEF2F2', color: '#991B1B', label: 'Cancelled' },
    refunded:   { bg: '#F5F3FF', color: '#5B21B6', label: 'Refunded' },
    failed:     { bg: '#FEF2F2', color: '#991B1B', label: 'Failed' },
  }[v] || { bg: C.creamD, color: C.dark, label: value || '—' };

  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function Spinner({ size = 20 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid ${C.border}`, borderTopColor: C.terra,
      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    }} />
  );
}

function Btn({ children, onClick, disabled, variant = 'primary', small, loading, style: s = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '6px 14px' : '10px 20px',
    fontSize: small ? 12 : 13, fontWeight: 500, letterSpacing: '0.06em',
    textTransform: 'uppercase', border: 'none', borderRadius: 6,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.55 : 1,
    transition: 'all 0.2s',
    fontFamily: 'Jost, sans-serif',
    ...s,
  };
  const variants = {
    primary:   { background: C.dark,    color: C.cream  },
    danger:    { background: '#DC2626', color: '#fff'   },
    success:   { background: '#16A34A', color: '#fff'   },
    secondary: { background: C.creamD,  color: C.dark, border: `1px solid ${C.border}` },
    ghost:     { background: 'none',    color: C.terra, padding: small ? '4px 8px' : '8px 14px' },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled || loading}>
      {loading ? <Spinner size={14} /> : null}
      {children}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(18,10,6,.6)',
      backdropFilter: 'blur(4px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.cream, borderRadius: 12, padding: '28px 32px',
        minWidth: 400, maxWidth: 560, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        animation: 'modalIn 0.22s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontWeight: 400, fontSize: 20 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C.muted, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

function TH({ children, style: s = {} }) {
  return (
    <th style={{
      padding: '10px 14px', textAlign: 'left',
      fontSize: 10, fontWeight: 600, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: C.muted,
      borderBottom: `1px solid ${C.border}`,
      background: C.creamD, whiteSpace: 'nowrap', ...s,
    }}>{children}</th>
  );
}

function TD({ children, style: s = {} }) {
  return (
    <td style={{ padding: '11px 14px', fontSize: 13, borderBottom: `1px solid ${C.border}`, ...s }}>
      {children}
    </td>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [tab,       setTab]       = useState('Overview');
  const [loading,   setLoading]   = useState(true);
  const [toasts,    setToasts]    = useState([]);

  // Data
  const [stats,     setStats]     = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [inventory, setInventory] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [auditLog,  setAuditLog]  = useState([]);

  // Orders tab state
  const [selectedIds,   setSelectedIds]   = useState(new Set());
  const [orderFilter,   setOrderFilter]   = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [fulfillModal,  setFulfillModal]  = useState(null);  // order object
  const [waybillInputs, setWaybillInputs] = useState({});
  const [busyIds,       setBusyIds]       = useState(new Set());

  // Fulfill modal form
  const [fulfillForm,   setFulfillForm]   = useState({ carrier: '', tracking_number: '', notes: '' });
  const [fulfillLoading, setFulfillLoading] = useState(false);

  // Products tab
  const [showProdForm,  setShowProdForm]  = useState(false);
  const [prodForm,      setProdForm]      = useState({ name:'', category:'', price:'', originalPrice:'', stock:'', description:'' });
  const [savingProd,    setSavingProd]    = useState(false);

  const toastCounter = useRef(0);

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const toast = useCallback((message, type = 'success') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ── Data loading ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, ord, inv, prod] = await Promise.all([
        API.admin.dashboard(),
        API.admin.orders.list({ limit: 100 }),
        API.admin.inventory.list({ limit: 200 }),
        API.admin.products.list(),
      ]);
      setStats(dash);
      setOrders(ord.orders || []);
      setInventory(inv.inventory || []);
      setProducts(prod.products || []);
    } catch (e) {
      toast('Failed to load dashboard: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadAuditLog = useCallback(async () => {
    try {
      const data = await API.admin.auditLog({ limit: 50 });
      setAuditLog(data.logs || []);
    } catch (e) {
      toast('Failed to load audit log: ' + e.message, 'error');
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'Audit Log') loadAuditLog(); }, [tab, loadAuditLog]);

  // ── Order helpers ──────────────────────────────────────────────────────────
  const toggleSelect = id => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const setBusy = (id, val) => setBusyIds(prev => {
    const n = new Set(prev); val ? n.add(id) : n.delete(id); return n;
  });

  const handleStatusChange = async (orderId, newStatus) => {
    setBusy(orderId, true);
    try {
      await API.admin.orders.update(orderId, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, shipping_status: newStatus } : o));
      toast(`Order #${orderId} → ${newStatus}`);
    } catch (e) {
      toast('Status update failed: ' + e.message, 'error');
    } finally {
      setBusy(orderId, false);
    }
  };

  const handleSetWaybill = async orderId => {
    const wb = (waybillInputs[orderId] || '').trim();
    if (!wb) { toast('Enter a waybill number first.', 'warning'); return; }
    setBusy(orderId, true);
    try {
      await API.admin.orders.setWaybill(orderId, wb);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, shipping_status: 'Shipped', waybill: wb } : o));
      setWaybillInputs(prev => ({ ...prev, [orderId]: '' }));
      toast(`Waybill set for order #${orderId}`);
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    } finally {
      setBusy(orderId, false);
    }
  };

  const handleRefund = async orderId => {
    if (!window.confirm(`Initiate full Razorpay refund for order #${orderId}? Cannot be undone.`)) return;
    setBusy(orderId, true);
    try {
      const res = await API.admin.orders.refund(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'Refunded' } : o));
      toast(`Refund initiated for #${orderId} (${res.refund_id})`);
    } catch (e) {
      toast('Refund failed: ' + e.message, 'error');
    } finally {
      setBusy(orderId, false);
    }
  };

  const handleSingleFulfill = async () => {
    if (!fulfillModal) return;
    setFulfillLoading(true);
    try {
      await API.admin.orders.fulfill(fulfillModal.id, fulfillForm);
      setOrders(prev => prev.map(o =>
        o.id === fulfillModal.id
          ? { ...o, shipping_status: 'Shipped', fulfillment_count: (o.fulfillment_count || 0) + 1, fulfillment_status: 'shipped' }
          : o
      ));
      toast(`Order #${fulfillModal.id} fulfilled & shipped!`);
      setFulfillModal(null);
      setFulfillForm({ carrier: '', tracking_number: '', notes: '' });
      // Refresh inventory since stock moved
      const inv = await API.admin.inventory.list({ limit: 200 });
      setInventory(inv.inventory || []);
    } catch (e) {
      toast('Fulfillment failed: ' + e.message, 'error');
    } finally {
      setFulfillLoading(false);
    }
  };

  const handleBulkFulfill = async () => {
    if (selectedIds.size === 0) { toast('Select at least one order.', 'warning'); return; }
    if (!window.confirm(`Fulfill ${selectedIds.size} selected order(s)?`)) return;
    try {
      const res = await API.admin.orders.bulkFulfill([...selectedIds]);
      toast(`${res.message}`, 'success');
      setSelectedIds(new Set());
      // Optimistically update statuses
      setOrders(prev => prev.map(o =>
        selectedIds.has(o.id) && o.payment_status === 'Paid'
          ? { ...o, shipping_status: 'Shipped', fulfillment_status: 'shipped' }
          : o
      ));
    } catch (e) {
      toast('Bulk fulfill failed: ' + e.message, 'error');
    }
  };

  // ── Product helpers ────────────────────────────────────────────────────────
  const handleSaveProduct = async e => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.price || !prodForm.category || !prodForm.stock) {
      toast('Fill in all required fields.', 'warning');
      return;
    }
    setSavingProd(true);
    try {
      await API.admin.products.create(prodForm);
      toast('Product added!');
      setProdForm({ name:'', category:'', price:'', originalPrice:'', stock:'', description:'' });
      setShowProdForm(false);
      const prod = await API.admin.products.list();
      setProducts(prod.products || []);
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    } finally {
      setSavingProd(false);
    }
  };

  const handleDeleteProduct = async id => {
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await API.admin.products.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast('Product deactivated.');
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    const matchText = !orderFilter || (
      String(o.id).includes(orderFilter) ||
      (o.customer_name || '').toLowerCase().includes(orderFilter.toLowerCase()) ||
      (o.customer_email || '').toLowerCase().includes(orderFilter.toLowerCase())
    );
    const matchStatus = !statusFilter || (
      (o.shipping_status || '').toLowerCase() === statusFilter.toLowerCase() ||
      (o.payment_status  || '').toLowerCase() === statusFilter.toLowerCase()
    );
    return matchText && matchStatus;
  });

  const paidUnfulfilled = orders.filter(
    o => o.payment_status === 'Paid' &&
    !['Shipped','Delivered'].includes(o.shipping_status) &&
    o.fulfillment_count === 0
  );

  const lowStockItems = inventory.filter(i => i.available <= 5);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16, fontFamily: 'Jost, sans-serif' }}>
        <Spinner size={32} />
        <p style={{ color: C.muted, fontSize: 14 }}>Loading dashboard…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Jost, sans-serif' }}>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ background: C.dark, color: C.cream, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 400, margin: 0, letterSpacing: '0.1em' }}>Rudhita OMS</h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, opacity: 0.5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Order Management System</p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {paidUnfulfilled.length > 0 && (
            <span style={{ background: C.terra, color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {paidUnfulfilled.length} awaiting fulfillment
            </span>
          )}
          {lowStockItems.length > 0 && (
            <span style={{ background: '#D97706', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {lowStockItems.length} low stock
            </span>
          )}
          <Btn variant="secondary" small onClick={load} style={{ borderColor: 'rgba(255,255,255,0.2)', color: C.cream, background: 'rgba(255,255,255,0.08)' }}>
            ↺ Refresh
          </Btn>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, padding: '0 40px', display: 'flex', gap: 0 }}>
        {TAB_LABELS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? C.terra : C.muted,
              borderBottom: tab === t ? `2px solid ${C.terra}` : '2px solid transparent',
              fontFamily: 'Jost, sans-serif', transition: 'all 0.18s',
            }}>
            {t}
            {t === 'Orders' && paidUnfulfilled.length > 0 &&
              <span style={{ marginLeft: 6, background: C.terra, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>
                {paidUnfulfilled.length}
              </span>
            }
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ════════════════════════ OVERVIEW ════════════════════════════════ */}
        {tab === 'Overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 32 }}>
              <StatCard label="Total Orders"   value={stats?.totalOrders ?? 0} />
              <StatCard label="Total Revenue"  value={`₹${Number(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`} accent={C.terra} />
              <StatCard label="Avg Order"      value={stats?.totalOrders ? `₹${Math.round((stats.totalRevenue || 0) / stats.totalOrders).toLocaleString('en-IN')}` : '—'} />
              <StatCard label="Pending Fulfill" value={paidUnfulfilled.length} accent={paidUnfulfilled.length > 0 ? C.terra : C.sage} sub="paid, not yet shipped" />
              <StatCard label="Low Stock Items" value={lowStockItems.length} accent={lowStockItems.length > 0 ? '#D97706' : C.sage} sub="≤ 5 units available" />
            </div>

            {/* Recent orders table */}
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, letterSpacing: '0.04em' }}>Recent Orders</h2>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Order', 'Customer', 'Amount', 'Payment', 'Shipping'].map(h => <TH key={h}>{h}</TH>)}</tr>
                </thead>
                <tbody>
                  {(stats?.recentOrders || []).slice(0, 8).map(o => (
                    <tr key={o.id} style={{ transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = C.creamD}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <TD><span style={{ fontWeight: 600, color: C.terra }}>#{o.id}</span></TD>
                      <TD>{o.customer_name || 'N/A'}</TD>
                      <TD>₹{Number(o.total || 0).toLocaleString('en-IN')}</TD>
                      <TD><StatusBadge value={o.payment_status} /></TD>
                      <TD><StatusBadge value={o.shipping_status} /></TD>
                    </tr>
                  ))}
                  {(!stats?.recentOrders?.length) && (
                    <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 13 }}>No orders yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════ ORDERS ══════════════════════════════════ */}
        {tab === 'Orders' && (
          <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="Search by ID, name, email…"
                value={orderFilter} onChange={e => setOrderFilter(e.target.value)}
                style={{ flex: 1, minWidth: 200, maxWidth: 320, padding: '9px 14px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: 'Jost, sans-serif', background: '#fff' }}
              />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '9px 14px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontFamily: 'Jost, sans-serif', background: '#fff', cursor: 'pointer' }}>
                <option value="">All Statuses</option>
                {['Pending','Processing','Shipped','Delivered','Cancelled','Paid','Refunded','Failed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span style={{ fontSize: 13, color: C.muted, marginLeft: 4 }}>
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                {selectedIds.size > 0 && (
                  <Btn variant="success" onClick={handleBulkFulfill}>
                    ↑ Fulfill {selectedIds.size} Selected
                  </Btn>
                )}
              </div>
            </div>

            {/* Orders table */}
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr>
                    <TH>
                      <input type="checkbox"
                        checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </TH>
                    {['Order', 'Customer', 'Amount', 'Payment', 'Shipping', 'Fulfillment', 'Actions'].map(h => <TH key={h}>{h}</TH>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const busy = busyIds.has(order.id);
                    const canFulfill = order.payment_status === 'Paid' &&
                      !['Shipped','Delivered'].includes(order.shipping_status) &&
                      (order.fulfillment_count || 0) === 0;
                    const canRefund  = order.payment_status === 'Paid' && !order.refund_id;
                    return (
                      <tr key={order.id}
                          style={{ background: selectedIds.has(order.id) ? '#FFF7F5' : '', transition: 'background 0.15s' }}
                          onMouseEnter={e => { if (!selectedIds.has(order.id)) e.currentTarget.style.background = C.creamD; }}
                          onMouseLeave={e => { if (!selectedIds.has(order.id)) e.currentTarget.style.background = ''; }}>
                        <TD>
                          <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} style={{ cursor: 'pointer' }} />
                        </TD>
                        <TD><span style={{ fontWeight: 600, color: C.terra }}>#{order.id}</span></TD>
                        <TD>
                          <div style={{ fontWeight: 500 }}>{order.customer_name || 'N/A'}</div>
                          {order.customer_email && <div style={{ fontSize: 11, color: C.muted }}>{order.customer_email}</div>}
                        </TD>
                        <TD>₹{Number(order.total || 0).toLocaleString('en-IN')}</TD>
                        <TD><StatusBadge value={order.payment_status} /></TD>
                        <TD>
                          <select value={order.shipping_status || 'Pending'}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            disabled={busy}
                            style={{ padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, fontFamily: 'Jost, sans-serif', background: '#fff', cursor: 'pointer' }}>
                            {['Pending','Processing','Shipped','Out for Delivery','Delivered','Cancelled','Return Initiated','Returned'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </TD>
                        <TD>
                          {order.fulfillment_status
                            ? <StatusBadge value={order.fulfillment_status} />
                            : <span style={{ color: C.muted, fontSize: 12 }}>—</span>
                          }
                        </TD>
                        <TD>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {canFulfill && (
                              <Btn small variant="success" onClick={() => { setFulfillModal(order); setFulfillForm({ carrier:'', tracking_number:'', notes:'' }); }}>
                                Fulfill
                              </Btn>
                            )}
                            {canRefund && (
                              <Btn small variant="danger" loading={busy} onClick={() => handleRefund(order.id)}>
                                Refund
                              </Btn>
                            )}
                            {/* Inline waybill */}
                            <div style={{ display: 'flex', gap: 4 }}>
                              <input
                                placeholder="Waybill…"
                                value={waybillInputs[order.id] || ''}
                                onChange={e => setWaybillInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                                style={{ width: 110, padding: '4px 8px', fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 5, fontFamily: 'Jost, sans-serif' }}
                              />
                              <Btn small variant="secondary" loading={busy} onClick={() => handleSetWaybill(order.id)}>Set</Btn>
                            </div>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 14 }}>No orders match your filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════ INVENTORY ═══════════════════════════════ */}
        {tab === 'Inventory' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Inventory Levels</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
                  Double-entry ledger — ordered by available stock (lowest first)
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.muted }}>
                <span style={{ padding: '4px 10px', borderRadius: 4, background: '#FEF2F2', color: '#991B1B' }}>● Critical ≤ 0</span>
                <span style={{ padding: '4px 10px', borderRadius: 4, background: '#FFFBEB', color: '#92400E' }}>● Low ≤ 5</span>
                <span style={{ padding: '4px 10px', borderRadius: 4, background: '#F0FDF4', color: '#166534' }}>● OK &gt; 5</span>
              </div>
            </div>

            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>{['Product', 'SKU', 'Location', 'Available', 'Committed', 'Unavailable', 'Total On Hand'].map(h => <TH key={h}>{h}</TH>)}</tr>
                </thead>
                <tbody>
                  {inventory.map((row, i) => {
                    const avail = row.available;
                    const rowBg = avail <= 0 ? '#FEF2F2' : avail <= 5 ? '#FFFBEB' : '';
                    const availColor = avail <= 0 ? '#991B1B' : avail <= 5 ? '#92400E' : C.sage;
                    return (
                      <tr key={i} style={{ background: rowBg }}>
                        <TD><span style={{ fontWeight: 500 }}>{row.product_name}</span></TD>
                        <TD><code style={{ fontSize: 11, background: C.creamD, padding: '2px 6px', borderRadius: 3 }}>{row.sku}</code></TD>
                        <TD><span style={{ color: C.muted }}>{row.location_name}</span></TD>
                        <TD><span style={{ fontWeight: 700, color: availColor, fontSize: 15 }}>{avail}</span></TD>
                        <TD><span style={{ color: '#1D4ED8', fontWeight: 500 }}>{row.committed}</span></TD>
                        <TD><span style={{ color: '#92400E' }}>{row.unavailable}</span></TD>
                        <TD><span style={{ fontWeight: 600 }}>{row.total_on_hand}</span></TD>
                      </tr>
                    );
                  })}
                  {inventory.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 14 }}>
                      No inventory data. Run migration_phase1.sql and create some products.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════ PRODUCTS ════════════════════════════════ */}
        {tab === 'Products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Products ({products.length})</h2>
              <Btn variant="primary" onClick={() => setShowProdForm(v => !v)}>
                {showProdForm ? '✕ Cancel' : '+ Add Product'}
              </Btn>
            </div>

            {showProdForm && (
              <form onSubmit={handleSaveProduct}
                style={{ background: C.creamD, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 600 }}>New Product</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
                  {[
                    { label: 'Product Name *', name: 'name',          type: 'text',   placeholder: 'Handcrafted earrings…' },
                    { label: 'Category *',     name: 'category',      type: 'text',   placeholder: 'Jewellery' },
                    { label: 'Price (₹) *',    name: 'price',         type: 'number', placeholder: '1499' },
                    { label: 'Original Price', name: 'originalPrice', type: 'number', placeholder: '1999' },
                    { label: 'Stock *',        name: 'stock',         type: 'number', placeholder: '25' },
                  ].map(f => (
                    <label key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>{f.label}</span>
                      <input type={f.type} placeholder={f.placeholder} value={prodForm[f.name] || ''}
                        onChange={e => setProdForm(p => ({ ...p, [f.name]: e.target.value }))}
                        style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 13, fontFamily: 'Jost, sans-serif' }} />
                    </label>
                  ))}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}>
                    <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>Description</span>
                    <input placeholder="Short product description…" value={prodForm.description || ''}
                      onChange={e => setProdForm(p => ({ ...p, description: e.target.value }))}
                      style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 13, fontFamily: 'Jost, sans-serif' }} />
                  </label>
                </div>
                <div style={{ marginTop: 18 }}>
                  <Btn variant="primary" loading={savingProd}>Add Product</Btn>
                </div>
              </form>
            )}

            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr>{['Name', 'Category', 'Price', 'Available Stock', 'Status', 'Actions'].map(h => <TH key={h}>{h}</TH>)}</tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}
                        onMouseEnter={e => e.currentTarget.style.background = C.creamD}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <TD>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{p.sku}</div>
                      </TD>
                      <TD><span style={{ fontSize: 12, color: C.muted }}>{p.category}</span></TD>
                      <TD>
                        <span style={{ fontWeight: 600 }}>₹{Number(p.price).toLocaleString('en-IN')}</span>
                        {p.original_price && Number(p.original_price) > Number(p.price) && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: C.muted, textDecoration: 'line-through' }}>
                            ₹{Number(p.original_price).toLocaleString('en-IN')}
                          </span>
                        )}
                      </TD>
                      <TD>
                        <span style={{
                          fontWeight: 600,
                          color: p.stock_quantity <= 0 ? '#991B1B' : p.stock_quantity <= 10 ? '#92400E' : C.sage,
                        }}>
                          {p.stock_quantity ?? '—'}
                        </span>
                      </TD>
                      <TD>
                        <StatusBadge value={p.is_active ? 'delivered' : 'cancelled'} />
                      </TD>
                      <TD>
                        <Btn small variant="danger" onClick={() => handleDeleteProduct(p.id)}>Deactivate</Btn>
                      </TD>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: C.muted }}>No products yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════ AUDIT LOG ═══════════════════════════════ */}
        {tab === 'Audit Log' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Audit Log</h2>
              <Btn variant="secondary" small onClick={loadAuditLog}>Refresh</Btn>
            </div>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>{['Time', 'Actor', 'Action', 'Target', 'Detail'].map(h => <TH key={h}>{h}</TH>)}</tr>
                </thead>
                <tbody>
                  {auditLog.map(log => {
                    let detail = '';
                    try { detail = log.detail ? JSON.stringify(JSON.parse(log.detail), null, 0) : ''; } catch { detail = log.detail || ''; }
                    return (
                      <tr key={log.id}
                          onMouseEnter={e => e.currentTarget.style.background = C.creamD}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <TD><span style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('en-IN')}</span></TD>
                        <TD><span style={{ fontWeight: 500 }}>User #{log.actor_id}</span></TD>
                        <TD>
                          <code style={{ fontSize: 11, background: C.creamD, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.04em' }}>
                            {log.action}
                          </code>
                        </TD>
                        <TD>
                          {log.target_type && (
                            <span style={{ color: C.muted, fontSize: 12 }}>
                              {log.target_type}
                              {log.target_id ? ` #${log.target_id}` : ''}
                            </span>
                          )}
                        </TD>
                        <TD>
                          <span style={{ fontSize: 11, color: C.muted, maxWidth: 300, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {detail}
                          </span>
                        </TD>
                      </tr>
                    );
                  })}
                  {auditLog.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: C.muted }}>No audit entries yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Fulfill Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={!!fulfillModal}
        title={`Fulfill Order #${fulfillModal?.id}`}
        onClose={() => setFulfillModal(null)}
      >
        {fulfillModal && (
          <div>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              Customer: <strong>{fulfillModal.customer_name}</strong>
              {' · '}Amount: <strong>₹{Number(fulfillModal.total).toLocaleString('en-IN')}</strong>
              {' · '}{fulfillModal.item_count} item(s)
            </p>
            <p style={{ fontSize: 12, color: '#1D4ED8', background: '#EFF6FF', padding: '8px 12px', borderRadius: 6, marginBottom: 20 }}>
              ℹ Fulfilling this order will write <strong>order_shipped</strong> inventory transactions,
              removing stock from the committed bucket.
            </p>

            {[
              { label: 'Carrier',         name: 'carrier',          placeholder: 'Delhivery, BlueDart…' },
              { label: 'Tracking Number', name: 'tracking_number',  placeholder: 'Waybill / AWB…' },
              { label: 'Notes',           name: 'notes',            placeholder: 'Internal note (optional)' },
            ].map(f => (
              <label key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>{f.label}</span>
                <input type="text" placeholder={f.placeholder}
                  value={fulfillForm[f.name] || ''}
                  onChange={e => setFulfillForm(p => ({ ...p, [f.name]: e.target.value }))}
                  style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 13, fontFamily: 'Jost, sans-serif' }} />
              </label>
            ))}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <Btn variant="secondary" onClick={() => setFulfillModal(null)}>Cancel</Btn>
              <Btn variant="success" loading={fulfillLoading} onClick={handleSingleFulfill}>
                ✓ Mark as Shipped
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
