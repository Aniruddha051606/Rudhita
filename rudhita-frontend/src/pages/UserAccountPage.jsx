// src/pages/UserAccountPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, LogOut, Heart, Trash2 } from 'lucide-react';
import { API } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

const statusVariant = (s) => {
  const v = (s || '').toLowerCase();
  if (v === 'paid' || v === 'delivered') return 'punch';
  if (v === 'pending') return 'muted';
  return 'outline';
};

export default function UserAccountPage() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.orders.list().then((d) => setOrders(d.orders || [])).catch(() => {}),
      API.wishlist.list().then((w) => setWishlist(Array.isArray(w) ? w : [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const removeWish = async (productId) => {
    try { await API.wishlist.toggle(productId); setWishlist((prev) => prev.filter((w) => w.product_id !== productId)); }
    catch { /* ignore */ }
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="eyebrow text-punch mb-3">Your Account</p>
          <h1 className="h-display text-5xl">Hi, {user?.name?.split(' ')[0] || 'there'}.</h1>
        </div>
        <Button variant="outline" onClick={logout}><LogOut size={16} /> Log out</Button>
      </div>

      {/* Profile card */}
      <div className="border-2 border-ink p-6 mb-10 grid sm:grid-cols-3 gap-6">
        <div>
          <p className="eyebrow mb-1">Name</p>
          <p className="font-sans font-semibold">{user?.name || '—'}</p>
        </div>
        <div>
          <p className="eyebrow mb-1">Email</p>
          <p className="font-sans font-semibold break-all">{user?.email || '—'}</p>
        </div>
        <div>
          <p className="eyebrow mb-1">Phone</p>
          <p className="font-sans font-semibold">{user?.phone || 'Not set'}</p>
        </div>
      </div>

      {/* Orders */}
      <h2 className="font-display text-2xl font-semibold mb-5">Order History</h2>
      {loading ? (
        <div className="flex items-center gap-3 text-muted py-12 justify-center"><Spinner /> <span className="font-mono text-sm">Loading orders…</span></div>
      ) : orders.length === 0 ? (
        <div className="border-2 border-ink p-12 text-center">
          <Package size={32} className="mx-auto mb-4 text-line" />
          <p className="font-display text-xl mb-2">No orders yet.</p>
          <Link to="/products"><Button variant="punch" className="mt-2">Start shopping</Button></Link>
        </div>
      ) : (
        <div className="border-2 border-ink divide-y-2 divide-line">
          {orders.map((o) => (
            <Link key={o.id} to={`/order/${o.id}/tracking`} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-sand transition-colors">
              <div>
                <p className="font-display font-semibold">Order #{o.id}</p>
                <p className="font-mono text-xs text-muted">
                  {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.item_count} item{o.item_count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex gap-2">
                  <Badge variant={statusVariant(o.payment_status)}>{o.payment_status}</Badge>
                  <Badge variant={statusVariant(o.shipping_status)}>{o.shipping_status}</Badge>
                </div>
                <span className="font-display font-bold">{formatINR(o.total_amount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Wishlist */}
      <h2 className="font-display text-2xl font-semibold mt-12 mb-5 flex items-center gap-2">
        <Heart size={22} className="text-punch" /> Wishlist
      </h2>
      {loading ? null : wishlist.length === 0 ? (
        <div className="border-2 border-dashed border-line p-10 text-center text-muted">
          <p>Nothing saved yet. Tap the heart on any product to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map((w) => (
            <div key={w.id} className="border-2 border-ink group relative">
              <Link to={`/product/${w.product_id}`} className="block">
                <div className="aspect-[4/5] border-b-2 border-ink bg-sand overflow-hidden">
                  {w.product?.image_url
                    ? <img src={w.product.image_url} alt={w.product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center font-display text-3xl text-line">R</div>}
                </div>
                <div className="p-3">
                  <p className="font-display font-semibold text-sm leading-tight truncate">{w.product?.name}</p>
                  <p className="font-sans font-bold text-sm mt-1">{formatINR(w.product?.price)}</p>
                </div>
              </Link>
              <button onClick={() => removeWish(w.product_id)} aria-label="Remove from wishlist"
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-paper border-2 border-ink hover:bg-destructive hover:text-paper hover:border-destructive transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
