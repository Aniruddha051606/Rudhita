// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

export default function ProductCard({ product, onAdd }) {
  const [adding, setAdding] = useState(false);
  const out = product.stock_quantity <= 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (out || adding) return;
    setAdding(true);
    try { await onAdd?.(product.id); } catch { /* parent handles */ }
    finally { setAdding(false); }
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block border-2 border-ink bg-paper transition-transform duration-200 hover:-translate-y-1 hover:shadow-brutal"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-ink bg-sand">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-4xl text-line">R</div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.discount_percent > 0 && <Badge variant="punch">−{product.discount_percent}%</Badge>}
          {out && <Badge variant="default">Sold out</Badge>}
        </div>

        {/* Quick add */}
        <button
          onClick={handleAdd}
          disabled={out || adding}
          aria-label="Add to cart"
          className="absolute bottom-3 right-3 w-11 h-11 flex items-center justify-center bg-ink text-paper border-2 border-ink
                     opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200
                     hover:bg-punch disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {adding ? <Spinner className="text-paper" /> : <Plus size={20} strokeWidth={2.5} />}
        </button>
      </div>

      {/* Meta */}
      <div className="p-4">
        {product.category && <p className="eyebrow mb-1.5">{product.category}</p>}
        <h3 className="font-display text-lg font-semibold leading-tight mb-2 line-clamp-1">{product.name}</h3>
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
