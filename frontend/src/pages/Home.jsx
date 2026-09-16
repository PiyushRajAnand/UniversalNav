import React from "react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: "🗺️",
    title: "Interactive Maps",
    description:
      "Design floors, rooms, waypoints and connected navigation networks.",
    className: "feature-green",
  },
  {
    icon: "🧭",
    title: "Smart Routing",
    description:
      "Find connected indoor routes with turn-by-turn navigation.",
    className: "feature-blue",
  },
  {
    icon: "🏢",
    title: "Multi-Floor Support",
    description:
      "Connect different floors through stairs and elevators.",
    className: "feature-purple",
  },
  {
    icon: "♿",
    title: "Accessibility",
    description:
      "Support navigation preferences for different mobility needs.",
    className: "feature-yellow",
  },
  {
    icon: "🚨",
    title: "Safety & Emergency",
    description:
      "Handle blocked areas and calculate alternative emergency routes.",
    className: "feature-red",
  },
  {
    icon: "📱",
    title: "QR Navigation",
    description:
      "Let visitors start public navigation from convenient QR entry points.",
    className: "feature-cyan",
  },
];

const environments = [
  {
    icon: "🎓",
    title: "Campuses",
  },
  {
    icon: "🏢",
    title: "Office Buildings",
  },
  {
    icon: "🏥",
    title: "Hospitals",
  },
  {
    icon: "🛍️",
    title: "Shopping Spaces",
  },
  {
    icon: "🏛️",
    title: "Public Buildings",
  },
  {
    icon: "🏟️",
    title: "Large Venues",
  },
];

export default function Home() {
  return (
    <main className="universal-home">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="home-hero">
        <div className="hero-background" />

        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="container position-relative">
          <div className="row align-items-center g-5">
            {/* HERO CONTENT */}
            <div className="col-lg-6">
              <div className="hero-pill">
                <span>✦</span>
                Next-Gen Indoor Navigation
              </div>

              <h1 className="hero-title">
                Navigate{" "}
                <span>Any Space</span>
                <br />
                With Confidence
              </h1>

              <p className="hero-description">
                Create interactive indoor maps, connect
                multi-floor pathways, and provide seamless
                navigation for campuses, offices, hospitals
                and more.
              </p>

              <div className="hero-actions">
                <Link
                  to="/dashboard"
                  className="hero-primary-button"
                >
                  <span>🗺️</span>
                  Go to My Maps
                  <span className="arrow">→</span>
                </Link>
              </div>

              {/* QUICK HIGHLIGHTS */}
              <div className="hero-highlights">
                <div className="highlight">
                  <div className="highlight-icon">
                    📍
                  </div>
                  <div>
                    <strong>Interactive</strong>
                    <small>Indoor Maps</small>
                  </div>
                </div>

                <div className="highlight-divider" />

                <div className="highlight">
                  <div className="highlight-icon">
                    🧭
                  </div>
                  <div>
                    <strong>Smart</strong>
                    <small>Route Finding</small>
                  </div>
                </div>

                <div className="highlight-divider" />

                <div className="highlight">
                  <div className="highlight-icon">
                    🏢
                  </div>
                  <div>
                    <strong>Multi-Floor</strong>
                    <small>Navigation</small>
                  </div>
                </div>
              </div>
            </div>

            {/* HERO VISUAL */}
            <div className="col-lg-6">
              <div className="hero-visual">
                <div className="map-glow" />

                <img
                  src="/hero-bg.png"
                  alt="UniversalNav indoor navigation map"
                  className="hero-map-image"
                />

                {/* MAP LABELS */}
                <div className="map-floating-card card-floor">
                  <div className="floating-icon blue">
                    🏢
                  </div>
                  <div>
                    <strong>Multi-Floor</strong>
                    <small>Connected navigation</small>
                  </div>
                </div>

                <div className="map-floating-card card-route">
                  <div className="floating-icon cyan">
                    🧭
                  </div>
                  <div>
                    <strong>Smart Routes</strong>
                    <small>Connected pathways</small>
                  </div>
                </div>

                <div className="map-floating-card card-qr">
                  <div className="floating-icon green">
                    ▦
                  </div>
                  <div>
                    <strong>QR Navigation</strong>
                    <small>Quick public access</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ====================================================== */}
      <section className="features-section">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-eyebrow">
              EVERYTHING YOU NEED
            </span>

            <h2>
              Build smarter indoor navigation
            </h2>

            <p>
              From map creation to public navigation,
              UniversalNav brings the complete workflow
              together in one platform.
            </p>
          </div>

          <div className="row g-4">
            {features.map((feature) => (
              <div
                className="col-md-6 col-lg-4"
                key={feature.title}
              >
                <div
                  className={`feature-card ${feature.className}`}
                >
                  <div className="feature-icon">
                    {feature.icon}
                  </div>

                  <div>
                    <h3>{feature.title}</h3>

                    <p>
                      {feature.description}
                    </p>
                  </div>

                  <div className="feature-arrow">
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}
      <section className="workflow-section">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <span className="section-eyebrow">
                SIMPLE WORKFLOW
              </span>

              <h2>
                From building layout
                <br />
                to navigation.
              </h2>

              <p>
                UniversalNav turns a building layout into
                a connected navigation experience through
                a simple mapping workflow.
              </p>

              <Link
                to="/guide"
                className="workflow-link"
              >
                Learn how UniversalNav works
                <span>→</span>
              </Link>
            </div>

            <div className="col-lg-7">
              <div className="workflow-card">
                <div className="workflow-line" />

                <div className="workflow-step">
                  <div className="step-number">
                    01
                  </div>

                  <div>
                    <h4>Create</h4>
                    <p>
                      Create your building and floors.
                    </p>
                  </div>
                </div>

                <div className="workflow-step">
                  <div className="step-number">
                    02
                  </div>

                  <div>
                    <h4>Design</h4>
                    <p>
                      Add rooms, waypoints and map
                      elements.
                    </p>
                  </div>
                </div>

                <div className="workflow-step">
                  <div className="step-number">
                    03
                  </div>

                  <div>
                    <h4>Connect</h4>
                    <p>
                      Build the paths that form your
                      navigation network.
                    </p>
                  </div>
                </div>

                <div className="workflow-step">
                  <div className="step-number">
                    04
                  </div>

                  <div>
                    <h4>Navigate</h4>
                    <p>
                      Test routes and provide public
                      navigation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ENVIRONMENTS
      ====================================================== */}
      <section className="environment-section">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-eyebrow">
              DESIGNED FOR INDOOR SPACES
            </span>

            <h2>
              One platform, many possibilities.
            </h2>

            <p>
              UniversalNav can be adapted to different
              environments where finding your way indoors
              matters.
            </p>
          </div>

          <div className="environment-grid">
            {environments.map((environment) => (
              <div
                className="environment-card"
                key={environment.title}
              >
                <span>
                  {environment.icon}
                </span>

                <strong>
                  {environment.title}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta">
            <div>
              <span className="section-eyebrow">
                START BUILDING
              </span>

              <h2>
                Ready to create your
                indoor navigation map?
              </h2>

              <p>
                Build your first map and turn your
                building into a navigable space.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="hero-primary-button"
            >
              <span>🗺️</span>
              Go to My Maps
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          PAGE STYLES
      ====================================================== */}
      <style>{`
        .universal-home {
          min-height: 100vh;
          background: #f7faff;
          color: #10213f;
          overflow: hidden;
        }

        /* HERO */

        .home-hero {
          position: relative;
          min-height: calc(100vh - 65px);
          display: flex;
          align-items: center;
          padding: 70px 0 80px;
          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              #f5faff 48%,
              #eef7ff 100%
            );
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(255,255,255,0.97) 0%,
              rgba(255,255,255,0.9) 38%,
              rgba(239,248,255,0.3) 75%,
              rgba(239,248,255,0.05) 100%
            ),
            url("/hero-bg.png");
          background-size: cover;
          background-position: center right;
          opacity: 0.45;
        }

        .hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          pointer-events: none;
        }

        .hero-glow-one {
          width: 360px;
          height: 360px;
          background: rgba(37, 99, 235, 0.10);
          top: -160px;
          right: 12%;
        }

        .hero-glow-two {
          width: 300px;
          height: 300px;
          background: rgba(6, 182, 212, 0.08);
          bottom: -150px;
          left: 20%;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 17px;
          border-radius: 999px;
          background: rgba(219, 241, 255, 0.8);
          border: 1px solid #c5e4fb;
          color: #0876c9;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 24px;
        }

        .hero-pill span {
          font-size: 16px;
        }

        .hero-title {
          position: relative;
          font-size: clamp(3rem, 5vw, 5.2rem);
          line-height: 1.02;
          letter-spacing: -3px;
          font-weight: 800;
          color: #0b1d3b;
          margin-bottom: 26px;
        }

        .hero-title span {
          background:
            linear-gradient(
              90deg,
              #1677e8,
              #00a9e8
            );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          position: relative;
          max-width: 650px;
          color: #58708f;
          font-size: 18px;
          line-height: 1.7;
          margin-bottom: 32px;
        }

        .hero-actions {
          position: relative;
          margin-bottom: 42px;
        }

        .hero-primary-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 15px 24px;
          border-radius: 12px;
          border: none;
          color: white;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          background:
            linear-gradient(
              135deg,
              #1677e8,
              #009fe8
            );
          box-shadow:
            0 12px 28px rgba(22,119,232,0.22);
          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .hero-primary-button:hover {
          color: white;
          transform: translateY(-2px);
          box-shadow:
            0 16px 34px rgba(22,119,232,0.28);
        }

        .hero-primary-button .arrow {
          font-size: 20px;
          margin-left: 3px;
        }

        .hero-highlights {
          position: relative;
          display: flex;
          align-items: center;
          gap: 22px;
          max-width: 650px;
        }

        .highlight {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .highlight-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: white;
          border: 1px solid #dbe9f5;
          box-shadow: 0 5px 16px rgba(23,64,105,0.07);
        }

        .highlight strong,
        .highlight small {
          display: block;
        }

        .highlight strong {
          color: #18365b;
          font-size: 13px;
        }

        .highlight small {
          color: #7186a0;
          font-size: 11px;
          margin-top: 2px;
        }

        .highlight-divider {
          width: 1px;
          height: 35px;
          background: #d8e3ee;
        }

        /* HERO VISUAL */

        .hero-visual {
          position: relative;
          min-height: 560px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .map-glow {
          position: absolute;
          width: 80%;
          height: 70%;
          background:
            radial-gradient(
              ellipse,
              rgba(52,170,255,0.22),
              transparent 70%
            );
          filter: blur(25px);
        }

        .hero-map-image {
          position: relative;
          width: 100%;
          max-width: 700px;
          border-radius: 28px;
          object-fit: cover;
          filter:
            drop-shadow(
              0 28px 45px
              rgba(37,99,235,0.16)
            );
          mix-blend-mode: multiply;
        }

        .map-floating-card {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 15px;
          background: rgba(255,255,255,0.93);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(210,225,240,0.9);
          border-radius: 13px;
          box-shadow:
            0 14px 30px rgba(25,73,117,0.12);
        }

        .map-floating-card strong,
        .map-floating-card small {
          display: block;
        }

        .map-floating-card strong {
          color: #17375e;
          font-size: 13px;
        }

        .map-floating-card small {
          color: #7489a1;
          font-size: 10px;
          margin-top: 2px;
        }

        .floating-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 18px;
        }

        .floating-icon.blue {
          background: #e5f0ff;
        }

        .floating-icon.cyan {
          background: #e0f9ff;
        }

        .floating-icon.green {
          background: #e2faef;
          color: #12a56c;
        }

        .card-floor {
          top: 8%;
          right: 2%;
        }

        .card-route {
          bottom: 15%;
          left: 1%;
        }

        .card-qr {
          bottom: 3%;
          right: 8%;
        }

        /* SECTIONS */

        .features-section,
        .workflow-section,
        .environment-section,
        .final-cta-section {
          padding: 90px 0;
        }

        .features-section {
          background: white;
        }

        .section-heading {
          max-width: 760px;
          margin: 0 auto 52px;
        }

        .section-eyebrow {
          display: inline-block;
          color: #147bdc;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 10px;
        }

        .section-heading h2,
        .workflow-section h2 {
          color: #10254a;
          font-size: clamp(2rem, 4vw, 3rem);
          letter-spacing: -1.5px;
          font-weight: 800;
          margin-bottom: 15px;
        }

        .section-heading p,
        .workflow-section p {
          color: #657d99;
          line-height: 1.7;
          margin-bottom: 0;
        }

        /* FEATURE CARDS */

        .feature-card {
          position: relative;
          height: 100%;
          padding: 28px;
          border-radius: 18px;
          border: 1px solid;
          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow:
            0 18px 38px rgba(26,66,106,0.10);
        }

        .feature-green {
          background: #f0fcf7;
          border-color: #d1f2e3;
        }

        .feature-blue {
          background: #eff7ff;
          border-color: #d3e9fc;
        }

        .feature-purple {
          background: #f7f2ff;
          border-color: #e5d8fa;
        }

        .feature-yellow {
          background: #fffaf0;
          border-color: #f6e6bf;
        }

        .feature-red {
          background: #fff3f3;
          border-color: #f5d8d8;
        }

        .feature-cyan {
          background: #effcff;
          border-color: #d0f1f6;
        }

        .feature-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: white;
          box-shadow: 0 7px 18px rgba(35,75,110,0.08);
          font-size: 25px;
          margin-bottom: 20px;
        }

        .feature-card h3 {
          color: #17375e;
          font-size: 18px;
          font-weight: 750;
          margin-bottom: 9px;
        }

        .feature-card p {
          color: #617894;
          font-size: 14px;
          line-height: 1.65;
          margin: 0;
          max-width: 300px;
        }

        .feature-arrow {
          position: absolute;
          top: 28px;
          right: 28px;
          color: #8aa0b8;
          font-size: 20px;
        }

        /* WORKFLOW */

        .workflow-section {
          background:
            linear-gradient(
              135deg,
              #f3f9ff,
              #ffffff
            );
        }

        .workflow-section p {
          max-width: 480px;
          margin-bottom: 25px;
        }

        .workflow-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #1677e8;
          font-weight: 700;
          text-decoration: none;
        }

        .workflow-link:hover {
          color: #005fcb;
        }

        .workflow-card {
          position: relative;
          padding: 30px;
          border-radius: 22px;
          background: white;
          border: 1px solid #dce9f5;
          box-shadow:
            0 18px 50px rgba(25,72,113,0.08);
        }

        .workflow-line {
          position: absolute;
          left: 51px;
          top: 55px;
          bottom: 55px;
          width: 2px;
          background: #dcebf8;
        }

        .workflow-step {
          position: relative;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 14px 0;
        }

        .step-number {
          position: relative;
          z-index: 2;
          width: 44px;
          min-width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #eaf5ff;
          border: 2px solid #c9e5fb;
          color: #147bdc;
          font-size: 12px;
          font-weight: 800;
        }

        .workflow-step h4 {
          color: #17375e;
          font-size: 17px;
          margin: 0 0 3px;
        }

        .workflow-step p {
          color: #7489a1;
          font-size: 13px;
          margin: 0;
        }

        /* ENVIRONMENTS */

        .environment-section {
          background: white;
        }

        .environment-grid {
          display: grid;
          grid-template-columns:
            repeat(6, 1fr);
          border: 1px solid #dfeaf4;
          border-radius: 20px;
          overflow: hidden;
          background: white;
        }

        .environment-card {
          min-height: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border-right: 1px solid #e2ebf4;
          transition: background .2s ease;
        }

        .environment-card:last-child {
          border-right: none;
        }

        .environment-card:hover {
          background: #f5faff;
        }

        .environment-card span {
          font-size: 30px;
        }

        .environment-card strong {
          color: #526b87;
          font-size: 13px;
          text-align: center;
        }

        /* FINAL CTA */

        .final-cta-section {
          background: #f7faff;
        }

        .final-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          padding: 55px;
          border-radius: 26px;
          background:
            linear-gradient(
              135deg,
              #eaf6ff,
              #f5fbff
            );
          border: 1px solid #cfe8fb;
        }

        .final-cta h2 {
          color: #10254a;
          font-size: clamp(2rem, 4vw, 3rem);
          letter-spacing: -1.5px;
          font-weight: 800;
          margin-bottom: 10px;
          max-width: 650px;
        }

        .final-cta p {
          color: #627b97;
          margin: 0;
        }

        /* RESPONSIVE */

        @media (max-width: 991px) {
          .home-hero {
            padding: 55px 0 65px;
          }

          .hero-visual {
            min-height: 420px;
          }

          .hero-map-image {
            max-width: 620px;
          }

          .environment-grid {
            grid-template-columns:
              repeat(3, 1fr);
          }

          .environment-card:nth-child(3) {
            border-right: none;
          }

          .environment-card:nth-child(-n+3) {
            border-bottom: 1px solid #e2ebf4;
          }

          .final-cta {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 767px) {
          .home-hero {
            min-height: auto;
            padding: 45px 0 55px;
          }

          .hero-title {
            font-size: 3rem;
            letter-spacing: -2px;
          }

          .hero-description {
            font-size: 16px;
          }

          .hero-highlights {
            flex-wrap: wrap;
            gap: 15px;
          }

          .highlight-divider {
            display: none;
          }

          .hero-visual {
            min-height: 320px;
          }

          .map-floating-card {
            transform: scale(.82);
          }

          .card-floor {
            top: 0;
          }

          .card-route {
            left: -5px;
          }

          .card-qr {
            right: 0;
          }

          .features-section,
          .workflow-section,
          .environment-section,
          .final-cta-section {
            padding: 65px 0;
          }

          .environment-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .environment-card:nth-child(3) {
            border-right: 1px solid #e2ebf4;
          }

          .environment-card:nth-child(2n) {
            border-right: none;
          }

          .environment-card:nth-child(-n+4) {
            border-bottom: 1px solid #e2ebf4;
          }

          .final-cta {
            padding: 32px 25px;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-primary-button {
            width: 100%;
            justify-content: center;
          }

          .hero-highlights {
            display: grid;
            grid-template-columns:
              repeat(3, 1fr);
            gap: 8px;
          }

          .highlight {
            flex-direction: column;
            text-align: center;
          }

          .highlight strong {
            font-size: 11px;
          }

          .highlight small {
            font-size: 9px;
          }

          .hero-visual {
            min-height: 250px;
          }

          .map-floating-card {
            display: none;
          }

          .environment-card {
            min-height: 125px;
          }

          .workflow-card {
            padding: 22px;
          }
        }
      `}</style>
    </main>
  );
}