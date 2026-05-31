// src/pages/UserAccountPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, LogOut } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.orders.list().then((d) => setOrders(d.orders || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
    </div>
  );
}
