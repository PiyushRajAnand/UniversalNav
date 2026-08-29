import React from 'react';

export default function About() {
  return (
    <div className="container py-5 text-light" style={{ maxWidth: '800px' }}>
      <h2 className="fw-bold text-info mb-3">ℹ️ About UniversalNav</h2>
      <p className="lead text-secondary">
        UniversalNav is an end-to-end indoor navigation platform that helps users create, design, and simulate multi-floor building layouts.
      </p>
      <hr className="border-secondary my-4" />
      <h5 className="text-white mb-2">Key Features:</h5>
      <ul className="text-secondary">
        <li>Custom path distance inputs overriding pixel Euclidean calculations</li>
        <li>Multi-floor linking via elevator and stairway nodes</li>
        <li>GPU-accelerated path simulation playback with speed controls</li>
        <li>Automatic turn-by-turn instruction generation</li>
      </ul>
    </div>
  );
}
