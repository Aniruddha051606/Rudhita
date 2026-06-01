// src/components/GoogleLoginButton.jsx
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { API } from '@/api/client';
import { Spinner } from '@/components/ui/Spinner';

// Exchanges the Google id_token for Rudhita tokens, then hands them to onSuccess.
// Does NOT store tokens or touch app state â€” the AuthContext owns that.
export default function GoogleLoginButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handle = async (cred) => {
    setLoading(true);
    try {
      const tokens = await API.auth.googleLogin(cred.credential);
      onSuccess?.(tokens);
    } catch (err) {
      onError?.(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" style={{ minHeight: 44 }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper/80">
          <Spinner className="text-punch" />
        </div>
      )}
      <GoogleLogin
        onSuccess={handle}
        onError={() => onError?.('Google returned an error. Please try again.')}
        useOneTap={false}
        shape="rectangular"
        theme="outline"
        size="large"
        width={360}
        text="continue_with"
        locale="en"
      />
    </div>
  );
}
