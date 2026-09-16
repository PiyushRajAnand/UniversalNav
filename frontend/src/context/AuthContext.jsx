import React, {
  createContext,
  useState,
  useEffect,
} from "react";

import API from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // CHECK CURRENT EXPRESS SESSION
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        /*
          Authentication comes from the Express session.

          Axios:
            withCredentials: true
                    ↓
          Browser sends universalnav.sid
                    ↓
          Express session
                    ↓
          req.session.userId
                    ↓
          User.findById()
        */

        const response = await API.get("/auth/me");

        if (!mounted) return;

        if (
          response.data?.success &&
          response.data?.user
        ) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (!mounted) return;

        /*
          401 simply means there is no valid session.
          This is normal when the user is logged out.
        */

        if (err.response?.status !== 401) {
          console.error(
            "Authentication check failed:",
            err.response?.data || err.message
          );
        }

        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // REGISTER
  // ============================================================

  const register = async (userData) => {
    try {
      const response = await API.post(
        "/auth/register",
        userData
      );

      const data = response.data;

      if (
        data?.success &&
        data?.user
      ) {
        /*
          Backend creates the authenticated Express session.

          React state is only used for UI state.
          The session remains the real authentication source.
        */

        setUser(data.user);
      }

      return data;
    } catch (err) {
      console.error(
        "Registration error:",
        err.response?.data || err.message
      );

      throw err;
    }
  };

  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (userData) => {
    try {
      const response = await API.post(
        "/auth/login",
        userData
      );

      const data = response.data;

      if (
        data?.success &&
        data?.user
      ) {
        /*
          Backend has already created the authenticated
          Express session.

          React state is only used for UI state.
        */

        setUser(data.user);
      }

      return data;
    } catch (err) {
      console.error(
        "Login error:",
        err.response?.data || err.message
      );

      throw err;
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = async () => {
    try {
      /*
        Backend destroys the Express session and clears
        the universalnav.sid cookie.
      */

      await API.post("/auth/logout");
    } catch (err) {
      /*
        Even if the backend request fails, clear local
        authentication state so the UI doesn't remain
        stuck in a logged-in state.
      */

      console.error(
        "Logout error:",
        err.response?.data || err.message
      );
    } finally {
      setUser(null);
    }
  };

  // ============================================================
  // AUTH CONTEXT
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        register,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;