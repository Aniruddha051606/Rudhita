// src/pages/AdminDashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, TrendingUp, AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';
import { API } from '@/api/client';
import { formatINR } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import ProductEditor from '@/components/admin/ProductEditor';
import OrderDetailDrawer from '@/components/admin/OrderDetailDrawer';
import { generateInvoice } from '@/lib/invoice';
import { CustomersPanel, InventoryPanel, ActivityPanel } from '@/components/admin/AdminPanels';
import AnalyticsPanel from '@/components/admin/AnalyticsPanel';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'out for delivery', 'delivered'];

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`border-2 border-ink p-5 ${accent ? 'bg-punch text-paper' : 'bg-paper'}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon size={20} className={accent ? 'text-paper' : 'text-punch'} />
      </div>
      <p className="font-display text-3xl font-bold leading-none mb-1">{value}</p>
      <p className={`font-mono text-[11px] uppercase tracking-wider ${accent ? 'text-paper/70' : 'text-muted'}`}>{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);     // overview load
  const [tabLoading, setTabLoading] = useState(false); // per-tab load
  const [loaded, setLoaded] = useState({});          // which tabs have fetched
  const [tab, setTab] = useState('overview');
  const [savingId, setSavingId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [lowStock, setLowStock] = useState([]);

  // Overview only — lightweight, loads on mount.
  const loadOverview = async () => {
    setLoading(true);
    try {
      const [s, ls] = await Promise.all([
        API.admin.stats().catch(() => null),
        API.admin.lowStock().catch(() => []),
      ]);
      setStats(s);
      setLowStock(Array.isArray(ls) ? ls : []);
    } finally { setLoading(false); }
  };

  // Orders / products fetch only when their tab is first opened (then cached).
  const loadOrders = async (force = false) => {
    if (loaded.orders && !force) return;
    setTabLoading(true);
    try {
      const o = await API.admin.orders({ limit: 50 }).catch(() => ({ orders: [] }));
      setOrders(o.orders || []);
      setLoaded((l) => ({ ...l, orders: true }));
    } finally { setTabLoading(false); }
  };
  const loadProducts = async (force = false) => {
    if (loaded.products && !force) return;
    setTabLoading(true);
    try {
      const p = await API.admin.products().catch(() => ({ products: [] }));
      setProducts(Array.isArray(p) ? p : (p.products || []));
      setLoaded((l) => ({ ...l, products: true }));
    } finally { setTabLoading(false); }
  };

  useEffect(() => { loadOverview(); }, []);

  // When the tab changes, lazily load that tab's data once.
  useEffect(() => {
    if (tab === 'orders') loadOrders();
    else if (tab === 'products') loadProducts();
    // inventory / customers / activity self-load in their own components
    // eslint-disable-next-line
  }, [tab]);

  // Backwards-compatible refresh used by editor/drawer callbacks.
  const load = () => {
    loadOverview();
    if (tab === 'orders') loadOrders(true);
    if (tab === 'products') loadProducts(true);
  };


  const openNew  = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (p) => { setEditing(p); setEditorOpen(true); };
  const onSaved  = () => { setEditorOpen(false); setEditing(null); load(); };

  const deleteProduct = async (p) => {
    if (!window.confirm(`Deactivate “${p.name}”? It will be hidden from the store.`)) return;
    try { await API.adminProducts.remove(p.id); setProducts((prev) => prev.filter((x) => x.id !== p.id)); }
    catch (e) { alert(e.message || 'Could not delete.'); }
  };

  const changeStatus = async (orderId, status) => {
    setSavingId(orderId);
    try {
      await API.admin.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, shipping_status: status } : o)));
    } catch (e) { alert(e.message || 'Failed to update status.'); }
    finally { setSavingId(null); }
  };

  // Order filtering + search
  const [orderSearch, setOrderSearch] = useState('');
  const [fPayment, setFPayment] = useState('');
  const [fShipping, setFShipping] = useState('');
  const filteredOrders = React.useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (fPayment && (o.payment_status || '').toLowerCase() !== fPayment) return false;
      if (fShipping && (o.shipping_status || '').toLowerCase() !== fShipping) return false;
      if (q) {
        const hay = `${o.id} ${o.customer_name || ''} ${o.customer_email || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, orderSearch, fPayment, fShipping]);

  // Bulk fulfill
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const toggleSelect = (id) => setSelectedOrders((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const bulkFulfill = async () => {
    if (selectedOrders.length === 0) return;
    if (!window.confirm(`Mark ${selectedOrders.length} order(s) as fulfilled?`)) return;
    setBulkBusy(true);
    try {
      await API.admin.bulkFulfill(selectedOrders);
      setSelectedOrders([]);
      loadOrders(true);
    } catch (e) { alert(e.message || 'Bulk fulfill failed.'); }
    finally { setBulkBusy(false); }
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <header className="border-b-2 border-ink sticky top-0 bg-paper z-30">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={22} className="text-punch" />
            <span className="font-display text-xl font-bold">Rudhita Admin</span>
          </div>
          <Link to="/"><Button variant="ghost" size="sm">← Back to store</Button></Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-10">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-2 border-ink p-1 w-fit">
          {['overview', 'analytics', 'orders', 'products', 'inventory', 'customers', 'activity'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 h-10 font-sans font-semibold text-sm capitalize transition-colors ${tab === t ? 'bg-ink text-paper' : 'hover:bg-sand'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading && tab === 'overview' ? (
          <div className="flex items-center justify-center py-32 gap-3 text-muted"><Spinner /> <span className="font-mono text-sm">Loading…</span></div>
        ) : tabLoading && (tab === 'orders' || tab === 'products') ? (
          <div className="flex items-center justify-center py-32 gap-3 text-muted"><Spinner /> <span className="font-mono text-sm">Loading…</span></div>
        ) : tab === 'overview' ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={TrendingUp} label="Total Revenue" value={formatINR(stats?.total_revenue || 0)} accent />
              <StatCard icon={ShoppingCart} label="Total Orders" value={stats?.total_orders ?? 0} />
              <StatCard icon={Package} label="Products" value={stats?.total_products ?? 0} />
              <StatCard icon={Users} label="Customers" value={stats?.total_users ?? 0} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={ShoppingCart} label="Pending" value={stats?.pending_orders ?? 0} />
              <StatCard icon={Package} label="Shipped" value={stats?.shipped_orders ?? 0} />
              <StatCard icon={Package} label="Delivered" value={stats?.delivered_orders ?? 0} />
              <StatCard icon={AlertTriangle} label="Low Stock" value={stats?.low_stock_products ?? 0} accent={Number(stats?.low_stock_products) > 0} />
            </div>

            {/* Low-stock list */}
            {lowStock.length > 0 && (
              <div className="mt-6 border-2 border-ink">
                <div className="flex items-center gap-2 border-b-2 border-ink px-4 py-3 bg-sand">
                  <AlertTriangle size={16} className="text-punch" />
                  <span className="font-display font-semibold">Needs restock</span>
                  <Badge variant="punch" className="ml-auto">{lowStock.length}</Badge>
                </div>
                <div className="divide-y-2 divide-line">
                  {lowStock.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="font-mono text-[11px] text-muted">{p.sku}</p>
                      </div>
                      <span className={`font-display font-bold ${p.stock_quantity <= 2 ? 'text-destructive' : 'text-punch'}`}>{p.stock_quantity} left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : tab === 'orders' ? (
          <>
            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order #, name, email…"
                className="h-10 border-2 border-ink bg-paper px-3 font-sans text-sm focus:outline-none focus:shadow-brutalPunch flex-1 min-w-[200px]"
              />
              <select value={fPayment} onChange={(e) => setFPayment(e.target.value)}
                className="h-10 border-2 border-ink bg-paper px-3 font-sans text-sm focus:outline-none focus:shadow-brutalPunch">
                <option value="">All payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
              <select value={fShipping} onChange={(e) => setFShipping(e.target.value)}
                className="h-10 border-2 border-ink bg-paper px-3 font-sans text-sm focus:outline-none focus:shadow-brutalPunch">
                <option value="">All shipping</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {selectedOrders.length > 0 && (
                <Button variant="punch" size="sm" disabled={bulkBusy} onClick={bulkFulfill}>
                  {bulkBusy ? 'Working…' : `Fulfill ${selectedOrders.length} selected`}
                </Button>
              )}
            </div>

            <div className="border-2 border-ink overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-ink text-paper font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 w-8"></th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Shipping</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-line">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted">No matching orders.</td></tr>
                ) : filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-sand">
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={() => toggleSelect(o.id)} className="w-4 h-4 accent-punch" />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedOrderId(o.id)} className="font-semibold hover:text-punch underline-offset-2 hover:underline">#{o.id}</button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.customer_name}</p>
                      {o.customer_email && <p className="font-mono text-[11px] text-muted">{o.customer_email}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatINR(o.total)}</td>
                    <td className="px-4 py-3"><Badge variant={o.payment_status === 'Paid' ? 'punch' : 'muted'}>{o.payment_status}</Badge></td>
                    <td className="px-4 py-3">
                      <select
                        value={(o.shipping_status || 'pending').toLowerCase()}
                        disabled={savingId === o.id}
                        onChange={(e) => changeStatus(o.id, e.target.value)}
                        className="border-2 border-ink bg-paper px-2 py-1 font-sans text-sm focus:outline-none focus:shadow-brutalPunch"
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setSelectedOrderId(o.id)} className="px-3 py-1.5 border-2 border-ink text-xs font-semibold hover:bg-ink hover:text-paper transition-colors">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        ) : tab === 'products' ? (
          // ── PRODUCTS ──
          <>
            <div className="flex justify-between items-center mb-5">
              <p className="font-mono text-sm text-muted">{products.length} product{products.length !== 1 ? 's' : ''}</p>
              <Button variant="punch" onClick={openNew}><Plus size={18} /> New product</Button>
            </div>
            <div className="border-2 border-ink overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-ink text-paper font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-line">
                  {products.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-muted">No products yet. Add your first one.</td></tr>
                  ) : products.map((p) => (
                    <tr key={p.id} className="hover:bg-sand">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 shrink-0 border-2 border-ink bg-sand overflow-hidden">
                            {p.image_url
                              ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center font-display text-sm text-line">R</div>}
                          </div>
                          <span className="font-medium truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{p.category || '—'}</td>
                      <td className="px-4 py-3 font-semibold">{formatINR(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={p.stock_quantity <= 5 ? 'text-punch font-semibold' : ''}>{p.stock_quantity}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(p)} className="p-2 border-2 border-ink hover:bg-ink hover:text-paper transition-colors" aria-label="Edit"><Pencil size={15} /></button>
                          <button onClick={() => deleteProduct(p)} className="p-2 border-2 border-ink hover:bg-destructive hover:border-destructive hover:text-paper transition-colors" aria-label="Delete"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : tab === 'analytics' ? (
          <AnalyticsPanel />
        ) : tab === 'inventory' ? (
          <InventoryPanel />
        ) : tab === 'customers' ? (
          <CustomersPanel />
        ) : (
          <ActivityPanel />
        )}
      </div>

      {editorOpen && (
        <ProductEditor
          product={editing}
          onClose={() => { setEditorOpen(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}

      {selectedOrderId && (
        <OrderDetailDrawer
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
