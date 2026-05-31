// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for authentication state across the whole app.
//
// WHY THIS EXISTS:
//   The old approach stored auth state in scattered places and relied on
//   window.location.reload() to "refresh" the UI after login. That caused
//   stale-state bugs (the header/add-to-cart still thought you were logged out)
//   and made the app fragile. This context holds auth state in React, so the
//   instant you log in, every consumer re-renders with the new state — no reload.
//
// EXPOSED API (via useAuth()):
//   user        – the profile object from /auth/me (or null)
//   isLoggedIn  – boolean, true if a token is present (does NOT depend on /auth/me
//                 succeeding, so a slow/cold backend never flips you to logged-out)
//   loading     – true while the initial /auth/me probe is in flight
//   login(tok)  – store tokens, fetch the profile, flip state to logged-in
//   logout()    – blocklist the token server-side (best effort), clear, reset state
//   refreshUser – re-fetch /auth/me (e.g. after a profile edit)
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react';
import {
  API, setAuthTokens, clearAuthTokens, getAuthToken,
} from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // `token` is initialized synchronously from localStorage so the very first
  // render already knows whether we're logged in — no logged-out flash.
  const [token, setToken]     = useState(() => getAuthToken());
  const [user,  setUser]      = useState(null);
  const [loading, setLoading] = useState(() => !!getAuthToken());

  const isLoggedIn = !!token;

  // Fetch the profile for the current token. A failure here (cold start,
  // network blip) does NOT log the user out — we keep the token and let the
  // next call retry. Only an explicit logout or a 401-driven token clear
  // (handled in api.js) removes the token.
  const refreshUser = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null);
      return null;
    }
    try {
      const profile = await API.auth.me();
      setUser(profile);
      return profile;
    } catch {
      // Keep token; just leave user as-is/null. Avoids the redirect loop.
      return null;
    }
  }, []);

  // On mount: if a token exists, probe /auth/me once to populate the profile.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getAuthToken()) {
        setLoading(false);
        return;
      }
      try {
        const profile = await API.auth.me();
        if (!cancelled) setUser(profile);
      } catch {
        // Leave user null but stay "logged in" by token; don't loop.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Keep multiple tabs in sync: if another tab logs in/out, mirror it here.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'rudhita_token') {
        const t = getAuthToken();
        setToken(t);
        if (t) refreshUser();
        else setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshUser]);

  // Called after a successful login (password OR Google). Stores the tokens,
  // flips state immediately (so the UI updates without a reload), then fetches
  // the profile in the background.
  const login = useCallback(async (tokens) => {
    setAuthTokens(tokens);
    setToken(getAuthToken());      // reflect the freshly-stored token
    setLoading(true);
    const profile = await refreshUser();
    setLoading(false);
    return profile;
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try { await API.auth.logout(); } catch { /* best effort */ }
    clearAuthTokens();
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user, isLoggedIn, loading,
    login, logout, refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth() must be used inside an <AuthProvider>.');
  }
  return ctx;
}

export default AuthContext;
