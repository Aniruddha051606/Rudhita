// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import { AppErrorBoundary } from './components/ErrorBoundary.jsx';
import { CartProvider } from './context/CartContext.jsx';
import CartSidebar from './components/CartSidebar.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <GoogleOAuthProvider clientId="454258164465-k4crklt7dghdbjtncrmrhbagfbk7b52c.apps.googleusercontent.com">
        <BrowserRouter>
          <CartProvider>
            {/* App contains all routes; CartSidebar is a global slide-out */}
            <App />
            <CartSidebar />
          </CartProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
