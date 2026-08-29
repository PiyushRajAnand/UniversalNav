import React, { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary px-4">
      <Link className="navbar-brand fw-bold text-info fs-4" to="/">
        🌐 UniversalNav
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse justify-content-between" id="navbarNav">
        {/* Navigation Links */}
        <div className="navbar-nav gap-3 fs-6 fw-semibold">
          {/* Public links always visible */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'nav-link text-info active fw-bold' : 'nav-link text-light'
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? 'nav-link text-info active fw-bold' : 'nav-link text-light'
            }
          >
            About
          </NavLink>

          {/* Protected links visible only when user is logged in */}
          {user && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? 'nav-link text-info active fw-bold' : 'nav-link text-light'
                }
              >
                My Maps
              </NavLink>
              <NavLink
                to="/playground"
                className={({ isActive }) =>
                  isActive ? 'nav-link text-info active fw-bold' : 'nav-link text-light'
                }
              >
                Playground
              </NavLink>
            </>
          )}
        </div>

        {/* Authentication State Section */}
        <div className="navbar-nav ms-auto align-items-center gap-3 fs-6 fw-semibold">
          {user ? (
            <>
              <span className="text-light small">Hello, {user.name || user.email}</span>
              <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-info btn-sm text-dark fw-bold">
                Login
              </Link>
              <Link to="/signup" className="btn btn-outline-light btn-sm">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
