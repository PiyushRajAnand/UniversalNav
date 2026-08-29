import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function CreateBuildingModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    category: 'College / University',
    totalFloors: 1,
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalFloors' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Fallback to a valid 24-character hexadecimal ObjectId
    const validOwnerId = user?._id && user._id !== 'mock-user-123'
      ? user._id
      : '507f1f77bcf86cd799439011';

    try {
      const response = await fetch('/api/buildings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': validOwnerId
        },
        body: JSON.stringify({
          ...formData,
          owner: validOwnerId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create building');
      }

      onClose();
      // Redirect straight to the newly created building map editor
      navigate(`/editor/${data._id}`);
    } catch (err) {
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-light border border-secondary shadow-lg">
          <div className="modal-header border-secondary">
            <h5 className="modal-title fw-bold">Create New Building Map</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">Building Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control bg-secondary text-light border-0"
                  placeholder="e.g. Science Block A"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Category *</label>
                  <select
                    name="category"
                    className="form-select bg-secondary text-light border-0"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="College / University">College / University</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Shopping Mall">Shopping Mall</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Number of Floors *</label>
                  <input
                    type="number"
                    name="totalFloors"
                    className="form-control bg-secondary text-light border-0"
                    min="1"
                    max="50"
                    value={formData.totalFloors}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">Description (Optional)</label>
                <textarea
                  name="description"
                  className="form-control bg-secondary text-light border-0"
                  rows="3"
                  placeholder="Provide additional details..."
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer border-secondary">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Initializing Maps...' : 'Create Map'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
