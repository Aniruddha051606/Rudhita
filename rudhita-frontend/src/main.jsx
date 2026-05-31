// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import { AppErrorBoundary } from './components/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import CartSidebar from './components/CartSidebar.jsx';
import './index.css';

// Read the Client ID from the Vite env (set VITE_GOOGLE_CLIENT_ID in .env / Vercel).
// Falls back to the literal ID so a missing env var doesn't disable Google Sign-In.
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '454258164465-k4crklt7dghdbjtncrmrhbagfbk7b52c.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              {/* App contains all routes; CartSidebar is a global slide-out */}
              <App />
              <CartSidebar />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
