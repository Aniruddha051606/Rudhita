import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn-style class combiner: merges conditional + tailwind classes safely.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}
