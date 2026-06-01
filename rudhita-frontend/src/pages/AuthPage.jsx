// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import GoogleLoginButton from '@/components/GoogleLoginButton';

export function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab]   = useState('login');     // login | register | otp
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [otp, setOtp]   = useState('');
  const [msg, setMsg]   = useState('');
  const [ok, setOk]     = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setMsg(''); };

  const finishLogin = (tokens) => { login(tokens); navigate('/'); };

  const doLogin = async () => {
    setMsg('');
    if (!form.email || !form.password) { setMsg('Please fill in all fields.'); return; }
    setBusy(true);
    try {
      const data = await API.auth.login({ email: form.email, password: form.password });
      if (data.access_token) finishLogin(data);
      else setMsg('Login failed. Please try again.');
    } catch (e) { setMsg(e.message || 'Login failed. Check your credentials.'); }
    finally { setBusy(false); }
  };

  const doRegister = async () => {
    setMsg('');
    if (!form.name || !form.email || !form.password || !form.confirm) { setMsg('Please fill in all fields.'); return; }
    if (form.password !== form.confirm) { setMsg('Passwords do not match.'); return; }
    if (form.password.length < 8) { setMsg('Password must be at least 8 characters.'); return; }
    setBusy(true);
    try {
      await API.auth.register({ name: form.name, email: form.email, phone: form.phone || null, password: form.password });
      setOk('OTP sent to your email. Please verify.');
      setTab('otp');
    } catch (e) { setMsg(e.message || 'Registration failed.'); }
    finally { setBusy(false); }
  };

  const doOTP = async () => {
    setMsg('');
    if (!otp || otp.length !== 6) { setMsg('Please enter a valid 6-digit code.'); return; }
    setBusy(true);
    try {
      await API.auth.verifyOTP({ email: form.email, otp });
      setOk('Account verified! Please sign in.');
      setTab('login');
    } catch (e) { setMsg(e.message || 'Invalid code.'); }
    finally { setBusy(false); }
  };

  const onGoogle = (tokens) => { try { finishLogin(tokens); } catch (e) { setMsg(e.message); } };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-ink text-paper p-12 relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-punch/20 blur-3xl" />
        <Link to="/" className="font-display text-3xl font-bold tracking-tight relative z-10">Rudhita</Link>
        <div className="relative z-10">
          <p className="eyebrow text-punch mb-4">Crafted Luxury</p>
          <h1 className="h-display text-5xl mb-6">Pieces made<br />to outlast<br />the moment.</h1>
          <p className="text-paper/70 max-w-sm">Sign in to track orders, save favourites, and check out faster.</p>
        </div>
        <p className="font-mono text-[11px] text-paper/40 relative z-10">Â© 2026 Rudhita</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link to="/" className="font-display text-2xl font-bold tracking-tight">Rudhita</Link>
          </div>

          {tab !== 'otp' && (
            <div className="flex gap-1 mb-8 border-2 border-ink p-1">
              {['login', 'register'].map((m) => (
                <button key={m} onClick={() => { setTab(m); setMsg(''); }}
                  className={`flex-1 h-10 font-sans font-semibold text-sm transition-colors ${tab === m ? 'bg-ink text-paper' : 'hover:bg-sand'}`}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          {msg && <div className="mb-4 border-2 border-destructive bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">{msg}</div>}
          {ok  && <div className="mb-4 border-2 border-success bg-success/5 px-3 py-2 font-mono text-xs text-success">{ok}</div>}

          {tab === 'login' && (
            <div className="flex flex-col gap-4">
              <GoogleLoginButton onSuccess={onGoogle} onError={setMsg} />
              <div className="flex items-center gap-3 my-1"><span className="flex-1 h-0.5 bg-line" /><span className="eyebrow">or</span><span className="flex-1 h-0.5 bg-line" /></div>
              <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
              <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
              <Button onClick={doLogin} disabled={busy} size="lg" className="mt-1">{busy ? 'Signing inâ€¦' : 'Sign In'}</Button>
            </div>
          )}

          {tab === 'register' && (
            <div className="flex flex-col gap-4">
              <GoogleLoginButton onSuccess={onGoogle} onError={setMsg} />
              <div className="flex items-center gap-3 my-1"><span className="flex-1 h-0.5 bg-line" /><span className="eyebrow">or</span><span className="flex-1 h-0.5 bg-line" /></div>
              <Input label="Full Name" value={form.name} onChange={set('name')} placeholder="Your name" />
              <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
              <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" />
              <Input label="Confirm Password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" />
              <Button onClick={doRegister} disabled={busy} size="lg" className="mt-1">{busy ? 'Creatingâ€¦' : 'Create Account'}</Button>
            </div>
          )}

          {tab === 'otp' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted">We sent a 6-digit code to <strong className="text-ink">{form.email}</strong>.</p>
              <Input label="Verification Code" value={otp} maxLength={6} onChange={(e) => setOtp(e.target.value)} placeholder="000000" className="text-center text-2xl tracking-[0.4em] font-mono" />
              <Button onClick={doOTP} disabled={busy} size="lg">{busy ? 'Verifyingâ€¦' : 'Verify Account'}</Button>
              <button onClick={() => setTab('login')} className="font-mono text-xs text-muted hover:text-punch">â† Back to sign in</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
