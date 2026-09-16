import React from "react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: "🗺️",
    title: "Interactive Mapping",
    text: "Create structured indoor maps with floors, rooms, waypoints, boundaries and connected paths.",
    tone: "blue",
  },
  {
    icon: "🧭",
    title: "Indoor Routing",
    text: "Calculate routes through the connected navigation network between important locations.",
    tone: "cyan",
  },
  {
    icon: "🏢",
    title: "Multi-Floor Support",
    text: "Connect different floors using stairs and elevators for complete building navigation.",
    tone: "purple",
  },
  {
    icon: "📱",
    title: "QR Navigation",
    text: "Create public entry points that let visitors start navigation from known locations.",
    tone: "green",
  },
  {
    icon: "♿",
    title: "Accessibility",
    text: "Support navigation preferences such as avoiding stairs or elevators when required.",
    tone: "orange",
  },
  {
    icon: "🚨",
    title: "Emergency Routing",
    text: "Handle blocked areas and help identify routes toward available emergency exits.",
    tone: "red",
  },
];

const workflow = [
  {
    number: "01",
    icon: "🏗️",
    title: "Create",
    text: "Create your building and define its floors.",
  },
  {
    number: "02",
    icon: "🗺️",
    title: "Design",
    text: "Add rooms, locations and navigation waypoints.",
  },
  {
    number: "03",
    icon: "🔗",
    title: "Connect",
    text: "Build the walkable network between waypoints.",
  },
  {
    number: "04",
    icon: "🧭",
    title: "Navigate",
    text: "Calculate routes and provide turn-by-turn directions.",
  },
  {
    number: "05",
    icon: "🌐",
    title: "Publish",
    text: "Make the map public and share it through QR navigation.",
  },
];

const environments = [
  ["🎓", "Campuses"],
  ["🏢", "Office Buildings"],
  ["🏥", "Hospitals"],
  ["🛍️", "Shopping Malls"],
  ["🏛️", "Public Buildings"],
  ["🏟️", "Stadiums"],
];

export default function About() {
  return (
    <main className="universal-about">

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="about-hero">
        <div className="about-glow about-glow-one" />
        <div className="about-glow about-glow-two" />

        <div className="container position-relative">
          <div className="row align-items-center g-5">

            {/* LEFT */}
            <div className="col-lg-7">

              <div className="about-eyebrow">
                <span>✦</span>
                Indoor navigation, reimagined
              </div>

              <h1 className="about-title">
                Turn complex buildings into{" "}
                <span>navigable spaces.</span>
              </h1>

              <p className="about-lead">
                UniversalNav is an indoor navigation platform
                for creating structured, multi-floor building
                maps and turning them into useful navigation
                experiences.
              </p>

              <div className="d-flex flex-wrap gap-3 mt-4">

                <Link
                  to="/guide"
                  className="about-primary-btn"
                >
                  <span>📖</span>
                  Explore the Guide
                  <span>→</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="about-secondary-btn"
                >
                  Start Mapping
                  <span>→</span>
                </Link>

              </div>

              {/* MINI STATS */}
              <div className="about-mini-stats">

                <div>
                  <strong>Multi-Floor</strong>
                  <span>Building support</span>
                </div>

                <div>
                  <strong>Smart</strong>
                  <span>Pathfinding</span>
                </div>

                <div>
                  <strong>Public</strong>
                  <span>QR navigation</span>
                </div>

              </div>

            </div>

            {/* RIGHT VISUAL */}
            <div className="col-lg-5">

              <div className="about-visual">

                <div className="visual-top">
                  <div className="visual-brand">
                    <span>🌐</span>
                    UniversalNav
                  </div>

                  <div className="visual-status">
                    ● Navigation ready
                  </div>
                </div>

                {/* MAP ILLUSTRATION */}
                <div className="map-illustration">

                  <div className="map-room room-one">
                    <span>Lab 204</span>
                  </div>

                  <div className="map-room room-two">
                    <span>Room 101</span>
                  </div>

                  <div className="map-room room-three">
                    <span>Office</span>
                  </div>

                  <div className="map-corridor corridor-one" />
                  <div className="map-corridor corridor-two" />
                  <div className="map-corridor corridor-three" />

                  <div className="map-route route-one" />
                  <div className="map-route route-two" />

                  <div className="map-pin pin-start">
                    📍
                  </div>

                  <div className="map-pin pin-end">
                    📍
                  </div>

                </div>

                {/* VISUAL CARDS */}
                <div className="visual-card visual-card-top">
                  <span>🏢</span>
                  <div>
                    <strong>Multi-Floor</strong>
                    <small>Connected navigation</small>
                  </div>
                </div>

                <div className="visual-card visual-card-bottom">
                  <span>🧭</span>
                  <div>
                    <strong>Smart Routes</strong>
                    <small>Connected pathways</small>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>


      {/* =====================================================
          WHAT IS UNIVERSALNAV
      ====================================================== */}
      <section className="about-intro section-space">

        <div className="container">

          <div className="section-heading text-center mx-auto">

            <div className="section-label">
              ABOUT UNIVERSALNAV
            </div>

            <h2>
              One building.
              <br />
              <span>One intelligent map.</span>
            </h2>

            <p>
              UniversalNav turns a building layout into a
              structured navigation network where rooms become
              destinations, waypoints become travel points and
              connections become routes.
            </p>

          </div>

          <div className="concept-grid mt-5">

            <div className="concept-card">
              <div className="concept-number">01</div>
              <div className="concept-icon">🚪</div>
              <h4>Rooms</h4>
              <p>
                Define classrooms, offices, laboratories,
                restrooms, entrances and other destinations.
              </p>
            </div>

            <div className="concept-card">
              <div className="concept-number">02</div>
              <div className="concept-icon">📍</div>
              <h4>Waypoints</h4>
              <p>
                Place navigation points along corridors,
                junctions and important locations.
              </p>
            </div>

            <div className="concept-card">
              <div className="concept-number">03</div>
              <div className="concept-icon">🔗</div>
              <h4>Connections</h4>
              <p>
                Connect waypoints together to create the
                walkable network used for routing.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          WORKFLOW
      ====================================================== */}
      <section className="workflow-section section-space">

        <div className="container">

          <div className="section-heading text-center mx-auto">

            <div className="section-label">
              HOW IT WORKS
            </div>

            <h2>
              From building layout to{" "}
              <span>navigation.</span>
            </h2>

            <p>
              A straightforward workflow takes you from an
              empty building map to a usable indoor navigation
              experience.
            </p>

          </div>

          <div className="workflow-grid mt-5">

            {workflow.map((item, index) => (
              <React.Fragment key={item.number}>

                <div className="workflow-card">

                  <div className="workflow-number">
                    {item.number}
                  </div>

                  <div className="workflow-icon">
                    {item.icon}
                  </div>

                  <h4>{item.title}</h4>

                  <p>{item.text}</p>

                </div>

                {index < workflow.length - 1 && (
                  <div className="workflow-arrow">
                    →
                  </div>
                )}

              </React.Fragment>
            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURES
      ====================================================== */}
      <section className="features-section section-space">

        <div className="container">

          <div className="row align-items-end mb-5">

            <div className="col-lg-7">

              <div className="section-label">
                CORE CAPABILITIES
              </div>

              <h2 className="section-title">
                Everything you need for{" "}
                <span>indoor navigation.</span>
              </h2>

            </div>

            <div className="col-lg-5">

              <p className="section-description">
                Map creation, routing, accessibility, safety
                and public navigation work together as one
                connected system.
              </p>

            </div>

          </div>

          <div className="row g-4">

            {features.map((feature) => (
              <div
                className="col-md-6 col-lg-4"
                key={feature.title}
              >

                <article
                  className={`feature-card feature-${feature.tone}`}
                >

                  <div className="feature-icon">
                    {feature.icon}
                  </div>

                  <h4>{feature.title}</h4>

                  <p>{feature.text}</p>

                  <div className="feature-line" />

                </article>

              </div>
            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          SAFETY + ACCESSIBILITY
      ====================================================== */}
      <section className="container section-space">

        <div className="safety-card">

          <div className="safety-content">

            <div className="section-label">
              SAFETY + ACCESSIBILITY
            </div>

            <h2>
              Navigation should adapt
              <span> to the situation.</span>
            </h2>

            <p>
              UniversalNav supports accessibility preferences,
              blocked navigation areas, alternative routes and
              emergency evacuation scenarios so that a map
              represents more than just the normal walking path.
            </p>

            <div className="safety-points">

              <div>
                <span>♿</span>
                <strong>Accessibility preferences</strong>
              </div>

              <div>
                <span>🚧</span>
                <strong>Blocked paths and locations</strong>
              </div>

              <div>
                <span>🚨</span>
                <strong>Emergency route support</strong>
              </div>

            </div>

          </div>

          <div className="safety-visual">

            <div className="safety-orbit orbit-one" />
            <div className="safety-orbit orbit-two" />

            <div className="safety-center">
              🧭
            </div>

            <div className="safety-bubble bubble-one">
              ♿
            </div>

            <div className="safety-bubble bubble-two">
              🚧
            </div>

            <div className="safety-bubble bubble-three">
              🚨
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          ENVIRONMENTS
      ====================================================== */}
      <section className="environment-section section-space">

        <div className="container">

          <div className="section-heading text-center mx-auto">

            <div className="section-label">
              BUILT FOR REAL SPACES
            </div>

            <h2>
              Navigate where people{" "}
              <span>actually go.</span>
            </h2>

            <p>
              UniversalNav can be adapted to many types of
              indoor environments and multi-floor spaces.
            </p>

          </div>

          <div className="environment-grid mt-5">

            {environments.map(([icon, title]) => (
              <div
                className="environment-item"
                key={title}
              >
                <span>{icon}</span>
                <strong>{title}</strong>
              </div>
            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section className="container section-space">

        <div className="about-final-cta">

          <div className="cta-glow" />

          <div className="position-relative">

            <div className="cta-icon">
              🧭
            </div>

            <h2>
              Ready to build your
              <span> indoor map?</span>
            </h2>

            <p>
              Learn the workflow, create your building,
              connect your navigation network and publish
              it for visitors.
            </p>

            <div className="d-flex justify-content-center flex-wrap gap-3">

              <Link
                to="/guide"
                className="about-primary-btn"
              >
                📖 Open UniversalNav Guide
                <span>→</span>
              </Link>

              <Link
                to="/dashboard"
                className="about-secondary-btn"
              >
                Open My Maps
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PAGE STYLES
      ====================================================== */}
      <style>
        {`

        /* =====================================================
           BASE
        ====================================================== */

        .universal-about {
          min-height: 100vh;
          color: #10254a;

          background:
            radial-gradient(
              circle at 5% 5%,
              rgba(37, 131, 237, 0.08),
              transparent 28%
            ),
            radial-gradient(
              circle at 95% 18%,
              rgba(0, 174, 239, 0.07),
              transparent 30%
            ),
            #f8fbff;
        }

        .section-space {
          padding-top: 85px;
          padding-bottom: 85px;
        }

        /* =====================================================
           HERO
        ====================================================== */

        .about-hero {
          position: relative;
          overflow: hidden;

          padding:
            95px 0
            90px;

          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              #f4f9ff 55%,
              #eef8ff 100%
            );

          border-bottom:
            1px solid #e3edf7;
        }

        .about-glow {
          position: absolute;

          width: 360px;
          height: 360px;

          border-radius: 50%;

          filter: blur(70px);

          pointer-events: none;
        }

        .about-glow-one {
          top: -180px;
          left: -100px;

          background:
            rgba(37, 131, 237, 0.09);
        }

        .about-glow-two {
          right: -100px;
          bottom: -200px;

          background:
            rgba(0, 174, 239, 0.10);
        }

        .about-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;

          padding: 9px 16px;

          border-radius: 999px;

          background: #edf7ff;

          border: 1px solid #cfe8fb;

          color: #1677d8;

          font-size: 13px;
          font-weight: 700;

          margin-bottom: 25px;
        }

        .about-title {
          max-width: 760px;

          margin: 0;

          color: #10254a;

          font-size:
            clamp(2.7rem, 5vw, 4.8rem);

          line-height: 1.04;

          letter-spacing: -3px;

          font-weight: 800;
        }

        .about-title span {
          background:
            linear-gradient(
              90deg,
              #1677e8,
              #00a8e8
            );

          -webkit-background-clip: text;
          background-clip: text;

          -webkit-text-fill-color: transparent;
        }

        .about-lead {
          max-width: 690px;

          margin-top: 27px;

          color: #60748c;

          font-size: 18px;

          line-height: 1.75;
        }

        /* =====================================================
           BUTTONS
        ====================================================== */

        .about-primary-btn,
        .about-secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          min-height: 50px;

          padding: 12px 20px;

          border-radius: 11px;

          text-decoration: none;

          font-size: 14px;
          font-weight: 750;

          transition:
            transform .2s ease,
            box-shadow .2s ease,
            background .2s ease;
        }

        .about-primary-btn {
          color: white;

          background:
            linear-gradient(
              135deg,
              #1677e8,
              #009fe8
            );

          box-shadow:
            0 10px 25px
            rgba(22, 119, 232, 0.18);
        }

        .about-primary-btn:hover {
          color: white;

          transform: translateY(-2px);

          box-shadow:
            0 14px 30px
            rgba(22, 119, 232, 0.25);
        }

        .about-secondary-btn {
          color: #234260;

          background: white;

          border: 1px solid #cbdceb;
        }

        .about-secondary-btn:hover {
          color: #1677e8;

          background: #f4f9ff;

          border-color: #a9d1f3;

          transform: translateY(-2px);
        }

        /* =====================================================
           MINI STATS
        ====================================================== */

        .about-mini-stats {
          display: flex;

          margin-top: 55px;

          max-width: 650px;

          border-top: 1px solid #dce8f3;
        }

        .about-mini-stats div {
          flex: 1;

          padding:
            20px 20px 0 0;

          border-right:
            1px solid #dce8f3;

          margin-right: 20px;
        }

        .about-mini-stats div:last-child {
          border-right: 0;
          margin-right: 0;
        }

        .about-mini-stats strong {
          display: block;

          color: #1677e8;

          font-size: 16px;
        }

        .about-mini-stats span {
          display: block;

          margin-top: 4px;

          color: #73879b;

          font-size: 12px;
        }

        /* =====================================================
           HERO VISUAL
        ====================================================== */

        .about-visual {
          position: relative;

          min-height: 455px;

          padding: 25px;

          overflow: hidden;

          border-radius: 28px;

          background:
            linear-gradient(
              145deg,
              #eaf6ff,
              #f8fcff
            );

          border:
            1px solid #cfe5f7;

          box-shadow:
            0 25px 65px
            rgba(34, 90, 140, 0.12);
        }

        .visual-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          position: relative;
          z-index: 3;
        }

        .visual-brand {
          display: flex;
          align-items: center;
          gap: 7px;

          color: #18395e;

          font-size: 13px;
          font-weight: 750;
        }

        .visual-status {
          padding: 6px 9px;

          border-radius: 999px;

          color: #18885a;

          background: #e9faf2;

          border: 1px solid #c6eedc;

          font-size: 10px;
          font-weight: 700;
        }

        .map-illustration {
          position: absolute;

          left: 35px;
          right: 35px;
          top: 95px;
          bottom: 50px;

          border-radius: 18px;

          background:
            linear-gradient(
              145deg,
              #d9ecf9,
              #eef8ff
            );

          border:
            1px solid #bdd9ec;

          overflow: hidden;
        }

        .map-illustration::before {
          content: "";

          position: absolute;

          inset: 0;

          background-image:
            linear-gradient(
              rgba(37,131,237,.07) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(37,131,237,.07) 1px,
              transparent 1px
            );

          background-size:
            28px 28px;
        }

        .map-room {
          position: absolute;

          display: flex;
          align-items: center;
          justify-content: center;

          background: rgba(255,255,255,.85);

          border: 2px solid #a9cce4;

          border-radius: 5px;

          color: #47657f;

          font-size: 9px;
          font-weight: 700;

          box-shadow:
            0 4px 10px
            rgba(47,96,132,.08);
        }

        .room-one {
          left: 13%;
          top: 16%;

          width: 28%;
          height: 24%;
        }

        .room-two {
          right: 12%;
          top: 17%;

          width: 27%;
          height: 24%;
        }

        .room-three {
          right: 14%;
          bottom: 14%;

          width: 25%;
          height: 23%;
        }

        .map-corridor {
          position: absolute;

          border-radius: 4px;

          background: #ffffff;

          border:
            2px solid #b8d5e9;
        }

        .corridor-one {
          left: 39%;
          top: 24%;

          width: 22%;
          height: 12%;
        }

        .corridor-two {
          left: 29%;
          top: 34%;

          width: 12%;
          height: 40%;
        }

        .corridor-three {
          left: 38%;
          bottom: 20%;

          width: 40%;
          height: 13%;
        }

        .map-route {
          position: absolute;

          height: 5px;

          border-radius: 10px;

          background:
            linear-gradient(
              90deg,
              #1787ed,
              #00b4ef
            );

          box-shadow:
            0 0 12px
            rgba(0,145,240,.45);

          z-index: 2;
        }

        .route-one {
          left: 19%;
          top: 54%;

          width: 28%;

          transform:
            rotate(-19deg);
        }

        .route-two {
          left: 43%;
          top: 55%;

          width: 38%;

          transform:
            rotate(14deg);
        }

        .map-pin {
          position: absolute;

          z-index: 4;

          display: flex;
          align-items: center;
          justify-content: center;

          width: 31px;
          height: 31px;

          border-radius: 50%;

          background: white;

          box-shadow:
            0 7px 18px
            rgba(19,93,150,.18);

          font-size: 15px;
        }

        .pin-start {
          left: 17%;
          top: 48%;
        }

        .pin-end {
          right: 14%;
          top: 56%;
        }

        .visual-card {
          position: absolute;

          z-index: 5;

          display: flex;
          align-items: center;
          gap: 9px;

          padding: 10px 13px;

          border-radius: 12px;

          background:
            rgba(255,255,255,.92);

          border:
            1px solid #d4e6f4;

          box-shadow:
            0 10px 25px
            rgba(43,90,130,.12);
        }

        .visual-card > span {
          width: 32px;
          height: 32px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background: #edf7ff;

          font-size: 15px;
        }

        .visual-card strong {
          display: block;

          color: #203d5c;

          font-size: 11px;
        }

        .visual-card small {
          display: block;

          color: #7b8ea2;

          font-size: 9px;

          margin-top: 2px;
        }

        .visual-card-top {
          top: 68px;
          right: 15px;
        }

        .visual-card-bottom {
          bottom: 18px;
          left: 18px;
        }

        /* =====================================================
           SECTION HEADING
        ====================================================== */

        .section-heading {
          max-width: 760px;
        }

        .section-label {
          display: inline-block;

          color: #1680df;

          font-size: 11px;
          font-weight: 800;

          letter-spacing: 1.4px;
        }

        .section-heading h2,
        .section-title {
          margin-top: 10px;

          color: #10254a;

          font-size:
            clamp(2rem, 4vw, 3rem);

          line-height: 1.12;

          letter-spacing: -1.5px;

          font-weight: 800;
        }

        .section-heading h2 span,
        .section-title span {
          color: #1680df;
        }

        .section-heading p,
        .section-description {
          color: #71859b;

          line-height: 1.75;

          font-size: 16px;
        }

        /* =====================================================
           CONCEPT
        ====================================================== */

        .concept-grid {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 20px;
        }

        .concept-card {
          position: relative;

          padding: 30px;

          border-radius: 20px;

          background: white;

          border: 1px solid #e0ebf4;

          box-shadow:
            0 12px 35px
            rgba(32,78,120,.055);

          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .concept-card:hover {
          transform: translateY(-5px);

          box-shadow:
            0 20px 45px
            rgba(32,78,120,.10);
        }

        .concept-number {
          position: absolute;

          right: 22px;
          top: 20px;

          color: #dbeaf7;

          font-size: 30px;
          font-weight: 800;
        }

        .concept-icon {
          width: 54px;
          height: 54px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 22px;

          border-radius: 14px;

          background: #edf7ff;

          border: 1px solid #d4eafb;

          font-size: 24px;
        }

        .concept-card h4 {
          color: #193656;

          font-size: 19px;
          font-weight: 750;
        }

        .concept-card p {
          margin: 0;

          color: #71859b;

          font-size: 14px;

          line-height: 1.7;
        }

        /* =====================================================
           WORKFLOW
        ====================================================== */

        .workflow-section {
          background:
            linear-gradient(
              180deg,
              #f0f7fd,
              #f8fbff
            );

          border-top:
            1px solid #e3edf6;

          border-bottom:
            1px solid #e3edf6;
        }

        .workflow-grid {
          display: flex;
          align-items: stretch;
          justify-content: center;
        }

        .workflow-card {
          flex: 1;

          min-width: 150px;

          padding: 25px 20px;

          border-radius: 17px;

          background: white;

          border: 1px solid #dce9f3;

          box-shadow:
            0 8px 25px
            rgba(33,78,118,.05);
        }

        .workflow-number {
          color: #1680df;

          font-size: 11px;
          font-weight: 800;

          letter-spacing: 1px;
        }

        .workflow-icon {
          margin-top: 15px;

          font-size: 26px;
        }

        .workflow-card h4 {
          margin-top: 13px;

          color: #1a3757;

          font-size: 17px;
          font-weight: 750;
        }

        .workflow-card p {
          margin: 0;

          color: #75899c;

          font-size: 12px;

          line-height: 1.6;
        }

        .workflow-arrow {
          display: flex;
          align-items: center;

          padding: 0 10px;

          color: #72a6ce;

          font-size: 20px;
          font-weight: 700;
        }

        /* =====================================================
           FEATURES
        ====================================================== */

        .feature-card {
          position: relative;

          height: 100%;

          padding: 28px;

          border-radius: 20px;

          background: white;

          border: 1px solid #e0eaf3;

          box-shadow:
            0 10px 30px
            rgba(30,76,115,.055);

          overflow: hidden;

          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .feature-card:hover {
          transform: translateY(-6px);

          box-shadow:
            0 20px 45px
            rgba(30,76,115,.11);
        }

        .feature-icon {
          width: 56px;
          height: 56px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 22px;

          border-radius: 15px;

          font-size: 25px;
        }

        .feature-blue .feature-icon {
          background: #eaf4ff;
        }

        .feature-cyan .feature-icon {
          background: #e9faff;
        }

        .feature-purple .feature-icon {
          background: #f2edff;
        }

        .feature-green .feature-icon {
          background: #eafaf2;
        }

        .feature-orange .feature-icon {
          background: #fff5e6;
        }

        .feature-red .feature-icon {
          background: #fff0f0;
        }

        .feature-card h4 {
          color: #183653;

          font-size: 18px;
          font-weight: 750;
        }

        .feature-card p {
          color: #72869a;

          font-size: 14px;

          line-height: 1.7;

          margin: 0;
        }

        .feature-line {
          width: 40px;
          height: 3px;

          margin-top: 25px;

          border-radius: 10px;

          background:
            linear-gradient(
              90deg,
              #1677e8,
              #00afe8
            );
        }

        /* =====================================================
           SAFETY
        ====================================================== */

        .safety-card {
          position: relative;

          display: flex;
          align-items: center;

          overflow: hidden;

          padding: 55px;

          border-radius: 28px;

          background:
            linear-gradient(
              135deg,
              #eef8ff,
              #f9fcff
            );

          border:
            1px solid #cfe5f6;

          box-shadow:
            0 20px 55px
            rgba(29,88,135,.08);
        }

        .safety-content {
          position: relative;
          z-index: 2;

          width: 62%;
        }

        .safety-content h2 {
          margin-top: 10px;

          color: #10254a;

          font-size:
            clamp(2rem, 4vw, 3rem);

          line-height: 1.15;

          letter-spacing: -1.5px;

          font-weight: 800;
        }

        .safety-content h2 span {
          color: #1680df;
        }

        .safety-content > p {
          max-width: 680px;

          color: #70859a;

          line-height: 1.75;
        }

        .safety-points {
          display: flex;
          flex-wrap: wrap;

          gap: 10px;

          margin-top: 25px;
        }

        .safety-points div {
          display: flex;
          align-items: center;
          gap: 8px;

          padding: 9px 12px;

          border-radius: 10px;

          background: white;

          border: 1px solid #dceaf5;

          color: #49647d;

          font-size: 12px;
        }

        .safety-visual {
          position: absolute;

          right: 50px;

          width: 270px;
          height: 270px;
        }

        .safety-orbit {
          position: absolute;

          border-radius: 50%;

          border: 1px dashed #afd3ed;
        }

        .orbit-one {
          inset: 0;
        }

        .orbit-two {
          inset: 40px;
        }

        .safety-center {
          position: absolute;

          top: 50%;
          left: 50%;

          transform:
            translate(-50%, -50%);

          width: 75px;
          height: 75px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #1677e8,
              #00a8e8
            );

          box-shadow:
            0 15px 35px
            rgba(22,119,232,.22);

          font-size: 30px;
        }

        .safety-bubble {
          position: absolute;

          width: 46px;
          height: 46px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: white;

          border: 1px solid #d5e7f4;

          box-shadow:
            0 8px 20px
            rgba(36,89,132,.10);

          font-size: 19px;
        }

        .bubble-one {
          top: 15px;
          left: 110px;
        }

        .bubble-two {
          bottom: 25px;
          left: 20px;
        }

        .bubble-three {
          right: 5px;
          bottom: 45px;
        }

        /* =====================================================
           ENVIRONMENTS
        ====================================================== */

        .environment-section {
          background: white;

          border-top:
            1px solid #e6eef6;
        }

        .environment-grid {
          display: grid;

          grid-template-columns:
            repeat(6, 1fr);

          border:
            1px solid #e0eaf3;

          border-radius: 18px;

          overflow: hidden;

          background: white;
        }

        .environment-item {
          min-height: 125px;

          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          gap: 10px;

          border-right:
            1px solid #e4edf5;

          color: #587087;
        }

        .environment-item:last-child {
          border-right: 0;
        }

        .environment-item span {
          font-size: 25px;
        }

        .environment-item strong {
          font-size: 12px;

          font-weight: 650;

          text-align: center;
        }

        /* =====================================================
           FINAL CTA
        ====================================================== */

        .about-final-cta {
          position: relative;

          overflow: hidden;

          padding: 70px 25px;

          text-align: center;

          border-radius: 28px;

          background:
            linear-gradient(
              135deg,
              #edf7ff,
              #f5fbff
            );

          border:
            1px solid #cfe5f7;

          box-shadow:
            0 20px 55px
            rgba(32,82,125,.08);
        }

        .cta-glow {
          position: absolute;

          width: 300px;
          height: 300px;

          top: -190px;
          left: 50%;

          transform:
            translateX(-50%);

          border-radius: 50%;

          background:
            rgba(37,131,237,.10);

          filter: blur(50px);
        }

        .cta-icon {
          position: relative;

          width: 65px;
          height: 65px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin: 0 auto 20px;

          border-radius: 18px;

          background:
            linear-gradient(
              135deg,
              #1677e8,
              #00a8e8
            );

          box-shadow:
            0 12px 30px
            rgba(22,119,232,.20);

          font-size: 28px;
        }

        .about-final-cta h2 {
          position: relative;

          color: #10254a;

          font-size:
            clamp(2rem, 4vw, 3rem);

          letter-spacing: -1.5px;

          font-weight: 800;
        }

        .about-final-cta h2 span {
          color: #1680df;
        }

        .about-final-cta p {
          position: relative;

          max-width: 600px;

          margin:
            0 auto 28px;

          color: #71859b;

          line-height: 1.7;
        }

        /* =====================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 991px) {

          .about-hero {
            padding: 70px 0;
          }

          .about-title {
            letter-spacing: -2px;
          }

          .concept-grid {
            grid-template-columns:
              1fr;
          }

          .workflow-grid {
            display: grid;

            grid-template-columns:
              repeat(2, 1fr);

            gap: 15px;
          }

          .workflow-arrow {
            display: none;
          }

          .safety-card {
            padding: 40px;
          }

          .safety-content {
            width: 100%;
          }

          .safety-visual {
            display: none;
          }

          .environment-grid {
            grid-template-columns:
              repeat(3, 1fr);
          }

          .environment-item:nth-child(3) {
            border-right: 0;
          }

        }

        @media (max-width: 767px) {

          .section-space {
            padding-top: 60px;
            padding-bottom: 60px;
          }

          .about-hero {
            padding: 55px 0;
          }

          .about-title {
            font-size: 2.65rem;
          }

          .about-lead {
            font-size: 16px;
          }

          .about-mini-stats {
            margin-top: 40px;
          }

          .about-mini-stats div {
            padding-right: 10px;
            margin-right: 10px;
          }

          .about-visual {
            min-height: 390px;
          }

          .workflow-grid {
            grid-template-columns:
              1fr;
          }

          .environment-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .environment-item {
            border-right:
              1px solid #e4edf5;
          }

          .environment-item:nth-child(even) {
            border-right: 0;
          }

          .safety-card {
            padding: 32px 25px;
          }

        }

        @media (max-width: 480px) {

          .about-title {
            font-size: 2.35rem;
          }

          .about-mini-stats {
            flex-direction: column;
          }

          .about-mini-stats div {
            border-right: 0;

            border-bottom:
              1px solid #dce8f3;

            padding-bottom: 12px;

            margin-bottom: 5px;
          }

          .about-mini-stats div:last-child {
            border-bottom: 0;
          }

          .about-primary-btn,
          .about-secondary-btn {
            width: 100%;
          }

          .environment-grid {
            grid-template-columns:
              1fr 1fr;
          }

        }

        `}
      </style>

    </main>
  );
}