// src/pages/CartPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const { items, subtotal, updateQty, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-32 text-center">
        <p className="eyebrow text-punch mb-3">Your Cart</p>
        <h1 className="h-display text-4xl mb-4">Nothing in here yet.</h1>
        <Link to="/products"><Button variant="punch" size="lg">Browse the collection <ArrowRight size={18} /></Button></Link>
      </div>
    );
  }

  // Display estimate of totals (backend recomputes authoritatively at checkout).
  const shipping = subtotal > 3000 ? 0 : 100;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      <p className="eyebrow text-punch mb-3">Your Cart</p>
      <h1 className="h-display text-5xl mb-10">Review your pieces.</h1>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Line items */}
        <div className="lg:col-span-2 border-2 border-ink divide-y-2 divide-line">
          {items.map((item) => (
            <div key={item.id} className="flex gap-5 p-5">
              <Link to={`/product/${item.product.id}`} className="w-24 h-28 shrink-0 border-2 border-ink bg-sand overflow-hidden">
                {item.product.image_url
                  ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center font-display text-3xl text-line">R</div>}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    {item.product.category && <p className="eyebrow mb-1">{item.product.category}</p>}
                    <h3 className="font-display text-lg font-semibold leading-tight truncate">{item.product.name}</h3>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-muted hover:text-destructive p-1 shrink-0" aria-label="Remove"><Trash2 size={18} /></button>
                </div>
                <div className="flex items-end justify-between mt-4">
                  <div className="flex items-center border-2 border-ink">
                    <button onClick={() => item.quantity > 1 && updateQty(item.product.id, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-sand"><Minus size={14} /></button>
                    <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-sand"><Plus size={14} /></button>
                  </div>
                  <span className="font-display text-lg font-bold">{formatINR(Number(item.product.price) * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="border-2 border-ink p-6 sticky top-24">
            <h2 className="font-display text-xl font-semibold mb-5">Order Summary</h2>
            <dl className="space-y-3 font-sans text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatINR(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="font-semibold">{shipping === 0 ? 'FREE' : formatINR(shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tax (18% GST)</dt><dd className="font-semibold">{formatINR(tax)}</dd></div>
              <div className="flex justify-between pt-3 border-t-2 border-ink">
                <dt className="font-display text-lg font-bold">Total</dt>
                <dd className="font-display text-lg font-bold">{formatINR(total)}</dd>
              </div>
            </dl>
            <Link to="/checkout"><Button variant="punch" size="lg" className="w-full mt-6">Proceed to checkout <ArrowRight size={18} /></Button></Link>
            <p className="font-mono text-[11px] text-muted text-center mt-3">Final total confirmed at payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
