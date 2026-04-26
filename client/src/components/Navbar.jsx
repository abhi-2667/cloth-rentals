import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Bell, Home as HomeIcon, Shirt } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass top-nav" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '0.85rem 0'
    }}>
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" style={{ fontSize: '1.45rem', fontWeight: 'bold', letterSpacing: '-0.02em' }}>
          <Shirt style={{ color: 'var(--primary-color)' }} />
          <span>Luxe<span style={{ color: 'var(--primary-color)' }}>Rentals</span></span>
        </Link>

        <div className="flex items-center gap-2 nav-links-wrap">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link-chip flex items-center gap-2 ${isActive ? 'nav-link-chip-active' : ''}`}
          >
            <HomeIcon size={16} /> Home
          </NavLink>
          <NavLink
            to="/browse"
            className={({ isActive }) => `nav-link-chip ${isActive ? 'nav-link-chip-active' : ''}`}
          >
            Browse Catalog
          </NavLink>
          {user ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-link-chip flex items-center gap-2 ${isActive ? 'nav-link-chip-active' : ''}`}
              >
                <User size={18} /> Profile
              </NavLink>
              {user.role !== 'admin' && (
                <NavLink
                  to="/notifications"
                  className={({ isActive }) => `nav-link-chip flex items-center gap-2 ${isActive ? 'nav-link-chip-active' : ''}`}
                  title="Notifications"
                >
                  <Bell size={17} /> Notifications
                </NavLink>
              )}
              {user.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `nav-link-chip flex items-center gap-2 ${isActive ? 'nav-link-chip-active' : ''}`}
                  title="Admin dashboard"
                >
                  <LayoutDashboard size={18} />
                  Admin
                </NavLink>
              )}
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn btn-primary">Sign In</Link>
              <Link to="/admin/signin" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Admin</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
