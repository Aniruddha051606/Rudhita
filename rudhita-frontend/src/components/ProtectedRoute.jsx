import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, API } from '../utils/api';

export function ProtectedRoute({ children, requiredRole = null }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    API.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole === 'admin' && !user.is_admin) return <Navigate to="/" replace />;
  return children;
}

export default ProtectedRoute;
