import React from 'react';
import './Input.css';

export function Input({
  label,
  type = 'text',
  placeholder = '',
  error = '',
  value = '',
  onChange = () => {},
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`form-input ${error ? 'form-input-error' : ''} ${className}`.trim()}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default Input;
