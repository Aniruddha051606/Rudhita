// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 (BUILD CRASH):
//   BEFORE: import { API, setAuthToken }  from '../utils/api';
//           ↑ "setAuthToken" does NOT exist → Vite throws [MISSING_EXPORT] → build fails
//   AFTER:  import { API, setAuthTokens } from '../utils/api';
//           ↑ "setAuthTokens" is the actual exported name (plural, stores both tokens)
// ─────────────────────────────────────────────────────────────────────────────
import { API, setAuthTokens } from '../utils/api';
import './AuthPage.css';

export function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);

  // Login Form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Register Form
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: ''
  });

  // OTP Form
  const [otpForm, setOtpForm] = useState({ otp: '', email: '' });

  // OTP countdown timer
  const [otpTimer, setOtpTimer] = useState(0);
  React.useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const handleOTPChange = (e) => {
    const { name, value } = e.target;
    if (name === 'otp' && value.length <= 6) {
      setOtpForm(prev => ({ ...prev, [name]: value }));
    } else if (name !== 'otp') {
      setOtpForm(prev => ({ ...prev, [name]: value }));
    }
    setMessage('');
  };

  // ── Login ─────────────────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setMessage('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.auth.login({
        email: loginForm.email,
        password: loginForm.password,
      });

      // ───────────────────────────────────────────────────────────────────────
      // FIX 2 (SILENT LOGIN FAILURE):
      //   BEFORE: if (response.token) { setAuthToken(response.token); }
      //           ↑ backend returns { access_token, refresh_token } — no "token" key
      //           ↑ response.token is always undefined → user never gets logged in
      //   AFTER:  setAuthTokens({ access_token, refresh_token })
      //           ↑ reads the actual field names the backend sends
      //           ↑ stores both tokens so refresh flow works
      // ───────────────────────────────────────────────────────────────────────
      if (response.access_token) {
        setAuthTokens({
          access_token:  response.access_token,
          refresh_token: response.refresh_token,
        });
        setMessage('Login successful! Redirecting...');
        setTimeout(() => navigate('/'), 1200);
      } else {
        setMessage('Login failed. Please try again.');
      }
    } catch (error) {
      setMessage(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!registerForm.name || !registerForm.email || !registerForm.phone ||
        !registerForm.password || !registerForm.confirmPassword) {
      setMessage('Please fill in all fields');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (registerForm.password.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await API.auth.register({
        name:     registerForm.name,
        email:    registerForm.email,
        phone:    registerForm.phone,
        password: registerForm.password,
      });

      setOtpForm(prev => ({ ...prev, email: registerForm.email }));
      setShowOTP(true);
      setOtpTimer(60);
      setMessage('OTP sent to your email. Please verify.');
    } catch (error) {
      setMessage(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP Verification ──────────────────────────────────────────────────────

  const handleOTPVerify = async (e) => {
    e.preventDefault();

    if (!otpForm.otp || otpForm.otp.length !== 6) {
      setMessage('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      await API.auth.verifyOTP({ email: otpForm.email, otp: otpForm.otp });

      // ─────────────────────────────────────────────────────────────────────
      // FIX 3 (OTP VERIFY ALWAYS SHOWS "FAILED"):
      //   BEFORE: if (response.token) { setAuthToken(response.token); navigate('/'); }
      //           else { setMessage('OTP verification failed. Please try again.'); }
      //           ↑ verifyOTP returns { status: "success", message: "..." } — no token
      //           ↑ response.token is always undefined → always hits the else branch
      //           ↑ user sees "OTP verification failed" even when verification WORKED
      //
      //   AFTER:  show success message → redirect to login tab after 1.5s
      //           verifyOTP just marks the account as verified; the user then logs in.
      //           The backend does NOT issue a token at the verification step.
      // ─────────────────────────────────────────────────────────────────────
      setMessage('Account verified! Please sign in.');
      setShowOTP(false);
      setOtpForm({ otp: '', email: '' });
      setOtpAttempts(0);
      setActiveTab('login');
    } catch (error) {
      const remaining = 3 - (otpAttempts + 1);
      setOtpAttempts(prev => prev + 1);
      if (otpAttempts >= 2) {
        setMessage('Too many failed attempts. Please request a new OTP.');
      } else {
        setMessage(
          error.message ||
          `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await API.auth.resendOTP({ email: otpForm.email });
      setOtpTimer(60);
      setMessage('A new OTP has been sent to your email.');
    } catch (error) {
      setMessage('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Rudhita</h1>
          <p className="auth-subtitle">Premium Oversized T-Shirts</p>
        </div>

        {!showOTP ? (
          <>
            {/* Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveTab('login'); setMessage(''); }}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => { setActiveTab('register'); setMessage(''); }}
              >
                Create Account
              </button>
            </div>

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="auth-form">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                />
                {message && (
                  <div className={`auth-message ${
                    message.includes('successful') || message.includes('Redirecting')
                      ? 'success' : 'error'
                  }`}>
                    {message}
                  </div>
                )}
                <Button variant="primary" className="auth-submit" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
                <p className="auth-footer">
                  <a href="#forgot" style={{ color: 'var(--terra)', textDecoration: 'none' }}>
                    Forgot password?
                  </a>
                </p>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="auth-form">
                <Input
                  label="Full Name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={registerForm.name}
                  onChange={handleRegisterChange}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  placeholder="+91 9876543210"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                />
                {message && (
                  <div className={`auth-message ${
                    message.includes('successful') || message.includes('OTP sent')
                      ? 'success' : 'error'
                  }`}>
                    {message}
                  </div>
                )}
                <Button variant="primary" className="auth-submit" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            )}
          </>
        ) : (
          /* OTP Verification Form */
          <form onSubmit={handleOTPVerify} className="auth-form">
            <h2 className="otp-title">Verify Your Email</h2>
            <p className="otp-hint">
              We've sent a 6-digit OTP to <strong>{otpForm.email}</strong>. Enter it below.
            </p>
            <Input
              label="OTP Code"
              type="text"
              name="otp"
              placeholder="000000"
              value={otpForm.otp}
              onChange={handleOTPChange}
              maxLength="6"
              required
            />
            {message && (
              <div className={`auth-message ${
                message.includes('verified') || message.includes('sent')
                  ? 'success' : 'error'
              }`}>
                {message}
              </div>
            )}
            <Button
              variant="primary"
              className="auth-submit"
              disabled={isLoading || otpForm.otp.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <div className="otp-footer">
              {otpTimer > 0 ? (
                <p>Resend OTP in <strong>{otpTimer}s</strong></p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="resend-btn"
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowOTP(false);
                setOtpForm({ otp: '', email: '' });
                setOtpAttempts(0);
                setMessage('');
              }}
              className="back-btn"
            >
              ← Back to Registration
            </button>
          </form>
        )}

        <div className="auth-card-footer">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>

      <div className="auth-bg-decoration" />
    </div>
  );
}

export default AuthPage;
