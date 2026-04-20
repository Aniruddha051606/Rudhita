import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/api';

export function ProtectedRoute({ children, requiredRole = null }) {
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }

  // TODO: Add role-based access control when needed
  // const userRole = getCurrentUserRole();
  // if (requiredRole && userRole !== requiredRole) {
  //   return <Navigate to="/" replace />;
  // }

  return children;
}

export default ProtectedRoute;
