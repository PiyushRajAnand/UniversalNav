import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Guide from "./pages/Guide";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MapEditor from "./pages/MapEditor";
import PublicNavigation from "./pages/PublicNavigation";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* Public Pages */}
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/about"
            element={<About />}
          />

          <Route
            path="/guide"
            element={<Guide />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />

          {/* Public Navigation */}
          <Route
            path="/navigate/:buildingId"
            element={<PublicNavigation />}
          />

          {/* Protected Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Map Editor */}
          <Route
            path="/editor/:buildingId"
            element={
              <ProtectedRoute>
                <MapEditor />
              </ProtectedRoute>
            }
          />

          {/* Unknown Routes */}
          <Route
            path="*"
            element={<Home />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}