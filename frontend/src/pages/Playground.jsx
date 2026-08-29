import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

export default function Playground() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [buildingTitle, setBuildingTitle] = useState('New Building Map');
  const [buildingDescription, setBuildingDescription] = useState('');
  const [totalFloors, setTotalFloors] = useState(1);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing map if editing an existing building ID
  useEffect(() => {
    if (id && !id.includes('isNew=true')) {
      setLoading(true);
      fetch(`${API_URL}/maps/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setBuildingTitle(data.title || 'Untitled Map');
            setBuildingDescription(data.description || '');
            setTotalFloors(data.totalFloors || 1);
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error loading map from database:', err);
          setLoading(false);
        });
    }
  }, [id]);

  // Save or Publish handler
  const handleSaveMap = async (statusType) => {
    const cleanId = id ? id.split('?')[0] : `map_${Date.now()}`;
    
    const payload = {
      buildingId: cleanId,
      title: buildingTitle,
      description: buildingDescription,
      status: statusType, // 'draft' or 'completed'
      totalFloors: totalFloors,
      nodes: nodes,
      edges: edges
    };

    try {
      const response = await fetch(`${API_URL}/maps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        alert(`Map successfully saved to MongoDB as ${statusType}! 🎉`);
        navigate('/dashboard');
      } else {
        alert('Failed to save map.');
      }
    } catch (error) {
      console.error('Server network error:', error);
      alert('Could not connect to backend server on port 5000.');
    }
  };

  if (loading) {
    return (
      <div className="bg-dark text-light d-flex justify-content-center align-items-center vh-100">
        <h3>Loading map workspace...</h3>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-dark text-light min-vh-100 p-4">
      {/* Top Action Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
        <div>
          <input
            type="text"
            className="form-control bg-transparent text-white border-0 fs-4 fw-bold shadow-none"
            value={buildingTitle}
            onChange={(e) => setBuildingTitle(e.target.value)}
            placeholder="Enter Building Name..."
          />
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-warning fw-bold px-4"
            onClick={() => handleSaveMap('draft')}
          >
            Save Draft
          </button>
          <button
            className="btn btn-success fw-bold px-4"
            onClick={() => handleSaveMap('completed')}
          >
            Publish Complete
          </button>
          <button
            className="btn btn-outline-secondary px-3"
            onClick={() => navigate('/dashboard')}
          >
            Close
          </button>
        </div>
      </div>

      {/* Editor Content Layout */}
      <div className="row g-4">
        <div className="col-md-3">
          <div className="p-3 bg-black rounded-4 border border-secondary border-opacity-25">
            <h5 className="text-info mb-3">Map Properties</h5>
            <div className="mb-3">
              <label className="form-label small text-secondary">Description</label>
              <textarea
                className="form-control bg-dark text-white border-secondary"
                rows="3"
                value={buildingDescription}
                onChange={(e) => setBuildingDescription(e.target.value)}
                placeholder="Add building description..."
              />
            </div>
            <div className="mb-3">
              <label className="form-label small text-secondary">Total Floors</label>
              <input
                type="number"
                className="form-control bg-dark text-white border-secondary"
                value={totalFloors}
                onChange={(e) => setTotalFloors(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="text-secondary small">
              <p className="mb-1">📍 Waypoints: {nodes.length}</p>
              <p className="mb-0">🔗 Pathways: {edges.length}</p>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="col-md-9">
          <div
            className="rounded-4 bg-black border border-secondary border-opacity-25 d-flex align-items-center justify-content-center position-relative"
            style={{ height: '70vh' }}
          >
            <div className="text-center text-secondary">
              <h5>Interactive Canvas Workspace</h5>
              <p className="small mb-0">Place nodes and draw edges here. Click "Save Draft" or "Publish Complete" above to store everything securely in MongoDB.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
