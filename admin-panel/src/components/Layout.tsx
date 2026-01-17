import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="nav-header">
          <h2>Wedding Jarvis</h2>
          <span className="user-email">{user?.email}</span>
        </div>

        <ul className="nav-links">
          <li>
            <NavLink to="/" end>Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/activity">Live Activity</NavLink>
          </li>
          <li>
            <NavLink to="/guests">Guests</NavLink>
          </li>
          <li>
            <NavLink to="/broadcasts">Broadcasts</NavLink>
          </li>
          <li className="nav-divider">Content</li>
          <li>
            <NavLink to="/events">Events</NavLink>
          </li>
          <li>
            <NavLink to="/venues">Venues</NavLink>
          </li>
          <li>
            <NavLink to="/faqs">FAQs</NavLink>
          </li>
          <li>
            <NavLink to="/contacts">Contacts</NavLink>
          </li>
        </ul>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
