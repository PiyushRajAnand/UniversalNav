import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div
      className="flex-grow-1 text-light d-flex align-items-center position-relative overflow-hidden"
      style={{
        minHeight: 'calc(100vh - 65px)',
        backgroundImage: `linear-gradient(to right, rgba(2, 6, 23, 0.85) 30%, rgba(2, 6, 23, 0.2) 100%), url('/hero-bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="container px-4 px-lg-5 position-relative z-1 py-5">
        <div className="row">
          <div className="col-lg-6 col-md-8">
            {/* Tag / Pill */}
            <div className="mb-4">
              <span className="badge bg-dark bg-opacity-75 text-info border border-info border-opacity-50 px-3 py-2 rounded-pill fs-6 fw-normal d-inline-flex align-items-center gap-2">
                <span className="text-info">🚀</span> Next-Gen Indoor Navigation & Pathfinding
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="display-4 fw-bold text-white mb-3 lh-sm">
              Precision Indoor Mapping with <br />
              <span className="text-info" style={{ color: '#00d2ff' }}>UniversalNav</span>
            </h1>

            {/* Subtitle */}
            <p className="lead text-secondary mb-4 fs-5" style={{ maxWidth: '480px' }}>
              Design, edit, and simulate interactive floor plans with customizable distances, cross-floor routing, and turn-by-turn navigation engine.
            </p>

            {/* CTA Button (Single Option) */}
            <div className="mb-5">
              <Link
                to="/dashboard"
                className="btn btn-info btn-lg fw-bold px-4 py-3 shadow-lg text-white border-0 d-inline-flex align-items-center gap-2"
                style={{
                  background: 'linear-gradient(90deg, #00b4db 0%, #0083b0 100%)',
                  borderRadius: '10px'
                }}
              >
                Go to My Maps 🗺️
              </Link>
            </div>

            {/* Bottom Feature Badges */}
            <div className="row g-4 pt-3 border-top border-secondary border-opacity-25" style={{ maxWidth: '520px' }}>
              <div className="col-3 text-start">
                <div className="text-info fs-5 mb-1">📍</div>
                <div className="small fw-semibold text-light">Accurate Mapping</div>
              </div>
              <div className="col-3 text-start">
                <div className="text-info fs-5 mb-1">🏢</div>
                <div className="small fw-semibold text-light">Cross-Floor Routing</div>
              </div>
              <div className="col-3 text-start">
                <div className="text-info fs-5 mb-1">🧭</div>
                <div className="small fw-semibold text-light">Turn-by-Turn Navigation</div>
              </div>
              <div className="col-3 text-start">
                <div className="text-info fs-5 mb-1">⚙️</div>
                <div className="small fw-semibold text-light">Customizable Distances</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
