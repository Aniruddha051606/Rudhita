import React, { useEffect } from 'react';
import './Modal.css';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = ''
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    full: 'modal-full'
  };

  return (
    <div 
      className={`modal-overlay ${isOpen ? 'modal-open' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`modal-content ${sizeClasses[size] || sizeClasses.md} ${className}`.trim()}>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {showCloseButton && (
              <button
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}
        {showCloseButton && !title && (
          <button
            className="modal-close-btn modal-close-btn-top"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
