// src/components/admin/OrderDetailDrawer.jsx
import React, { useEffect, useState } from 'react';
import { X, FileText, Truck, RotateCcw, MapPin, User, CreditCard } from 'lucide-react';
import { API } from '@/api/client';
import { formatINR } from '@/lib/utils';
import { generateInvoice } from '@/lib/invoice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

const CARRIERS = ['Delhivery', 'BlueDart', 'DTDC', 'India Post', 'Ekart', 'Shiprocket', 'Other'];

export default function OrderDetailDrawer({ orderId, onClose, onChanged }) {
  const [order, setOrder]   = useState(null);
  const [loading, setLoad]  = useState(true);
  const [err, setErr]       = useState('');
  const [busy, setBusy]     = useState('');     // which action is running

  // fulfill form
  const [carrier, setCarrier]   = useState('Delhivery');
  const [tracking, setTracking] = useState('');

  const load = async () => {
    setLoad(true); setErr('');
    try { setOrder(await API.admin.order(orderId)); }
    catch (e) { setErr(e.message || 'Could not load order.'); }
    finally { setLoad(false); }
  };
  useEffect(() => { if (orderId) load(); /* eslint-disable-next-line */ }, [orderId]);

  const doFulfill = async () => {
    if (!tracking.trim()) { setErr('Enter a tracking number to fulfill.'); return; }
    setBusy('fulfill'); setErr('');
    try {
      await API.admin.fulfillOrder(orderId, { carrier, tracking_number: tracking.trim() });
      await load(); onChanged?.();
    } catch (e) { setErr(e.message || 'Fulfillment failed.'); }
    finally { setBusy(''); }
  };

  const doRefund = async () => {
    if (!window.confirm('Refund the full amount for this order? This cannot be undone.')) return;
    setBusy('refund'); setErr('');
    try {
      await API.admin.refundOrder(orderId);
      await load(); onChanged?.();
    } catch (e) { setErr(e.message || 'Refund failed.'); }
    finally { setBusy(''); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-lg bg-paper border-l-2 border-ink flex flex-col">
        <div className="flex items-center justify-between border-b-2 border-ink px-6 h-16 shrink-0">
          <span className="font-display text-xl font-semibold">{order ? `Order #${order.id}` : 'Order'}</span>
          <button onClick={onClose} className="hover:text-punch"><X size={22} strokeWidth={2.5} /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-muted"><Spinner /> <span className="font-mono text-sm">Loadingâ€¦</span></div>
        ) : !order ? (
          <div className="flex-1 flex items-center justify-center text-destructive font-mono text-sm">{err || 'Not found.'}</div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {err && <div className="border-2 border-destructive bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">{err}</div>}

              {/* Status chips */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={order.payment_status === 'Paid' ? 'punch' : 'muted'}>Payment: {order.payment_status}</Badge>
                <Badge variant="outline">Shipping: {order.shipping_status}</Badge>
                {order.razorpay_refund_id && <Badge variant="muted">Refunded</Badge>}
              </div>

              {/* Customer */}
              <section>
                <h3 className="eyebrow mb-2 flex items-center gap-1.5"><User size={12} /> Customer</h3>
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold">{order.customer_name}</p>
                  {order.customer_email && <p className="text-muted">{order.customer_email}</p>}
                  {order.customer_phone && <p className="text-muted">{order.customer_phone}</p>}
                </div>
              </section>

              {/* Address */}
              <section>
                <h3 className="eyebrow mb-2 flex items-center gap-1.5"><MapPin size={12} /> Shipping Address</h3>
                <p className="text-sm leading-relaxed">{order.shipping_address || 'â€”'}</p>
              </section>

              {/* Items */}
              <section>
                <h3 className="eyebrow mb-2">Items</h3>
                <div className="border-2 border-ink divide-y-2 divide-line">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex items-center gap-3 p-3">
                      <div className="w-12 h-14 shrink-0 border-2 border-ink bg-sand overflow-hidden">
                        {it.product_image
                          ? <img src={it.product_image} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center font-display text-lg text-line">R</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{it.product_name}</p>
                        <p className="font-mono text-xs text-muted">{it.quantity} Ã— {formatINR(it.price_at_purchase)}</p>
                      </div>
                      <span className="font-semibold text-sm">{formatINR(it.line_total)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 font-display text-lg font-bold">
                  <span>Total</span><span>{formatINR(order.total_amount)}</span>
                </div>
              </section>

              {/* Payment refs */}
              {(order.razorpay_payment_id || order.waybill) && (
                <section>
                  <h3 className="eyebrow mb-2 flex items-center gap-1.5"><CreditCard size={12} /> References</h3>
                  <div className="font-mono text-xs text-muted space-y-1">
                    {order.razorpay_payment_id && <p>Payment: {order.razorpay_payment_id}</p>}
                    {order.razorpay_refund_id && <p>Refund: {order.razorpay_refund_id}</p>}
                    {order.waybill && <p>Waybill: {order.waybill}</p>}
                  </div>
                </section>
              )}

              {/* Fulfill */}
              <section className="border-2 border-ink p-4">
                <h3 className="eyebrow mb-3 flex items-center gap-1.5"><Truck size={12} /> Fulfill / Ship</h3>
                <div className="grid gap-3">
                  <select value={carrier} onChange={(e) => setCarrier(e.target.value)}
                    className="h-11 border-2 border-ink bg-paper px-3 font-sans text-sm focus:outline-none focus:shadow-brutalPunch">
                    {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking / waybill number"
                    className="h-11 border-2 border-ink bg-paper px-3 font-sans text-sm focus:outline-none focus:shadow-brutalPunch" />
                  <Button variant="primary" onClick={doFulfill} disabled={busy === 'fulfill'}>
                    {busy === 'fulfill' ? 'Fulfillingâ€¦' : 'Mark fulfilled'}
                  </Button>
                </div>
              </section>
            </div>

            {/* Action bar */}
            <div className="border-t-2 border-ink p-4 flex gap-3 shrink-0">
              <Button variant="outline" className="flex-1" onClick={() => generateInvoice(order)}>
                <FileText size={16} /> Invoice
              </Button>
              {order.payment_status === 'Paid' && !order.razorpay_refund_id && (
                <Button variant="ghost" className="flex-1 text-destructive" onClick={doRefund} disabled={busy === 'refund'}>
                  <RotateCcw size={16} /> {busy === 'refund' ? 'Refundingâ€¦' : 'Refund'}
                </Button>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
