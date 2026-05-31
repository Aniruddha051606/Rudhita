// src/components/ui/Input.jsx
import React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef(({ className, label, error, id, ...props }, ref) => {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="eyebrow text-ink">{label}</label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          'h-12 w-full bg-paper border-2 border-ink px-4 font-sans text-[15px] text-ink',
          'placeholder:text-muted/60 transition-shadow duration-150',
          'focus:outline-none focus:shadow-brutalPunch',
          error && 'border-destructive focus:shadow-none',
          className
        )}
        {...props}
      />
      {error && <span className="font-mono text-xs text-destructive">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';
export default Input;
