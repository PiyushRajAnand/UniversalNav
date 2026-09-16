import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const passwordIsValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.special;

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

    return "Unable to create your account. Please check your details and try again.";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = formData.name.trim();
    const email = formData.email.trim();

    // -----------------------------
    // FRONTEND VALIDATION
    // -----------------------------

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    if (name.length < 2) {
      setError("Your name must contain at least 2 characters.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.password) {
      setError("Please create a password.");
      return;
    }

    if (!passwordIsValid) {
      setError(
        "Please create a stronger password using all the requirements shown below."
      );
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email,
        password: formData.password,
      });

      navigate("/", {
        replace: true,
      });
    } catch (err) {
      console.error("Registration error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">

      <div className="register-background-glow register-glow-one" />
      <div className="register-background-glow register-glow-two" />

      <div className="container-fluid px-3 px-md-4 px-lg-5">

        <div className="register-shell">

          {/* =====================================================
              LEFT HERO
              ===================================================== */}

          <section className="register-hero">

            {/* BRAND */}

            <div className="register-brand">

              <div className="register-brand-icon">
                🧭
              </div>

              <span>
                Universal<span>Nav</span>
              </span>

            </div>


            <div className="register-hero-content">

              <div className="register-eyebrow">
                <span>✦</span>
                BUILD YOUR INDOOR WORLD
              </div>

              <h1>
                Create Maps.
                <br />
                <span>Connect Spaces.</span>
              </h1>

              <p className="register-hero-description">
                Build structured indoor maps,
                connect pathways and create
                smarter navigation experiences
                for everyone.
              </p>


              {/* FEATURES */}

              <div className="register-features">

                <div className="register-feature">

                  <div className="register-feature-icon blue">
                    🗺️
                  </div>

                  <div>
                    <strong>
                      Interactive Maps
                    </strong>

                    <span>
                      Design rooms and indoor spaces
                    </span>
                  </div>

                </div>


                <div className="register-feature">

                  <div className="register-feature-icon green">
                    🔗
                  </div>

                  <div>
                    <strong>
                      Connected Pathways
                    </strong>

                    <span>
                      Build your navigation network
                    </span>
                  </div>

                </div>


                <div className="register-feature">

                  <div className="register-feature-icon purple">
                    🏢
                  </div>

                  <div>
                    <strong>
                      Multi-Floor Navigation
                    </strong>

                    <span>
                      Connect floors with stairs and lifts
                    </span>
                  </div>

                </div>


                <div className="register-feature">

                  <div className="register-feature-icon orange">
                    📱
                  </div>

                  <div>
                    <strong>
                      Public QR Navigation
                    </strong>

                    <span>
                      Let visitors navigate without accounts
                    </span>
                  </div>

                </div>

              </div>


              {/* MAP */}

              <div className="register-map-visual">

                <img
                  src="/hero-bg.png"
                  alt="UniversalNav indoor navigation map"
                />

                <div className="register-map-overlay" />

                <div className="register-map-label register-map-label-one">
                  <span>📚</span>
                  Library
                </div>

                <div className="register-map-label register-map-label-two">
                  <span>🛗</span>
                  Elevator
                </div>

                <div className="register-map-label register-map-label-three">
                  <span>🍴</span>
                  Cafeteria
                </div>

                <div className="register-map-location">

                  <div className="register-map-pulse" />

                  <span>●</span>

                  Start here

                </div>

              </div>

            </div>


            {/* BOTTOM MESSAGE */}

            <div className="register-quote">

              <div className="register-quote-icon">
                ✦
              </div>

              <div>

                <p>
                  One platform for creating,
                  connecting and navigating
                  indoor spaces.
                </p>

                <span>
                  Students • Visitors • Staff • Institutions
                </span>

              </div>

            </div>

          </section>


          {/* =====================================================
              REGISTER CARD
              ===================================================== */}

          <section className="register-card-wrapper">

            <div className="register-card">

              {/* TOP LOGIN */}

              <div className="register-login-top">

                <span>
                  Already have an account?
                </span>

                <Link to="/login">
                  Login
                </Link>

              </div>


              {/* HEADER */}

              <div className="register-card-header">

                <div className="register-card-logo">
                  🧭
                </div>

                <h2>
                  Create Your Account
                </h2>

                <p>
                  Start building your indoor maps with UniversalNav
                </p>

              </div>


              {/* ERROR */}

              {error && (
                <div
                  className="register-error"
                  role="alert"
                >
                  <span>!</span>

                  <div>
                    {error}
                  </div>
                </div>
              )}


              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                noValidate
              >

                {/* NAME */}

                <div className="register-field">

                  <label htmlFor="register-name">
                    Full Name
                  </label>

                  <div className="register-input-wrapper">

                    <span className="register-input-icon">
                      👤
                    </span>

                    <input
                      id="register-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      disabled={loading}
                    />

                  </div>

                </div>


                {/* EMAIL */}

                <div className="register-field">

                  <label htmlFor="register-email">
                    Email address
                  </label>

                  <div className="register-input-wrapper">

                    <span className="register-input-icon">
                      ✉
                    </span>

                    <input
                      id="register-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      disabled={loading}
                    />

                  </div>

                </div>


                {/* PASSWORD */}

                <div className="register-field">

                  <label htmlFor="register-password">
                    Password
                  </label>

                  <div className="register-input-wrapper">

                    <span className="register-input-icon">
                      🔒
                    </span>

                    <input
                      id="register-password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      disabled={loading}
                    />

                    <button
                      type="button"
                      className="register-password-toggle"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      disabled={loading}
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                </div>


                {/* PASSWORD REQUIREMENTS */}

                <div className="register-password-box">

                  <div className="register-password-title">
                    Password must contain:
                  </div>

                  <div className="register-password-grid">

                    <PasswordRequirement
                      valid={passwordChecks.length}
                      text="At least 8 characters"
                    />

                    <PasswordRequirement
                      valid={passwordChecks.uppercase}
                      text="One uppercase letter"
                    />

                    <PasswordRequirement
                      valid={passwordChecks.lowercase}
                      text="One lowercase letter"
                    />

                    <PasswordRequirement
                      valid={passwordChecks.number}
                      text="One number"
                    />

                    <PasswordRequirement
                      valid={passwordChecks.special}
                      text="One special character"
                    />

                  </div>

                </div>


                {/* CREATE ACCOUNT */}

                <button
                  type="submit"
                  className="register-submit"
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="register-spinner" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <span>→</span>
                    </>
                  )}

                </button>

              </form>


              {/* LOGIN CTA */}

              <div className="register-login-box">

                <strong>
                  Already using UniversalNav?
                </strong>

                <p>
                  Sign in to continue managing
                  your indoor maps.
                </p>

                <Link to="/login">
                  Sign In To Your Account
                  <span>→</span>
                </Link>

              </div>


              {/* TRUST */}

              <div className="register-trust">

                <div>
                  <span>🛡️</span>
                  Secure Account
                </div>

                <div>
                  <span>🗺️</span>
                  Build Maps
                </div>

                <div>
                  <span>🧭</span>
                  Navigate Smarter
                </div>

              </div>

            </div>

          </section>

        </div>

      </div>


      {/* =========================================================
          STYLES
          ========================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .register-page {
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

        .register-background-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(60px);
        }

        .register-glow-one {
          width: 320px;
          height: 320px;
          background: rgba(37, 128, 255, .10);
          top: -130px;
          left: -100px;
        }

        .register-glow-two {
          width: 300px;
          height: 300px;
          background: rgba(0, 210, 255, .08);
          bottom: -140px;
          right: -80px;
        }

        .register-shell {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1380px;
          min-height: calc(100vh - 130px);
          margin: 0 auto;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(420px, 560px);
          align-items: center;
          gap: 55px;
        }

        /* =====================================================
           BRAND
           ===================================================== */

        .register-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 45px;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -1px;
          color: #10264a;
        }

        .register-brand span span {
          color: #0879ed;
        }

        .register-brand-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            linear-gradient(
              135deg,
              #0d8cff,
              #1769e8
            );
          color: white;
          font-size: 25px;
          box-shadow:
            0 12px 28px rgba(13, 140, 255, .22);
        }

        /* =====================================================
           HERO
           ===================================================== */

        .register-hero {
          min-width: 0;
          padding: 10px 0 10px 25px;
        }

        .register-eyebrow {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,.72);
          border: 1px solid rgba(45,137,230,.16);
          color: #24466e;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .3px;
          box-shadow:
            0 8px 25px rgba(25,91,160,.06);
          margin-bottom: 25px;
        }

        .register-eyebrow span {
          color: #087ff2;
        }

        .register-hero h1 {
          margin: 0;
          color: #10264a;
          font-size: clamp(42px, 4.5vw, 68px);
          line-height: 1.02;
          letter-spacing: -3px;
          font-weight: 850;
        }

        .register-hero h1 span {
          background:
            linear-gradient(
              90deg,
              #087ff2,
              #1769e8
            );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .register-hero-description {
          max-width: 580px;
          margin: 22px 0 27px;
          color: #5c708d;
          font-size: 18px;
          line-height: 1.65;
        }

        /* =====================================================
           FEATURES
           ===================================================== */

        .register-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px 28px;
          max-width: 680px;
          margin-bottom: 25px;
        }

        .register-feature {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .register-feature-icon {
          width: 43px;
          height: 43px;
          min-width: 43px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          box-shadow:
            0 8px 18px rgba(0,0,0,.08);
        }

        .register-feature-icon.blue {
          background:
            linear-gradient(
              135deg,
              #1494ff,
              #1672ed
            );
        }

        .register-feature-icon.green {
          background:
            linear-gradient(
              135deg,
              #17c985,
              #11a96f
            );
        }

        .register-feature-icon.purple {
          background:
            linear-gradient(
              135deg,
              #8a62f5,
              #6541d9
            );
        }

        .register-feature-icon.orange {
          background:
            linear-gradient(
              135deg,
              #f6ad3d,
              #ed7e22
            );
        }

        .register-feature strong {
          display: block;
          color: #19365e;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .register-feature span {
          display: block;
          color: #71839b;
          font-size: 12px;
        }

        /* =====================================================
           MAP VISUAL
           ===================================================== */

        .register-map-visual {
          position: relative;
          width: 100%;
          max-width: 700px;
          height: 245px;
          border-radius: 26px;
          overflow: hidden;
          border: 1px solid rgba(57,139,220,.14);
          box-shadow:
            0 22px 55px rgba(28,90,150,.13);
          background: #e5f2fc;
        }

        .register-map-visual img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: .82;
        }

        .register-map-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(238,249,255,.72),
              rgba(238,249,255,.10)
            );
        }

        .register-map-label {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 13px;
          border-radius: 12px;
          background: rgba(255,255,255,.93);
          color: #19365e;
          font-size: 12px;
          font-weight: 700;
          box-shadow:
            0 8px 22px rgba(25,71,115,.13);
        }

        .register-map-label-one {
          top: 23%;
          right: 28%;
        }

        .register-map-label-two {
          top: 58%;
          left: 37%;
        }

        .register-map-label-three {
          bottom: 12%;
          right: 12%;
        }

        .register-map-location {
          position: absolute;
          bottom: 23px;
          left: 24px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 13px;
          border-radius: 999px;
          background: white;
          color: #087ff2;
          font-size: 12px;
          font-weight: 800;
          box-shadow:
            0 8px 25px rgba(22,105,232,.14);
        }

        .register-map-location > span {
          font-size: 17px;
        }

        .register-map-pulse {
          position: absolute;
          width: 32px;
          height: 32px;
          left: -7px;
          border-radius: 50%;
          border: 2px solid rgba(8,127,242,.28);
          animation:
            registerPulse 2s infinite;
        }

        @keyframes registerPulse {
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

        /* =====================================================
           QUOTE
           ===================================================== */

        .register-quote {
          max-width: 570px;
          display: flex;
          gap: 13px;
          align-items: flex-start;
          margin-top: 20px;
          padding: 17px 20px;
          border-radius: 17px;
          background: rgba(255,255,255,.65);
          border: 1px solid rgba(50,126,207,.11);
        }

        .register-quote-icon {
          width: 28px;
          height: 28px;
          min-width: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e8f4ff;
          color: #087ff2;
        }

        .register-quote p {
          margin: 0 0 5px;
          color: #365271;
          font-size: 13px;
          line-height: 1.5;
        }

        .register-quote span {
          color: #8191a6;
          font-size: 11px;
        }

        /* =====================================================
           CARD
           ===================================================== */

        .register-card-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .register-card {
          width: 100%;
          max-width: 540px;
          padding: 34px 42px 28px;
          border-radius: 28px;
          background: rgba(255,255,255,.94);
          border: 1px solid rgba(37,112,187,.12);
          box-shadow:
            0 30px 80px rgba(33,82,132,.15),
            0 8px 30px rgba(33,82,132,.06);
          backdrop-filter: blur(18px);
        }

        .register-login-top {
          display: flex;
          justify-content: flex-end;
          gap: 5px;
          color: #71829a;
          font-size: 13px;
          margin-bottom: 20px;
        }

        .register-login-top a {
          color: #087ff2;
          font-weight: 700;
          text-decoration: none;
        }

        .register-login-top a:hover {
          text-decoration: underline;
        }

        .register-card-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .register-card-logo {
          width: 68px;
          height: 68px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 19px;
          background:
            linear-gradient(
              135deg,
              #0d8cff,
              #1769e8
            );
          color: white;
          font-size: 33px;
          box-shadow:
            0 15px 32px rgba(13,140,255,.22);
        }

        .register-card-header h2 {
          color: #10264a;
          font-size: 31px;
          font-weight: 850;
          letter-spacing: -1.3px;
          margin-bottom: 6px;
        }

        .register-card-header p {
          color: #71829a;
          font-size: 13px;
          margin: 0;
          line-height: 1.5;
        }

        /* =====================================================
           ERROR
           ===================================================== */

        .register-error {
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

        .register-error > span {
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

        /* =====================================================
           INPUTS
           ===================================================== */

        .register-field {
          margin-bottom: 16px;
        }

        .register-field label {
          display: block;
          color: #19365e;
          font-size: 13px;
          font-weight: 750;
          margin-bottom: 7px;
        }

        .register-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          height: 54px;
          border: 1px solid #d7e3ef;
          border-radius: 13px;
          background: #f8fbfe;
          transition:
            border-color .2s ease,
            box-shadow .2s ease,
            background .2s ease;
        }

        .register-input-wrapper:focus-within {
          background: white;
          border-color: #1688f5;
          box-shadow:
            0 0 0 4px rgba(22,136,245,.09);
        }

        .register-input-icon {
          width: 47px;
          text-align: center;
          color: #7188a1;
          font-size: 16px;
          flex-shrink: 0;
        }

        .register-input-wrapper input {
          min-width: 0;
          flex: 1;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #18365d;
          font-size: 13px;
          padding: 0 10px 0 0;
        }

        .register-input-wrapper input::placeholder {
          color: #9aabbd;
        }

        .register-password-toggle {
          border: 0;
          background: transparent;
          color: #5e7794;
          font-size: 11px;
          font-weight: 700;
          padding: 0 14px;
          cursor: pointer;
        }

        .register-password-toggle:hover {
          color: #087ff2;
        }

        /* =====================================================
           PASSWORD REQUIREMENTS
           ===================================================== */

        .register-password-box {
          margin: -2px 0 19px;
          padding: 13px 14px;
          border-radius: 13px;
          background: #f4f8fc;
          border: 1px solid #e3edf5;
        }

        .register-password-title {
          color: #536b87;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 9px;
        }

        .register-password-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 12px;
        }

        .password-requirement {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #7a8da4;
          font-size: 10px;
        }

        .password-requirement.valid {
          color: #15976b;
        }

        .password-check {
          width: 17px;
          height: 17px;
          min-width: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e8eef4;
          font-size: 9px;
          font-weight: 900;
        }

        .password-requirement.valid .password-check {
          background: #d9f7eb;
          color: #15976b;
        }

        /* =====================================================
           SUBMIT
           ===================================================== */

        .register-submit {
          width: 100%;
          min-height: 55px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          border: 0;
          border-radius: 13px;
          color: white;
          background:
            linear-gradient(
              90deg,
              #0797f5,
              #126eea
            );
          font-size: 15px;
          font-weight: 800;
          box-shadow:
            0 13px 25px rgba(18,110,234,.22);
          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .register-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 17px 32px rgba(18,110,234,.28);
        }

        .register-submit:disabled {
          opacity: .7;
          cursor: not-allowed;
        }

        .register-submit > span {
          font-size: 21px;
        }

        .register-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: white;
          border-radius: 50%;
          animation:
            registerSpin .7s linear infinite;
        }

        @keyframes registerSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =====================================================
           LOGIN CTA
           ===================================================== */

        .register-login-box {
          margin-top: 19px;
          padding: 16px;
          text-align: center;
          border-radius: 16px;
          background: #f1f7fc;
          border: 1px solid #e0ebf4;
        }

        .register-login-box strong {
          display: block;
          color: #19365e;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .register-login-box p {
          color: #71829a;
          font-size: 11px;
          margin: 0 0 8px;
        }

        .register-login-box a {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #087ff2;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .register-login-box a:hover {
          text-decoration: underline;
        }

        .register-login-box a span {
          font-size: 16px;
        }

        /* =====================================================
           TRUST
           ===================================================== */

        .register-trust {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 20px;
          padding-top: 17px;
          border-top: 1px solid #e6edf4;
        }

        .register-trust div {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #72849a;
          font-size: 9px;
          white-space: nowrap;
        }

        .register-trust span {
          color: #087ff2;
          font-size: 14px;
        }

        /* =====================================================
           TABLET
           ===================================================== */

        @media (max-width: 1100px) {

          .register-shell {
            grid-template-columns:
              minmax(0, 1fr)
              minmax(390px, 500px);
            gap: 30px;
          }

          .register-hero {
            padding-left: 5px;
          }

          .register-hero h1 {
            font-size: clamp(40px, 5vw, 56px);
          }

          .register-features {
            gap: 12px;
          }

          .register-map-visual {
            height: 215px;
          }

          .register-card {
            padding: 30px 32px 25px;
          }
        }

        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 767px) {

          .register-page {
            min-height: calc(100vh - 60px);
            padding: 20px 0 30px;
          }

          .register-shell {
            min-height: auto;
            display: flex;
            flex-direction: column;
            gap: 22px;
            align-items: stretch;
          }

          .register-hero {
            padding: 0;
          }

          .register-brand {
            margin-bottom: 24px;
            font-size: 22px;
          }

          .register-brand-icon {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            font-size: 21px;
          }

          .register-eyebrow {
            font-size: 10px;
            padding: 8px 12px;
            margin-bottom: 17px;
          }

          .register-hero h1 {
            font-size: clamp(35px, 10vw, 46px);
            letter-spacing: -2px;
          }

          .register-hero-description {
            font-size: 14px;
            line-height: 1.55;
            margin: 15px 0 20px;
          }

          .register-features {
            grid-template-columns: 1fr 1fr;
            gap: 12px 10px;
            margin-bottom: 18px;
          }

          .register-feature {
            gap: 8px;
          }

          .register-feature-icon {
            width: 36px;
            height: 36px;
            min-width: 36px;
            border-radius: 10px;
            font-size: 16px;
          }

          .register-feature strong {
            font-size: 10px;
          }

          .register-feature span {
            font-size: 8px;
            line-height: 1.3;
          }

          .register-map-visual {
            height: 145px;
            border-radius: 18px;
          }

          .register-map-label {
            padding: 6px 8px;
            font-size: 8px;
          }

          .register-map-location {
            bottom: 10px;
            left: 10px;
            padding: 6px 9px;
            font-size: 8px;
          }

          .register-map-location > span {
            font-size: 12px;
          }

          .register-quote {
            display: none;
          }

          .register-card-wrapper {
            width: 100%;
          }

          .register-card {
            max-width: none;
            padding: 21px 18px 19px;
            border-radius: 22px;
          }

          .register-login-top {
            font-size: 11px;
            margin-bottom: 18px;
          }

          .register-card-logo {
            width: 58px;
            height: 58px;
            border-radius: 16px;
            font-size: 28px;
            margin-bottom: 12px;
          }

          .register-card-header {
            margin-bottom: 20px;
          }

          .register-card-header h2 {
            font-size: 27px;
            letter-spacing: -1px;
          }

          .register-card-header p {
            font-size: 11px;
          }

          .register-field {
            margin-bottom: 14px;
          }

          .register-field label {
            font-size: 12px;
            margin-bottom: 6px;
          }

          .register-input-wrapper {
            height: 50px;
            border-radius: 11px;
          }

          .register-input-wrapper input {
            font-size: 12px;
          }

          .register-input-icon {
            width: 41px;
            font-size: 14px;
          }

          .register-password-box {
            padding: 11px;
            margin-bottom: 16px;
          }

          .register-password-grid {
            gap: 5px 8px;
          }

          .password-requirement {
            font-size: 9px;
          }

          .password-check {
            width: 15px;
            height: 15px;
            min-width: 15px;
            font-size: 8px;
          }

          .register-submit {
            min-height: 52px;
            font-size: 14px;
          }

          .register-login-box {
            margin-top: 16px;
            padding: 14px;
          }

          .register-trust {
            margin-top: 16px;
            padding-top: 14px;
          }

          .register-trust div {
            font-size: 7px;
          }

          .register-trust span {
            font-size: 12px;
          }
        }

        /* =====================================================
           SMALL PHONES
           ===================================================== */

        @media (max-width: 390px) {

          .register-page {
            padding-top: 15px;
          }

          .register-hero h1 {
            font-size: 34px;
          }

          .register-hero-description {
            font-size: 13px;
          }

          .register-features {
            gap: 9px 7px;
          }

          .register-feature-icon {
            width: 32px;
            height: 32px;
            min-width: 32px;
            font-size: 14px;
          }

          .register-feature strong {
            font-size: 9px;
          }

          .register-feature span {
            font-size: 7px;
          }

          .register-map-visual {
            height: 125px;
          }

          .register-card {
            padding-left: 15px;
            padding-right: 15px;
          }

          .register-password-grid {
            grid-template-columns: 1fr;
          }

          .register-trust div {
            font-size: 6.5px;
          }
        }

      `}</style>
    </main>
  );
};


/* =============================================================
   PASSWORD REQUIREMENT COMPONENT
   ============================================================= */

function PasswordRequirement({ valid, text }) {
  return (
    <div
      className={`password-requirement ${
        valid ? "valid" : ""
      }`}
    >
      <span className="password-check">
        {valid ? "✓" : "○"}
      </span>

      <span>
        {text}
      </span>
    </div>
  );
}

export default Signup;