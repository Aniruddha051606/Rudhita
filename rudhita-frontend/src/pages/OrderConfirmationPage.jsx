// src/pages/OrderConfirmationPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Package } from 'lucide-react';
import { API } from '@/api/client';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function OrderConfirmationPage() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    API.orders.get(orderId).then(setOrder).catch(() => {}).finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="max-w-2xl mx-auto px-5 py-20 text-center reveal">
      <div className="w-20 h-20 mx-auto mb-8 bg-punch border-2 border-ink shadow-brutal flex items-center justify-center animate-scale-in">
        <Check size={40} strokeWidth={3} className="text-paper" />
      </div>
      <p className="eyebrow text-punch mb-3">Order Confirmed</p>
      <h1 className="h-display text-5xl mb-4">Thank you.</h1>
      <p className="text-muted mb-10">
        Your order has been received and is being prepared. A confirmation email is on its way.
      </p>

      {loading ? (
        <div className="flex justify-center"><Spinner /></div>
      ) : order ? (
        <div className="border-2 border-ink text-left">
          <div className="flex items-center justify-between border-b-2 border-ink px-6 py-4 bg-sand">
            <span className="font-mono text-sm">Order #{order.id}</span>
            <span className="font-mono text-sm">{formatINR(order.total_amount)}</span>
          </div>
          <div className="divide-y-2 divide-line">
            {(order.items || []).map((it) => (
              <div key={it.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-14 h-16 shrink-0 border-2 border-ink bg-sand overflow-hidden">
                  {it.product?.image_url
                    ? <img src={it.product.image_url} alt={it.product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center font-display text-xl text-line">R</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold truncate">{it.product?.name}</p>
                  <p className="font-mono text-xs text-muted">Qty {it.quantity}</p>
                </div>
                <span className="font-semibold text-sm">{formatINR(Number(it.price_at_purchase) * it.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="font-mono text-sm text-muted">Order details will appear in your account.</p>
      )}

      <div className="flex flex-wrap gap-4 justify-center mt-10">
        {order && <Link to={`/order/${order.id}/tracking`}><Button variant="outline"><Package size={18} /> Track order</Button></Link>}
        <Link to="/products"><Button variant="punch">Continue shopping</Button></Link>
      </div>
    </div>
  );
}
