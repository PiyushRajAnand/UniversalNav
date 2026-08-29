import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary fs-3" to="/">UniversalNav 🧭</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/about">About System</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/capabilities">Capabilities</Link></li>
            {user && (
              <li className="nav-item">
                <Link className="nav-link text-warning fw-bold" to="/playground">🎮 Our Playground</Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                <span className="navbar-text me-2">Hi, {user.name || 'Explorer'}</span>
                <button className="btn btn-outline-danger btn-sm" onClick={() => { logout(); navigate('/'); }}>Logout</button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-light btn-sm" to="/login">Login</Link>
                <Link className="btn btn-primary btn-sm" to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
