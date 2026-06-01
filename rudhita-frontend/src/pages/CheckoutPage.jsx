// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '@/api/client';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Cashfree JS SDK v3 is loaded globally in index.html (window.Cashfree).
function getCashfree(mode) {
  if (typeof window.Cashfree !== 'function') return null;
  return window.Cashfree({ mode }); // mode: 'sandbox' | 'production'
}

const FIELDS = [
  ['name', 'Full Name', 'text', 'Your name'],
  ['phone', 'Phone', 'tel', '+91 98765 43210'],
  ['street', 'Street Address', 'text', 'House no, street, area'],
  ['city', 'City', 'text', 'City'],
  ['state', 'State', 'text', 'State'],
  ['pincode', 'PIN Code', 'text', '6-digit PIN'],
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [addr, setAddr] = useState({ name: user?.name || '', phone: '', street: '', city: '', state: '', pincode: '' });
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  const shipping = shippingMethod === 'express' ? 200 : (subtotal > 3000 ? 0 : 100);
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const validate = () => {
    if (Object.values(addr).some((v) => !v.trim())) return 'Please fill in all address fields.';
    if (!/^\d{6}$/.test(addr.pincode)) return 'PIN code must be 6 digits.';
    if (addr.phone.replace(/\D/g, '').length < 7) return 'Please enter a valid phone number.';
    return '';
  };

  const placeOrder = async () => {
    const v = validate();
    if (v) { setErr(v); return; }
    setErr('');
    setBusy(true);
    try {
      // 1. Create the order on the backend (it computes the authoritative amount
      //    and creates the Cashfree order, returning a payment_session_id).
      const order = await API.orders.create({
        address: addr,
        shipping_method: shippingMethod,
        payment_method: 'cashfree',
      });

      if (!order.payment_session_id) {
        throw new Error('Could not start payment session. Please try again.');
      }

      const cashfree = getCashfree(order.env === 'production' ? 'production' : 'sandbox');
      if (!cashfree) throw new Error('Payment SDK failed to load. Please refresh and try again.');

      // 2. Open Cashfree checkout in a modal (stays on our page).
      const result = await cashfree.checkout({
        paymentSessionId: order.payment_session_id,
        redirectTarget: '_modal',
      });

      // If the modal flow returned an error object, surface it.
      if (result && result.error) {
        setErr(result.error.message || 'Payment was not completed.');
        setBusy(false);
        return;
      }

      // 3. Verify server-side (Cashfree is the source of truth — we ask our
      //    backend, which asks Cashfree, never trusting the browser).
      const verify = await API.orders.verifyPayment(order.order_id);
      if (verify.status === 'success') {
        await clearCart();
        navigate(`/order-confirmation?order=${order.order_id}`);
      } else {
        // Payment may still be processing; the webhook will reconcile it.
        setErr('Payment is being confirmed. Check your orders in a moment — you’ll get an email once it’s done.');
        setBusy(false);
      }
    } catch (e) {
      setErr(e.message || 'Could not start checkout.');
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-32 text-center">
        <h1 className="h-display text-4xl mb-4">Your cart is empty.</h1>
        <Button variant="outline" onClick={() => navigate('/products')}>Browse the collection</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      <p className="eyebrow text-punch mb-3">Checkout</p>
      <h1 className="h-display text-5xl mb-10">Almost yours.</h1>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Address form */}
        <div className="lg:col-span-2">
          <div className="border-2 border-ink p-6">
            <h2 className="font-display text-xl font-semibold mb-6">Shipping Address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {FIELDS.map(([k, label, type, ph]) => (
                <div key={k} className={k === 'street' ? 'sm:col-span-2' : ''}>
                  <Input label={label} type={type} value={addr[k]} onChange={set(k)} placeholder={ph} />
                </div>
              ))}
            </div>

            <h2 className="font-display text-xl font-semibold mt-8 mb-4">Shipping Method</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[['standard', 'Standard', subtotal > 3000 ? 'Free' : formatINR(100), '4–7 days'],
                ['express', 'Express', formatINR(200), '1–2 days']].map(([val, name, price, eta]) => (
                <button key={val} onClick={() => setShippingMethod(val)}
                  className={`text-left border-2 border-ink p-4 transition-colors ${shippingMethod === val ? 'bg-ink text-paper' : 'hover:bg-sand'}`}>
                  <div className="flex justify-between font-semibold"><span>{name}</span><span>{price}</span></div>
                  <p className={`font-mono text-[11px] mt-1 ${shippingMethod === val ? 'text-paper/60' : 'text-muted'}`}>{eta}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="border-2 border-ink p-6 sticky top-24">
            <h2 className="font-display text-xl font-semibold mb-5">Order Summary</h2>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm gap-2">
                  <span className="text-muted truncate">{i.quantity}× {i.product.name}</span>
                  <span className="font-medium shrink-0">{formatINR(Number(i.product.price) * i.quantity)}</span>
                </div>
              ))}
            </div>
            <dl className="space-y-3 font-sans text-sm border-t-2 border-line pt-4">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatINR(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="font-semibold">{shipping === 0 ? 'FREE' : formatINR(shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tax (18% GST)</dt><dd className="font-semibold">{formatINR(tax)}</dd></div>
              <div className="flex justify-between pt-3 border-t-2 border-ink">
                <dt className="font-display text-lg font-bold">Total</dt>
                <dd className="font-display text-lg font-bold">{formatINR(total)}</dd>
              </div>
            </dl>

            {err && <div className="mt-4 border-2 border-destructive bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">{err}</div>}

            <Button variant="punch" size="lg" className="w-full mt-6" disabled={busy} onClick={placeOrder}>
              {busy ? 'Processing…' : `Pay ${formatINR(total)}`}
            </Button>
            <p className="font-mono text-[11px] text-muted text-center mt-3">Secured by Cashfree.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
