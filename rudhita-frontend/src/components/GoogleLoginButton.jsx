// src/components/GoogleLoginButton.jsx
// ═════════════════════════════════════════════════════════════════════
// Renders the Google One-Tap / sign-in button and passes the
// id_token to the Rudhita backend for cryptographic verification.
//
// SETUP:
//   npm install @react-oauth/google
//
//   In main.jsx, wrap <App> with <GoogleOAuthProvider>:
//     import { GoogleOAuthProvider } from '@react-oauth/google';
//     <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
//       <App />
//     </GoogleOAuthProvider>
//
//   Add to .env:
//     VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
//
// Props:
//   onSuccess(tokens)  – called with { access_token, refresh_token }
//   onError(message)   – called with error string
// ═════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { GoogleLogin }      from '@react-oauth/google';
import { API, setAuthTokens } from '../utils/api';

export default function GoogleLoginButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleCredentialResponse = async (credentialResponse) => {
    console.log('Google Auth Success Response:', credentialResponse);
    setLoading(true);
    try {
      const tokens = await API.auth.googleLogin(credentialResponse.credential);
      console.log('[GoogleLogin] backend response:', JSON.stringify(tokens));
      setAuthTokens(tokens);
      onSuccess?.(tokens);
    } catch (err) {
      console.error('Google Auth Error:', err);
      onError?.(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'relative', zIndex:50, pointerEvents:'auto' }}>
      {loading && (
        <div style={{
          position:'absolute', inset:0, display:'flex',
          alignItems:'center', justifyContent:'center',
          background:'rgba(245,239,230,0.8)', borderRadius:6, zIndex:1,
        }}>
          <div style={{
            width:20, height:20,
            border:'2px solid rgba(24,16,12,0.15)',
            borderTopColor:'#A85538', borderRadius:'50%',
            animation:'gSpin 0.7s linear infinite',
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
