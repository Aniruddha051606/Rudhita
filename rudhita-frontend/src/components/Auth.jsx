// src/components/Auth.jsx
import { useState } from 'react';
import { API, setAuthTokens } from '../utils/api';
import GoogleLoginButton from './GoogleLoginButton';

export default function Auth() {
  // Modes: 'login' | 'register' | 'verify'
  const [mode, setMode] = useState('login');

  // Form state
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [otp,      setOtp]      = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // ── 1. REGISTER ──────────────────────────────────────────────────────
      if (mode === 'register') {
        await API.auth.register({ name, email, password, phone });
        alert('Registration successful! Check your email for the OTP.');
        setMode('verify');

      // ── 2. OTP VERIFY ─────────────────────────────────────────────────────
      } else if (mode === 'verify') {
        await API.auth.verifyOTP({ email, otp });
        alert('Email verified! You can now log in.');
        setMode('login');

      // ── 3. LOGIN ──────────────────────────────────────────────────────────
      } else if (mode === 'login') {
        /**
         * FIX: Removed the raw fetch('http://127.0.0.1:8080/auth/login') call.
         *
         * API.auth.login() now handles:
         *   • Formatting credentials as URLSearchParams (required by FastAPI OAuth2)
         *   • Setting Content-Type: application/x-www-form-urlencoded
         *   • Reading VITE_API_URL so the correct base URL is used in all envs
         *   • Unified error handling via APIError
         */
        const data = await API.auth.login({ email, password });

        // Persist BOTH tokens so the backend's refresh-token rotation is usable.
        setAuthTokens({ access_token: data.access_token, refresh_token: data.refresh_token });

        // Hard-redirect to home; forces Navbar to re-read localStorage.
        window.location.href = "/";
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    }
  };

  return (
    <div className="auth-container">
      <h2>
        {mode === 'login'
          ? 'Welcome Back'
          : mode === 'register'
          ? 'Create Account'
          : 'Verify Email'}
      </h2>

      {error && (
        <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      {/* Google sign-in — shown in login + register modes only */}
      {mode !== 'verify' && (
        <>
          <GoogleLoginButton
            onSuccess={() => { window.location.href = '/'; }}
            onError={(msg) => setError(msg || 'Google sign-in failed.')}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(24,16,12,0.1)' }} />
            <span style={{ fontSize: 11, color: 'rgba(24,16,12,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              or
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(24,16,12,0.1)' }} />
          </div>
        </>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Name + Phone only for Register */}
        {mode === 'register' && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        )}

        {/* Email visible in all modes */}
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password only for Login / Register */}
        {(mode === 'login' || mode === 'register') && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}

        {/* OTP only for Verify */}
        {mode === 'verify' && (
          <input
            type="text"
            placeholder="6-Digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        )}

        <button type="submit">
          {mode === 'login'
            ? 'Sign In'
            : mode === 'register'
            ? 'Register'
            : 'Verify Account'}
        </button>
      </form>

      {/* Toggle between Login and Register */}
      {mode !== 'verify' && (
        <p
          className="auth-toggle"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <span>{mode === 'login' ? 'Sign Up' : 'Log In'}</span>
        </p>
      )}
    </div>
  );
}
