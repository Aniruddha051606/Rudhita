// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted">
        <Spinner /> <span className="font-mono text-sm">Loadingâ€¦</span>
      </div>
    );
  }

  // Only the absence of a token sends you to /auth. A failed /auth/me does not.
  if (!loggedIn) return <Navigate to="/auth" replace />;
  if (requiredRole === 'admin' && !user?.is_admin) return <Navigate to="/" replace />;

  return children;
}
