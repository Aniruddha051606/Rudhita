import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '',
  ...props 
}) {
  const baseClasses = 'btn-solid transition-all font-medium text-center';
  
  const variantClasses = {
    primary: 'btn-solid',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    text: 'btn-text'
  };
  
  const sizeClasses = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4'
  };
  
  const finalClass = `${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`.trim();
  
  return (
    <button 
      className={finalClass}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
