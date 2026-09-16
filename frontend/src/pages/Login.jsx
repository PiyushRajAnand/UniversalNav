import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const getErrorMessage = (err) => {
    const data = err?.response?.data;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors
        .map(
          (item) =>
            item.message ||
            item.msg ||
            item.error
        )
        .filter(Boolean)
        .join(" ");
    }

    if (data?.error) {
      return data.error;
    }

    if (data?.message) {
      return data.message;
    }

    if (!err?.response) {
      return "Unable to connect to the server. Please make sure UniversalNav is running.";
    }

    return "Login failed. Please check your email and password.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();

    // -----------------------------
    // FRONTEND VALIDATION
    // -----------------------------

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await login({
        email: trimmedEmail,
        password,
      });

      navigate("/", {
        replace: true,
      });
    } catch (err) {
      console.error("Login submit error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);

    if (error) {
      setError("");
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);

    if (error) {
      setError("");
    }
  };

  return (
    <main className="login-page">
      <div className="login-background-glow login-glow-one" />
      <div className="login-background-glow login-glow-two" />

      <div className="container-fluid px-3 px-md-4 px-lg-5">
        <div className="login-shell">

          {/* =====================================================
              LEFT NAVIGATION HERO
              ===================================================== */}

          <section className="login-hero">

            <div className="login-brand">
              <div className="login-brand-icon">
                🧭
              </div>

              <span>
                Universal<span>Nav</span>
              </span>
            </div>

            <div className="login-hero-content">

              <div className="login-eyebrow">
                <span>➤</span>
                INDOOR NAVIGATION MADE SIMPLE
              </div>

              <h1>
                Find Your Way
                <br />
                <span>Anywhere Indoors</span>
              </h1>

              <p className="login-hero-description">
                Smart indoor navigation for buildings,
                campuses and complex spaces.
              </p>

              {/* FEATURES */}

              <div className="login-features">

                <div className="login-feature">
                  <div className="login-feature-icon blue">
                    🗺️
                  </div>

                  <div>
                    <strong>
                      Interactive Maps
                    </strong>

                    <span>
                      Explore buildings with ease
                    </span>
                  </div>
                </div>

                <div className="login-feature">
                  <div className="login-feature-icon green">
                    🧭
                  </div>

                  <div>
                    <strong>
                      Turn-by-Turn Navigation
                    </strong>

                    <span>
                      Find any room or facility
                    </span>
                  </div>
                </div>

                <div className="login-feature">
                  <div className="login-feature-icon purple">
                    ♿
                  </div>

                  <div>
                    <strong>
                      Accessible for Everyone
                    </strong>

                    <span>
                      Simple, fast and reliable
                    </span>
                  </div>
                </div>

                <div className="login-feature">
                  <div className="login-feature-icon orange">
                    🛡️
                  </div>

                  <div>
                    <strong>
                      Safer & Smarter Spaces
                    </strong>

                    <span>
                      Support emergency and accessible routes
                    </span>
                  </div>
                </div>

              </div>

              {/* MAP VISUAL */}

              <div className="login-map-visual">

                <img
                  src="/hero-bg.png"
                  alt="UniversalNav indoor navigation map"
                />

                <div className="map-overlay" />

                <div className="map-label map-label-one">
                  <span>📚</span>
                  Library
                </div>

                <div className="map-label map-label-two">
                  <span>🛗</span>
                  Elevator
                </div>

                <div className="map-label map-label-three">
                  <span>🍴</span>
                  Cafeteria
                </div>

                <div className="map-you-are-here">
                  <div className="map-pulse" />
                  <span>●</span>
                  You are here
                </div>

                <div className="map-route-line" />

              </div>

            </div>

            {/* TESTIMONIAL / TRUST */}

            <div className="login-quote">
              <div className="quote-mark">
                “
              </div>

              <div>
                <p>
                  UniversalNav makes it easier
                  to navigate complex buildings.
                </p>

                <span>
                  Students&nbsp; • &nbsp;Visitors&nbsp;
                  • &nbsp;Staff&nbsp; • &nbsp;Everyone
                </span>
              </div>
            </div>

          </section>


          {/* =====================================================
              RIGHT LOGIN CARD
              ===================================================== */}

          <section className="login-card-wrapper">

            <div className="login-card">

              {/* TOP REGISTER LINK */}

              <div className="login-register-top">
                <span>
                  Don't have an account?
                </span>

                <Link to="/signup">
                  Register
                </Link>
              </div>

              {/* LOGIN HEADER */}

              <div className="login-card-header">

                <div className="login-card-logo">
                  🧭
                </div>

                <h2>
                  Welcome Back
                </h2>

                <p>
                  Sign in to your UniversalNav account
                </p>

              </div>

              {/* ERROR */}

              {error && (
                <div
                  className="login-error"
                  role="alert"
                >
                  <span>!</span>
                  <div>{error}</div>
                </div>
              )}

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                noValidate
              >

                {/* EMAIL */}

                <div className="login-field">

                  <label
                    htmlFor="login-email"
                  >
                    Email address
                  </label>

                  <div className="login-input-wrapper">

                    <span className="login-input-icon">
                      ✉
                    </span>

                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      disabled={loading}
                    />

                  </div>

                </div>


                {/* PASSWORD */}

                <div className="login-field">

                  <label
                    htmlFor="login-password"
                  >
                    Password
                  </label>

                  <div className="login-input-wrapper">

                    <span className="login-input-icon">
                      🔒
                    </span>

                    <input
                      id="login-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                    />

                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                </div>


                {/* OPTIONS */}

                <div className="login-options">

                  <label className="remember-option">

                    <input
                      type="checkbox"
                    />

                    <span>
                      Remember me
                    </span>

                  </label>

                  <button
                    type="button"
                    className="forgot-button"
                    onClick={() =>
                      setError(
                        "Password recovery is not available yet. Please contact the administrator or use your registered password."
                      )
                    }
                  >
                    Forgot password?
                  </button>

                </div>


                {/* SIGN IN */}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="login-spinner" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <span>→</span>
                    </>
                  )}

                </button>

              </form>


              {/* ACCOUNT CTA */}

              <div className="login-create-box">

                <strong>
                  New to UniversalNav?
                </strong>

                <p>
                  Create an account and start
                  building your maps.
                </p>

                <Link to="/signup">
                  Create Your Account
                  <span>→</span>
                </Link>

              </div>


              {/* TRUST FOOTER */}

              <div className="login-trust">

                <div>
                  <span>🛡️</span>
                  Secure Login
                </div>

                <div>
                  <span>♡</span>
                  Built for Real Spaces
                </div>

                <div>
                  <span>♧</span>
                  Smarter Navigation
                </div>

              </div>

            </div>

          </section>

        </div>
      </div>


      {/* =========================================================
          PAGE STYLES
          ========================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .login-page {
          min-height: calc(100vh - 65px);
          position: relative;
          overflow: hidden;
          background:
            linear-gradient(
              135deg,
              #f5fbff 0%,
              #edf7ff 45%,
              #f8fbff 100%
            );
          color: #10264a;
          padding: 32px 0;
        }

        .login-background-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(60px);
        }

        .login-glow-one {
          width: 320px;
          height: 320px;
          background: rgba(37, 128, 255, 0.10);
          top: -130px;
          left: -100px;
        }

        .login-glow-two {
          width: 300px;
          height: 300px;
          background: rgba(0, 210, 255, 0.08);
          bottom: -140px;
          right: -80px;
        }

        .login-shell {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1380px;
          min-height: calc(100vh - 130px);
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(420px, 560px);
          align-items: center;
          gap: 55px;
        }

        /* BRAND */

        .login-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 45px;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -1px;
          color: #10264a;
        }

        .login-brand span span {
          color: #0879ed;
        }

        .login-brand-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            135deg,
            #0d8cff,
            #1769e8
          );
          color: white;
          font-size: 25px;
          box-shadow:
            0 12px 28px rgba(13, 140, 255, 0.22);
        }

        /* HERO */

        .login-hero {
          min-width: 0;
          padding: 10px 0 10px 25px;
        }

        .login-hero-content {
          position: relative;
        }

        .login-eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(45, 137, 230, 0.16);
          color: #24466e;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .3px;
          box-shadow:
            0 8px 25px rgba(25, 91, 160, 0.06);
          margin-bottom: 25px;
        }

        .login-eyebrow span {
          color: #087ff2;
          font-size: 16px;
        }

        .login-hero h1 {
          margin: 0;
          color: #10264a;
          font-size: clamp(42px, 4.5vw, 70px);
          line-height: 1.02;
          letter-spacing: -3px;
          font-weight: 850;
        }

        .login-hero h1 span {
          background:
            linear-gradient(
              90deg,
              #087ff2,
              #1769e8
            );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-hero-description {
          max-width: 570px;
          margin: 22px 0 27px;
          color: #5c708d;
          font-size: 18px;
          line-height: 1.65;
        }

        /* FEATURES */

        .login-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px 28px;
          max-width: 670px;
          margin-bottom: 25px;
        }

        .login-feature {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .login-feature-icon {
          width: 43px;
          height: 43px;
          min-width: 43px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          box-shadow: 0 8px 18px rgba(0,0,0,.08);
        }

        .login-feature-icon.blue {
          background: linear-gradient(
            135deg,
            #1494ff,
            #1672ed
          );
        }

        .login-feature-icon.green {
          background: linear-gradient(
            135deg,
            #17c985,
            #11a96f
          );
        }

        .login-feature-icon.purple {
          background: linear-gradient(
            135deg,
            #8a62f5,
            #6541d9
          );
        }

        .login-feature-icon.orange {
          background: linear-gradient(
            135deg,
            #f6ad3d,
            #ed7e22
          );
        }

        .login-feature strong {
          display: block;
          color: #19365e;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .login-feature span {
          display: block;
          color: #71839b;
          font-size: 12px;
        }

        /* MAP */

        .login-map-visual {
          position: relative;
          width: 100%;
          max-width: 700px;
          height: 260px;
          border-radius: 26px;
          overflow: hidden;
          border: 1px solid rgba(57, 139, 220, .14);
          box-shadow:
            0 22px 55px rgba(28, 90, 150, .13);
          background: #e5f2fc;
        }

        .login-map-visual img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: .82;
        }

        .map-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(238,249,255,.72),
              rgba(238,249,255,.12)
            );
          pointer-events: none;
        }

        .map-label {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 13px;
          border-radius: 12px;
          background: rgba(255,255,255,.92);
          color: #19365e;
          font-size: 12px;
          font-weight: 700;
          box-shadow:
            0 8px 22px rgba(25, 71, 115, .13);
        }

        .map-label-one {
          top: 25%;
          right: 28%;
        }

        .map-label-two {
          top: 58%;
          left: 37%;
        }

        .map-label-three {
          bottom: 12%;
          right: 12%;
        }

        .map-you-are-here {
          position: absolute;
          bottom: 28px;
          left: 28px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 13px;
          border-radius: 999px;
          background: #fff;
          color: #087ff2;
          font-size: 12px;
          font-weight: 800;
          box-shadow:
            0 8px 25px rgba(22, 105, 232, .14);
        }

        .map-you-are-here > span {
          font-size: 18px;
          line-height: 1;
        }

        .map-pulse {
          position: absolute;
          width: 32px;
          height: 32px;
          left: -7px;
          border-radius: 50%;
          border: 2px solid rgba(8,127,242,.28);
          animation: mapPulse 2s infinite;
        }

        @keyframes mapPulse {
          0% {
            transform: scale(.7);
            opacity: .8;
          }
          70% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }

        /* QUOTE */

        .login-quote {
          max-width: 560px;
          display: flex;
          gap: 13px;
          align-items: flex-start;
          margin-top: 22px;
          padding: 17px 20px;
          border-radius: 17px;
          background: rgba(255,255,255,.65);
          border: 1px solid rgba(50, 126, 207, .11);
        }

        .quote-mark {
          color: #1688f5;
          font-size: 38px;
          line-height: .7;
          font-weight: 800;
        }

        .login-quote p {
          margin: 0 0 5px;
          color: #365271;
          font-size: 13px;
          line-height: 1.5;
        }

        .login-quote span {
          color: #8191a6;
          font-size: 11px;
        }

        /* LOGIN CARD */

        .login-card-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .login-card {
          position: relative;
          width: 100%;
          max-width: 540px;
          padding: 34px 42px 28px;
          border-radius: 28px;
          background: rgba(255,255,255,.92);
          border: 1px solid rgba(37, 112, 187, .12);
          box-shadow:
            0 30px 80px rgba(33, 82, 132, .15),
            0 8px 30px rgba(33, 82, 132, .06);
          backdrop-filter: blur(18px);
        }

        .login-register-top {
          display: flex;
          justify-content: flex-end;
          gap: 5px;
          color: #71829a;
          font-size: 13px;
          margin-bottom: 25px;
        }

        .login-register-top a {
          color: #087ff2;
          font-weight: 700;
          text-decoration: none;
        }

        .login-register-top a:hover {
          text-decoration: underline;
        }

        .login-card-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .login-card-logo {
          width: 72px;
          height: 72px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background:
            linear-gradient(
              135deg,
              #0d8cff,
              #1769e8
            );
          color: white;
          font-size: 36px;
          box-shadow:
            0 15px 32px rgba(13, 140, 255, .22);
        }

        .login-card-header h2 {
          color: #10264a;
          font-size: 35px;
          font-weight: 850;
          letter-spacing: -1.5px;
          margin-bottom: 6px;
        }

        .login-card-header p {
          color: #71829a;
          font-size: 14px;
          margin: 0;
        }

        /* ERROR */

        .login-error {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 12px 14px;
          margin-bottom: 18px;
          border-radius: 12px;
          color: #a33a3a;
          background: #fff2f2;
          border: 1px solid #ffd3d3;
          font-size: 13px;
        }

        .login-error > span {
          width: 20px;
          height: 20px;
          min-width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e75b5b;
          color: white;
          font-size: 12px;
          font-weight: 800;
        }

        /* INPUTS */

        .login-field {
          margin-bottom: 19px;
        }

        .login-field label {
          display: block;
          color: #19365e;
          font-size: 14px;
          font-weight: 750;
          margin-bottom: 8px;
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          height: 56px;
          border: 1px solid #d7e3ef;
          border-radius: 13px;
          background: #f8fbfe;
          transition:
            border-color .2s ease,
            box-shadow .2s ease,
            background .2s ease;
        }

        .login-input-wrapper:focus-within {
          background: #fff;
          border-color: #1688f5;
          box-shadow:
            0 0 0 4px rgba(22,136,245,.09);
        }

        .login-input-icon {
          width: 48px;
          text-align: center;
          color: #7188a1;
          font-size: 17px;
          flex-shrink: 0;
        }

        .login-input-wrapper input {
          min-width: 0;
          flex: 1;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #18365d;
          font-size: 14px;
          padding: 0 12px 0 0;
        }

        .login-input-wrapper input::placeholder {
          color: #9aabbd;
        }

        .login-input-wrapper input:disabled {
          opacity: .65;
        }

        .login-password-toggle {
          border: 0;
          background: transparent;
          color: #5e7794;
          font-size: 12px;
          font-weight: 700;
          padding: 0 15px;
          cursor: pointer;
        }

        .login-password-toggle:hover {
          color: #087ff2;
        }

        /* OPTIONS */

        .login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin: 2px 0 20px;
        }

        .remember-option {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #5d718b;
          font-size: 12px;
          cursor: pointer;
          user-select: none;
        }

        .remember-option input {
          width: 17px;
          height: 17px;
          accent-color: #087ff2;
        }

        .forgot-button {
          border: 0;
          background: transparent;
          color: #087ff2;
          font-size: 12px;
          font-weight: 700;
          padding: 0;
        }

        .forgot-button:hover {
          text-decoration: underline;
        }

        /* SUBMIT */

        .login-submit {
          width: 100%;
          min-height: 57px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: 0;
          border-radius: 13px;
          color: white;
          background:
            linear-gradient(
              90deg,
              #0797f5,
              #126eea
            );
          font-size: 16px;
          font-weight: 800;
          box-shadow:
            0 13px 25px rgba(18, 110, 234, .22);
          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .login-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 17px 32px rgba(18, 110, 234, .28);
        }

        .login-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit:disabled {
          opacity: .7;
          cursor: not-allowed;
        }

        .login-submit span {
          font-size: 22px;
        }

        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: white;
          border-radius: 50%;
          animation: loginSpin .7s linear infinite;
        }

        @keyframes loginSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* CREATE ACCOUNT */

        .login-create-box {
          margin-top: 22px;
          padding: 18px;
          text-align: center;
          border-radius: 16px;
          background: #f1f7fc;
          border: 1px solid #e0ebf4;
        }

        .login-create-box strong {
          display: block;
          color: #19365e;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .login-create-box p {
          color: #71829a;
          font-size: 12px;
          margin: 0 0 9px;
        }

        .login-create-box a {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #087ff2;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }

        .login-create-box a:hover {
          text-decoration: underline;
        }

        .login-create-box a span {
          font-size: 17px;
        }

        /* TRUST */

        .login-trust {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 23px;
          padding-top: 19px;
          border-top: 1px solid #e6edf4;
        }

        .login-trust div {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #72849a;
          font-size: 10px;
          white-space: nowrap;
        }

        .login-trust span {
          color: #087ff2;
          font-size: 15px;
        }

        /* =====================================================
           TABLET
           ===================================================== */

        @media (max-width: 1100px) {

          .login-shell {
            grid-template-columns: minmax(0, 1fr) minmax(390px, 500px);
            gap: 30px;
          }

          .login-hero {
            padding-left: 5px;
          }

          .login-hero h1 {
            font-size: clamp(40px, 5vw, 56px);
          }

          .login-features {
            gap: 12px;
          }

          .login-map-visual {
            height: 220px;
          }

          .login-card {
            padding: 30px 32px 25px;
          }
        }

        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 767px) {

          .login-page {
            min-height: calc(100vh - 60px);
            padding: 20px 0 30px;
          }

          .login-shell {
            min-height: auto;
            display: flex;
            flex-direction: column;
            gap: 22px;
            align-items: stretch;
          }

          .login-hero {
            padding: 0;
          }

          .login-brand {
            margin-bottom: 25px;
            font-size: 22px;
          }

          .login-brand-icon {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            font-size: 21px;
          }

          .login-eyebrow {
            font-size: 10px;
            padding: 8px 12px;
            margin-bottom: 17px;
          }

          .login-hero h1 {
            font-size: clamp(35px, 10vw, 46px);
            letter-spacing: -2px;
          }

          .login-hero-description {
            font-size: 14px;
            line-height: 1.55;
            margin: 15px 0 20px;
          }

          .login-features {
            grid-template-columns: 1fr 1fr;
            gap: 12px 10px;
            margin-bottom: 18px;
          }

          .login-feature {
            gap: 8px;
          }

          .login-feature-icon {
            width: 36px;
            height: 36px;
            min-width: 36px;
            border-radius: 10px;
            font-size: 16px;
          }

          .login-feature strong {
            font-size: 11px;
          }

          .login-feature span {
            font-size: 9px;
            line-height: 1.3;
          }

          .login-map-visual {
            height: 150px;
            border-radius: 18px;
          }

          .map-label {
            padding: 6px 8px;
            font-size: 9px;
          }

          .map-you-are-here {
            bottom: 12px;
            left: 12px;
            padding: 6px 9px;
            font-size: 9px;
          }

          .map-you-are-here > span {
            font-size: 13px;
          }

          .login-quote {
            display: none;
          }

          .login-card-wrapper {
            width: 100%;
          }

          .login-card {
            max-width: none;
            padding: 22px 18px 20px;
            border-radius: 22px;
          }

          .login-register-top {
            font-size: 11px;
            margin-bottom: 20px;
          }

          .login-card-logo {
            width: 58px;
            height: 58px;
            border-radius: 16px;
            font-size: 28px;
            margin-bottom: 13px;
          }

          .login-card-header {
            margin-bottom: 22px;
          }

          .login-card-header h2 {
            font-size: 28px;
            letter-spacing: -1px;
          }

          .login-card-header p {
            font-size: 12px;
          }

          .login-field {
            margin-bottom: 15px;
          }

          .login-field label {
            font-size: 12px;
            margin-bottom: 6px;
          }

          .login-input-wrapper {
            height: 51px;
            border-radius: 11px;
          }

          .login-input-wrapper input {
            font-size: 13px;
          }

          .login-input-icon {
            width: 42px;
            font-size: 15px;
          }

          .login-options {
            margin-bottom: 17px;
          }

          .login-submit {
            min-height: 53px;
            font-size: 15px;
          }

          .login-create-box {
            margin-top: 17px;
            padding: 15px;
          }

          .login-trust {
            margin-top: 17px;
            padding-top: 15px;
          }

          .login-trust div {
            font-size: 8px;
          }

          .login-trust span {
            font-size: 12px;
          }
        }

        /* SMALL PHONES */

        @media (max-width: 390px) {

          .login-page {
            padding-top: 15px;
          }

          .login-hero h1 {
            font-size: 34px;
          }

          .login-hero-description {
            font-size: 13px;
          }

          .login-features {
            gap: 10px 7px;
          }

          .login-feature-icon {
            width: 32px;
            height: 32px;
            min-width: 32px;
            font-size: 14px;
          }

          .login-feature strong {
            font-size: 10px;
          }

          .login-feature span {
            font-size: 8px;
          }

          .login-map-visual {
            height: 130px;
          }

          .login-card {
            padding-left: 15px;
            padding-right: 15px;
          }

          .login-options {
            align-items: flex-start;
          }

          .remember-option span,
          .forgot-button {
            font-size: 10px;
          }

          .login-trust div {
            font-size: 7px;
          }
        }

      `}</style>
    </main>
  );
};

export default Login;