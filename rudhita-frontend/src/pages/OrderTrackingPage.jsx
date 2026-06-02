// src/pages/OrderTrackingPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CircleCheck, Circle } from 'lucide-react';
import { API } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

const STAGES = ['Pending', 'Processing', 'Shipped', 'Out for delivery', 'Delivered'];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    API.orders.track(id)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setErr(e.message || 'Could not load tracking.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted"><Spinner /> <span className="font-mono text-sm">Loadingâ€¦</span></div>;
  if (err) return (
    <div className="max-w-2xl mx-auto px-5 py-32 text-center">
      <p className="font-display text-2xl mb-4">{err}</p>
      <Link to="/account"><Button variant="outline">â† Back to account</Button></Link>
    </div>
  );

  const events = data?.events || [];

  return (
    <div className="max-w-2xl mx-auto px-5 py-12 reveal">
      <Link to="/account" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted hover:text-punch mb-8">
        <ArrowLeft size={14} /> Account
      </Link>

      <div className="flex items-center justify-between mb-2">
        <p className="eyebrow text-punch">Tracking</p>
        <Badge variant="punch">{data?.shipping_status || 'Pending'}</Badge>
      </div>
      <h1 className="h-display text-4xl mb-2">Order #{data?.order_id}</h1>
      {data?.waybill && <p className="font-mono text-xs text-muted mb-10">Waybill: {data.waybill}</p>}

      {/* Timeline */}
      <div className="border-2 border-ink p-6 mt-6">
        {events.length === 0 ? (
          <div className="relative pl-8 space-y-8">
            {STAGES.map((stage, i) => {
              const reached = STAGES.findIndex((s) => s.toLowerCase() === (data?.shipping_status || 'pending').toLowerCase()) >= i;
              return (
                <div key={stage} className="relative">
                  <span className="absolute -left-8 top-0">{reached ? <CircleCheck size={20} className="text-punch" /> : <Circle size={20} className="text-line" />}</span>
                  <p className={`font-sans font-semibold ${reached ? 'text-ink' : 'text-muted'}`}>{stage}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative pl-8 space-y-8">
            {events.map((ev) => (
              <div key={ev.id} className="relative">
                <span className="absolute -left-8 top-0"><CircleCheck size={20} className="text-punch" /></span>
                <p className="font-sans font-semibold">{ev.status}</p>
                {ev.description && <p className="text-sm text-muted">{ev.description}</p>}
                {ev.location && <p className="font-mono text-xs text-muted">{ev.location}</p>}
                <p className="font-mono text-[11px] text-muted mt-1">
                  {new Date(ev.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
