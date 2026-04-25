// src/components/ErrorBoundary.jsx
import React from 'react';

/**
 * AppErrorBoundary — wraps the entire application.
 * Catches any uncaught render error so the whole app never goes white.
 * 
 * Usage in main.jsx:
 *   <AppErrorBoundary><App /></AppErrorBoundary>
 */
export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // TODO: send to Sentry / LogRocket in production
    console.error('[AppErrorBoundary] Uncaught error:', error, errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5EFE6',
        fontFamily: 'sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '480px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠</div>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '28px',
            color: '#18100C',
            marginBottom: '12px',
          }}>
            Something went wrong
          </h1>
          <p style={{ color: 'rgba(24,16,12,0.6)', fontSize: '15px', lineHeight: '1.6', marginBottom: '28px' }}>
            We hit an unexpected error. Your cart and account data are safe.
            Try refreshing the page or going back to the homepage.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 28px',
                background: '#A85538',
                color: '#F5EFE6',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: '12px 28px',
                border: '1px solid rgba(24,16,12,0.2)',
                color: '#18100C',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * ProductErrorBoundary — wraps a single ProductCard inside a .map().
 * If one product's data is malformed (null price, missing name, etc.),
 * only that card shows a placeholder — the rest of the grid remains intact.
 *
 * Usage:
 *   {products.map(p => (
 *     <ProductErrorBoundary key={p.id}>
 *       <ProductCard {...p} />
 *     </ProductErrorBoundary>
 *   ))}
 */
export class ProductErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('[ProductErrorBoundary] Card failed to render:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            aspectRatio: '3/4',
            background: 'rgba(24,16,12,0.04)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: 'rgba(24,16,12,0.4)',
            fontSize: '13px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '24px' }}>⚠</span>
          <span>Item unavailable</span>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * SectionErrorBoundary — wraps a page section (e.g., reviews, related products).
 * Shows a compact inline error without affecting the rest of the page.
 */
export class SectionErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e) { console.error('[SectionErrorBoundary]', e.message); }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: 'rgba(168,85,56,0.06)',
          borderRadius: '8px',
          color: 'rgba(24,16,12,0.5)',
          fontSize: '13px',
          textAlign: 'center',
        }}>
          This section could not be loaded.
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;