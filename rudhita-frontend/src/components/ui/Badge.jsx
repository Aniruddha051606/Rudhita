// src/components/ui/Badge.jsx
import React from 'react';
import { cn } from '@/lib/utils';

export function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: 'bg-ink text-paper',
    punch:   'bg-punch text-paper',
    outline: 'bg-transparent text-ink border-2 border-ink',
    muted:   'bg-sand text-ink',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-[10px] uppercase tracking-[0.15em] px-2 py-0.5',
        variants[variant], className
      )}
      {...props}
    />
  );
}
export default Badge;
