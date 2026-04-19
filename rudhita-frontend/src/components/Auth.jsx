import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '../utils/api';

export default function Auth() {
  // Modes: 'login' | 'register' | 'verify'
  const [mode, setMode] = useState('login');
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'register') {
        // 1. REGISTER FLOW
        await fetchAPI('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, phone }),
        });
        alert('Registration successful! Check your backend terminal for the OTP.');
        setMode('verify');

      } else if (mode === 'verify') {
        // 2. OTP VERIFICATION FLOW
        await fetchAPI('/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email, otp }),
        });
        alert('Email verified! You can now log in.');
        setMode('login');

      } else if (mode === 'login') {
        // 3. LOGIN FLOW (OAuth2 requires URLSearchParams, not JSON)
        const formData = new URLSearchParams();
        formData.append('username', email); // FastAPI OAuth2 strictly expects 'username'
        formData.append('password', password);

        const response = await fetch('http://127.0.0.1:8080/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail);

        // Save token and go to storefront
        localStorage.setItem('rudhita_token', data.access_token);
        
        // Force a hard reload to update the Navbar state and go home
        window.location.href = "/";
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    }
  };

  return (
    <div className="auth-container">
      <h2>
        {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Verify Email'}
      </h2>
      
      {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Only show Name/Phone if Registering */}
        {mode === 'register' && (
          <>
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </>
        )}

        {/* Email is used in all modes */}
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />

        {/* Only show Password if Login or Register */}
        {(mode === 'login' || mode === 'register') && (
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        )}

        {/* Only show OTP if Verifying */}
        {mode === 'verify' && (
          <input type="text" placeholder="6-Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
        )}

        <button type="submit">
          {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Register' : 'Verify Account'}
        </button>
      </form>

      {/* Toggle between Login and Register */}
      {mode !== 'verify' && (
        <p className="auth-toggle" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <span>{mode === 'login' ? 'Sign Up' : 'Log In'}</span>
        </p>
      )}
    </div>
  );
}