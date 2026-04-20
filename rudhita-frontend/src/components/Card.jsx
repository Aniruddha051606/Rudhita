import React from 'react';
import './Card.css';

export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  const baseClasses = 'card';
  const variantClasses = {
    default: 'card-default',
    elevated: 'card-elevated',
    bordered: 'card-bordered'
  };
  
  const finalClass = `${baseClasses} ${variantClasses[variant] || variantClasses.default} ${className}`.trim();
  
  return (
    <div className={finalClass} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`.trim()}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`card-content ${className}`.trim()}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card-footer ${className}`.trim()}>{children}</div>;
}

export default Card;
