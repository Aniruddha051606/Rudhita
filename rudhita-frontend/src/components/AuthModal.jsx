// src/components/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import { API, setAuthTokens } from '../utils/api';

export default function AuthModal({ isOpen, onClose }) {
  // Modes: 'login' | 'register' | 'otp'
  const [mode, setMode] = useState('login');

  // Form state
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [otp,      setOtp]      = useState('');

  // Messaging state
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  // Clear messages whenever the modal opens / closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  // Close when clicking the dark backdrop
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('overlay')) onClose();
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError(''); setSuccess('');
    try {
      /**
       * FIX: api.js now formats credentials as URLSearchParams internally.
       *      No raw fetch() here — all calls go through the centralised utility
       *      so the base URL, auth headers, and error handling are consistent.
       */
      const data = await API.auth.login({ email, password });

      // Persist BOTH tokens so the refresh flow works server-side.
      setAuthTokens({ access_token: data.access_token, refresh_token: data.refresh_token });

      // Hard-reload updates the Navbar "Logout" state without needing global state.
      window.location.reload();
    } catch (err) {
      setError(err.message || "Sign in failed. Check your credentials.");
    }
  };

  // ── REGISTER ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setError(''); setSuccess('');
    try {
      await API.auth.register({ name, email, password, phone: phone || null });
      setSuccess('Verification code sent! Check your email.');
      setMode('otp');
    } catch (err) {
      setError(err.message || "Registration failed.");
    }
  };

  // ── OTP VERIFY ────────────────────────────────────────────────────────────
  const handleOTP = async () => {
    setError(''); setSuccess('');
    try {
      await API.auth.verifyOTP({ email, otp });
      setSuccess('Account verified! You can now sign in.');
      setMode('login');
    } catch (err) {
      setError(err.message || "Verification failed. Invalid code.");
    }
  };

  return (
    <div className={`overlay ${isOpen ? 'open' : ''}`} onClick={handleOverlayClick}>
      <div className="modal">
        <button className="modal-x" onClick={onClose}>×</button>

        {/* Hide tabs while in OTP mode */}
        {mode !== 'otp' && (
          <div className="modal-tabs">
            <button
              className={`mtab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              className={`mtab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Alert messages */}
        {error   && <div className="form-msg err" style={{ display: 'block', marginBottom: '15px' }}>{error}</div>}
        {success && <div className="form-msg ok"  style={{ display: 'block', marginBottom: '15px' }}>{success}</div>}

        {/* ── LOGIN FORM ── */}
        {mode === 'login' && (
          <div className="mform active">
            <div className="fg">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="fg">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button className="msubmit" onClick={handleLogin}>Sign In</button>
          </div>
        )}

        {/* ── REGISTER FORM ── */}
        {mode === 'register' && (
          <div className="mform active">
            <div className="fg">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="fg">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="fg">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="fg">
              <label>Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <button className="msubmit" onClick={handleRegister}>Create Account</button>
          </div>
        )}

        {/* ── OTP FORM ── */}
        {mode === 'otp' && (
          <div className="mform active">
            <p className="otp-hint">
              We sent a 6-digit code to <strong>{email}</strong>.
              Enter it below to activate your account.
            </p>
            <div className="fg">
              <label>Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength="6"
                style={{ fontSize: '22px', letterSpacing: '.35em', textAlign: 'center' }}
              />
            </div>
            <button className="msubmit" onClick={handleOTP}>Verify Account</button>
          </div>
        )}
      </div>
    </div>
  );
}
