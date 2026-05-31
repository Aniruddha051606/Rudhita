// src/components/ui/Button.jsx
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // base
  'inline-flex items-center justify-center gap-2 font-sans font-semibold tracking-tight ' +
  'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-punch focus-visible:ring-offset-2 focus-visible:ring-offset-paper ' +
  'disabled:opacity-50 disabled:pointer-events-none select-none active:translate-x-[2px] active:translate-y-[2px]',
  {
    variants: {
      variant: {
        // Primary: ink block with hard offset shadow, shifts into shadow on press
        primary:  'bg-ink text-paper border-2 border-ink shadow-brutal hover:shadow-brutalPunch active:shadow-none',
        punch:    'bg-punch text-paper border-2 border-ink shadow-brutal active:shadow-none',
        outline:  'bg-transparent text-ink border-2 border-ink hover:bg-ink hover:text-paper',
        ghost:    'bg-transparent text-ink hover:bg-sand border-2 border-transparent',
        link:     'bg-transparent text-ink underline underline-offset-4 decoration-2 hover:decoration-punch',
      },
      size: {
        sm:  'h-9 px-4 text-sm',
        md:  'h-11 px-6 text-[15px]',
        lg:  'h-14 px-8 text-base',
        icon:'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export const Button = React.forwardRef(
  ({ className, variant, size, asChild, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';

export { buttonVariants };
export default Button;
