import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { API } from '../utils/api';

export function ProtectedRoute({ children, requiredRole = null }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read directly from localStorage so the value is always fresh after a
  // hard reload (e.g. post-Google-OAuth). Never goes stale from a closure.
  const hasToken = !!localStorage.getItem('rudhita_token');

  useEffect(() => {
    if (!hasToken) {
      setLoading(false);
      return;
    }
    API.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Show a minimal spinner while the profile fetch is in-flight so the user
  // sees feedback instead of a blank page.
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', fontSize: '14px', opacity: 0.5,
        fontFamily: 'var(--font-sans)',
      }}>
        Loading…
      </div>
    );
  }

  // No token at all → redirect. This is the ONLY condition that should kick
  // the user to /auth. A me() failure alone (network blip, cold start) must
  // NOT redirect — that would create a loop when the token is valid but the
  // backend response was slow or temporarily unavailable.
  if (!hasToken) return <Navigate to="/auth" replace />;

  // Admin gate — safe with optional chaining in case me() failed and user is null.
  if (requiredRole === 'admin' && !user?.is_admin) return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;
