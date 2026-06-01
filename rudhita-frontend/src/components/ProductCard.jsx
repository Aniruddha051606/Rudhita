// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

export default function ProductCard({ product, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const out = product.stock_quantity <= 0;
  const low = !out && product.stock_quantity <= 5;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (out || adding) return;
    setAdding(true);
    try {
      await onAdd?.(product.id);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch { /* parent handles */ }
    finally { setAdding(false); }
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block border-2 border-ink bg-paper transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-brutalLg focus-visible:-translate-y-1.5 focus-visible:shadow-brutalLg"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-ink bg-sand">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-4xl text-line">R</div>
        )}

        {/* subtle gradient at the bottom so the quick-add reads on any image */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.discount_percent > 0 && <Badge variant="punch">âˆ’{product.discount_percent}%</Badge>}
          {out && <Badge variant="default">Sold out</Badge>}
          {low && <Badge variant="outline">Only {product.stock_quantity} left</Badge>}
        </div>

        {/* Quick add */}
        <button
          onClick={handleAdd}
          disabled={out || adding}
          aria-label={done ? 'Added to cart' : 'Add to cart'}
          className={`absolute bottom-3 right-3 w-11 h-11 flex items-center justify-center border-2 border-ink
                     opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                     transition-[opacity,transform,background-color] duration-300 active:translate-x-[2px] active:translate-y-[2px]
                     disabled:opacity-40 disabled:cursor-not-allowed
                     ${done ? 'bg-punch text-paper' : 'bg-ink text-paper hover:bg-punch'}`}
        >
          {adding ? <Spinner className="text-paper" /> : done ? <Check size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={2.5} />}
        </button>
      </div>

      {/* Meta */}
      <div className="p-4">
        {product.category && <p className="eyebrow mb-1.5">{product.category}</p>}
        <h3 className="font-display text-lg font-semibold leading-tight mb-2 line-clamp-1 transition-colors group-hover:text-punch">{product.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-sans font-bold">{formatINR(product.price)}</span>
          {product.original_price && Number(product.original_price) > Number(product.price) && (
            <span className="font-sans text-sm text-muted line-through">{formatINR(product.original_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
