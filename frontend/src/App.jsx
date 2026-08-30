import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Playground from './pages/Playground';
import About from './pages/About';
import MapEditor from './pages/MapEditor';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PublicNavigation from './pages/PublicNavigation';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="bg-dark min-vh-100 text-light d-flex flex-column">
          <Navbar />

          <div className="flex-grow-1 d-flex flex-column">
            <Routes>

              {/* =====================================================
                  PUBLIC ROUTES
              ===================================================== */}

              <Route
                path="/"
                element={<Home />}
              />

              <Route
                path="/about"
                element={<About />}
              />

              <Route
                path="/login"
                element={<Login />}
              />

              <Route
                path="/signup"
                element={<Signup />}
              />

              {/* =====================================================
                  PUBLIC MAP / QR ROUTE

                  Example:
                  https://your-domain.vercel.app/navigate/map_123456

                  Anyone scanning the QR can open this.
                  Login is NOT required.
              ===================================================== */}

              <Route
                path="/navigate/:buildingId"
                element={<PublicNavigation />}
              />

              {/* =====================================================
                  PROTECTED USER ROUTES
              ===================================================== */}

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/playground"
                element={
                  <ProtectedRoute>
                    <Playground />
                  </ProtectedRoute>
                }
              />

              {/* =====================================================
                  MAP EDITOR

                  Existing functionality preserved.
                  Only authenticated owner can edit.
              ===================================================== */}

              <Route
                path="/editor/:buildingId"
                element={
                  <ProtectedRoute>
                    <MapEditor />
                  </ProtectedRoute>
                }
              />

              {/* =====================================================
                  FALLBACK
              ===================================================== */}

              <Route
                path="*"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />

            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}