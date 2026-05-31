// src/components/CartDrawer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function CartDrawer() {
  const { open, closeDrawer, items, subtotal, count, updateQty, removeItem } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
      />
      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-paper border-l-2 border-ink flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b-2 border-ink px-6 h-16 shrink-0">
          <span className="font-display text-xl font-semibold">Your Cart ({count})</span>
          <button onClick={closeDrawer} className="hover:text-punch" aria-label="Close cart"><X size={22} strokeWidth={2.5} /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="font-display text-2xl">Your cart is empty.</p>
            <Link to="/products" onClick={closeDrawer}><Button variant="outline">Browse the collection</Button></Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y-2 divide-line">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-5">
                  <Link to={`/product/${item.product.id}`} onClick={closeDrawer} className="w-20 h-24 shrink-0 border-2 border-ink bg-sand overflow-hidden">
                    {item.product.image_url
                      ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center font-display text-2xl text-line">R</div>}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-semibold leading-tight mb-1 truncate">{item.product.name}</h4>
                    <p className="font-sans font-bold text-sm mb-2">{formatINR(item.product.price)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border-2 border-ink">
                        <button onClick={() => item.quantity > 1 && updateQty(item.product.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-sand" aria-label="Decrease"><Minus size={13} /></button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-sand" aria-label="Increase"><Plus size={13} /></button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-muted hover:text-destructive p-1" aria-label="Remove"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-ink p-6 shrink-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-sans font-medium">Subtotal</span>
                <span className="font-display text-2xl font-bold">{formatINR(subtotal)}</span>
              </div>
              <p className="font-mono text-[11px] text-muted mb-4">Shipping &amp; taxes calculated at checkout.</p>
              <Link to="/checkout" onClick={closeDrawer}><Button variant="punch" size="lg" className="w-full">Checkout</Button></Link>
              <Link to="/cart" onClick={closeDrawer}><Button variant="ghost" className="w-full mt-2">View full cart</Button></Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
