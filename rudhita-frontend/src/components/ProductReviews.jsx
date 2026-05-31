// src/components/ProductReviews.jsx
import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { API } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

function Stars({ value, size = 16, onSelect }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(n)}
          className={onSelect ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} star`}
        >
          <Star
            size={size}
            className={n <= value ? 'fill-punch text-punch' : 'text-line'}
            strokeWidth={2}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId, onRequireAuth }) {
  const { loggedIn, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // compose form
  const [rating, setRating] = useState(0);
  const [title, setTitle]   = useState('');
  const [body, setBody]     = useState('');
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState('');
  const [done, setDone]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        API.reviews.summary(productId).catch(() => null),
        API.reviews.list(productId).catch(() => []),
      ]);
      setSummary(s);
      setReviews(Array.isArray(r) ? r : []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [productId]);

  const submit = async () => {
    if (!loggedIn) { onRequireAuth?.(); return; }
    if (rating < 1) { setErr('Please choose a star rating.'); return; }
    setErr(''); setBusy(true);
    try {
      await API.reviews.create(productId, { rating, title: title || null, body: body || null });
      setRating(0); setTitle(''); setBody(''); setDone(true);
      setTimeout(() => setDone(false), 2500);
      load();
    } catch (e) {
      setErr(e.message || 'Could not submit review.');
    } finally {
      setBusy(false);
    }
  };

  const avg = summary?.average_rating ? Number(summary.average_rating).toFixed(1) : null;
  const dist = summary?.distribution || {};
  const count = summary?.review_count || 0;

  return (
    <section className="border-t-2 border-ink mt-16 pt-16">
      <h2 className="font-display text-3xl font-semibold mb-8">Reviews</h2>

      {loading ? (
        <div className="flex items-center gap-3 text-muted py-8"><Spinner /> <span className="font-mono text-sm">Loading reviews…</span></div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Summary + form */}
          <div className="lg:col-span-1">
            {count > 0 ? (
              <div className="border-2 border-ink p-6 mb-6">
                <div className="flex items-end gap-3 mb-3">
                  <span className="font-display text-5xl font-bold leading-none">{avg}</span>
                  <div className="mb-1"><Stars value={Math.round(summary.average_rating)} /></div>
                </div>
                <p className="font-mono text-xs text-muted mb-5">{count} review{count !== 1 ? 's' : ''}</p>
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = dist[n] || dist[String(n)] || 0;
                  const pct = count ? (c / count) * 100 : 0;
                  return (
                    <div key={n} className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs w-3">{n}</span>
                      <Star size={12} className="fill-punch text-punch" />
                      <div className="flex-1 h-2 bg-sand border border-ink">
                        <div className="h-full bg-punch" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-muted w-6 text-right">{c}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted mb-6">No reviews yet. Be the first.</p>
            )}

            {/* Compose */}
            <div className="border-2 border-ink p-6">
              <p className="eyebrow mb-3">Write a review</p>
              {done && <div className="border-2 border-success bg-success/5 px-3 py-2 font-mono text-xs text-success mb-3">Thanks — your review is posted.</div>}
              {err && <div className="border-2 border-destructive bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive mb-3">{err}</div>}
              <div className="mb-3"><Stars value={rating} size={24} onSelect={setRating} /></div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
                className="w-full bg-paper border-2 border-ink px-3 h-10 font-sans text-sm mb-3 focus:outline-none focus:shadow-brutalPunch" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Share your thoughts…"
                className="w-full bg-paper border-2 border-ink px-3 py-2 font-sans text-sm mb-3 resize-none focus:outline-none focus:shadow-brutalPunch" />
              <Button variant="primary" className="w-full" disabled={busy} onClick={submit}>
                {busy ? 'Posting…' : loggedIn ? 'Post review' : 'Sign in to review'}
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2">
            {reviews.length === 0 ? (
              <div className="border-2 border-dashed border-line p-12 text-center text-muted">No reviews to show yet.</div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rv) => (
                  <div key={rv.id} className="border-2 border-ink p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center font-display font-bold text-sm overflow-hidden">
                          {rv.author_avatar ? <img src={rv.author_avatar} alt="" className="w-full h-full object-cover" /> : (rv.author_name?.[0] || 'A')}
                        </div>
                        <div>
                          <p className="font-sans font-semibold text-sm leading-tight">{rv.author_name || 'Anonymous'}</p>
                          {rv.is_verified && <span className="font-mono text-[10px] uppercase tracking-wider text-success">✓ Verified purchase</span>}
                        </div>
                      </div>
                      <Stars value={rv.rating} size={14} />
                    </div>
                    {rv.title && <p className="font-display font-semibold mb-1">{rv.title}</p>}
                    {rv.body && <p className="text-sm text-muted leading-relaxed">{rv.body}</p>}
                    <p className="font-mono text-[10px] text-muted mt-3">
                      {new Date(rv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
