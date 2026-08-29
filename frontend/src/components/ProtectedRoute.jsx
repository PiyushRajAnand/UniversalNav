import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // ============================================================
  // WAIT FOR SESSION CHECK
  // ============================================================
  
  /*
    AuthContext first calls:

    GET /api/auth/me

    We must wait for that request to finish.

    Otherwise, ProtectedRoute could redirect to /login
    before the Express session is checked.
  */

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div
            className="spinner-border text-info"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <p className="mt-3 text-light">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }


  // ============================================================
  // NOT AUTHENTICATED
  // ============================================================

  /*
    IMPORTANT:

    Do NOT use localStorage here.

    Authentication is determined by the Express session
    returned through /api/auth/me.
  */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // ============================================================
  // AUTHENTICATED
  // ============================================================

  return children;
}