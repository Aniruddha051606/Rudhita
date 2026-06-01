// src/components/ui/Skeleton.jsx
import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

// A product-card-shaped skeleton for catalog/home grids.
export function ProductCardSkeleton() {
  return (
    <div className="border-2 border-line">
      <Skeleton className="aspect-[4/5] border-0 border-b-2" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16 border-0" />
        <Skeleton className="h-5 w-3/4 border-0" />
        <Skeleton className="h-4 w-1/3 border-0" />
      </div>
    </div>
  );
}

// A simple table-row skeleton for admin tables.
export function RowSkeleton({ cols = 5 }) {
  return (
    <div className="flex gap-4 px-4 py-4 border-b-2 border-line">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1 border-0" />
      ))}
    </div>
  );
}

export default Skeleton;
