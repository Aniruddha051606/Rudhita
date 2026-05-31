// src/components/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();

  // Modes: 'login' | 'register' | 'otp'
  const [mode, setMode] = useState('login');

  // Form state
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [otp,      setOtp]      = useState('');

  // Messaging + busy state
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [busy,    setBusy]    = useState(false);

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

  // Shared: take tokens from a successful login (password OR Google), hand them
  // to the AuthContext (which stores them + updates state instantly), then close.
  const finishLogin = async (tokens) => {
    await login(tokens);   // updates global state — header/cart re-render, no reload
    onClose();
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError(''); setSuccess('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      const data = await API.auth.login({ email, password });
      await finishLogin(data);
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  // ── REGISTER ─────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setError(''); setSuccess('');
    if (!name || !email || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }
    setBusy(true);
    try {
      await API.auth.register({ name, email, password, phone: phone || null });
      setSuccess('Verification code sent! Check your email.');
      setMode('otp');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  // ── OTP VERIFY ───────────────────────────────────────────────────────────────
  const handleOTP = async () => {
    setError(''); setSuccess('');
    setBusy(true);
    try {
      await API.auth.verifyOTP({ email, otp });
      setSuccess('Account verified! You can now sign in.');
      setMode('login');
    } catch (err) {
      setError(err.message || 'Verification failed. Invalid code.');
    } finally {
      setBusy(false);
    }
  };

  const onGoogleSuccess = async (tokens) => {
    try {
      await finishLogin(tokens);
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
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
            <GoogleLoginButton
              onSuccess={onGoogleSuccess}
              onError={(msg) => setError(msg || 'Google sign-in failed.')}
            />
            <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px 0' }}>
              <div style={{ flex:1, height:1, background:'rgba(24,16,12,0.1)' }} />
              <span style={{ fontSize:11, color:'rgba(24,16,12,0.4)', letterSpacing:'0.1em', textTransform:'uppercase' }}>or</span>
              <div style={{ flex:1, height:1, background:'rgba(24,16,12,0.1)' }} />
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
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              />
            </div>
            <button className="msubmit" onClick={handleLogin} disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        )}

        {/* ── REGISTER FORM ── */}
        {mode === 'register' && (
          <div className="mform active">
            <GoogleLoginButton
              onSuccess={onGoogleSuccess}
              onError={(msg) => setError(msg || 'Google sign-in failed.')}
            />
            <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px 0' }}>
              <div style={{ flex:1, height:1, background:'rgba(24,16,12,0.1)' }} />
              <span style={{ fontSize:11, color:'rgba(24,16,12,0.4)', letterSpacing:'0.1em', textTransform:'uppercase' }}>or</span>
              <div style={{ flex:1, height:1, background:'rgba(24,16,12,0.1)' }} />
            </div>
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
            <button className="msubmit" onClick={handleRegister} disabled={busy}>
              {busy ? 'Creating…' : 'Create Account'}
            </button>
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
            <button className="msubmit" onClick={handleOTP} disabled={busy}>
              {busy ? 'Verifying…' : 'Verify Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
