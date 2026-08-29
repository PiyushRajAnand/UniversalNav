import React from 'react';
import { COMPONENT_ICONS } from './BlueprintCanvas';

export default function PropertyPanel({ selectedElement, onUpdateElement, onDeleteElement, onClose }) {
  if (!selectedElement) return null;

  const handleChange = (field, value) => {
    onUpdateElement({
      ...selectedElement,
      [field]: value
    });
  };

  return (
    <div className="glass-panel p-3" style={{ width: '320px', height: '100%', overflowY: 'auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
        <h6 className="fw-bold mb-0 text-light">
          {COMPONENT_ICONS[selectedElement.type]} {selectedElement.type} Inspector
        </h6>
        <button className="btn-close btn-close-white" onClick={onClose} />
      </div>

      {/* Basic Info */}
      <div className="mb-3">
        <label className="form-label text-muted small">Name</label>
        <input
          type="text"
          className="form-control bg-dark text-light border-secondary btn-sm"
          value={selectedElement.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      <div className="row mb-3">
        <div className="col-6">
          <label className="form-label text-muted small">Room/Unit #</label>
          <input
            type="text"
            className="form-control bg-dark text-light border-secondary btn-sm"
            value={selectedElement.roomNumber || ''}
            onChange={(e) => handleChange('roomNumber', e.target.value)}
          />
        </div>
        <div className="col-6">
          <label className="form-label text-muted small">Capacity</label>
          <input
            type="number"
            className="form-control bg-dark text-light border-secondary btn-sm"
            value={selectedElement.capacity || 0}
            onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label text-muted small">Department / Owner</label>
        <input
          type="text"
          className="form-control bg-dark text-light border-secondary btn-sm"
          value={selectedElement.department || ''}
          onChange={(e) => handleChange('department', e.target.value)}
        />
      </div>

      {/* Visual Options */}
      <div className="mb-3">
        <label className="form-label text-muted small">Fill Color</label>
        <input
          type="color"
          className="form-control form-control-color bg-dark border-secondary w-100"
          value={selectedElement.color || '#1e293b'}
          onChange={(e) => handleChange('color', e.target.value)}
        />
      </div>

      <div className="row mb-3">
        <div className="col-6">
          <label className="form-label text-muted small">Width (px)</label>
          <input
            type="number"
            className="form-control bg-dark text-light border-secondary btn-sm"
            value={selectedElement.width || 100}
            onChange={(e) => handleChange('width', parseInt(e.target.value))}
          />
        </div>
        <div className="col-6">
          <label className="form-label text-muted small">Height (px)</label>
          <input
            type="number"
            className="form-control bg-dark text-light border-secondary btn-sm"
            value={selectedElement.height || 80}
            onChange={(e) => handleChange('height', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label text-muted small">Rotation (Degrees)</label>
        <input
          type="range"
          min="0"
          max="360"
          className="form-range"
          value={selectedElement.rotation || 0}
          onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
        />
      </div>

      <button
        onClick={() => onDeleteElement(selectedElement._id || selectedElement.id)}
        className="btn btn-outline-danger w-100 btn-sm"
      >
        Remove Component
      </button>
    </div>
  );
}
