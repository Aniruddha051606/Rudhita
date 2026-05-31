// src/context/AuthContext.jsx
import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react';
import { API, setTokens, clearTokens, getToken, isLoggedIn as tokenPresent } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(() => getToken());
  const [user,  setUser]      = useState(null);
  const [loading, setLoading] = useState(() => !!getToken());

  const loggedIn = !!token;

  const refreshUser = useCallback(async () => {
    if (!getToken()) { setUser(null); return null; }
    try {
      const profile = await API.auth.me();
      setUser(profile);
      return profile;
    } catch {
      return null; // keep token; never force logout on a transient failure
    }
  }, []);

  // Initial probe on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) { setLoading(false); return; }
      try { const p = await API.auth.me(); if (!cancelled) setUser(p); }
      catch { /* keep token */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Cross-tab sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'rudhita_token') {
        const t = getToken();
        setToken(t);
        if (t) refreshUser(); else setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshUser]);

  // Login: store tokens + flip state INSTANTLY (no await on /auth/me), fetch
  // profile in the background. This is what makes login feel immediate and
  // prevents any "stuck" state if the profile call is slow.
  const login = useCallback((tokens) => {
    setTokens(tokens);
    setToken(getToken());
    setLoading(false);
    refreshUser(); // fire-and-forget
    return true;
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try { await API.auth.logout(); } catch { /* best effort */ }
    clearTokens();
    setToken(null);
    setUser(null);
  }, []);

  const value = { user, loggedIn, loading, login, logout, refreshUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error('useAuth() must be used within <AuthProvider>.');
  return ctx;
}

export default AuthContext;
