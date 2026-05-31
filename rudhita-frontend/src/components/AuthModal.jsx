// src/components/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { API } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import GoogleLoginButton from '@/components/GoogleLoginButton';

const Divider = () => (
  <div className="flex items-center gap-3 my-5">
    <span className="flex-1 h-0.5 bg-line" />
    <span className="eyebrow">or</span>
    <span className="flex-1 h-0.5 bg-line" />
  </div>
);

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');     // login | register | otp
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [otp, setOtp]   = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy]       = useState(false);

  useEffect(() => { if (isOpen) { setError(''); setSuccess(''); } }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const finishLogin = (tokens) => { login(tokens); onClose(); };

  const doLogin = async () => {
    setError('');
    if (!form.email || !form.password) { setError('Please enter your email and password.'); return; }
    setBusy(true);
    try {
      const data = await API.auth.login({ email: form.email, password: form.password });
      finishLogin(data);
    } catch (err) { setError(err.message || 'Sign in failed. Check your credentials.'); }
    finally { setBusy(false); }
  };

  const doRegister = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill in name, email, and password.'); return; }
    setBusy(true);
    try {
      await API.auth.register({ name: form.name, email: form.email, password: form.password, phone: form.phone || null });
      setSuccess('Verification code sent! Check your email.');
      setMode('otp');
    } catch (err) { setError(err.message || 'Registration failed.'); }
    finally { setBusy(false); }
  };

  const doOTP = async () => {
    setError('');
    setBusy(true);
    try {
      await API.auth.verifyOTP({ email: form.email, otp });
      setSuccess('Account verified! You can now sign in.');
      setMode('login');
    } catch (err) { setError(err.message || 'Verification failed. Invalid code.'); }
    finally { setBusy(false); }
  };

  const onGoogle = (tokens) => { try { finishLogin(tokens); } catch (e) { setError(e.message); } };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-scale-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-paper border-2 border-ink shadow-brutalLg">
        {/* Header strip */}
        <div className="flex items-center justify-between border-b-2 border-ink px-6 py-4">
          <span className="font-display text-2xl font-semibold tracking-tight">
            {mode === 'otp' ? 'Verify' : 'Rudhita'}
          </span>
          <button onClick={onClose} className="p-1 hover:text-punch transition-colors" aria-label="Close">
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          {mode !== 'otp' && (
            <div className="flex gap-1 mb-6 border-2 border-ink p-1">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 h-9 font-sans font-semibold text-sm tracking-tight transition-colors ${
                    mode === m ? 'bg-ink text-paper' : 'text-ink hover:bg-sand'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          {error   && <div className="mb-4 border-2 border-destructive bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">{error}</div>}
          {success && <div className="mb-4 border-2 border-success bg-success/5 px-3 py-2 font-mono text-xs text-success">{success}</div>}

          {mode === 'login' && (
            <div className="flex flex-col gap-4">
              <GoogleLoginButton onSuccess={onGoogle} onError={setError} />
              <Divider />
              <Input label="Email" type="email" name="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
              <Input label="Password" type="password" name="password" value={form.password} onChange={set('password')}
                     placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
              <Button onClick={doLogin} disabled={busy} size="lg" className="mt-1">
                {busy ? 'Signing in…' : 'Sign In'}
              </Button>
            </div>
          )}

          {mode === 'register' && (
            <div className="flex flex-col gap-4">
              <GoogleLoginButton onSuccess={onGoogle} onError={setError} />
              <Divider />
              <Input label="Full Name" name="name" value={form.name} onChange={set('name')} placeholder="Your name" />
              <Input label="Email" type="email" name="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
              <Input label="Password" type="password" name="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
              <Input label="Phone (optional)" type="tel" name="phone" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              <Button onClick={doRegister} disabled={busy} size="lg" className="mt-1">
                {busy ? 'Creating…' : 'Create Account'}
              </Button>
            </div>
          )}

          {mode === 'otp' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted">
                We sent a 6-digit code to <strong className="text-ink">{form.email}</strong>. Enter it below.
              </p>
              <Input label="Verification Code" name="otp" value={otp} maxLength={6}
                     onChange={(e) => setOtp(e.target.value)} placeholder="000000"
                     className="text-center text-2xl tracking-[0.4em] font-mono" />
              <Button onClick={doOTP} disabled={busy} size="lg">
                {busy ? 'Verifying…' : 'Verify Account'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
