// src/components/ui/Spinner.jsx
import React from 'react';
import { cn } from '@/lib/utils';

export function Spinner({ className }) {
  return (
    <span
      className={cn(
        'inline-block w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin-slow',
        className
      )}
      aria-label="Loading"
    />
  );
}
export default Spinner;
