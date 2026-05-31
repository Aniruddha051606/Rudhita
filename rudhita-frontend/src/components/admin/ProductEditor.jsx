// src/components/admin/ProductEditor.jsx
import React, { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { API } from '@/api/client';
import { uploadImage } from '@/lib/upload';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const EMPTY = {
  name: '', description: '', category: '', price: '', original_price: '',
  stock_quantity: '', weight_grams: '', image_url: '',
};

export default function ProductEditor({ product, onClose, onSaved }) {
  const editing = !!product;
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...(product
      ? {
          name: product.name || '', description: product.description || '',
          category: product.category || '', price: product.price ?? '',
          original_price: product.original_price ?? '',
          stock_quantity: product.stock_quantity ?? '', weight_grams: product.weight_grams ?? '',
          image_url: product.image_url || '',
        }
      : {}),
  }));
  const [busy, setBusy]       = useState(false);
  const [uploading, setUp]    = useState(false);
  const [err, setErr]         = useState('');
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(''); setUp(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (e2) {
      setErr(e2.message || 'Image upload failed.');
    } finally {
      setUp(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    setErr('');
    if (!form.name || !form.category || !form.price) { setErr('Name, category, and price are required.'); return; }
    if (form.original_price && Number(form.original_price) <= Number(form.price)) {
      setErr('Original price must be greater than price (it shows the discount).'); return;
    }
    setBusy(true);
    try {
      if (editing) {
        // PATCH uses snake_case field names
        await API.adminProducts.update(product.id, {
          name: form.name,
          description: form.description || null,
          category: form.category,
          price: Number(form.price),
          original_price: form.original_price ? Number(form.original_price) : null,
          stock_quantity: form.stock_quantity === '' ? 0 : Number(form.stock_quantity),
          weight_grams: form.weight_grams === '' ? 0 : Number(form.weight_grams),
          image_url: form.image_url || null,
        });
      } else {
        // CREATE uses backend aliases: originalPrice, stock
        await API.adminProducts.create({
          name: form.name,
          description: form.description || null,
          category: form.category,
          price: Number(form.price),
          originalPrice: form.original_price ? Number(form.original_price) : null,
          stock: form.stock_quantity === '' ? 0 : Number(form.stock_quantity),
          weight_grams: form.weight_grams === '' ? 0 : Number(form.weight_grams),
          image_url: form.image_url || null,
        });
      }
      onSaved?.();
    } catch (e2) {
      setErr(e2.message || 'Could not save product.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-ink/60 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl bg-paper border-2 border-ink shadow-brutalLg my-8">
        <div className="flex items-center justify-between border-b-2 border-ink px-6 h-16">
          <h2 className="font-display text-xl font-semibold">{editing ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="hover:text-punch"><X size={22} strokeWidth={2.5} /></button>
        </div>

        <div className="p-6 grid gap-5">
          {err && <div className="border-2 border-destructive bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">{err}</div>}

          {/* Image */}
          <div>
            <p className="eyebrow mb-2">Product Image</p>
            <div className="flex gap-4 items-start">
              <div className="w-28 h-32 shrink-0 border-2 border-ink bg-sand overflow-hidden">
                {form.image_url
                  ? <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center font-display text-3xl text-line">R</div>}
              </div>
              <div className="flex-1 grid gap-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" id="prod-img" />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Upload size={16} /> Upload image</>}
                </Button>
                <Input placeholder="…or paste an image URL" value={form.image_url} onChange={set('image_url')} />
              </div>
            </div>
          </div>

          <Input label="Name" value={form.name} onChange={set('name')} placeholder="Product name" />

          <div>
            <p className="eyebrow mb-1.5">Description</p>
            <textarea value={form.description} onChange={set('description')} rows={3}
              placeholder="Describe the piece…"
              className="w-full bg-paper border-2 border-ink px-4 py-3 font-sans text-[15px] focus:outline-none focus:shadow-brutalPunch transition-shadow resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Category" value={form.category} onChange={set('category')} placeholder="e.g. Necklaces" />
            <Input label="Stock Quantity" type="number" min="0" value={form.stock_quantity} onChange={set('stock_quantity')} placeholder="0" />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="Price (₹)" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" />
            <Input label="Original Price (₹)" type="number" min="0" step="0.01" value={form.original_price} onChange={set('original_price')} placeholder="optional" />
            <Input label="Weight (g)" type="number" min="0" value={form.weight_grams} onChange={set('weight_grams')} placeholder="0" />
          </div>
        </div>

        <div className="flex gap-3 justify-end border-t-2 border-ink px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="punch" onClick={save} disabled={busy || uploading}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>
    </div>
  );
}
