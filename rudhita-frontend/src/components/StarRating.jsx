// src/components/StarRating.jsx
// ════════════════════════════════════════════════════════
// Dual-mode star rating:
//   • display mode (readonly=true)  – shows filled/half/empty stars
//   • input mode  (readonly=false)  – hoverable, clickable rating picker
// ════════════════════════════════════════════════════════
import React, { useState } from 'react';

const GOLD   = '#B8924A';
const MUTED  = 'rgba(24,16,12,0.18)';

function Star({ filled, half, size = 18 }) {
  const id = `half-${Math.random().toString(36).slice(2)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display:'block' }}>
      {half && (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor={GOLD} />
            <stop offset="50%" stopColor={MUTED} />
          </linearGradient>
        </defs>
      )}
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={half ? `url(#${id})` : filled ? GOLD : MUTED}
        stroke={filled || half ? GOLD : MUTED}
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function StarDisplay({ rating = 0, count, size = 16 }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const full = rating >= i + 1;
    const half = !full && rating > i;
    return <Star key={i} filled={full} half={half} size={size} />;
  });
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:3 }}>
      {stars}
      {count !== undefined && (
        <span style={{ fontSize:12, color:'rgba(24,16,12,0.5)', marginLeft:4 }}>
          ({count})
        </span>
      )}
    </div>
  );
}

export function StarPicker({ value = 0, onChange, size = 24 }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div
      style={{ display:'inline-flex', gap:4, cursor:'pointer' }}
      onMouseLeave={() => setHovered(0)}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i + 1)}
          onClick={() => onChange(i + 1)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:1, transition:'transform 0.1s' }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={e   => e.currentTarget.style.transform = 'scale(1)'}
          aria-label={`Rate ${i + 1} star${i > 0 ? 's' : ''}`}
        >
          <Star filled={active > i} size={size} />
        </button>
      ))}
    </div>
  );
}
