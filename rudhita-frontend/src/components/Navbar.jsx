import { Link } from 'react-router-dom';

export default function Navbar() {
  // Check if a user is currently logged in by looking for the token
  const isLoggedIn = !!localStorage.getItem("rudhita_token");

  const handleLogout = () => {
    localStorage.removeItem("rudhita_token");
    window.location.reload(); // Quick refresh to update the UI
  };

  return (
    <nav className="navbar">
      <h2><Link to="/" style={{ marginLeft: 0 }}>Rudhita</Link></h2>
      <div>
        <Link to="/cart">Cart 🛒</Link>
        {isLoggedIn ? (
          <button onClick={handleLogout} style={{ marginLeft: '1.5rem', background: '#333' }}>
            Logout
          </button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}