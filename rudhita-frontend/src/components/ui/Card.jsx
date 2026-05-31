// src/components/ui/Card.jsx
import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }) {
  return <div className={cn('bg-sand border-2 border-ink', className)} {...props} />;
}
export function CardBody({ className, ...props }) {
  return <div className={cn('p-6', className)} {...props} />;
}
export default Card;
