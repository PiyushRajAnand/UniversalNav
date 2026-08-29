import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const API_URL = 'http://localhost:5000/api';

export default function Dashboard() {
  const navigate = useNavigate();

  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  // QR modal state
  const [qrMap, setQrMap] = useState(null);
  const qrRef = useRef(null);

  // Backend is the source of truth. Local storage is only an offline recovery path.
  useEffect(() => {
    let cancelled = false;

    const loadMaps = async () => {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        const res = await fetch(`${API_URL}/maps`, {
          method: 'GET', headers, credentials: 'include'
        });
        if (!res.ok) throw new Error(`Maps request failed with ${res.status}`);
        const data = await res.json();
        let backendMaps = [];
        if (Array.isArray(data)) backendMaps = data;
        else if (Array.isArray(data?.maps)) backendMaps = data.maps;
        else if (Array.isArray(data?.data)) backendMaps = data.data;
        if (!cancelled) { setMaps(backendMaps); setLoading(false); }
      } catch (err) {
        console.warn('Backend maps unavailable; using local cache only:', err);
        const localMaps = JSON.parse(
          localStorage.getItem('universal_maps') ||
          localStorage.getItem('maps') ||
          localStorage.getItem('building_maps') ||
          '[]'
        );
        if (!cancelled) { setMaps(Array.isArray(localMaps) ? localMaps : []); setLoading(false); }
      }
    };

    loadMaps();
    return () => { cancelled = true; };
  }, []);

  const counts = {
    draft: maps.filter((m) => (m.status || 'draft') === 'draft').length,

    completed: maps.filter(
      (m) => m.status === 'completed' || m.status === 'published'
    ).length,

    archived: maps.filter((m) => m.status === 'archived').length
  };

  const handleDelete = async (mapOrId) => {
    if (!window.confirm('Are you sure you want to delete this map?')) return;

    const map = typeof mapOrId === 'object' ? mapOrId : { buildingId: mapOrId };
    const candidates = [map._id, map.buildingId, map.id]
      .filter(Boolean).map(String)
      .filter((value, index, arr) => arr.indexOf(value) === index);

    if (!candidates.length) { alert('Cannot delete this map: map ID is missing.'); return; }

    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('authToken');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let deleted = false;
    let lastStatus = null;

    try {
      for (const candidate of candidates) {
        const res = await fetch(`${API_URL}/maps/${encodeURIComponent(candidate)}`, {
          method: 'DELETE', headers, credentials: 'include'
        });
        lastStatus = res.status;
        if (res.ok) { deleted = true; break; }
        if (res.status !== 404) break;
      }

      if (!deleted) {
        if (lastStatus === 401) alert('Your session has expired. Please login again.');
        else if (lastStatus === 403) alert('You do not have permission to delete this map.');
        else alert('Map could not be deleted from the server. It was not removed locally.');
        return;
      }

      const ids = new Set(candidates);
      const matchesMap = (m) => [m?._id, m?.buildingId, m?.id]
        .filter(Boolean).map(String).some((value) => ids.has(value));
      setMaps((prev) => prev.filter((m) => !matchesMap(m)));

      for (const key of ['universal_maps', 'maps', 'building_maps', 'user_building_maps']) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) continue;
          localStorage.setItem(key, JSON.stringify(parsed.filter((m) => !matchesMap(m))));
        } catch (cacheError) { console.warn(`Could not clean ${key}:`, cacheError); }
      }

      for (const id of candidates) {
        localStorage.removeItem(`map_draft_${id}`);
        localStorage.removeItem(`map_versions_${id}`);
      }
    } catch (err) {
      console.error('Map delete request failed:', err);
      alert('Unable to reach the server. The map was not deleted.');
    }
  };

  // Get the ID used by the map
  const getMapId = (map) => {
    return map._id || map.buildingId || map.id;
  };

  // Generate public URL for QR
  const getPublicMapUrl = (map) => {
    const mapId = getMapId(map);

    return `${window.location.origin}/map/${mapId}`;
  };

  // Copy public navigation URL
  const handleCopyLink = async () => {
    if (!qrMap) return;

    const url = getPublicMapUrl(qrMap);

    try {
      await navigator.clipboard.writeText(url);
      alert('Navigation link copied!');
    } catch (err) {
      console.warn('Could not copy link:', err);
    }
  };

  // Download QR code
  const handleDownloadQR = () => {
    if (!qrRef.current || !qrMap) return;

    const canvas = qrRef.current.querySelector('canvas');

    if (!canvas) return;

    const mapName =
      qrMap.title ||
      qrMap.name ||
      'building-map';

    const link = document.createElement('a');

    link.download = `${mapName
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()}-qr.png`;

    link.href = canvas.toDataURL('image/png');

    link.click();
  };

  if (loading) {
    return (
      <div
        className="flex-grow-1 bg-dark text-light d-flex justify-content-center align-items-center py-5"
        style={{ minHeight: '80vh' }}
      >
        <h4>Loading your maps... ⚡</h4>
      </div>
    );
  }

  return (
    <div
      className="flex-grow-1 text-light py-5 px-3 px-md-5 position-relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top, #0f172a 0%, #020617 70%, #000000 100%)',
        minHeight: 'calc(100vh - 65px)'
      }}
    >
      <div
        className="container-fluid"
        style={{ maxWidth: '1240px' }}
      >

        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-5">
          <div>
            <h2 className="fw-black text-white m-0">
              My Building Maps
            </h2>

            <p className="text-secondary small mb-0 mt-1">
              Manage your indoor navigation networks and multi-floor
              pathfinding blueprints.
            </p>
          </div>

          <button
            className="btn fw-bold px-4 py-3 text-white border-0 shadow-lg"
            style={{
              background:
                'linear-gradient(135deg, #00d2ff 0%, #0066ff 100%)',
              borderRadius: '12px'
            }}
            onClick={() =>
              navigate(`/editor/map_${Date.now()}?isNew=true`)
            }
          >
            + Create New Map
          </button>
        </div>

        {/* Status Counters */}
        <div className="row g-4 mb-5">

          <div className="col-md-4">
            <div className="p-4 rounded-4 bg-dark border border-warning border-opacity-25">
              <span className="text-warning fw-bold fs-7">
                DRAFTS IN PROGRESS
              </span>

              <h1 className="display-4 fw-black text-white mb-0">
                {counts.draft}
              </h1>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-4 rounded-4 bg-dark border border-success border-opacity-25">
              <span className="text-success fw-bold fs-7">
                PUBLISHED MAPS
              </span>

              <h1 className="display-4 fw-black text-white mb-0">
                {counts.completed}
              </h1>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-4 rounded-4 bg-dark border border-info border-opacity-25">
              <span className="text-info fw-bold fs-7">
                ARCHIVED PROJECTS
              </span>

              <h1 className="display-4 fw-black text-white mb-0">
                {counts.archived}
              </h1>
            </div>
          </div>

        </div>

        {/* Active Projects */}
        <h4 className="text-white mb-3">
          Active Projects ({maps.length})
        </h4>

        <div className="row g-4">

          {maps.length === 0 ? (
            <div className="col-12 text-center py-5 text-secondary border border-secondary rounded-4 border-opacity-25 bg-dark">
              <h5>No Maps Created Yet</h5>

              <p className="small mb-0">
                Click "+ Create New Map" above to get started.
              </p>
            </div>
          ) : (
            maps.map((map) => {

              const mapId = getMapId(map);

              return (
                <div
                  key={mapId}
                  className="col-lg-6"
                >
                  <div className="p-4 rounded-4 bg-dark border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">

                    <div>

                      <div className="d-flex justify-content-between align-items-start mb-3">

                        <h4 className="fw-bold text-white mb-0">
                          {map.title ||
                            map.name ||
                            'Untitled Map'}
                        </h4>

                        <span className="badge bg-secondary text-uppercase">
                          {map.status || 'draft'}
                        </span>

                      </div>

                      <p className="text-secondary small mb-3">
                        {map.description ||
                          'No description provided.'}
                      </p>

                      <div className="d-flex gap-3 mb-4 text-secondary small">

                        <span>
                          🏢 {map.totalFloors || 1} Floor(s)
                        </span>

                        <span>
                          📍 {map.nodes?.length || 0} Waypoints
                        </span>

                      </div>

                    </div>

                    {/* Actions */}
                    <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-25">

                      <div className="d-flex gap-2">

                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() =>
                            handleDelete(map)
                          }
                        >
                          Delete
                        </button>

                        {/* QR BUTTON */}
                        <button
                          className="btn btn-outline-info btn-sm fw-bold"
                          onClick={() => setQrMap(map)}
                        >
                          📱 QR Code
                        </button>

                      </div>

                      <button
                        className="btn btn-info btn-sm fw-bold text-white"
                        onClick={() =>
                          navigate(`/editor/${mapId}`)
                        }
                      >
                        Open Editor ↗
                      </button>

                    </div>

                  </div>
                </div>
              );
            })
          )}

        </div>
      </div>

      {/* =====================================================
          QR CODE MODAL
          ===================================================== */}

      {qrMap && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            backdropFilter: 'blur(6px)'
          }}
          onClick={() => setQrMap(null)}
        >

          <div
            className="bg-dark text-white rounded-4 border border-secondary shadow-lg p-4"
            style={{
              width: 'min(92vw, 430px)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="d-flex justify-content-between align-items-start mb-3">

              <div>
                <h4 className="fw-bold mb-1">
                  📱 Scan to Navigate
                </h4>

                <p className="text-secondary small mb-0">
                  {qrMap.title ||
                    qrMap.name ||
                    'Building Map'}
                </p>
              </div>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setQrMap(null)}
              >
                ✕
              </button>

            </div>

            {/* QR */}
            <div
              ref={qrRef}
              className="bg-white rounded-4 p-4 d-flex justify-content-center align-items-center mb-4"
            >
              <QRCodeCanvas
                value={getPublicMapUrl(qrMap)}
                size={260}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Explanation */}
            <div className="text-center mb-3">

              <h6 className="fw-bold">
                Scan this QR code
              </h6>

              <p className="text-secondary small mb-0">
                Visitors can scan this code to open
                the public navigation map.
              </p>

            </div>

            {/* Public URL */}
            <div className="mb-3">

              <label className="form-label text-secondary small">
                Public Navigation Link
              </label>

              <div className="input-group">

                <input
                  type="text"
                  className="form-control bg-black text-white border-secondary"
                  value={getPublicMapUrl(qrMap)}
                  readOnly
                />

                <button
                  className="btn btn-info fw-bold"
                  onClick={handleCopyLink}
                >
                  Copy
                </button>

              </div>

            </div>

            {/* Actions */}
            <div className="d-flex gap-2">

              <button
                className="btn btn-info text-white fw-bold flex-grow-1"
                onClick={handleDownloadQR}
              >
                ⬇ Download QR
              </button>

              <button
                className="btn btn-outline-light fw-bold"
                onClick={() => setQrMap(null)}
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}