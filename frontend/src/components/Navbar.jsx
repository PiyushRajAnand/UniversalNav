import React, { useContext } from "react";
import {
  NavLink,
  Link,
  useNavigate,
} from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `universal-nav-link ${
      isActive ? "universal-nav-link-active" : ""
    }`;

  return (
    <>
      <nav className="navbar navbar-expand-lg universal-navbar">
        <div className="universal-navbar-inner">

          {/* =================================================
              BRAND
          ================================================== */}
          <Link
            to="/"
            className="universal-brand"
          >
            <span className="brand-icon">
              🌐
            </span>

            <span className="brand-text">
              Universal<span>Nav</span>
            </span>
          </Link>

          {/* =================================================
              MOBILE TOGGLE
          ================================================== */}
          <button
            className="universal-mobile-toggle"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#universalNavbar"
            aria-controls="universalNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span />
            <span />
            <span />
          </button>

          {/* =================================================
              NAVIGATION
          ================================================== */}
          <div
            className="collapse navbar-collapse"
            id="universalNavbar"
          >
            <div className="universal-nav-menu">

              <NavLink
                to="/"
                end
                className={navLinkClass}
              >
                <span className="nav-icon">
                  🏠
                </span>
                <span>Home</span>
              </NavLink>

              <NavLink
                to="/about"
                className={navLinkClass}
              >
                <span className="nav-icon">
                  ℹ️
                </span>
                <span>About</span>
              </NavLink>

              <NavLink
                to="/guide"
                className={navLinkClass}
              >
                <span className="nav-icon">
                  📖
                </span>
                <span>Guide</span>
              </NavLink>

              {user && (
                <NavLink
                  to="/dashboard"
                  className={navLinkClass}
                >
                  <span className="nav-icon">
                    🗺️
                  </span>
                  <span>My Maps</span>
                </NavLink>
              )}

            </div>

            {/* =================================================
                RIGHT SIDE
            ================================================== */}
            <div className="universal-nav-right">

              {user ? (
                <>
                  {/* USER */}
                  <div className="universal-user">

                    <div className="user-avatar">
                      {(
                        user.name ||
                        user.email ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="user-info">
                      <span className="user-greeting">
                        Hello,
                      </span>

                      <span className="user-name">
                        {user.name ||
                          user.email}
                      </span>
                    </div>
                  </div>

                  {/* LOGOUT */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="universal-logout"
                  >
                    <span>Logout</span>
                    <span className="logout-arrow">
                      →
                    </span>
                  </button>
                </>
              ) : (
                <>
                  {/* LOGIN */}
                  <Link
                    to="/login"
                    className="universal-login"
                  >
                    Login
                  </Link>

                  {/* SIGN UP */}
                  <Link
                    to="/signup"
                    className="universal-signup"
                  >
                    Get Started
                    <span>→</span>
                  </Link>
                </>
              )}

            </div>
          </div>
        </div>
      </nav>

      {/* =====================================================
          NAVBAR STYLES
      ====================================================== */}
      <style>
        {`
          /* ================================================
             NAVBAR
          ================================================= */

          .universal-navbar {
            position: sticky;
            top: 0;
            z-index: 1050;
            width: 100%;
            height: 74px;

            background: rgba(255, 255, 255, 0.94);

            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);

            border-bottom: 1px solid #e5edf5;

            box-shadow:
              0 5px 24px rgba(20, 62, 100, 0.06);
          }

          .universal-navbar-inner {
            width: 100%;
            max-width: 1500px;
            height: 74px;

            margin: 0 auto;
            padding: 0 32px;

            display: flex;
            align-items: center;
          }

          /* ================================================
             BRAND
          ================================================= */

          .universal-brand {
            display: inline-flex;
            align-items: center;
            gap: 11px;

            text-decoration: none;

            flex-shrink: 0;
          }

          .brand-icon {
            width: 42px;
            height: 42px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 12px;

            background:
              linear-gradient(
                135deg,
                #1684ed,
                #00a9e8
              );

            color: white;

            font-size: 21px;

            box-shadow:
              0 7px 18px
              rgba(22, 132, 237, 0.22);
          }

          .brand-text {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.8px;

            color: #10254a;
          }

          .brand-text span {
            color: #1684ed;
          }

          /* ================================================
             MAIN NAV
          ================================================= */

          .universal-nav-menu {
            display: flex;
            align-items: center;

            gap: 5px;

            margin-left: auto;
            margin-right: auto;

            padding: 5px;

            border-radius: 13px;
          }

          .universal-nav-link {
            position: relative;

            display: inline-flex;
            align-items: center;
            gap: 7px;

            padding: 10px 15px;

            border-radius: 10px;

            color: #536b86;

            text-decoration: none;

            font-size: 14px;
            font-weight: 650;

            transition:
              color 0.2s ease,
              background 0.2s ease,
              transform 0.2s ease;
          }

          .universal-nav-link:hover {
            color: #1677e8;

            background: #f1f7ff;

            transform: translateY(-1px);
          }

          .universal-nav-link-active {
            color: #126fd5 !important;

            background:
              linear-gradient(
                135deg,
                #edf6ff,
                #f4faff
              );

            box-shadow:
              inset 0 0 0 1px #d8ebfc;
          }

          .nav-icon {
            font-size: 14px;
            line-height: 1;
          }

          /* ================================================
             RIGHT SIDE
          ================================================= */

          .universal-nav-right {
            display: flex;
            align-items: center;

            gap: 10px;

            flex-shrink: 0;
          }

          /* ================================================
             USER
          ================================================= */

          .universal-user {
            display: flex;
            align-items: center;
            gap: 10px;

            padding: 5px 12px 5px 6px;

            border-radius: 13px;

            background: #f7faff;

            border: 1px solid #e4edf6;
          }

          .user-avatar {
            width: 36px;
            height: 36px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;

            background:
              linear-gradient(
                135deg,
                #2583ed,
                #54a6f7
              );

            color: white;

            font-size: 15px;
            font-weight: 750;

            box-shadow:
              0 5px 14px
              rgba(37, 131, 237, 0.2);
          }

          .user-info {
            display: flex;
            align-items: baseline;
            gap: 4px;

            white-space: nowrap;
          }

          .user-greeting {
            color: #71839a;
            font-size: 12px;
          }

          .user-name {
            color: #183557;
            font-size: 13px;
            font-weight: 700;

            max-width: 125px;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* ================================================
             LOGOUT
          ================================================= */

          .universal-logout {
            display: inline-flex;
            align-items: center;
            gap: 7px;

            padding: 9px 15px;

            border-radius: 10px;

            background: white;

            border: 1px solid #f0b5b5;

            color: #d44747;

            font-size: 13px;
            font-weight: 700;

            cursor: pointer;

            transition:
              all 0.2s ease;
          }

          .universal-logout:hover {
            color: white;

            background: #e05252;

            border-color: #e05252;

            box-shadow:
              0 7px 18px
              rgba(224, 82, 82, 0.18);

            transform: translateY(-1px);
          }

          .logout-arrow {
            font-size: 16px;
          }

          /* ================================================
             LOGIN
          ================================================= */

          .universal-login {
            display: inline-flex;
            align-items: center;
            justify-content: center;

            padding: 10px 17px;

            border-radius: 10px;

            color: #24415f;

            border: 1px solid #d9e5f0;

            background: white;

            text-decoration: none;

            font-size: 14px;
            font-weight: 700;

            transition:
              all 0.2s ease;
          }

          .universal-login:hover {
            color: #1677e8;

            border-color: #b9d9f7;

            background: #f5faff;

            transform: translateY(-1px);
          }

          /* ================================================
             SIGN UP
          ================================================= */

          .universal-signup {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;

            padding: 10px 17px;

            border-radius: 10px;

            color: white;

            background:
              linear-gradient(
                135deg,
                #1677e8,
                #009fe8
              );

            text-decoration: none;

            font-size: 14px;
            font-weight: 700;

            box-shadow:
              0 7px 18px
              rgba(22, 119, 232, 0.19);

            transition:
              all 0.2s ease;
          }

          .universal-signup:hover {
            color: white;

            transform: translateY(-2px);

            box-shadow:
              0 11px 24px
              rgba(22, 119, 232, 0.27);
          }

          .universal-signup span {
            font-size: 17px;
          }

          /* ================================================
             MOBILE TOGGLE
          ================================================= */

          .universal-mobile-toggle {
            display: none;

            width: 42px;
            height: 42px;

            margin-left: auto;

            align-items: center;
            justify-content: center;
            flex-direction: column;

            gap: 5px;

            border-radius: 10px;

            background: white;

            border: 1px solid #dce7f1;

            cursor: pointer;
          }

          .universal-mobile-toggle span {
            display: block;

            width: 19px;
            height: 2px;

            border-radius: 10px;

            background: #24415f;
          }

          /* ================================================
             TABLET
          ================================================= */

          @media (max-width: 1100px) {

            .universal-navbar-inner {
              padding: 0 20px;
            }

            .universal-nav-link {
              padding: 9px 11px;
            }

            .user-info {
              display: none;
            }

            .universal-user {
              padding: 5px;
            }

          }

          /* ================================================
             MOBILE
          ================================================= */

          @media (max-width: 991px) {

            .universal-navbar {
              height: auto;
              min-height: 70px;
            }

            .universal-navbar-inner {
              min-height: 70px;
              height: auto;

              flex-wrap: wrap;

              padding: 12px 18px;
            }

            .universal-mobile-toggle {
              display: flex;
            }

            .universal-navbar
              .navbar-collapse {
              width: 100%;
              flex-basis: 100%;
            }

            .universal-nav-menu {
              width: 100%;

              margin: 15px 0 0;

              padding: 10px;

              flex-direction: column;
              align-items: stretch;

              background: #f7faff;

              border:
                1px solid #e0ebf5;

              border-radius: 14px;
            }

            .universal-nav-link {
              width: 100%;

              justify-content: flex-start;

              padding: 12px 14px;
            }

            .universal-nav-right {
              width: 100%;

              margin-top: 10px;

              padding-top: 12px;

              border-top:
                1px solid #e4edf5;

              flex-direction: column;
              align-items: stretch;
            }

            .universal-user {
              width: 100%;
              justify-content: flex-start;
            }

            .user-info {
              display: flex;
            }

            .universal-logout,
            .universal-login,
            .universal-signup {
              width: 100%;
              justify-content: center;
            }

          }

          /* ================================================
             SMALL MOBILE
          ================================================= */

          @media (max-width: 480px) {

            .universal-navbar-inner {
              padding-left: 14px;
              padding-right: 14px;
            }

            .brand-icon {
              width: 38px;
              height: 38px;
              font-size: 19px;
            }

            .brand-text {
              font-size: 19px;
            }

            .universal-mobile-toggle {
              width: 38px;
              height: 38px;
            }

          }
        `}
      </style>
    </>
  );
}