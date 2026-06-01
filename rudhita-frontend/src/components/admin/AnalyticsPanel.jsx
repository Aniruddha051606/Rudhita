// src/components/admin/AnalyticsPanel.jsx
import React, { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, IndianRupee } from 'lucide-react';
import { API } from '@/api/client';
import { formatINR } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

// Lightweight inline SVG charts â€” no charting library, keeps the bundle small.
function RevenueChart({ series }) {
  if (!series || series.length === 0) return <p className="text-muted text-sm py-8 text-center">No sales in this period.</p>;
  const W = 720, H = 180, P = 8;
  const max = Math.max(...series.map((d) => d.revenue), 1);
  const step = series.length > 1 ? (W - P * 2) / (series.length - 1) : 0;
  const pts = series.map((d, i) => [P + i * step, H - P - (d.revenue / max) * (H - P * 2)]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - P} L${pts[0][0].toFixed(1)},${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
      <path d={area} fill="hsl(10 82% 54% / 0.12)" />
      <path d={line} fill="none" stroke="hsl(10 82% 54%)" strokeWidth="2.5" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="hsl(20 14% 8%)" />)}
    </svg>
  );
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="border-2 border-ink p-5">
      <Icon size={20} className="text-punch mb-3" />
      <p className="font-display text-3xl font-bold leading-none mb-1">{value}</p>
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

export default function AnalyticsPanel() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.admin.analytics(days).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="flex items-center justify-center py-20 gap-3 text-muted"><Spinner /> <span className="font-mono text-sm">Loading analyticsâ€¦</span></div>;
  if (!data) return <p className="text-muted py-12 text-center">Analytics unavailable.</p>;

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex gap-1 border-2 border-ink p-1 w-fit">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-4 h-9 font-sans font-semibold text-sm transition-colors ${days === d ? 'bg-ink text-paper' : 'hover:bg-sand'}`}>
            {d}d
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBox icon={IndianRupee} label={`Revenue (${days}d)`} value={formatINR(data.total_revenue)} />
        <StatBox icon={ShoppingCart} label="Paid Orders" value={data.order_count} />
        <StatBox icon={TrendingUp} label="Avg Order Value" value={formatINR(data.avg_order_value)} />
      </div>

      {/* Revenue chart */}
      <div className="border-2 border-ink p-5">
        <h3 className="eyebrow mb-4">Revenue â€” last {days} days</h3>
        <RevenueChart series={data.series} />
      </div>

      {/* Top products */}
      <div className="border-2 border-ink">
        <div className="border-b-2 border-ink px-4 py-3 bg-sand"><span className="font-display font-semibold">Top Sellers</span></div>
        {(!data.top_products || data.top_products.length === 0) ? (
          <p className="text-muted text-sm px-4 py-8 text-center">No sales yet.</p>
        ) : (
          <div className="divide-y-2 divide-line">
            {data.top_products.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                <span className="font-display text-lg font-bold text-line w-6">{i + 1}</span>
                <span className="flex-1 font-medium truncate">{p.name}</span>
                <span className="font-mono text-xs text-muted">{p.units} sold</span>
                <span className="font-semibold w-24 text-right">{formatINR(p.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
