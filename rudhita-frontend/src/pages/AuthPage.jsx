import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { API, setAuthToken } from '../utils/api';
import './AuthPage.css';

export function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);

  // Login Form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Register Form
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // OTP Form
  const [otpForm, setOtpForm] = useState({
    otp: '',
    email: ''
  });

  // OTP Timer
  const [otpTimer, setOtpTimer] = useState(0);
  React.useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

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
    // Only allow 6 digits
    if (name === 'otp' && value.length <= 6) {
      setOtpForm(prev => ({ ...prev, [name]: value }));
    } else if (name !== 'otp') {
      setOtpForm(prev => ({ ...prev, [name]: value }));
    }
    setMessage('');
  };

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
        password: loginForm.password
      });

      if (response.token) {
        setAuthToken(response.token);
        setMessage('Login successful! Redirecting...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage('Login failed. Please try again.');
      }
    } catch (error) {
      setMessage(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation
    if (!registerForm.name || !registerForm.email || !registerForm.phone || !registerForm.password || !registerForm.confirmPassword) {
      setMessage('Please fill in all fields');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (registerForm.password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      // Send OTP to email
      await API.auth.register({
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password
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

  const handleOTPVerify = async (e) => {
    e.preventDefault();

    if (!otpForm.otp || otpForm.otp.length !== 6) {
      setMessage('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.auth.verifyOTP({
        email: otpForm.email,
        otp: otpForm.otp
      });

      if (response.token) {
        setAuthToken(response.token);
        setMessage('Registration successful! Redirecting...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage('OTP verification failed. Please try again.');
      }
    } catch (error) {
      setOtpAttempts(prev => prev + 1);
      if (otpAttempts >= 3) {
        setMessage('Too many failed attempts. Please request a new OTP.');
      } else {
        setMessage(error.message || `Invalid OTP. ${3 - otpAttempts} attempts remaining.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement resend OTP endpoint
      setOtpTimer(60);
      setMessage('OTP resent to your email.');
    } catch (error) {
      setMessage('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
                onClick={() => {
                  setActiveTab('login');
                  setMessage('');
                }}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('register');
                  setMessage('');
                }}
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
                  <div className={`auth-message ${message.includes('successful') || message.includes('Redirecting') ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}

                <Button
                  variant="primary"
                  className="auth-submit"
                  disabled={isLoading}
                >
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
                  <div className={`auth-message ${message.includes('successful') || message.includes('Redirecting') || message.includes('OTP sent') ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}

                <Button
                  variant="primary"
                  className="auth-submit"
                  disabled={isLoading}
                >
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
              We've sent a 6-digit OTP to <strong>{otpForm.email}</strong>. Please enter it below.
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
              <div className={`auth-message ${message.includes('successful') || message.includes('Redirecting') ? 'success' : 'error'}`}>
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

        {/* Footer */}
        <div className="auth-card-footer">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="auth-bg-decoration" />
    </div>
  );
}

export default AuthPage;
