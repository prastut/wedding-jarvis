import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function handleNavClick() {
    setMenuOpen(false);
  }

  // Close menu on route change
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
        <h1>Shreyas & Sanjoli's Wedding Jarvis</h1>
      </header>

      {/* Overlay for mobile */}
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="nav-header">
          <h2>Shreyas & Sanjoli's Wedding Jarvis</h2>
          <span className="user-email">{user?.email}</span>
        </div>

        {/* Mobile-only Dashboard link at top of sidebar */}
        <div className="mobile-nav-header">
          <NavLink to="/" end onClick={handleNavClick} className="mobile-dashboard-link">
            Dashboard
          </NavLink>
          <span className="user-email">{user?.email}</span>
        </div>

        <ul className="nav-links">
          <li className="desktop-only">
            <NavLink to="/" end onClick={handleNavClick}>Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/activity" onClick={handleNavClick}>Live Activity</NavLink>
          </li>
          <li>
            <NavLink to="/guests" onClick={handleNavClick}>Guests</NavLink>
          </li>
          <li>
            <NavLink to="/broadcasts" onClick={handleNavClick}>Broadcasts</NavLink>
          </li>
          <li className="nav-divider">Edit Content</li>
          <li>
            <NavLink to="/events" onClick={handleNavClick}>Events</NavLink>
          </li>
          <li>
            <NavLink to="/venues" onClick={handleNavClick}>Venues</NavLink>
          </li>
          <li>
            <NavLink to="/faqs" onClick={handleNavClick}>FAQs</NavLink>
          </li>
          <li>
            <NavLink to="/contacts" onClick={handleNavClick}>Contacts</NavLink>
          </li>
          <li>
            <NavLink to="/dress-code" onClick={handleNavClick}>Dress Code</NavLink>
          </li>
          <li>
            <NavLink to="/registry" onClick={handleNavClick}>Gift Registry</NavLink>
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
