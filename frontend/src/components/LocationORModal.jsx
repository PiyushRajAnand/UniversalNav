import React from 'react';

export default function LocationQRModal({ room, buildingId, onClose }) {
  if (!room) return null;

  const qrUrl = `${window.location.origin}/editor/${buildingId}?startNode=${room.waypointId}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center" 
      style={{ zIndex: 1050 }}
    >
      <div className="bg-dark text-light border border-info rounded p-4 text-center shadow-lg" style={{ maxWidth: '320px' }}>
        <h6 className="fw-bold text-info mb-1">📍 "You Are Here" QR Code</h6>
        <p className="small text-secondary mb-3">{room.name} ({room.floor})</p>

        <img 
          src={qrImageSrc} 
          alt="Location QR Code" 
          className="img-fluid border p-2 bg-white rounded mb-3" 
        />

        <input
          type="text"
          className="form-control form-control-sm bg-secondary text-light border-0 text-center mb-3"
          value={qrUrl}
          readOnly
        />

        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-light w-100"
            onClick={() => {
              navigator.clipboard.writeText(qrUrl);
              alert('Location URL copied to clipboard!');
            }}
          >
            📋 Copy Link
          </button>
          <button className="btn btn-sm btn-primary w-100" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
