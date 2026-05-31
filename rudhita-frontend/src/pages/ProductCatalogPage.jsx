// src/pages/ProductCatalogPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { API } from '@/api/client';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

const PAGE = 12;

export default function ProductCatalogPage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [total, setTotal]   = useState(0);
  const [skip, setSkip]     = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery]   = useState('');     // debounced/applied search
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    setErr('');
    try {
      const params = { skip: reset ? 0 : skip, limit: PAGE };
      if (query) params.search = query;
      if (category) params.category = category;
      const data = await API.products.list(params);
      const list = data.products || [];
      setProducts((prev) => (reset ? list : [...prev, ...list]));
      setTotal(data.total ?? list.length);
      // derive category chips from the first load
      if (reset || categories.length === 0) {
        const cats = [...new Set(list.map((p) => p.category).filter(Boolean))];
        setCategories((prev) => [...new Set([...prev, ...cats])]);
      }
    } catch (e) {
      setErr(e.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, [skip, query, category, categories.length]);

  // Reset list when search/category change
  useEffect(() => { setSkip(0); load(true); /* eslint-disable-next-line */ }, [query, category]);
  // Load more when skip advances
  useEffect(() => { if (skip > 0) load(false); /* eslint-disable-next-line */ }, [skip]);

  const onSearchSubmit = (e) => { e.preventDefault(); setQuery(search.trim()); };
  const handleAdd = (id) => addItem(id, 1);
  const hasMore = products.length < total;

  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="eyebrow text-punch mb-3">The Collection</p>
        <h1 className="h-display text-5xl md:text-6xl">Everything we make.</h1>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch md:items-center">
        <form onSubmit={onSearchSubmit} className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pieces…"
            className="h-12 w-full bg-paper border-2 border-ink pl-10 pr-4 font-sans text-[15px] focus:outline-none focus:shadow-brutalPunch transition-shadow"
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('')}
            className={`px-4 h-12 border-2 border-ink font-sans font-medium text-sm transition-colors ${category === '' ? 'bg-ink text-paper' : 'hover:bg-sand'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 h-12 border-2 border-ink font-sans font-medium text-sm transition-colors ${category === c ? 'bg-ink text-paper' : 'hover:bg-sand'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {err && <div className="border-2 border-destructive bg-destructive/5 px-4 py-3 font-mono text-sm text-destructive mb-8">{err}</div>}

      {/* Grid */}
      {loading && products.length === 0 ? (
        <div className="flex items-center justify-center py-32 gap-3 text-muted"><Spinner /> <span className="font-mono text-sm">Loading…</span></div>
      ) : products.length === 0 ? (
        <div className="text-center py-32">
          <p className="font-display text-2xl mb-2">Nothing here yet.</p>
          <p className="text-muted">{query ? `No results for “${query}”.` : 'Check back soon.'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => <ProductCard key={p.id} product={p} onAdd={handleAdd} />)}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-12">
              <Button variant="outline" size="lg" disabled={loading} onClick={() => setSkip(skip + PAGE)}>
                {loading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
