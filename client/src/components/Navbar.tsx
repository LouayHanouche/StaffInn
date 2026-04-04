import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar__brand">StaffInn</div>
      <nav className="navbar__links">
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            {user.role === 'CANDIDATE' && <Link to="/candidate">Candidate Dashboard</Link>}
            {user.role === 'HOTEL' && <Link to="/hotel">Hotel Dashboard</Link>}
            {user.role === 'ADMIN' && <Link to="/admin">Admin Panel</Link>}
            <button type="button" onClick={() => logout()}>
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
};
