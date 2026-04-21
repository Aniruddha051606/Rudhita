// src/components/Navbar.jsx
import { Link } from 'react-router-dom';

// FIX: import clearAuthTokens so logout removes BOTH rudhita_token AND rudhita_refresh_token.
// The old code only removed rudhita_token, leaving rudhita_refresh_token in localStorage forever.
import { API, clearAuthTokens } from '../utils/api';

export default function Navbar() {
  const isLoggedIn = !!localStorage.getItem("rudhita_token");

  const handleLogout = async () => {
    try {
      // Tell the backend to blocklist the access token JTI and revoke the refresh token.
      // This is a fire-and-forget — even if it fails we still clear locally.
      await API.auth.logout();
    } catch {
      // Network error on logout is non-fatal; clear tokens locally regardless.
    }

    // FIX: clear BOTH tokens (access + refresh).
    // Before: only removed "rudhita_token", leaving "rudhita_refresh_token" stranded.
    clearAuthTokens();

    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <h2><Link to="/" style={{ marginLeft: 0 }}>Rudhita</Link></h2>
      <div>
        <Link to="/cart">Cart 🛒</Link>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            style={{ marginLeft: '1.5rem', background: '#333' }}
          >
            Logout
          </button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}