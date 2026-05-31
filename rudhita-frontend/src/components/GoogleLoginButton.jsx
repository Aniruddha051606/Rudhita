// src/components/GoogleLoginButton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders the Google sign-in button and exchanges the Google id_token for
// Rudhita JWTs via the backend. It does NOT store tokens or touch app state —
// it simply hands the returned { access_token, refresh_token } to onSuccess,
// and the caller (AuthModal / AuthPage) feeds them to the AuthContext login(),
// which is the single source of truth for storing tokens + updating state.
//
// Props:
//   onSuccess(tokens) – called with { access_token, refresh_token, token_type }
//   onError(message)  – called with an error string
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { API } from '../utils/api';

export default function GoogleLoginButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleCredentialResponse = async (credentialResponse) => {
    setLoading(true);
    try {
      const tokens = await API.auth.googleLogin(credentialResponse.credential);
      onSuccess?.(tokens);
    } catch (err) {
      onError?.(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(245,239,230,0.8)', borderRadius: 6, zIndex: 1,
        }}>
          <div style={{
            width: 20, height: 20,
            border: '2px solid rgba(24,16,12,0.15)',
            borderTopColor: '#A85538', borderRadius: '50%',
            animation: 'gSpin 0.7s linear infinite',
          }} />
          <style>{`@keyframes gSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
      <GoogleLogin
        onSuccess={handleCredentialResponse}
        onError={() => onError?.('Google returned an error. Please try again.')}
        useOneTap={false}
        shape="rectangular"
        theme="outline"
        size="large"
        width={400}
        text="continue_with"
        locale="en"
      />
    </div>
  );
}
