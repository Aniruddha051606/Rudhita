import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isLoggedIn, loading } = useAuth();

  // Wait for the initial /auth/me probe before deciding anything, so we don't
  // briefly redirect a logged-in user while their profile is still loading.
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

  // No token → not logged in → go to /auth. This is the ONLY thing that sends
  // the user to the login page. A failed /auth/me alone (cold start, blip)
  // does NOT clear the token, so it cannot cause a redirect loop.
  if (!isLoggedIn) return <Navigate to="/auth" replace />;

  // Admin gate — optional chaining is safe if the profile didn't load.
  if (requiredRole === 'admin' && !user?.is_admin) return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;
