import React from 'react';
import './Badge.css';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) {
  const variantClasses = {
    default: 'badge-default',
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info'
  };

  const sizeClasses = {
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg'
  };

  const finalClass = `badge ${variantClasses[variant] || variantClasses.default} ${sizeClasses[size] || sizeClasses.md} ${className}`.trim();

  return (
    <span className={finalClass}>
      {children}
    </span>
  );
}

export default Badge;
