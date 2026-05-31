// src/pages/ProductDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ArrowLeft, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { API } from '@/api/client';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

export default function ProductDetailPage({ onRequireAuth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { loggedIn } = useAuth();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    API.products.get(id)
      .then((p) => { if (!cancelled) setProduct(p); })
      .catch((e) => { if (!cancelled) setErr(e.message || 'Product not found.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const out = product && product.stock_quantity <= 0;
  const maxQty = Math.min(product?.stock_quantity || 1, 10);

  const handleAdd = async () => {
    if (!loggedIn) { onRequireAuth?.(); return; }
    if (out || adding) return;
    setAdding(true);
    try {
      await addItem(product.id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      setErr(e.message || 'Could not add to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted"><Spinner /> <span className="font-mono text-sm">Loading…</span></div>;
  if (err && !product) return (
    <div className="max-w-7xl mx-auto px-5 py-32 text-center">
      <p className="font-display text-3xl mb-4">{err}</p>
      <Link to="/products"><Button variant="outline">← Back to shop</Button></Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted hover:text-punch mb-8">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="relative aspect-[4/5] border-2 border-ink bg-sand overflow-hidden">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center font-display text-7xl text-line">R</div>}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.discount_percent > 0 && <Badge variant="punch">−{product.discount_percent}% off</Badge>}
            {out && <Badge>Sold out</Badge>}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.category && <p className="eyebrow text-punch mb-3">{product.category}</p>}
          <h1 className="h-display text-4xl md:text-5xl mb-4">{product.name}</h1>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-sans text-2xl font-bold">{formatINR(product.price)}</span>
            {product.original_price && Number(product.original_price) > Number(product.price) && (
              <span className="font-sans text-lg text-muted line-through">{formatINR(product.original_price)}</span>
            )}
          </div>

          {product.description && (
            <p className="text-muted leading-relaxed mb-8 max-w-prose">{product.description}</p>
          )}

          {/* Stock note */}
          <p className="font-mono text-xs uppercase tracking-wider mb-6">
            {out ? <span className="text-destructive">Out of stock</span>
                 : product.stock_quantity <= 5 ? <span className="text-punch">Only {product.stock_quantity} left</span>
                 : <span className="text-success">In stock</span>}
          </p>

          {/* Qty + add */}
          {!out && (
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border-2 border-ink">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center hover:bg-sand" aria-label="Decrease"><Minus size={16} /></button>
                <span className="w-12 text-center font-sans font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="w-11 h-11 flex items-center justify-center hover:bg-sand" aria-label="Increase"><Plus size={16} /></button>
              </div>
              <Button onClick={handleAdd} disabled={adding} variant={added ? 'punch' : 'primary'} size="lg" className="flex-1">
                {adding ? <Spinner className="text-paper" /> : added ? 'Added ✓' : 'Add to cart'}
              </Button>
            </div>
          )}
          {err && product && <p className="font-mono text-xs text-destructive mb-4">{err}</p>}

          {/* Assurances */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t-2 border-line">
            {[[ShieldCheck, 'Lifetime repair'], [Truck, 'Free over ₹3,000'], [RefreshCw, '14-day returns']].map(([Icon, label], i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <Icon size={20} className="text-punch" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
