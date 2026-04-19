import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';

export default function AuthModal({ isOpen, onClose }) {
  // Modes: 'login', 'register', 'otp'
  const [mode, setMode] = useState('login'); 
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Messaging State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear errors when the modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  // Handle clicking the dark background to close
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('overlay')) onClose();
  };

  const handleLogin = async () => {
    setError(''); setSuccess('');
    try {
      // FastAPI OAuth2 strictly expects URLSearchParams, not JSON
      const formData = new URLSearchParams();
      formData.append('username', email); 
      formData.append('password', password);

      const response = await fetch('http://127.0.0.1:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.detail);

      localStorage.setItem('rudhita_token', data.access_token);
      window.location.reload(); // Refresh to update the Navbar state to "Logout"
    } catch (err) {
      setError(err.message || "Sign in failed. Check your credentials.");
    }
  };

  const handleRegister = async () => {
    setError(''); setSuccess('');
    try {
      await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone: phone || null })
      });
      setSuccess('Verification code sent! Check your backend terminal.');
      setMode('otp');
    } catch (err) {
      setError(err.message || "Registration failed.");
    }
  };

  const handleOTP = async () => {
    setError(''); setSuccess('');
    try {
      await fetchAPI('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });
      setSuccess('Account verified! You can now sign in.');
      setMode('login');
    } catch (err) {
      setError(err.message || "Verification failed. Invalid code.");
    }
  };

  return (
    // The CSS class 'open' handles the smooth fade-in animation
    <div className={`overlay ${isOpen ? 'open' : ''}`} onClick={handleOverlayClick}>
      <div className="modal">
        <button className="modal-x" onClick={onClose}>×</button>

        {/* Hide tabs if we are currently in OTP verification mode */}
        {mode !== 'otp' && (
          <div className="modal-tabs">
            <button className={`mtab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
            <button className={`mtab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Create Account</button>
          </div>
        )}

        {/* Alert Messages */}
        {error && <div className="form-msg err" style={{display: 'block', marginBottom: '15px'}}>{error}</div>}
        {success && <div className="form-msg ok" style={{display: 'block', marginBottom: '15px'}}>{success}</div>}

        {/* --- LOGIN FORM --- */}
        {mode === 'login' && (
          <div className="mform active">
            <div className="fg"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"/></div>
            <div className="fg"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></div>
            <button className="msubmit" onClick={handleLogin}>Sign In</button>
          </div>
        )}

        {/* --- REGISTER FORM --- */}
        {mode === 'register' && (
          <div className="mform active">
            <div className="fg"><label>Full Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div>
            <div className="fg"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"/></div>
            <div className="fg"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></div>
            <div className="fg"><label>Phone (optional)</label><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210"/></div>
            <button className="msubmit" onClick={handleRegister}>Create Account</button>
          </div>
        )}

        {/* --- OTP FORM --- */}
        {mode === 'otp' && (
          <div className="mform active">
            <p className="otp-hint">We sent a 6-digit code to <strong>{email}</strong>. Enter it below to activate your account.</p>
            <div className="fg">
              <label>Verification Code</label>
              <input type="text" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="000000" maxLength="6" style={{fontSize: '22px', letterSpacing: '.35em', textAlign: 'center'}}/>
            </div>
            <button className="msubmit" onClick={handleOTP}>Verify Account</button>
          </div>
        )}
      </div>
    </div>
  );
}