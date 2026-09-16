import React, { useState } from "react";
import { Link } from "react-router-dom";

const sections = [
  {
    id: "building",
    category: "GETTING STARTED",
    number: "01",
    icon: "🏢",
    title: "Create your building",
    description:
      "Start by creating the building that will contain your indoor navigation map.",
    steps: [
      "Open My Maps after logging in.",
      "Create a new building map.",
      "Enter the building name, category, description and number of floors.",
      "Open the editor to begin designing the map.",
    ],
    tip: "Use a clear building name so visitors can easily understand what they are navigating.",
  },
  {
    id: "floors",
    category: "GETTING STARTED",
    number: "02",
    icon: "🏬",
    title: "Set up your floors",
    description:
      "Each floor represents its own indoor layout while remaining part of the same building.",
    steps: [
      "Select the floor you want to edit.",
      "Give floors meaningful names.",
      "Design each floor independently.",
      "Use stairs or elevators when connecting different levels.",
    ],
    tip: "Keep floor names consistent, such as Ground Floor, Floor 1 and Floor 2.",
  },
  {
    id: "rooms",
    category: "MAP EDITOR",
    number: "03",
    icon: "🚪",
    title: "Add rooms and locations",
    description:
      "Rooms represent destinations that users can search for and navigate toward.",
    steps: [
      "Create the rooms or important locations on the floor.",
      "Give each location a meaningful name.",
      "Choose an appropriate room or location type.",
      "Associate important destinations with navigation waypoints.",
    ],
    tip: "Use names visitors will actually recognize, such as Reception, Lab 204 or Main Entrance.",
  },
  {
    id: "waypoints",
    category: "MAP EDITOR",
    number: "04",
    icon: "📍",
    title: "Add waypoints",
    description:
      "Waypoints are the points that form the navigable network inside your building.",
    steps: [
      "Place waypoints along corridors and walkable areas.",
      "Add points at important junctions.",
      "Place points near rooms that should be navigable.",
      "Use suitable waypoint types for entrances, stairs and elevators.",
    ],
    tip: "Think of waypoints as roads inside your building.",
  },
  {
    id: "connections",
    category: "MAP EDITOR",
    number: "05",
    icon: "🔗",
    title: "Connect waypoints",
    description:
      "Connections tell UniversalNav which waypoints can be travelled between.",
    steps: [
      "Connect nearby waypoints.",
      "Follow the actual walkable layout.",
      "Create a continuous network through corridors.",
      "Connect important destinations to the network.",
    ],
    tip: "A room can exist on the map without being reachable. Always test the connection network.",
  },
  {
    id: "multifloor",
    category: "MAP EDITOR",
    number: "06",
    icon: "🪜",
    title: "Connect multiple floors",
    description:
      "Stairs and elevators allow the navigation network to move between different levels.",
    steps: [
      "Create stair or elevator locations on the relevant floors.",
      "Connect the corresponding navigation points.",
      "Test a route from one floor to another.",
      "Make sure the chosen connection reflects the real building.",
    ],
    tip: "For accessibility, provide an elevator route when one is available.",
  },
  {
    id: "blockages",
    category: "SAFETY",
    number: "07",
    icon: "🚧",
    title: "Handle blocked areas",
    description:
      "Temporary or permanent restrictions can be represented in the navigation experience.",
    steps: [
      "Identify the unavailable room, node or path.",
      "Use the appropriate blockage control.",
      "Recalculate the route.",
      "Verify that navigation avoids the unavailable area.",
      "Clear the blockage when the area becomes available again.",
    ],
    tip: "Always recalculate a route after changing a blockage.",
  },
  {
    id: "accessibility",
    category: "SAFETY",
    number: "08",
    icon: "♿",
    title: "Configure accessibility",
    description:
      "Navigation preferences can help users choose routes that fit their accessibility requirements.",
    steps: [
      "Open the navigation preferences.",
      "Enable the relevant accessibility option.",
      "Use avoid-stairs or avoid-elevator preferences where appropriate.",
      "Calculate the route again.",
      "Verify that a valid accessible path actually exists.",
    ],
    tip: "Accessibility preferences cannot create a path where the map has no suitable connection.",
  },
  {
    id: "qr",
    category: "PUBLISHING",
    number: "09",
    icon: "📱",
    title: "Create QR locations",
    description:
      "QR locations provide a convenient starting point for visitors entering a building.",
    steps: [
      "Select a waypoint representing a known physical location.",
      "Use the available QR-location action.",
      "Give it a useful name such as Main Entrance or Reception.",
      "Save the map.",
      "Use the generated QR entry point for public navigation.",
    ],
    tip: "Place QR locations at entrances and other obvious visitor starting points.",
  },
  {
    id: "navigation",
    category: "NAVIGATION",
    number: "10",
    icon: "🧭",
    title: "Test navigation",
    description:
      "Before publishing, test routes from realistic starting points to important destinations.",
    steps: [
      "Choose a starting location.",
      "Choose a destination.",
      "Calculate the route.",
      "Check the highlighted path.",
      "Review distance and turn-by-turn instructions.",
      "Repeat after changing preferences or blockages.",
    ],
    tip: "Test more than one route. A map can look correct while still containing disconnected navigation points.",
  },
  {
    id: "emergency",
    category: "SAFETY",
    number: "11",
    icon: "🚨",
    title: "Emergency navigation",
    description:
      "Emergency mode helps test routes toward available exits while accounting for blocked areas.",
    steps: [
      "Define emergency exits and important evacuation locations.",
      "Activate emergency navigation during testing.",
      "Check that blocked paths are avoided.",
      "Test from multiple starting locations.",
      "Verify that routes lead toward valid exits.",
    ],
    tip: "Emergency routes should always be tested against the real building layout.",
  },
  {
    id: "publish",
    category: "PUBLISHING",
    number: "12",
    icon: "🌐",
    title: "Publish your map",
    description:
      "Once the map has been tested, make it available for public navigation.",
    steps: [
      "Save your completed map.",
      "Open the Dashboard.",
      "Make the map public.",
      "Open or generate its QR code.",
      "Visitors can open the public navigation experience without creating an account.",
    ],
    tip: "Test the public QR flow before sharing it with visitors.",
  },
];

export default function Guide() {
  const [active, setActive] = useState("building");

  const activeSection =
    sections.find((section) => section.id === active) ||
    sections[0];

  const activeIndex = sections.findIndex(
    (section) => section.id === active
  );

  const categories = [
    ...new Set(sections.map((section) => section.category)),
  ];

  const goPrevious = () => {
    if (activeIndex > 0) {
      setActive(sections[activeIndex - 1].id);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const goNext = () => {
    if (activeIndex < sections.length - 1) {
      setActive(sections[activeIndex + 1].id);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <main className="universal-guide">

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="guide-hero">

        <div className="guide-hero-glow guide-glow-one" />
        <div className="guide-hero-glow guide-glow-two" />

        <div className="container position-relative">

          <div className="row align-items-center g-4">

            <div className="col-lg-8">

              <div className="guide-eyebrow">
                <span>📘</span>
                UniversalNav Guide
              </div>

              <h1 className="guide-title">
                Build your map.
                <br />
                <span>Connect your world.</span>
              </h1>

              <p className="guide-subtitle">
                Everything you need to create an indoor
                navigation map, connect waypoints, test
                routes, configure safety features and
                publish it for visitors.
              </p>

            </div>

            <div className="col-lg-4">

              <div className="guide-workflow-card">

                <div className="workflow-label">
                  YOUR WORKFLOW
                </div>

                <div className="workflow-steps">

                  <div className="workflow-step active">
                    <span>01</span>
                    Create
                  </div>

                  <div className="workflow-line" />

                  <div className="workflow-step">
                    <span>02</span>
                    Connect
                  </div>

                  <div className="workflow-line" />

                  <div className="workflow-step">
                    <span>03</span>
                    Navigate
                  </div>

                </div>

                <div className="workflow-caption">
                  Build → Test → Publish
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          PROGRESS
      ====================================================== */}

      <section className="guide-progress-section">

        <div className="container">

          <div className="guide-progress-top">

            <div>
              <span>GUIDE PROGRESS</span>
              <strong>
                Step {activeSection.number} of 12
              </strong>
            </div>

            <div className="progress-percent">
              {Math.round(
                ((activeIndex + 1) / sections.length) * 100
              )}
              %
            </div>

          </div>

          <div className="guide-progress">

            <div
              className="guide-progress-fill"
              style={{
                width: `${
                  ((activeIndex + 1) / sections.length) * 100
                }%`,
              }}
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          MAIN GUIDE
      ====================================================== */}

      <section className="container guide-main">

        <div className="row g-4">

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <div className="col-lg-3">

            <aside className="guide-sidebar">

              <div className="sidebar-heading">
                GUIDE CONTENT
              </div>

              {categories.map((category) => (

                <div
                  className="sidebar-category"
                  key={category}
                >

                  <div className="sidebar-category-title">
                    {category}
                  </div>

                  {sections
                    .filter(
                      (section) =>
                        section.category === category
                    )
                    .map((section) => (

                      <button
                        key={section.id}
                        type="button"
                        onClick={() => {
                          setActive(section.id);
                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          });
                        }}
                        className={`guide-nav-item ${
                          active === section.id
                            ? "active"
                            : ""
                        }`}
                      >

                        <span className="guide-nav-number">
                          {section.number}
                        </span>

                        <span className="guide-nav-icon">
                          {section.icon}
                        </span>

                        <span className="guide-nav-title">
                          {section.title}
                        </span>

                      </button>

                    ))}

                </div>

              ))}

            </aside>

          </div>


          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="col-lg-9">

            <article className="guide-content-card">

              {/* CONTENT HEADER */}

              <div className="guide-content-header">

                <div className="content-icon">
                  {activeSection.icon}
                </div>

                <div className="content-heading">

                  <div className="content-meta">
                    {activeSection.category}
                    <span>•</span>
                    STEP {activeSection.number}
                  </div>

                  <h2>
                    {activeSection.title}
                  </h2>

                  <p>
                    {activeSection.description}
                  </p>

                </div>

              </div>


              {/* STEPS */}

              <div className="guide-steps-section">

                <div className="steps-heading">

                  <div>
                    <span className="steps-heading-icon">
                      ✓
                    </span>

                    <h3>How to do it</h3>
                  </div>

                  <span className="steps-count">
                    {activeSection.steps.length} steps
                  </span>

                </div>


                <div className="step-list">

                  {activeSection.steps.map(
                    (step, index) => (

                      <div
                        className="guide-step"
                        key={index}
                      >

                        <div className="step-number">
                          {index + 1}
                        </div>

                        <div className="step-connector" />

                        <div className="step-content">
                          {step}
                        </div>

                      </div>

                    )
                  )}

                </div>


                {/* TIP */}

                <div className="guide-tip">

                  <div className="tip-icon">
                    💡
                  </div>

                  <div>
                    <strong>Pro tip</strong>

                    <p>
                      {activeSection.tip}
                    </p>
                  </div>

                </div>


                {/* NAVIGATION */}

                <div className="guide-navigation">

                  <button
                    type="button"
                    onClick={goPrevious}
                    disabled={activeIndex === 0}
                    className="guide-nav-button previous"
                  >
                    <span>←</span>

                    <div>
                      <small>Previous</small>
                      <strong>
                        {activeIndex > 0
                          ? sections[
                              activeIndex - 1
                            ].title
                          : "First step"}
                      </strong>
                    </div>
                  </button>


                  <div className="guide-page-indicator">
                    <span>{activeSection.number}</span>
                    <i>/</i>
                    <span>12</span>
                  </div>


                  <button
                    type="button"
                    onClick={goNext}
                    disabled={
                      activeIndex ===
                      sections.length - 1
                    }
                    className="guide-nav-button next"
                  >
                    <div>
                      <small>Next</small>
                      <strong>
                        {activeIndex <
                        sections.length - 1
                          ? sections[
                              activeIndex + 1
                            ].title
                          : "Complete"}
                      </strong>
                    </div>

                    <span>→</span>
                  </button>

                </div>

              </div>

            </article>

          </div>

        </div>

      </section>


      {/* =====================================================
          CORE CONCEPT
      ====================================================== */}

      <section className="container guide-concept-section">

        <div className="guide-concept">

          <div className="concept-header">

            <div className="concept-label">
              THE CORE CONCEPT
            </div>

            <h2>
              Understand how UniversalNav
              <span> builds a route.</span>
            </h2>

            <p>
              The navigation system uses connected
              waypoints to determine how users can
              move through the building.
            </p>

          </div>


          <div className="concept-flow">

            <div className="concept-node">
              <span>🚪</span>
              <strong>Room</strong>
              <small>Destination</small>
            </div>

            <div className="concept-arrow">
              →
            </div>

            <div className="concept-node">
              <span>📍</span>
              <strong>Waypoint</strong>
              <small>Navigation point</small>
            </div>

            <div className="concept-arrow">
              →
            </div>

            <div className="concept-node">
              <span>🔗</span>
              <strong>Connection</strong>
              <small>Walkable path</small>
            </div>

            <div className="concept-arrow">
              →
            </div>

            <div className="concept-node highlighted">
              <span>🧭</span>
              <strong>Route</strong>
              <small>Navigation result</small>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="container guide-final-section">

        <div className="guide-final-cta">

          <div className="final-glow" />

          <div className="position-relative">

            <div className="final-icon">
              🚀
            </div>

            <h2>
              Ready to build your
              <span> first map?</span>
            </h2>

            <p>
              Follow the workflow, create your building,
              connect your navigation network and test
              it before publishing.
            </p>

            <div className="d-flex justify-content-center flex-wrap gap-3">

              <Link
                to="/dashboard"
                className="guide-primary-button"
              >
                🗺️ Open My Maps
                <span>→</span>
              </Link>

              <Link
                to="/about"
                className="guide-secondary-button"
              >
                Learn about UniversalNav
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          STYLES
      ====================================================== */}

      <style>
        {`

        /* =====================================================
           BASE
        ====================================================== */

        .universal-guide {
          min-height: 100vh;

          color: #183653;

          background:
            radial-gradient(
              circle at 8% 0%,
              rgba(37,131,237,.07),
              transparent 28%
            ),
            radial-gradient(
              circle at 92% 8%,
              rgba(0,174,239,.07),
              transparent 28%
            ),
            #f8fbff;
        }


        /* =====================================================
           HERO
        ====================================================== */

        .guide-hero {
          position: relative;

          overflow: hidden;

          padding:
            75px 0 65px;

          background:
            linear-gradient(
              135deg,
              #ffffff,
              #f2f8ff
            );

          border-bottom:
            1px solid #e0ebf5;
        }

        .guide-hero-glow {
          position: absolute;

          width: 360px;
          height: 360px;

          border-radius: 50%;

          filter: blur(75px);

          pointer-events: none;
        }

        .guide-glow-one {
          left: -180px;
          top: -200px;

          background:
            rgba(37,131,237,.09);
        }

        .guide-glow-two {
          right: -150px;
          bottom: -220px;

          background:
            rgba(0,174,239,.09);
        }

        .guide-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          padding:
            9px 15px;

          border-radius: 999px;

          color: #1478d6;

          background: #edf7ff;

          border:
            1px solid #cfe7f8;

          font-size: 13px;
          font-weight: 750;
        }

        .guide-title {
          margin-top: 22px;
          margin-bottom: 20px;

          color: #10254a;

          font-size:
            clamp(2.8rem, 5vw, 4.6rem);

          line-height: 1.05;

          letter-spacing: -3px;

          font-weight: 850;
        }

        .guide-title span {
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

        .guide-subtitle {
          max-width: 730px;

          margin: 0;

          color: #6d8197;

          font-size: 17px;

          line-height: 1.75;
        }


        /* =====================================================
           WORKFLOW CARD
        ====================================================== */

        .guide-workflow-card {
          padding: 25px;

          border-radius: 20px;

          background: rgba(255,255,255,.9);

          border:
            1px solid #d9e7f2;

          box-shadow:
            0 15px 40px
            rgba(31,82,125,.07);
        }

        .workflow-label {
          color: #7790a6;

          font-size: 10px;
          font-weight: 800;

          letter-spacing: 1.3px;

          margin-bottom: 18px;
        }

        .workflow-steps {
          display: flex;
          align-items: center;
        }

        .workflow-step {
          display: flex;
          flex-direction: column;
          align-items: center;

          gap: 5px;

          color: #70859a;

          font-size: 12px;
          font-weight: 700;
        }

        .workflow-step span {
          width: 31px;
          height: 31px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: #f0f5f9;

          color: #7890a4;

          font-size: 9px;
        }

        .workflow-step.active {
          color: #167ce1;
        }

        .workflow-step.active span {
          color: white;

          background:
            linear-gradient(
              135deg,
              #1677e8,
              #00a8e8
            );

          box-shadow:
            0 6px 15px
            rgba(22,119,232,.18);
        }

        .workflow-line {
          flex: 1;

          height: 1px;

          margin:
            0 8px 18px;

          background: #d7e5ef;
        }

        .workflow-caption {
          margin-top: 18px;

          padding-top: 15px;

          border-top:
            1px solid #e4edf4;

          color: #8a9bad;

          font-size: 11px;

          text-align: center;
        }


        /* =====================================================
           PROGRESS
        ====================================================== */

        .guide-progress-section {
          padding:
            18px 0 8px;

          background: white;

          border-bottom:
            1px solid #e5edf4;
        }

        .guide-progress-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 8px;
        }

        .guide-progress-top > div:first-child {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .guide-progress-top span {
          color: #1680df;

          font-size: 9px;
          font-weight: 800;

          letter-spacing: 1px;
        }

        .guide-progress-top strong {
          color: #61778d;

          font-size: 11px;
        }

        .progress-percent {
          color: #167ce1;

          font-size: 12px;
          font-weight: 800;
        }

        .guide-progress {
          height: 3px;

          overflow: hidden;

          border-radius: 10px;

          background: #e8f0f6;
        }

        .guide-progress-fill {
          height: 100%;

          border-radius: inherit;

          background:
            linear-gradient(
              90deg,
              #1677e8,
              #00afe8
            );

          transition:
            width .3s ease;
        }


        /* =====================================================
           MAIN
        ====================================================== */

        .guide-main {
          padding-top: 45px;
          padding-bottom: 25px;
        }


        /* =====================================================
           SIDEBAR
        ====================================================== */

        .guide-sidebar {
          position: sticky;

          top: 90px;

          padding: 18px;

          max-height:
            calc(100vh - 110px);

          overflow-y: auto;

          border-radius: 18px;

          background: white;

          border:
            1px solid #dfeaf3;

          box-shadow:
            0 10px 30px
            rgba(34,80,120,.055);
        }

        .sidebar-heading {
          padding:
            4px 9px 15px;

          color: #167ddc;

          font-size: 10px;
          font-weight: 850;

          letter-spacing: 1.2px;
        }

        .sidebar-category {
          margin-bottom: 16px;
        }

        .sidebar-category-title {
          padding:
            0 9px 6px;

          color: #8a9bad;

          font-size: 9px;
          font-weight: 800;

          letter-spacing: .8px;
        }

        .guide-nav-item {
          width: 100%;

          display: grid;

          grid-template-columns:
            25px 25px 1fr;

          align-items: center;

          gap: 4px;

          border: 0;

          border-radius: 10px;

          padding:
            9px;

          margin-bottom: 2px;

          color: #60758b;

          background: transparent;

          text-align: left;

          font-size: 11px;

          transition:
            background .18s ease,
            color .18s ease,
            transform .18s ease;
        }

        .guide-nav-item:hover {
          background: #f1f8fd;

          color: #167ce1;

          transform:
            translateX(2px);
        }

        .guide-nav-item.active {
          color: #167ce1;

          background:
            linear-gradient(
              90deg,
              #edf7ff,
              #f6fbff
            );

          box-shadow:
            inset 3px 0 0 #1680df;
        }

        .guide-nav-number {
          font-size: 9px;

          color: #99aabd;
        }

        .guide-nav-item.active
        .guide-nav-number {
          color: #1680df;
          font-weight: 800;
        }

        .guide-nav-icon {
          font-size: 14px;
        }

        .guide-nav-title {
          line-height: 1.25;
        }


        /* =====================================================
           CONTENT CARD
        ====================================================== */

        .guide-content-card {
          overflow: hidden;

          border-radius: 22px;

          background: white;

          border:
            1px solid #dce8f2;

          box-shadow:
            0 15px 45px
            rgba(31,78,117,.065);
        }

        .guide-content-header {
          display: flex;
          align-items: flex-start;

          gap: 22px;

          padding:
            35px 38px;

          background:
            linear-gradient(
              135deg,
              #ffffff,
              #f5faff
            );

          border-bottom:
            1px solid #e4edf4;
        }

        .content-icon {
          flex-shrink: 0;

          width: 70px;
          height: 70px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 18px;

          background:
            linear-gradient(
              135deg,
              #eaf6ff,
              #f2fbff
            );

          border:
            1px solid #cfe7f7;

          box-shadow:
            0 8px 20px
            rgba(35,105,158,.07);

          font-size: 31px;
        }

        .content-heading {
          min-width: 0;
        }

        .content-meta {
          display: flex;
          align-items: center;
          gap: 7px;

          margin-bottom: 7px;

          color: #1680df;

          font-size: 10px;
          font-weight: 850;

          letter-spacing: .8px;
        }

        .content-meta span {
          color: #a2b4c4;
        }

        .content-heading h2 {
          margin: 0 0 8px;

          color: #142e4d;

          font-size:
            clamp(1.65rem, 3vw, 2.25rem);

          letter-spacing: -1px;

          font-weight: 800;
        }

        .content-heading p {
          max-width: 700px;

          margin: 0;

          color: #74889c;

          font-size: 14px;

          line-height: 1.7;
        }


        /* =====================================================
           STEPS
        ====================================================== */

        .guide-steps-section {
          padding:
            32px 38px 38px;
        }

        .steps-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 27px;
        }

        .steps-heading > div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .steps-heading-icon {
          width: 27px;
          height: 27px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          color: #1680df;

          background: #edf7ff;

          font-size: 12px;
          font-weight: 800;
        }

        .steps-heading h3 {
          margin: 0;

          color: #203d5b;

          font-size: 16px;
          font-weight: 750;
        }

        .steps-count {
          color: #899bad;

          font-size: 10px;

          padding:
            6px 9px;

          border-radius: 999px;

          background: #f4f7fa;

          border:
            1px solid #e3ebf2;
        }

        .step-list {
          position: relative;
        }

        .guide-step {
          position: relative;

          display: flex;

          gap: 17px;

          min-height: 60px;

          padding-bottom: 17px;
        }

        .step-number {
          position: relative;

          z-index: 2;

          flex-shrink: 0;

          width: 31px;
          height: 31px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          color: #167ce1;

          background: #edf7ff;

          border:
            1px solid #cde6f8;

          font-size: 11px;
          font-weight: 800;
        }

        .step-connector {
          position: absolute;

          left: 15px;
          top: 31px;
          bottom: 0;

          width: 1px;

          background:
            #dce9f2;
        }

        .guide-step:last-child
        .step-connector {
          display: none;
        }

        .step-content {
          padding-top: 6px;

          color: #506a83;

          font-size: 14px;

          line-height: 1.65;
        }


        /* =====================================================
           TIP
        ====================================================== */

        .guide-tip {
          display: flex;
          align-items: flex-start;

          gap: 13px;

          margin-top: 18px;

          padding: 17px;

          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              #fff9ec,
              #fffdf8
            );

          border:
            1px solid #f3dfb4;
        }

        .tip-icon {
          width: 34px;
          height: 34px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background: #fff2cf;

          font-size: 16px;
        }

        .guide-tip strong {
          display: block;

          margin-bottom: 3px;

          color: #a16a08;

          font-size: 12px;
        }

        .guide-tip p {
          margin: 0;

          color: #806f50;

          font-size: 12px;

          line-height: 1.6;
        }


        /* =====================================================
           NAVIGATION
        ====================================================== */

        .guide-navigation {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 20px;

          margin-top: 32px;
          padding-top: 25px;

          border-top:
            1px solid #e4edf4;
        }

        .guide-nav-button {
          min-width: 160px;

          display: flex;
          align-items: center;

          gap: 11px;

          padding:
            10px 13px;

          border-radius: 11px;

          border:
            1px solid #d7e4ee;

          background: white;

          color: #557089;

          text-align: left;

          transition:
            all .2s ease;
        }

        .guide-nav-button:hover:not(:disabled) {
          border-color: #a9d0ed;

          color: #167ce1;

          background: #f5faff;

          transform:
            translateY(-2px);
        }

        .guide-nav-button:disabled {
          opacity: .4;

          cursor: not-allowed;
        }

        .guide-nav-button > span {
          font-size: 18px;
        }

        .guide-nav-button small {
          display: block;

          color: #95a6b6;

          font-size: 9px;

          margin-bottom: 2px;
        }

        .guide-nav-button strong {
          display: block;

          max-width: 120px;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;

          font-size: 11px;
        }

        .guide-nav-button.next {
          text-align: right;

          justify-content: flex-end;
        }

        .guide-page-indicator {
          display: flex;
          align-items: center;
          gap: 5px;

          color: #91a3b3;

          font-size: 11px;
          font-weight: 700;
        }

        .guide-page-indicator span:first-child {
          color: #167ce1;

          font-size: 15px;
        }

        .guide-page-indicator i {
          font-style: normal;
        }


        /* =====================================================
           CONCEPT
        ====================================================== */

        .guide-concept-section {
          padding:
            45px 0 25px;
        }

        .guide-concept {
          position: relative;

          overflow: hidden;

          padding:
            48px 40px;

          border-radius: 24px;

          background:
            linear-gradient(
              135deg,
              #edf7ff,
              #f7fcff
            );

          border:
            1px solid #cfe5f6;

          box-shadow:
            0 15px 40px
            rgba(35,90,135,.06);
        }

        .concept-header {
          text-align: center;

          max-width: 700px;

          margin:
            0 auto 38px;
        }

        .concept-label {
          color: #167edc;

          font-size: 10px;
          font-weight: 850;

          letter-spacing: 1.2px;
        }

        .concept-header h2 {
          margin:
            9px 0 10px;

          color: #122d4d;

          font-size:
            clamp(1.8rem, 4vw, 2.5rem);

          letter-spacing: -1px;

          font-weight: 800;
        }

        .concept-header h2 span {
          color: #1680df;
        }

        .concept-header p {
          margin: 0;

          color: #74889d;

          font-size: 14px;

          line-height: 1.7;
        }

        .concept-flow {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 12px;
        }

        .concept-node {
          min-width: 135px;

          padding:
            18px 14px;

          display: flex;
          align-items: center;
          flex-direction: column;

          border-radius: 15px;

          background: white;

          border:
            1px solid #d8e7f2;

          box-shadow:
            0 7px 20px
            rgba(35,87,130,.05);
        }

        .concept-node.highlighted {
          border-color: #9fcfee;

          box-shadow:
            0 9px 25px
            rgba(25,126,216,.10);
        }

        .concept-node > span {
          font-size: 24px;

          margin-bottom: 8px;
        }

        .concept-node strong {
          color: #27455f;

          font-size: 13px;
        }

        .concept-node small {
          margin-top: 3px;

          color: #8b9eae;

          font-size: 9px;
        }

        .concept-arrow {
          color: #5b9bd0;

          font-size: 20px;
          font-weight: 700;
        }


        /* =====================================================
           FINAL CTA
        ====================================================== */

        .guide-final-section {
          padding:
            45px 0 80px;
        }

        .guide-final-cta {
          position: relative;

          overflow: hidden;

          padding:
            65px 25px;

          text-align: center;

          border-radius: 25px;

          background:
            linear-gradient(
              135deg,
              #f0f8ff,
              #f7fcff
            );

          border:
            1px solid #cfe5f6;

          box-shadow:
            0 20px 50px
            rgba(30,82,125,.07);
        }

        .final-glow {
          position: absolute;

          width: 300px;
          height: 300px;

          left: 50%;
          top: -200px;

          transform:
            translateX(-50%);

          border-radius: 50%;

          background:
            rgba(37,131,237,.10);

          filter: blur(55px);
        }

        .final-icon {
          position: relative;

          width: 62px;
          height: 62px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin:
            0 auto 18px;

          border-radius: 17px;

          background:
            linear-gradient(
              135deg,
              #1677e8,
              #00a8e8
            );

          box-shadow:
            0 12px 30px
            rgba(22,119,232,.20);

          font-size: 27px;
        }

        .guide-final-cta h2 {
          position: relative;

          color: #10254a;

          font-size:
            clamp(2rem, 4vw, 3rem);

          letter-spacing: -1.5px;

          font-weight: 800;
        }

        .guide-final-cta h2 span {
          color: #1680df;
        }

        .guide-final-cta p {
          position: relative;

          max-width: 600px;

          margin:
            0 auto 28px;

          color: #72869a;

          line-height: 1.7;

          font-size: 14px;
        }

        .guide-primary-button,
        .guide-secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 9px;

          min-height: 49px;

          padding:
            11px 19px;

          border-radius: 11px;

          text-decoration: none;

          font-size: 13px;
          font-weight: 750;

          transition:
            all .2s ease;
        }

        .guide-primary-button {
          color: white;

          background:
            linear-gradient(
              135deg,
              #1677e8,
              #00a8e8
            );

          box-shadow:
            0 10px 25px
            rgba(22,119,232,.18);
        }

        .guide-primary-button:hover {
          color: white;

          transform:
            translateY(-2px);

          box-shadow:
            0 14px 30px
            rgba(22,119,232,.25);
        }

        .guide-secondary-button {
          color: #294761;

          background: white;

          border:
            1px solid #caddeb;
        }

        .guide-secondary-button:hover {
          color: #167ce1;

          background: #f5faff;

          border-color: #a9d0ed;

          transform:
            translateY(-2px);
        }


        /* =====================================================
           RESPONSIVE
        ====================================================== */

        @media (max-width: 991px) {

          .guide-hero {
            padding:
              60px 0 50px;
          }

          .guide-sidebar {
            position: relative;

            top: 0;

            max-height: none;

            margin-bottom: 5px;
          }

          .guide-nav-item {
            grid-template-columns:
              30px 30px 1fr;
          }

          .concept-flow {
            flex-wrap: wrap;
          }

        }


        @media (max-width: 767px) {

          .guide-title {
            font-size: 2.65rem;

            letter-spacing: -2px;
          }

          .guide-subtitle {
            font-size: 15px;
          }

          .guide-workflow-card {
            margin-top: 10px;
          }

          .guide-content-header {
            padding:
              27px 24px;

            gap: 16px;
          }

          .content-icon {
            width: 56px;
            height: 56px;

            font-size: 25px;
          }

          .guide-steps-section {
            padding:
              27px 24px 30px;
          }

          .guide-navigation {
            align-items: stretch;

            flex-direction: column;
          }

          .guide-nav-button {
            width: 100%;

            justify-content: flex-start;
          }

          .guide-nav-button.next {
            justify-content: flex-end;
          }

          .guide-page-indicator {
            order: -1;

            justify-content: center;
          }

          .guide-concept {
            padding:
              35px 20px;
          }

          .concept-flow {
            flex-direction: column;
          }

          .concept-arrow {
            transform:
              rotate(90deg);
          }

          .concept-node {
            width: 100%;
            max-width: 250px;
          }

        }


        @media (max-width: 480px) {

          .guide-hero {
            padding:
              45px 0;
          }

          .guide-title {
            font-size: 2.25rem;
          }

          .guide-eyebrow {
            font-size: 11px;
          }

          .guide-progress-top
          > div:first-child {
            flex-direction: column;

            align-items: flex-start;

            gap: 2px;
          }

          .guide-content-header {
            flex-direction: column;
          }

          .content-heading h2 {
            font-size: 1.65rem;
          }

          .guide-tip {
            padding: 14px;
          }

          .guide-final-cta {
            padding:
              50px 20px;
          }

          .guide-primary-button,
          .guide-secondary-button {
            width: 100%;
          }

        }

        `}
      </style>

    </main>
  );
}