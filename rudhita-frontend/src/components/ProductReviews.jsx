// src/components/ProductReviews.jsx
// ════════════════════════════════════════════════════════════════
// Drop onto any product detail page:
//   <ProductReviews productId={product.id} />
// ════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { StarDisplay, StarPicker } from './StarRating';
import { API } from '../utils/api';

const T = {
  cream:'#F5EFE6', creamD:'#EDE4D7',
  dark:'#18100C', terra:'#A85538', sage:'#6B7A5E',
  border:'rgba(24,16,12,0.1)', muted:'rgba(24,16,12,0.45)',
};

function ReviewForm({ productId, onSuccess }) {
  const [rating, setRating]   = useState(0);
  const [title,  setTitle]    = useState('');
  const [body,   setBody]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setError('Please select a star rating.'); return; }
    setSaving(true); setError('');
    try {
      await API.reviews.create(productId, { rating, title, body });
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Could not submit review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ background:'#fff', padding:24, borderRadius:10,
                                     border:`1px solid ${T.border}`, marginTop:20 }}>
      <h4 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600 }}>Write a Review</h4>

      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase',
                        color:T.muted, display:'block', marginBottom:8 }}>
          Your Rating *
        </label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      {[
        { label:'Review Title', value:title, set:setTitle, placeholder:'Summarise your experience…', max:200 },
        { label:'Your Review',  value:body,  set:setBody,  placeholder:'Tell others what you think…', max:3000, multi:true },
      ].map(f => (
        <label key={f.label} style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
          <span style={{ fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted }}>{f.label}</span>
          {f.multi
            ? <textarea value={f.value} onChange={e => f.set(e.target.value)} maxLength={f.max}
                placeholder={f.placeholder} rows={4}
                style={{ padding:'10px 14px', border:`1px solid ${T.border}`, borderRadius:6,
                          fontSize:13, fontFamily:'Jost, sans-serif', resize:'vertical' }} />
            : <input type="text" value={f.value} onChange={e => f.set(e.target.value)}
                maxLength={f.max} placeholder={f.placeholder}
                style={{ padding:'10px 14px', border:`1px solid ${T.border}`, borderRadius:6,
                          fontSize:13, fontFamily:'Jost, sans-serif' }} />
          }
        </label>
      ))}

      {error && <p style={{ color:T.terra, fontSize:13, marginBottom:12 }}>{error}</p>}

      <button type="submit" disabled={saving || !rating}
        style={{ padding:'11px 28px', background: !rating||saving ? T.muted : T.dark, color:'#fff',
                  border:'none', borderRadius:4, fontSize:11, letterSpacing:'0.14em',
                  textTransform:'uppercase', cursor: !rating||saving ? 'not-allowed' : 'pointer',
                  fontFamily:'Jost, sans-serif' }}>
        {saving ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

export default function ProductReviews({ productId }) {
  const [reviews,  setReviews]  = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const isLoggedIn = !!localStorage.getItem('rudhita_token');

  const load = async () => {
    setLoading(true);
    try {
      const [revData, sumData] = await Promise.all([
        API.reviews.list(productId),
        API.reviews.summary(productId).catch(() => null),
      ]);
      setReviews(revData || []);
      setSummary(sumData);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [productId]);

  const handleReviewSuccess = () => { setShowForm(false); load(); };

  return (
    <section style={{ fontFamily:'Jost, sans-serif', marginTop:48 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h3 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, fontWeight:400, margin:0 }}>
            Customer Reviews
          </h3>
          {summary && summary.review_count > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6 }}>
              <StarDisplay rating={summary.average_rating} size={16} />
              <span style={{ fontSize:13, color:T.muted }}>
                {summary.average_rating.toFixed(1)} out of 5 ({summary.review_count} review{summary.review_count !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
        {isLoggedIn && !showForm && (
          <button onClick={() => setShowForm(true)}
            style={{ padding:'10px 20px', background:T.dark, color:T.cream,
                      border:'none', borderRadius:4, fontSize:11, letterSpacing:'0.12em',
                      textTransform:'uppercase', cursor:'pointer', fontFamily:'Jost, sans-serif' }}>
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <ReviewForm productId={productId} onSuccess={handleReviewSuccess} />
      )}

      {loading && <p style={{ color:T.muted, fontSize:13 }}>Loading reviews…</p>}

      {!loading && reviews.length === 0 && !showForm && (
        <div style={{ padding:'32px 0', textAlign:'center', color:T.muted, fontSize:14 }}>
          No reviews yet. Be the first to share your experience.
        </div>
      )}

      <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:16 }}>
        {reviews.map(r => (
          <div key={r.id} style={{ padding:'20px 24px', background:'#fff',
                                    borderRadius:10, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden',
                               background:T.creamD, flexShrink:0 }}>
                  {r.author_avatar
                    ? <img src={r.author_avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
                                     justifyContent:'center', fontSize:14, fontWeight:600,
                                     color:T.muted }}>
                        {r.author_name?.[0]?.toUpperCase() || '?'}
                      </div>
                  }
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:13 }}>{r.author_name}</p>
                  {r.is_verified && (
                    <span style={{ fontSize:10, color:T.sage, letterSpacing:'0.08em' }}>
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontSize:11, color:T.muted }}>
                {new Date(r.created_at).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })}
              </span>
            </div>
            <StarDisplay rating={r.rating} size={14} />
            {r.title && <p style={{ margin:'8px 0 4px', fontWeight:600, fontSize:14 }}>{r.title}</p>}
            {r.body  && <p style={{ margin:'4px 0 0', fontSize:13, color:T.muted, lineHeight:1.7 }}>{r.body}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
