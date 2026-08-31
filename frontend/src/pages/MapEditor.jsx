import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import API from '../services/api';
import { createPortal } from 'react-dom';
import BuildingBoundary from '../components/map/BuildingBoundary';

const COMPONENT_PALETTE = [
  { type: 'Room', label: 'Standard Room', color: '#FFFFFF', borderColor: '#1E293B' },
  { type: 'Classroom', label: 'Classroom', color: '#F8FAFC', borderColor: '#0284C7' },
  { type: 'Auditorium', label: 'Auditorium / Hall', color: '#FFFBEB', borderColor: '#D97706' },
  { type: 'Washroom', label: 'Washroom', color: '#7C3AED', borderColor: '#5B21B6' },
  { type: 'Stairs', label: 'Stairs', color: '#E0F2FE', borderColor: '#0369A1' },
  { type: 'Elevator', label: 'Elevator', color: '#FAE8FF', borderColor: '#A21CAF' },
  { type: 'EmergencyExit', label: 'Emergency Exit', color: '#FEF2F2', borderColor: '#B91C1C' },
  { type: 'Entrance', label: 'Main Entrance / Exit', color: '#ECFDF5', borderColor: '#047857' },
  { type: 'Cafeteria', label: 'Cafeteria / Food', color: '#FFEDD5', borderColor: '#C2410C' },
  { type: 'Lab', label: 'Laboratory', color: '#E0E7FF', borderColor: '#4338CA' },
  { type: 'Gym', label: 'Gymnasium', color: '#F0FDF4', borderColor: '#16A34A' },
  { type: 'Office', label: 'Main Office', color: '#FEF2F2', borderColor: '#DC2626' },
  { type: 'Storage', label: 'Storage / Utility', color: '#F3F4F6', borderColor: '#4B5563' }
];

const INITIAL_FLOORS = [
  'Lower Level',
  '1st FLOOR',
  '2nd FLOOR',
  '3rd FLOOR'
];

const PIXELS_TO_METERS = 0.1;

/*
 * ADDITIVE RESIZABLE OBJECT SUPPORT
 * ---------------------------------
 * Existing room fields (x, y, width, height) are preserved.
 * New maps may also store `rotation`.
 *
 * Old maps are safe because missing width/height/rotation values are
 * normalised when they are loaded. Nothing else in the routing model
 * is changed.
 */
const ROOM_SIZE_RULES = {
  Room: { width: 120, height: 80, minWidth: 24, minHeight: 20 },
  Classroom: { width: 150, height: 90, minWidth: 32, minHeight: 24 },
  Auditorium: { width: 220, height: 140, minWidth: 100, minHeight: 60 },
  Washroom: { width: 70, height: 55, minWidth: 24, minHeight: 20 },
  Stairs: { width: 80, height: 60, minWidth: 36, minHeight: 30 },
  Elevator: { width: 80, height: 60, minWidth: 36, minHeight: 30 },
  EmergencyExit: { width: 80, height: 60, minWidth: 36, minHeight: 30 },
  Entrance: { width: 120, height: 60, minWidth: 40, minHeight: 24 },
  Cafeteria: { width: 180, height: 100, minWidth: 60, minHeight: 36 },
  Lab: { width: 150, height: 90, minWidth: 40, minHeight: 28 },
  Gym: { width: 220, height: 140, minWidth: 80, minHeight: 50 },
  Office: { width: 120, height: 80, minWidth: 30, minHeight: 22 },
  Storage: { width: 100, height: 70, minWidth: 28, minHeight: 20 }
};

const getRoomSizeRule = (type) =>
  ROOM_SIZE_RULES[type] || ROOM_SIZE_RULES.Room;

const normaliseRoomForEditor = (room) => {
  const rule = getRoomSizeRule(room?.type);

  const safeNumber = (value, fallback) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;

  const width = Math.max(
    rule.minWidth,
    safeNumber(room?.width, rule.width)
  );

  const height = Math.max(
    rule.minHeight,
    safeNumber(room?.height, rule.height)
  );

  const rotation = safeNumber(room?.rotation, 0);

  return {
    ...room,
    width,
    height,
    rotation
  };
};

const getRoomIconForRoom = (room) => {
  const icons = {
    Room: '🚪',
    Classroom: '🎓',
    Auditorium: '🏛️',
    Washroom: '🚻',
    Stairs: '🪜',
    Elevator: '🛗',
    EmergencyExit: '🚨',
    Entrance: '🚪',
    Cafeteria: '🍽️',
    Lab: '🧪',
    Gym: '🏋️',
    Office: '💼',
    Storage: '📦',
    Library: '📚'
  };
  return icons[room?.type] || '📍';
};

const formatDistanceMeters = (meters) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

const formatEmergencyTime = (seconds) => {
  const safe = Math.max(0, Math.round(seconds || 0));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return minutes > 0 ? `${minutes} min ${secs.toString().padStart(2, '0')} sec` : `${secs} sec`;
};

/* ================================================================
   NEW: DESTINATION SEARCH COMPONENT
   Does not change your routing/data structure.
================================================================ */

function DestinationSearch({ rooms, selectedRoomId, onSelectRoom, getDistanceMeters }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [isOpen, setIsOpen] = useState(false);

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('universalnav_favorite_destinations') || '[]'
      );
    } catch {
      return [];
    }
  });

  const [recentRooms, setRecentRooms] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('universalnav_recent_destinations') || '[]'
      );
    } catch {
      return [];
    }
  });

  const categories = [
    { key: 'All', icon: '📍', label: 'All' },
    { key: 'Rooms', icon: '🚪', label: 'Rooms' },
    { key: 'Lab', icon: '🧪', label: 'Labs' },
    { key: 'Cafeteria', icon: '🍽️', label: 'Food' },
    { key: 'Washroom', icon: '🚻', label: 'Washrooms' },
    { key: 'Exits', icon: '🚪', label: 'Exits' },
    { key: 'Elevator', icon: '🛗', label: 'Elevators' },
    { key: 'Stairs', icon: '🪜', label: 'Stairs' },
    { key: 'Office', icon: '💼', label: 'Offices' },
    { key: 'Auditorium', icon: '🏛️', label: 'Halls' },
    { key: 'Gym', icon: '🏋️', label: 'Gyms' },
    { key: 'Storage', icon: '📦', label: 'Storage' }
  ];

  const matchesCategory = (room) => {
    if (category === 'All') return true;

    if (category === 'Rooms') {
      return ['Room', 'Classroom'].includes(room.type);
    }

    if (category === 'Exits') {
      return ['EmergencyExit', 'Entrance'].includes(room.type);
    }

    return room.type === category;
  };

  const getRoomIcon = (room) => {
    const icons = {
      Room: '🚪',
      Classroom: '🎓',
      Auditorium: '🏛️',
      Washroom: '🚻',
      Stairs: '🪜',
      Elevator: '🛗',
      EmergencyExit: '🚨',
      Entrance: '🚪',
      Cafeteria: '🍽️',
      Lab: '🧪',
      Gym: '🏋️',
      Office: '💼',
      Storage: '📦',
      Library: '📚'
    };

    return icons[room?.type] || '📍';
  };

  const normalize = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const fuzzyMatch = (room, searchText) => {
    if (!searchText.trim()) return true;

    const search = normalize(searchText);

    const searchableText = normalize(
      [room.name, room.type, room.floor].join(' ')
    );

    if (searchableText.includes(search)) return true;

    const queryWords = search.split(' ');
    const textWords = searchableText.split(' ');

    return queryWords.every((queryWord) =>
      textWords.some((textWord) => {
        if (textWord.includes(queryWord)) return true;

        if (
          queryWord.length >= 3 &&
          Math.abs(textWord.length - queryWord.length) <= 1
        ) {
          let differences = 0;
          const maxLength = Math.max(textWord.length, queryWord.length);

          for (let i = 0; i < maxLength; i++) {
            if (textWord[i] !== queryWord[i]) differences++;
          }

          return differences <= 1;
        }

        return false;
      })
    );
  };

  const filteredRooms = useMemo(() => {
    let result = [...rooms];

    if (category !== 'All') {
      result = result.filter(matchesCategory);
    }

    if (query.trim()) {
      result = result.filter((room) => fuzzyMatch(room, query));
    }

    result.sort((a, b) => {
      const aFavorite = favorites.includes(a._id);
      const bFavorite = favorites.includes(b._id);

      if (aFavorite && !bFavorite) return -1;
      if (!aFavorite && bFavorite) return 1;

      const aDistance = Number(getDistanceMeters?.(a));
      const bDistance = Number(getDistanceMeters?.(b));

      if (Number.isFinite(aDistance) && Number.isFinite(bDistance)) {
        return aDistance - bDistance;
      }

      return String(a.name || '').localeCompare(String(b.name || ''));
    });

    return result.slice(0, 20);
  }, [rooms, query, category, favorites, getDistanceMeters]);

  const recentRoomObjects = useMemo(
    () =>
      recentRooms
        .map((id) => rooms.find((room) => room._id === id))
        .filter(Boolean),
    [recentRooms, rooms]
  );

  const selectDestination = (room) => {
    recordUniversalNavAnalyticsEvent('destination_search', {
      name: room?.name || 'Unnamed destination'
    });

    onSelectRoom(room._id);

    setRecentRooms((previous) => {
      const next = [
        room._id,
        ...previous.filter((id) => id !== room._id)
      ].slice(0, 5);

      localStorage.setItem(
        'universalnav_recent_destinations',
        JSON.stringify(next)
      );
      window.dispatchEvent(new Event('universalnav-destinations-changed'));

      return next;
    });

    setQuery('');
    setIsOpen(false);
  };

  const toggleFavorite = (event, roomId) => {
    event.stopPropagation();

    setFavorites((previous) => {
      const next = previous.includes(roomId)
        ? previous.filter((id) => id !== roomId)
        : [...previous, roomId];

      localStorage.setItem(
        'universalnav_favorite_destinations',
        JSON.stringify(next)
      );
      window.dispatchEvent(new Event('universalnav-destinations-changed'));

      return next;
    });
  };

  const selectedRoom = rooms.find((room) => room._id === selectedRoomId);

  const ResultItem = ({ room }) => {
    const isFavorite = favorites.includes(room._id);

    return (
      <div
        className="d-flex align-items-center gap-2 rounded p-2 mb-1"
        style={{
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.035)',
          transition: 'background 0.15s ease'
        }}
        onClick={() => selectDestination(room)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(56,189,248,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
        }}
      >
        <div
          className="d-flex align-items-center justify-content-center rounded"
          style={{
            width: '38px',
            height: '38px',
            minWidth: '38px',
            background: 'rgba(56,189,248,0.10)',
            fontSize: '19px'
          }}
        >
          {getRoomIconForRoom(room)}
        </div>

        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="fw-semibold text-light small text-truncate">
            {room.name || 'Unnamed Room'}
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-info small">
              {room.floor || '1st FLOOR'}
            </span>

            <span className="text-secondary small">•</span>

            <span className="text-secondary small">
              {room.type === 'Lab' ? 'Laboratory' : room.type || 'Room'}
            </span>

            {Number.isFinite(Number(getDistanceMeters?.(room))) && (
              <>
                <span className="text-secondary small">•</span>
                <span className="text-success small fw-semibold">
                  {formatDistanceMeters(getDistanceMeters(room))} away
                </span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm border-0 p-1"
          onClick={(e) => toggleFavorite(e, room._id)}
          title={isFavorite ? 'Remove favorite' : 'Add favorite'}
        >
          {isFavorite ? '⭐' : '☆'}
        </button>
      </div>
    );
  };

  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <label className="form-label small text-info fw-bold mb-0">
          🔍 Where do you want to go?
        </label>

        {selectedRoom && (
          <span className="badge bg-success">✓ Selected</span>
        )}
      </div>

      <div className="position-relative" style={{ zIndex: 100 }}>
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-dark text-info border-secondary">
            🔍
          </span>

          <input
            type="text"
            className="form-control bg-dark text-light border-secondary"
            placeholder="Search room, office, lab, cafeteria..."
            value={query || (selectedRoom ? selectedRoom.name : '')}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
          />

          {(query || selectedRoom) && (
            <button
              type="button"
              className="btn btn-dark border-secondary text-secondary"
              onClick={() => {
                setQuery('');
                onSelectRoom('');
                setIsOpen(true);
              }}
            >
              ✕
            </button>
          )}
        </div>

        {isOpen && (
          <div
            className="position-absolute start-0 end-0 bg-dark border border-secondary rounded shadow-lg mt-1"
            style={{
              maxHeight: '420px',
              overflowY: 'auto',
              zIndex: 1000
            }}
          >
            <div className="p-2 border-bottom border-secondary">
              <div className="small text-secondary mb-2">
                Filter by category
              </div>

              <div className="d-flex flex-wrap gap-1">
                {categories.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`btn btn-sm py-1 px-2 ${
                      category === item.key
                        ? 'btn-info text-dark fw-bold'
                        : 'btn-outline-secondary text-light'
                    }`}
                    onClick={() => setCategory(item.key)}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>

            {!query.trim() &&
              category === 'All' &&
              recentRoomObjects.length > 0 && (
                <div className="p-2 border-bottom border-secondary">
                  <div className="small fw-bold text-warning mb-1">
                    🕘 Recently Visited
                  </div>

                  {recentRoomObjects.map((room) => (
                    <ResultItem key={room._id} room={room} />
                  ))}
                </div>
              )}

            {!query.trim() &&
              category === 'All' &&
              favorites.length > 0 && (
                <div className="p-2 border-bottom border-secondary">
                  <div className="small fw-bold text-warning mb-1">
                    ⭐ Favorites
                  </div>

                  {rooms
                    .filter((room) => favorites.includes(room._id))
                    .slice(0, 5)
                    .map((room) => (
                      <ResultItem key={room._id} room={room} />
                    ))}
                </div>
              )}

            <div className="p-2">
              <div className="small fw-bold text-secondary mb-1">
                {query.trim() ? `Results for "${query}"` : 'All Locations'}
              </div>

              {filteredRooms.length === 0 ? (
                <div className="text-center py-4">
                  <div className="fs-4">🔎</div>
                  <div className="small text-secondary">
                    No locations found
                  </div>
                  <div className="small text-secondary mt-1">
                    Try another room name or category.
                  </div>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <ResultItem key={room._id} room={room} />
                ))
              )}
            </div>

            <div className="p-2 border-top border-secondary">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedRoom && (
        <div className="border border-info rounded p-2 mt-2 bg-info bg-opacity-10">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '22px' }}>
              {getRoomIcon(selectedRoom)}
            </span>

            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="small text-secondary">Destination</div>

              <div className="fw-bold text-light small text-truncate">
                {selectedRoom.name}
              </div>

              <div className="small text-info">
                {selectedRoom.floor || '1st FLOOR'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



/* ================================================================
   📊 UNIVERSALNAV ANALYTICS
   Additive analytics layer. It never blocks routing or map editing.
================================================================ */
const UNIVERSALNAV_ANALYTICS_KEY = 'universalnav_analytics_v1';

function readUniversalNavAnalytics() {
  const empty = {
    navigationAttempts: 0,
    successfulRoutes: 0,
    accessibilityRoutes: 0,
    emergencyRoutes: 0,
    destinationSearches: {},
    lastUpdated: null
  };

  try {
    const raw = JSON.parse(
      localStorage.getItem(UNIVERSALNAV_ANALYTICS_KEY) || '{}'
    );

    return {
      ...empty,
      ...raw,
      destinationSearches:
        raw && typeof raw.destinationSearches === 'object'
          ? raw.destinationSearches
          : {}
    };
  } catch {
    return empty;
  }
}

function recordUniversalNavAnalyticsEvent(type, payload = {}) {
  try {
    const current = readUniversalNavAnalytics();

    if (type === 'route_attempt') {
      current.navigationAttempts += 1;
    }

    if (type === 'route_success') {
      current.successfulRoutes += 1;

      if (payload.accessible) {
        current.accessibilityRoutes += 1;
      }
    }

    if (type === 'emergency_route') {
      current.emergencyRoutes += 1;
    }

    if (type === 'destination_search' && payload.name) {
      const name = String(payload.name).trim() || 'Unnamed destination';

      current.destinationSearches[name] =
        Number(current.destinationSearches[name] || 0) + 1;
    }

    current.lastUpdated = new Date().toISOString();

    localStorage.setItem(
      UNIVERSALNAV_ANALYTICS_KEY,
      JSON.stringify(current)
    );

    window.dispatchEvent(
      new Event('universalnav-analytics-changed')
    );
  } catch {
    // Analytics must NEVER interrupt the existing application.
  }
}

function AnalyticsDashboard({
  title,
  rooms,
  floors,
  onClose
}) {
  const [data, setData] = useState(() => readUniversalNavAnalytics());
  const [backendData, setBackendData] = useState(null);
  const [loadingBackend, setLoadingBackend] = useState(false);

  const refresh = useCallback(() => {
    setData(readUniversalNavAnalytics());
  }, []);

  useEffect(() => {
    refresh();

    const refreshHandler = () => refresh();

    window.addEventListener(
      'universalnav-analytics-changed',
      refreshHandler
    );

    window.addEventListener('storage', refreshHandler);

    return () => {
      window.removeEventListener(
        'universalnav-analytics-changed',
        refreshHandler
      );

      window.removeEventListener('storage', refreshHandler);
    };
  }, [refresh]);

  /*
   * Optional existing-backend integration.
   * If GET /analytics exists, its values are used automatically.
   * If it does not exist, local analytics continue working.
   */
  useEffect(() => {
    let cancelled = false;

    const loadBackendAnalytics = async () => {
      setLoadingBackend(true);

      try {
        const response = await API.get('/analytics');

        if (!cancelled && response?.data) {
          setBackendData(response.data);
        }
      } catch {
        // Backend endpoint may not exist yet.
      } finally {
        if (!cancelled) {
          setLoadingBackend(false);
        }
      }
    };

    loadBackendAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const analytics = useMemo(() => {
    const b = backendData || {};

    const attempts = Number(
      b.navigationAttempts ??
      b.totalNavigations ??
      b.navigations ??
      data.navigationAttempts ??
      0
    );

    const successful = Number(
      b.successfulRoutes ??
      b.successfulNavigations ??
      data.successfulRoutes ??
      0
    );

    const accessibility = Number(
      b.accessibilityRoutes ??
      b.accessibleRoutes ??
      data.accessibilityRoutes ??
      0
    );

    const emergency = Number(
      b.emergencyRoutes ??
      b.emergencyNavigations ??
      data.emergencyRoutes ??
      0
    );

    const successRate =
      b.successRate !== undefined
        ? Number(b.successRate)
        : attempts
          ? Math.round((successful / attempts) * 100)
          : 0;

    const accessibilityRate =
      b.accessibilityRate !== undefined
        ? Number(b.accessibilityRate)
        : attempts
          ? Math.round((accessibility / attempts) * 100)
          : 0;

    const activeMaps = Number(
      b.activeMaps ??
      b.activeMapCount ??
      b.maps ??
      1
    );

    const searchMap = {
      ...(data.destinationSearches || {})
    };

    const backendSearches =
      b.mostSearchedLocations ||
      b.mostSearched ||
      b.topDestinations ||
      [];

    if (Array.isArray(backendSearches)) {
      backendSearches.forEach((item) => {
        const name =
          item.name ||
          item.location ||
          item.destination ||
          item._id ||
          'Unknown';

        const count = Number(
          item.count ??
          item.searches ??
          item.total ??
          0
        );

        if (count > 0) {
          searchMap[name] = count;
        }
      });
    }

    const topSearches = Object.entries(searchMap)
      .map(([name, count]) => ({
        name,
        count: Number(count) || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      attempts,
      successful,
      successRate: Math.max(0, Math.min(100, successRate)),
      activeMaps,
      accessibility,
      accessibilityRate: Math.max(
        0,
        Math.min(100, accessibilityRate)
      ),
      emergency,
      topSearches
    };
  }, [backendData, data]);

  const totalRooms = rooms.filter(
    (room) => !['Stairs', 'Elevator'].includes(room.type)
  ).length;

  const StatCard = ({
    icon,
    value,
    label,
    accent = 'info',
    sub
  }) => (
    <div
      className={`border border-${accent} rounded-4 p-3 h-100 bg-${accent} bg-opacity-10`}
    >
      <div className="d-flex justify-content-between">
        <span style={{ fontSize: '24px' }}>{icon}</span>

        <span className={`badge text-bg-${accent}`}>
          LIVE
        </span>
      </div>

      <div className="display-6 fw-bold text-light mt-2">
        {value}
      </div>

      <div className="fw-semibold text-light">
        {label}
      </div>

      {sub && (
        <div className="small text-secondary mt-1">
          {sub}
        </div>
      )}
    </div>
  );

  const resetLocalAnalytics = () => {
    if (!window.confirm('Reset local UniversalNav analytics?')) {
      return;
    }

    localStorage.removeItem(UNIVERSALNAV_ANALYTICS_KEY);
    refresh();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="d-flex align-items-center justify-content-center"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483646,
        background: 'rgba(2, 6, 23, .95)',
        overflowY: 'auto',
        padding: '24px'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-dark text-light border border-info rounded-4 shadow-lg"
        style={{
          width: 'min(1120px, 96vw)',
          maxHeight: '94vh',
          overflowY: 'auto'
        }}
      >
        <div className="p-4 border-bottom border-secondary">
          <div className="d-flex justify-content-between gap-3">
            <div>
              <div className="small text-info fw-bold text-uppercase">
                📊 UniversalNav Analytics
              </div>

              <h2 className="h3 fw-bold mb-1">
                {title || 'Building Analytics'}
              </h2>

              <div className="small text-secondary">
                Admin dashboard • {floors.length} floors • {totalRooms} mapped rooms
                {loadingBackend
                  ? ' • syncing…'
                  : backendData
                    ? ' • backend connected'
                    : ' • local tracking active'}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline-light fw-bold"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose(e);
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-xl-3">
              <StatCard
                icon="🧭"
                value={analytics.attempts.toLocaleString()}
                label="Navigations"
                sub="Route attempts recorded"
              />
            </div>

            <div className="col-md-6 col-xl-3">
              <StatCard
                icon="🗺️"
                value={analytics.activeMaps.toLocaleString()}
                label="Active Maps"
                accent="primary"
                sub={
                  backendData
                    ? 'From analytics service'
                    : 'Current map available'
                }
              />
            </div>

            <div className="col-md-6 col-xl-3">
              <StatCard
                icon="✅"
                value={`${analytics.successRate}%`}
                label="Successful Routes"
                accent="success"
                sub={`${analytics.successful.toLocaleString()} completed`}
              />
            </div>

            <div className="col-md-6 col-xl-3">
              <StatCard
                icon="🚨"
                value={analytics.emergency.toLocaleString()}
                label="Emergency Routes"
                accent="danger"
                sub="Safe evacuation routes"
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-7">
              <div className="border border-secondary rounded-4 p-4 h-100">
                <div className="d-flex justify-content-between mb-3">
                  <div>
                    <div className="h5 fw-bold mb-1">
                      🔎 Most searched locations
                    </div>

                    <div className="small text-secondary">
                      Top destinations selected by users.
                    </div>
                  </div>

                  <span className="badge bg-info text-dark">
                    Top {analytics.topSearches.length}
                  </span>
                </div>

                {analytics.topSearches.length ? (
                  <div className="d-flex flex-column gap-2">
                    {analytics.topSearches.map((item, index) => {
                      const max = Math.max(
                        1,
                        ...analytics.topSearches.map(
                          (x) => x.count
                        )
                      );

                      const width = Math.max(
                        4,
                        Math.round(
                          (item.count / max) * 100
                        )
                      );

                      return (
                        <div
                          key={`${item.name}-${index}`}
                          className="p-2 rounded-3 bg-secondary bg-opacity-10"
                        >
                          <div className="d-flex justify-content-between">
                            <span className="fw-semibold">
                              {index + 1}. {item.name}
                            </span>

                            <span className="text-info fw-bold">
                              {item.count.toLocaleString()}
                            </span>
                          </div>

                          <div
                            className="progress mt-1"
                            style={{ height: '7px' }}
                          >
                            <div
                              className="progress-bar bg-info"
                              style={{
                                width: `${width}%`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-secondary text-center py-4">
                    No destination searches recorded yet.
                    <div className="small mt-1">
                      Search/select a destination to populate this section.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-5">
              <div className="border border-info rounded-4 p-4 h-100">
                <div className="h5 fw-bold mb-3">
                  ♿ Accessibility usage
                </div>

                <div className="display-5 fw-bold text-info">
                  {analytics.accessibilityRate}%
                </div>

                <div className="text-secondary mb-3">
                  of routes used accessibility preferences
                </div>

                <div
                  className="progress mb-2"
                  style={{ height: '10px' }}
                >
                  <div
                    className="progress-bar bg-info"
                    style={{
                      width: `${analytics.accessibilityRate}%`
                    }}
                  />
                </div>

                <div className="small">
                  ♿ {analytics.accessibility.toLocaleString()} accessible routes
                </div>

                <hr className="border-secondary" />

                <div className="d-flex justify-content-between">
                  <span className="fw-semibold">
                    🚨 Emergency routes
                  </span>

                  <span className="badge bg-danger">
                    {analytics.emergency.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-md-4">
              <div className="border border-secondary rounded-4 p-3">
                <div className="small text-secondary">
                  Route completion
                </div>

                <div className="h4 fw-bold mb-0">
                  {analytics.successful.toLocaleString()} / {analytics.attempts.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="border border-secondary rounded-4 p-3">
                <div className="small text-secondary">
                  Mapped rooms
                </div>

                <div className="h4 fw-bold mb-0">
                  {totalRooms.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="border border-secondary rounded-4 p-3">
                <div className="small text-secondary">
                  Floors
                </div>

                <div className="h4 fw-bold mb-0">
                  {floors.length.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary">
            <div className="small text-secondary">
              Analytics are additive and never block routing or map editing.
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-warning"
              onClick={resetLocalAnalytics}
            >
              Reset local analytics
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ================================================================
   VENUE OVERVIEW
   Additive SaaS-style overview. It only reads existing rooms/floors
   and calls callbacks supplied by MapEditor; it does not alter the
   existing editor data model or routing engine.
================================================================ */
function VenueOverview({
  title,
  floors,
  rooms,
  onClose,
  onNavigate,
  onViewMap,
  onEmergency,
  onAccessibility,
  onSelectDestination
}) {
  const [favorites, setFavorites] = useState([]);
  const [recentRooms, setRecentRooms] = useState([]);

  const loadDestinationMemory = useCallback(() => {
    try {
      const storedFavorites = JSON.parse(
        localStorage.getItem('universalnav_favorite_destinations') || '[]'
      );
      const storedRecent = JSON.parse(
        localStorage.getItem('universalnav_recent_destinations') || '[]'
      );
      setFavorites(Array.isArray(storedFavorites) ? storedFavorites : []);
      setRecentRooms(Array.isArray(storedRecent) ? storedRecent : []);
    } catch {
      setFavorites([]);
      setRecentRooms([]);
    }
  }, []);

  useEffect(() => {
    loadDestinationMemory();
    const refresh = () => loadDestinationMemory();
    window.addEventListener('universalnav-destinations-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('universalnav-destinations-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [loadDestinationMemory]);

  const stats = useMemo(() => ({
    floors: floors.length,
    rooms: rooms.filter((r) => !['Stairs', 'Elevator'].includes(r.type)).length,
    elevators: rooms.filter((r) => r.type === 'Elevator').length,
    stairs: rooms.filter((r) => r.type === 'Stairs').length,
    washrooms: rooms.filter((r) => r.type === 'Washroom').length,
    exits: rooms.filter((r) => r.type === 'EmergencyExit').length
  }), [floors, rooms]);

  const iconFor = (room) => ({
    Room: '🚪', Classroom: '🎓', Auditorium: '🏛️', Washroom: '🚻',
    Stairs: '🪜', Elevator: '🛗', EmergencyExit: '🚨', Entrance: '🚪',
    Cafeteria: '🍽️', Lab: '🧪', Gym: '🏋️', Office: '💼', Storage: '📦',
    Library: '📚'
  }[room?.type] || '📍');

  const favoriteRooms = favorites
    .map((id) => rooms.find((room) => room._id === id))
    .filter(Boolean)
    .slice(0, 6);

  const recentRoomObjects = recentRooms
    .map((id) => rooms.find((room) => room._id === id))
    .filter(Boolean)
    .slice(0, 6);

  const DestinationButton = ({ room, recent = false }) => (
    <button
      type="button"
      className="btn btn-sm btn-dark border border-secondary text-start w-100 d-flex align-items-center gap-2"
      onClick={() => onSelectDestination(room)}
    >
      <span style={{ fontSize: '18px' }}>{iconFor(room)}</span>
      <span className="flex-grow-1 text-truncate">
        <span className="d-block fw-semibold text-light text-truncate">{room.name || 'Unnamed Room'}</span>
        <span className="d-block small text-secondary">{room.floor || '1st FLOOR'}</span>
      </span>
      <span className={recent ? 'text-warning' : 'text-info'}>{recent ? '🕘' : '→'}</span>
    </button>
  );

  const overviewModal = (
    <div
      role="dialog"
      aria-modal="true"
      className="d-flex align-items-center justify-content-center"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647,
        backgroundColor: 'rgba(0,0,0,0.92)',
        pointerEvents: 'auto',
        isolation: 'isolate'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-dark text-light border border-info rounded-4 shadow-lg p-4"
        style={{
          position: 'relative',
          display: 'block',
          width: 'min(760px, 94vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#111827',
          color: '#fff',
          zIndex: 2147483647
        }}
      >
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div className="position-absolute" style={{ top: '8px', left: '12px', fontSize: '10px', color: '#22d3ee', opacity: 0.8 }}>
            VENUE OVERVIEW OPEN
          </div>
          <div>
            <div className="text-info small fw-bold text-uppercase">🏢 Venue Overview</div>
            <h3 className="fw-bold mb-1">{title || 'Building'}</h3>
            <div className="small text-secondary">Your indoor venue at a glance</div>
          </div>
          <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose}>✕</button>
        </div>

        <div className="row g-2 mb-3">
          {[
            ['📍', stats.floors, 'Floors', 'info'],
            ['🚪', stats.rooms, 'Rooms', 'primary'],
            ['🛗', stats.elevators, 'Elevators', 'purple'],
            ['🪜', stats.stairs, 'Staircases', 'warning'],
            ['🚻', stats.washrooms, 'Washrooms', 'secondary'],
            ['🚨', stats.exits, 'Emergency Exits', 'danger']
          ].map(([icon, value, label, tone]) => (
            <div key={label} className="col-6 col-md-4">
              <div className="bg-secondary bg-opacity-10 border border-secondary rounded-3 p-3 h-100">
                <div className="fs-4">{icon}</div>
                <div className="fs-4 fw-bold text-light">{value}</div>
                <div className={`small ${tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : tone === 'info' ? 'text-info' : 'text-secondary'}`}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-secondary rounded-3 p-3 mb-3">
          <div className="small text-secondary mb-2 text-uppercase fw-bold">Quick Actions</div>
          <div className="row g-2">
            <div className="col-6 col-md-3"><button type="button" className="btn btn-info text-dark fw-bold w-100 h-100" onClick={onNavigate}>🧭 Navigate</button></div>
            <div className="col-6 col-md-3"><button type="button" className="btn btn-outline-light fw-bold w-100 h-100" onClick={onViewMap}>🗺️ View Map</button></div>
            <div className="col-6 col-md-3"><button type="button" className="btn btn-outline-danger fw-bold w-100 h-100" onClick={onEmergency}>🚨 Emergency Exits</button></div>
            <div className="col-6 col-md-3"><button type="button" className="btn btn-outline-info fw-bold w-100 h-100" onClick={onAccessibility}>♿ Accessibility</button></div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="border border-warning rounded-3 p-3 h-100">
              <div className="fw-bold text-warning mb-2">⭐ Favorites</div>
              {favoriteRooms.length ? (
                <div className="d-flex flex-column gap-2">
                  {favoriteRooms.map((room) => <DestinationButton key={room._id} room={room} />)}
                </div>
              ) : (
                <div className="small text-secondary">No favorites yet. Use ☆ beside a destination in Search to add one.</div>
              )}
            </div>
          </div>

          <div className="col-md-6">
            <div className="border border-secondary rounded-3 p-3 h-100">
              <div className="fw-bold text-light mb-2">🕘 Recent destinations</div>
              {recentRoomObjects.length ? (
                <div className="d-flex flex-column gap-2">
                  {recentRoomObjects.map((room) => <DestinationButton key={room._id} room={room} recent />)}
                </div>
              ) : (
                <div className="small text-secondary">Destinations you select will appear here for one-click navigation.</div>
              )}
            </div>
          </div>
        </div>

        <div className="small text-secondary mt-3 text-center">
          Tip: select a favorite or recent destination to set it as your destination and start routing when a starting location is available.
        </div>
      </div>
    </div>
  );

  return createPortal(overviewModal, document.body);
}

export default function MapEditor() {
  const { buildingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const isNewMapRequest =
    searchParams.get('isNew') === 'true' ||
    searchParams.get('new') === 'true';

  const [floors, setFloors] = useState(INITIAL_FLOORS);
  const [activeFloor, setActiveFloor] = useState('1st FLOOR');
  const [floorSize] = useState({ width: 1100, height: 750 });

  // ADDITIVE: one independent boundary per floor. Existing room/node/edge state is untouched.
  const [floorBoundaries, setFloorBoundaries] = useState({});
  const [boundaryPanelOpen, setBoundaryPanelOpen] = useState(false);

  const [mapTitle, setMapTitle] = useState(
    isNewMapRequest ? 'New Building Map' : 'Untitled Map'
  );

  const [rooms, setRooms] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [edges, setEdges] = useState([]);

  const [qrLocations, setQrLocations] = useState([]);
  const [qrModalNode, setQrModalNode] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [enableGrid, setEnableGrid] = useState(true);
  const [gridSize, setGridSize] = useState(8);

  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [selectedWaypointId, setSelectedWaypointId] = useState(null);
  const [activeTool, setActiveTool] = useState('select');

  // ADDITIVE editor productivity state. Existing single-selection behaviour
  // remains the default; multi-select is enabled with Shift-click.
  const [clipboardRooms, setClipboardRooms] = useState([]);
  const [versionHistory, setVersionHistory] = useState([]);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState('saved');
  const editorLoadedRef = useRef(false);
  const autoSaveTimerRef = useRef(null);
  const lastAutoSaveSignatureRef = useRef('');
  const skipNextAutoSaveRef = useRef(true);
  const lastVersionAtRef = useRef(0);
  const [connectStartNode, setConnectStartNode] = useState(null);

  const [stairModalSource, setStairModalSource] = useState(null);
  const [targetStairWpId, setTargetStairWpId] = useState('');

  const [interaction, setInteraction] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const [startRoomId, setStartRoomId] = useState('');
  const [destRoomId, setDestRoomId] = useState('');

  const [navigationPath, setNavigationPath] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentLocationNodeId, setCurrentLocationNodeId] = useState('');

  // ADDITIVE safety/emergency features. Existing routing remains untouched.
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyCenterOpen, setEmergencyCenterOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState('evacuation');
  const [emergencyPath, setEmergencyPath] = useState([]);
  const [emergencyExitId, setEmergencyExitId] = useState('');
  const [emergencyDistance, setEmergencyDistance] = useState(0);
  const [emergencyTimeSeconds, setEmergencyTimeSeconds] = useState(0);
  const [emergencyStatus, setEmergencyStatus] = useState('');
  const [blockedNodeIds, setBlockedNodeIds] = useState([]);
  const [blockedRoomIds, setBlockedRoomIds] = useState([]);
  const [blockedEdgeKeys, setBlockedEdgeKeys] = useState([]);
  // Selected path is separate from the existing route/path selection.
  // This lets an admin block ONE corridor connection instead of disabling
  // every connection around a node.
  const [selectedSafetyEdgeKey, setSelectedSafetyEdgeKey] = useState('');
  const [accessibilityPrefs, setAccessibilityPrefs] = useState({ wheelchair:false, avoidStairs:false, avoidNarrow:false, minimizeWalking:false, avoidElevators:false });

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // ADDITIVE SaaS venue overview. Existing editor state is untouched.
  const [venueOverviewOpen, setVenueOverviewOpen] = useState(false);

  // ADDITIVE analytics dashboard. Existing editor/routing state is untouched.
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // ADDITIVE map validation. It only reads the existing rooms/waypoints/edges.
  const [validationOpen, setValidationOpen] = useState(false);

  const handleOpenAnalytics = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setAnalyticsOpen(true);
  }, []);

  const handleCloseAnalytics = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setAnalyticsOpen(false);
  }, []);

  const handleOpenVenueOverview = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setVenueOverviewOpen(true);
  }, []);

  const handleCloseVenueOverview = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setVenueOverviewOpen(false);
  }, []);

  useEffect(() => {
    if (!venueOverviewOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setVenueOverviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [venueOverviewOpen]);

  const canvasRef = useRef(null);

  const currentRooms = rooms.filter(
    (r) => (r.floor || '1st FLOOR') === activeFloor
  );

  const currentWaypoints = waypoints.filter(
    (w) => (w.floor || '1st FLOOR') === activeFloor
  );

  const selectedRoom = rooms.find((r) => r._id === selectedRoomId);

  // ============================================================
  // AUTOMATIC MAP VALIDATION
  // Read-only diagnostics. Existing map data is never mutated.
  // ============================================================
  const mapValidation = useMemo(() => {
    const nodeIds = waypoints.map((w) => w.id);
    const nodeSet = new Set(nodeIds);
    const adjacency = Object.fromEntries(nodeIds.map((id) => [id, []]));

    const validEdges = edges.filter((e) =>
      nodeSet.has(e.from) && nodeSet.has(e.to) && e.from !== e.to
    );
    validEdges.forEach((e) => {
      adjacency[e.from].push(e.to);
      adjacency[e.to].push(e.from);
    });

    const roomByWaypoint = new Map(
      rooms.filter((r) => r.waypointId).map((r) => [r.waypointId, r])
    );
    const labelForNode = (id) => {
      const room = roomByWaypoint.get(id);
      const wp = waypoints.find((w) => w.id === id);
      return room?.name || `${wp?.floor || 'Floor'} node`;
    };

    const errors = [];
    const warnings = [];

    // A node with no path can never be reached by the router.
    nodeIds.forEach((id) => {
      if (adjacency[id].length === 0) {
        errors.push({
          key: `isolated:${id}`,
          text: `${labelForNode(id)} has no connected path`,
          nodeId: id
        });
      }
    });

    // Connected components.
    const visited = new Set();
    const components = [];
    for (const start of nodeIds) {
      if (visited.has(start)) continue;
      const queue = [start];
      const component = [];
      visited.add(start);
      while (queue.length) {
        const current = queue.shift();
        component.push(current);
        for (const next of adjacency[current]) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
      components.push(component);
    }
    const largestComponent = components.reduce(
      (largest, component) => component.length > largest.length ? component : largest,
      []
    );

    const componentByNode = new Map();
    components.forEach((component, index) => {
      component.forEach((nodeId) => componentByNode.set(nodeId, index));
    });

    const floorNames = floors.length
      ? floors
      : [...new Set(waypoints.map((w) => w.floor || '1st FLOOR'))];

    const crossFloorEdges = validEdges.filter((e) => {
      const a = waypoints.find((w) => w.id === e.from);
      const b = waypoints.find((w) => w.id === e.to);
      return a && b && a.floor !== b.floor;
    });

    // Each populated floor should have at least one cross-floor connection
    // when the building contains multiple floors.
    if (floorNames.length > 1) {
      floorNames.forEach((floor) => {
        const floorNodes = waypoints.filter((w) => (w.floor || '1st FLOOR') === floor);
        if (!floorNodes.length) return;
        const connectedOut = crossFloorEdges.some((e) => {
          const a = waypoints.find((w) => w.id === e.from);
          const b = waypoints.find((w) => w.id === e.to);
          return a?.floor === floor || b?.floor === floor;
        });
        if (!connectedOut) {
          warnings.push({ key: `floor:${floor}`, text: `${floor} has no connection to another floor` });
        }
      });
    }

    // Stairs/elevators should have at least one cross-floor link.
    rooms.filter((r) => ['Stairs', 'Elevator'].includes(r.type)).forEach((room) => {
      const wp = waypoints.find((w) => w.id === room.waypointId);
      if (!wp || floorNames.length <= 1) return;
      const linked = crossFloorEdges.some((e) => e.from === wp.id || e.to === wp.id);
      if (!linked) {
        warnings.push({
          key: `vertical:${room._id}`,
          text: `${room.name || room.type} has no connection to another floor`,
          nodeId: wp.id
        });
      }
    });

    // Every emergency exit / entrance must have at least one incoming path.
    const exitRooms = rooms.filter((r) =>
      ['EmergencyExit', 'Entrance'].includes(r.type) && r.waypointId
    );
    const exitNodeIds = new Set(exitRooms.map((r) => r.waypointId));
    if (!exitRooms.length && waypoints.length) {
      errors.push({ key: 'no-exit', text: 'No Emergency Exit or Main Entrance is defined' });
    } else {
      exitRooms.forEach((room) => {
        if (!adjacency[room.waypointId]?.length) {
          warnings.push({
            key: `exit:${room._id}`,
            text: `${room.name || 'Emergency Exit'} is unreachable`,
            nodeId: room.waypointId
          });
        }
      });

      // A node may have a local path but still live in a disconnected
      // component that cannot reach any exit. This is the important
      // route-level check for navigation reliability.
      rooms.filter((r) => r.waypointId && !exitNodeIds.has(r.waypointId)).forEach((room) => {
        const componentIndex = componentByNode.get(room.waypointId);
        const component = componentIndex == null ? [] : components[componentIndex] || [];
        const canReachExit = component.some((nodeId) => exitNodeIds.has(nodeId));
        if (!canReachExit) {
          errors.push({
            key: `no-exit-route:${room._id}`,
            text: `${room.name || room.type} cannot reach any exit`,
            nodeId: room.waypointId
          });
        }
      });
    }

    if (floorNames.length > 1 && crossFloorEdges.length === 0 && waypoints.length > 0) {
      errors.push({ key: 'no-cross-floor', text: 'No path connects any two floors' });
    }

    // Broken path references indicate stale/corrupt edge data.
    edges.forEach((e, index) => {
      if (!nodeSet.has(e.from) || !nodeSet.has(e.to)) {
        errors.push({ key: `broken-edge:${index}`, text: 'A path references a missing node' });
      }
    });

    const checks = [
      { label: 'Nodes', value: nodeIds.length },
      { label: 'Connected', value: largestComponent.length },
      { label: 'Valid paths', value: validEdges.length },
      { label: 'Cross-floor', value: crossFloorEdges.length },
      { label: 'Floors', value: floorNames.length },
      { label: 'Exits', value: exitRooms.length }
    ];

    return {
      errors,
      warnings,
      checks,
      components,
      isolated: nodeIds.filter((id) => adjacency[id].length === 0),
      status: errors.length ? 'error' : warnings.length ? 'warning' : 'success',
      issueCount: errors.length + warnings.length,
      passed: errors.length === 0 && warnings.length === 0
    };
  }, [rooms, waypoints, edges, floors]);

  const applyGrid = useCallback(
    (val) =>
      enableGrid
        ? Math.round(val / gridSize) * gridSize
        : Math.round(val),
    [enableGrid, gridSize]
  );

  const recordHistory = useCallback(
    (newRooms, newWaypoints, newEdges) => {
      const snapshot = {
        rooms: JSON.parse(JSON.stringify(newRooms)),
        waypoints: JSON.parse(JSON.stringify(newWaypoints)),
        edges: JSON.parse(JSON.stringify(newEdges))
      };

      setHistory((prev) => [
        ...prev.slice(0, historyStep + 1),
        snapshot
      ]);

      setHistoryStep((prev) => prev + 1);
    },
    [historyStep]
  );

  const handleUndo = useCallback(() => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      const state = history[prevStep];

      setRooms(state.rooms);
      setWaypoints(state.waypoints);
      setEdges(state.edges);
      setHistoryStep(prevStep);
    }
  }, [history, historyStep]);

  const handleRedo = useCallback(() => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      const state = history[nextStep];

      setRooms(state.rooms);
      setWaypoints(state.waypoints);
      setEdges(state.edges);
      setHistoryStep(nextStep);
    }
  }, [history, historyStep]);

  const handleCustomDistancePrompt = (edgeToEdit) => {
    const currentMeters =
      edgeToEdit.customDistance ??
      Math.round(
        Math.hypot(
          (waypoints.find((w) => w.id === edgeToEdit.to)?.x || 0) -
            (waypoints.find((w) => w.id === edgeToEdit.from)?.x || 0),
          (waypoints.find((w) => w.id === edgeToEdit.to)?.y || 0) -
            (waypoints.find((w) => w.id === edgeToEdit.from)?.y || 0)
        ) * PIXELS_TO_METERS
      );

    const input = window.prompt(
      'Enter custom distance in meters (m) for this path (Leave blank or enter 0 to reset to auto):',
      currentMeters
    );

    if (input !== null) {
      const val = parseFloat(input);

      const updatedEdges = edges.map((e) => {
        if (
          (e.from === edgeToEdit.from && e.to === edgeToEdit.to) ||
          (e.from === edgeToEdit.to && e.to === edgeToEdit.from)
        ) {
          return {
            ...e,
            customDistance:
              isNaN(val) || val <= 0 ? null : val
          };
        }

        return e;
      });

      setEdges(updatedEdges);
      recordHistory(rooms, waypoints, updatedEdges);
    }
  };

  const handleDeleteRoom = useCallback(
    (roomId) => {
      const targetRoom = rooms.find((r) => r._id === roomId);

      let nextWaypoints = [...waypoints];
      let nextEdges = [...edges];

      if (targetRoom?.waypointId) {
        nextWaypoints = nextWaypoints.filter(
          (w) => w.id !== targetRoom.waypointId
        );

        nextEdges = nextEdges.filter(
          (e) =>
            e.from !== targetRoom.waypointId &&
            e.to !== targetRoom.waypointId
        );
      }

      const nextRooms = rooms.filter((r) => r._id !== roomId);

      setRooms(nextRooms);
      setWaypoints(nextWaypoints);
      setEdges(nextEdges);
      setSelectedRoomId(null);
      setSelectedRoomIds([]);
      setContextMenu(null);

      recordHistory(nextRooms, nextWaypoints, nextEdges);
    },
    [rooms, waypoints, edges, recordHistory]
  );

  const handleDeleteWaypoint = useCallback(
    (wpId) => {
      const nextWaypoints = waypoints.filter((w) => w.id !== wpId);

      const nextEdges = edges.filter(
        (e) => e.from !== wpId && e.to !== wpId
      );

      const nextRooms = rooms.map((r) =>
        r.waypointId === wpId
          ? { ...r, waypointId: null }
          : r
      );

      const nextQrLocations = qrLocations.filter(
        (q) => q.nodeId !== wpId
      );

      setRooms(nextRooms);
      setWaypoints(nextWaypoints);
      setEdges(nextEdges);
      setQrLocations(nextQrLocations);
      setSelectedWaypointId(null);

      if (connectStartNode === wpId) {
        setConnectStartNode(null);
      }

      setContextMenu(null);

      recordHistory(nextRooms, nextWaypoints, nextEdges);
    },
    [
      rooms,
      waypoints,
      edges,
      qrLocations,
      connectStartNode,
      recordHistory
    ]
  );

  const cloneEditorRooms = useCallback(
    (items) => JSON.parse(JSON.stringify(items || [])),
    []
  );

  const makeEditorId = useCallback((prefix) => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }, []);

  const duplicateSelectedRooms = useCallback(
    (sourceIds = selectedRoomIds.length ? selectedRoomIds : (selectedRoomId ? [selectedRoomId] : [])) => {
      const sourceRooms = rooms.filter((r) => sourceIds.includes(r._id));
      if (!sourceRooms.length) return;

      const selectedWaypoints = waypoints.filter((w) =>
        sourceRooms.some((r) => r.waypointId === w.id)
      );

      const wpMap = new Map();
      const newRooms = sourceRooms.map((room) => {
        const newRoomId = makeEditorId('room');
        const newWpId = makeEditorId('wp');
        wpMap.set(room.waypointId, newWpId);

        return {
          ...room,
          _id: newRoomId,
          name: `${room.name || 'Room'} Copy`,
          x: (room.x || 0) + 32,
          y: (room.y || 0) + 32,
          waypointId: newWpId
        };
      });

      const newWaypoints = selectedWaypoints.map((wp) => ({
        ...wp,
        id: wpMap.get(wp.id) || makeEditorId('wp'),
        x: (wp.x || 0) + 32,
        y: (wp.y || 0) + 32
      }));

      // Intentionally do not copy edges. A duplicated room should never
      // accidentally inherit a routing connection to the original graph.
      const nextRooms = [...rooms, ...newRooms];
      const nextWaypoints = [...waypoints, ...newWaypoints];

      setRooms(nextRooms);
      setWaypoints(nextWaypoints);
      setSelectedRoomIds(newRooms.map((r) => r._id));
      setSelectedRoomId(newRooms[0]?._id || null);
      setSelectedWaypointId(null);
      recordHistory(nextRooms, nextWaypoints, edges);
    },
    [
      rooms,
      waypoints,
      edges,
      selectedRoomIds,
      selectedRoomId,
      makeEditorId,
      recordHistory
    ]
  );

  const copySelectedRooms = useCallback(() => {
    const ids = selectedRoomIds.length
      ? selectedRoomIds
      : selectedRoomId
        ? [selectedRoomId]
        : [];

    const selected = rooms.filter((r) => ids.includes(r._id));
    if (!selected.length) return;

    setClipboardRooms(cloneEditorRooms(selected));
    setSaveMessage({
      type: 'success',
      text: `${selected.length} room${selected.length > 1 ? 's' : ''} copied`
    });
    setTimeout(() => setSaveMessage(null), 1200);
  }, [rooms, selectedRoomIds, selectedRoomId, cloneEditorRooms]);

  const pasteCopiedRooms = useCallback(() => {
    if (!clipboardRooms.length) return;

    const sourceWaypoints = waypoints.filter((w) =>
      clipboardRooms.some((r) => r.waypointId === w.id)
    );

    const wpMap = new Map();
    const newRooms = clipboardRooms.map((room) => {
      const newRoomId = makeEditorId('room');
      const newWpId = makeEditorId('wp');
      wpMap.set(room.waypointId, newWpId);

      return {
        ...room,
        _id: newRoomId,
        name: `${room.name || 'Room'} Copy`,
        x: (room.x || 0) + 40,
        y: (room.y || 0) + 40,
        waypointId: newWpId
      };
    });

    const newWaypoints = sourceWaypoints.map((wp) => ({
      ...wp,
      id: wpMap.get(wp.id) || makeEditorId('wp'),
      x: (wp.x || 0) + 40,
      y: (wp.y || 0) + 40
    }));

    const nextRooms = [...rooms, ...newRooms];
    const nextWaypoints = [...waypoints, ...newWaypoints];

    setRooms(nextRooms);
    setWaypoints(nextWaypoints);
    setSelectedRoomIds(newRooms.map((r) => r._id));
    setSelectedRoomId(newRooms[0]?._id || null);
    setSelectedWaypointId(null);
    recordHistory(nextRooms, nextWaypoints, edges);
  }, [
    clipboardRooms,
    waypoints,
    rooms,
    edges,
    makeEditorId,
    recordHistory
  ]);

  const alignSelectedRooms = useCallback(
    (mode) => {
      const ids = selectedRoomIds.length
        ? selectedRoomIds
        : selectedRoomId
          ? [selectedRoomId]
          : [];

      if (ids.length < 2) {
        setSaveMessage({
          type: 'danger',
          text: 'Select at least 2 rooms with Shift-click to align them.'
        });
        setTimeout(() => setSaveMessage(null), 1800);
        return;
      }

      const selected = rooms.filter((r) => ids.includes(r._id));
      if (selected.length < 2) return;

      const minX = Math.min(...selected.map((r) => r.x));
      const maxRight = Math.max(...selected.map((r) => r.x + r.width));
      const minY = Math.min(...selected.map((r) => r.y));
      const maxBottom = Math.max(...selected.map((r) => r.y + r.height));
      const centerX = selected.reduce(
        (sum, r) => sum + r.x + r.width / 2,
        0
      ) / selected.length;
      const centerY = selected.reduce(
        (sum, r) => sum + r.y + r.height / 2,
        0
      ) / selected.length;

      const nextRooms = rooms.map((room) => {
        if (!ids.includes(room._id)) return room;

        if (mode === 'left') return { ...room, x: minX };
        if (mode === 'center') {
          return { ...room, x: centerX - room.width / 2 };
        }
        if (mode === 'right') {
          return { ...room, x: maxRight - room.width };
        }
        if (mode === 'top') return { ...room, y: minY };
        if (mode === 'middle') {
          return { ...room, y: centerY - room.height / 2 };
        }
        if (mode === 'bottom') {
          return { ...room, y: maxBottom - room.height };
        }

        return room;
      });

      setRooms(nextRooms);

      // Keep each room's routing waypoint centred after alignment.
      setWaypoints((prev) =>
        prev.map((wp) => {
          const room = nextRooms.find((r) => r.waypointId === wp.id);
          if (!room) return wp;
          return {
            ...wp,
            x: room.x + room.width / 2,
            y: room.y + room.height / 2
          };
        })
      );

      const nextWaypoints = waypoints.map((wp) => {
        const room = nextRooms.find((r) => r.waypointId === wp.id);
        if (!room) return wp;
        return {
          ...wp,
          x: room.x + room.width / 2,
          y: room.y + room.height / 2
        };
      });

      recordHistory(nextRooms, nextWaypoints, edges);
    },
    [rooms, waypoints, edges, selectedRoomIds, selectedRoomId, recordHistory]
  );

  const loadVersionHistory = useCallback(() => {
    if (!buildingId) return [];
    try {
      const raw = localStorage.getItem(`map_versions_${buildingId}`);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [buildingId]);

  const createLocalMapVersion = useCallback(
    (label = 'Manual save') => {
      if (!buildingId) return;

      const now = Date.now();
      const version = {
        id: `version_${now}_${Math.random().toString(36).slice(2, 7)}`,
        label,
        createdAt: new Date(now).toISOString(),
        title: mapTitle,
        floors: JSON.parse(JSON.stringify(floors)),
        rooms: JSON.parse(JSON.stringify(rooms)),
        waypoints: JSON.parse(JSON.stringify(waypoints)),
        edges: JSON.parse(JSON.stringify(edges)),
        qrLocations: JSON.parse(JSON.stringify(qrLocations)),
        blockedNodeIds: JSON.parse(JSON.stringify(blockedNodeIds)),
        blockedRoomIds: JSON.parse(JSON.stringify(blockedRoomIds)),
        blockedEdgeKeys: JSON.parse(JSON.stringify(blockedEdgeKeys)),
        accessibilityPrefs: JSON.parse(JSON.stringify(accessibilityPrefs)),
        floorBoundaries: JSON.parse(JSON.stringify(floorBoundaries))
      };

      const existing = loadVersionHistory();
      const next = [version, ...existing].slice(0, 15);

      localStorage.setItem(`map_versions_${buildingId}`, JSON.stringify(next));
      setVersionHistory(next);
      lastVersionAtRef.current = now;
    },
    [
      buildingId,
      mapTitle,
      floors,
      rooms,
      waypoints,
      edges,
      qrLocations,
      blockedNodeIds,
      blockedRoomIds,
      blockedEdgeKeys,
      accessibilityPrefs,
      floorBoundaries,
      loadVersionHistory
    ]
  );

  const restoreMapVersion = useCallback(
    (version) => {
      if (!version) return;

      setMapTitle(version.title || 'Untitled Map');
      setFloors(version.floors || INITIAL_FLOORS);
      setRooms((version.rooms || []).map(normaliseRoomForEditor));
      setWaypoints(version.waypoints || []);
      setEdges(version.edges || []);
      setQrLocations(version.qrLocations || []);
      setBlockedNodeIds(version.blockedNodeIds || []);
      setBlockedRoomIds(version.blockedRoomIds || []);
      setBlockedEdgeKeys(version.blockedEdgeKeys || []);
      setAccessibilityPrefs((prev) => ({
        ...prev,
        ...(version.accessibilityPrefs || {})
      }));
      setFloorBoundaries(version.floorBoundaries || {});

      const restoredRooms = (version.rooms || []).map(normaliseRoomForEditor);
      recordHistory(restoredRooms, version.waypoints || [], version.edges || []);
      setVersionHistoryOpen(false);
      setSaveMessage({
        type: 'success',
        text: 'Version restored. Save Draft to persist it.'
      });
      setTimeout(() => setSaveMessage(null), 2200);
    },
    [recordHistory]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.shiftKey ? handleRedo() : handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        handleRedo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRoomIds.length > 1) {
        const nextRooms = rooms.filter((r) => !selectedRoomIds.includes(r._id));
        const removedWpIds = new Set(
          rooms.filter((r) => selectedRoomIds.includes(r._id)).map((r) => r.waypointId)
        );
        const nextWaypoints = waypoints.filter((w) => !removedWpIds.has(w.id));
        const nextEdges = edges.filter(
          (edge) => !removedWpIds.has(edge.from) && !removedWpIds.has(edge.to)
        );
        setRooms(nextRooms);
        setWaypoints(nextWaypoints);
        setEdges(nextEdges);
        setSelectedRoomIds([]);
        setSelectedRoomId(null);
        recordHistory(nextRooms, nextWaypoints, nextEdges);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRoomId) {
          handleDeleteRoom(selectedRoomId);
        } else if (selectedWaypointId) {
          handleDeleteWaypoint(selectedWaypointId);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelectedRooms();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteCopiedRooms();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedRooms();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDeleteRoom,
    handleDeleteWaypoint,
    selectedRoomId,
    selectedWaypointId,
    selectedRoomIds,
    rooms,
    waypoints,
    edges,
    recordHistory,
    copySelectedRooms,
    pasteCopiedRooms,
    duplicateSelectedRooms
  ]);


  useEffect(() => {
    if (isNewMapRequest) {
      setRooms([]);
      setWaypoints([]);
      setEdges([]);
      setQrLocations([]);
      setBlockedNodeIds([]);
      setBlockedRoomIds([]);
      setBlockedEdgeKeys([]);
      setFloorBoundaries({});
      setBoundaryPanelOpen(false);
      setMapTitle('New Building Map');

      recordHistory([], [], []);

      return;
    }

    if (!buildingId) {
      console.error('MapEditor: buildingId is missing.');
      navigate('/dashboard', { replace: true });
      return;
    }

    let cancelled = false;

    const loadMapData = async () => {
      try {
        /*
        ========================================================
        SERVER IS THE SOURCE OF TRUTH
        ========================================================
        The backend decides whether the current session user
        owns this building or whether it is public.
        Never use localStorage after a 401/403/404 response.
        */

        let response;

        try {
          response = await API.get(`/maps/${buildingId}`);
        } catch (mapErr) {
          if (mapErr.response?.status === 404) {
            response = await API.get(`/buildings/${buildingId}`);
          } else {
            throw mapErr;
          }
        }

        if (cancelled) return;

        const data =
          response.data?.map ||
          response.data?.building ||
          response.data;

        if (!data) {
          throw new Error('Map data was not returned by server.');
        }

        const loadedR = Array.isArray(data.rooms)
          ? data.rooms
          : [];

        const loadedW = Array.isArray(data.waypoints)
          ? data.waypoints
          : Array.isArray(data.nodes)
            ? data.nodes
            : [];

        const loadedE = Array.isArray(data.connections)
          ? data.connections
          : Array.isArray(data.edges)
            ? data.edges
            : [];

        setQrLocations(
          Array.isArray(data.qrLocations)
            ? data.qrLocations
            : []
        );

        setBlockedNodeIds(
          Array.isArray(data.blockedNodeIds)
            ? data.blockedNodeIds
            : []
        );

        setBlockedRoomIds(
          Array.isArray(data.blockedRoomIds)
            ? data.blockedRoomIds
            : []
        );

        setBlockedEdgeKeys(
          Array.isArray(data.blockedEdgeKeys)
            ? data.blockedEdgeKeys
            : []
        );

        setFloorBoundaries(
          data.floorBoundaries &&
          typeof data.floorBoundaries === 'object'
            ? data.floorBoundaries
            : {}
        );

        setAccessibilityPrefs((prev) => ({
          ...prev,
          ...(data.accessibilityPrefs || {})
        }));

        if (data.title || data.name) {
          setMapTitle(
            data.title ||
            data.name ||
            'Untitled Map'
          );
        }

        if (Array.isArray(data.floors) && data.floors.length > 0) {
          setFloors(data.floors);
        }

        const normalisedRooms =
          loadedR.map(normaliseRoomForEditor);

        setRooms(normalisedRooms);
        setWaypoints(loadedW);
        setEdges(loadedE);

        recordHistory(
          normalisedRooms,
          loadedW,
          loadedE
        );

      } catch (err) {
        if (cancelled) return;

        const status = err.response?.status;

        console.error(
          'Map loading failed:',
          status,
          err.response?.data || err.message
        );

        /*
        ========================================================
        401 = NOT AUTHENTICATED / SESSION EXPIRED
        ========================================================
        */

        if (status === 401) {
          alert(
            'Your session has expired. Please login again.'
          );

          navigate('/login', {
            replace: true
          });

          return;
        }

        /*
        ========================================================
        403 = AUTHENTICATED BUT NOT AUTHORIZED
        ========================================================
        */

        if (status === 403) {
          alert(
            'You do not have permission to access this map.'
          );

          navigate('/dashboard', {
            replace: true
          });

          return;
        }

        /*
        ========================================================
        404 = NOT FOUND OR PRIVATE TO ANOTHER USER
        ========================================================
        */

        if (status === 404) {
          alert(
            'Map not found or you do not have access to it.'
          );

          navigate('/dashboard', {
            replace: true
          });

          return;
        }

        /*
        ========================================================
        NETWORK FAILURE ONLY
        ========================================================
        Local draft recovery is allowed only when there was no
        HTTP response at all.
        */

        if (!err.response) {
          const storageKey =
            `map_draft_${buildingId}`;

          const savedLocal =
            localStorage.getItem(storageKey);

          if (savedLocal) {
            try {
              const parsed =
                JSON.parse(savedLocal);

              const localRooms =
                Array.isArray(parsed.rooms)
                  ? parsed.rooms
                  : [];

              const localWaypoints =
                Array.isArray(parsed.waypoints)
                  ? parsed.waypoints
                  : Array.isArray(parsed.nodes)
                    ? parsed.nodes
                    : [];

              const localEdges =
                Array.isArray(parsed.edges)
                  ? parsed.edges
                  : Array.isArray(parsed.connections)
                    ? parsed.connections
                    : [];

              setQrLocations(
                Array.isArray(parsed.qrLocations)
                  ? parsed.qrLocations
                  : []
              );

              setBlockedNodeIds(
                Array.isArray(parsed.blockedNodeIds)
                  ? parsed.blockedNodeIds
                  : []
              );

              setBlockedRoomIds(
                Array.isArray(parsed.blockedRoomIds)
                  ? parsed.blockedRoomIds
                  : []
              );

              setBlockedEdgeKeys(
                Array.isArray(parsed.blockedEdgeKeys)
                  ? parsed.blockedEdgeKeys
                  : []
              );

              setFloorBoundaries(
                parsed.floorBoundaries &&
                typeof parsed.floorBoundaries === 'object'
                  ? parsed.floorBoundaries
                  : {}
              );

              setAccessibilityPrefs((prev) => ({
                ...prev,
                ...(parsed.accessibilityPrefs || {})
              }));

              if (parsed.title || parsed.name) {
                setMapTitle(
                  parsed.title ||
                  parsed.name ||
                  'Untitled Map'
                );
              }

              if (
                Array.isArray(parsed.floors) &&
                parsed.floors.length > 0
              ) {
                setFloors(parsed.floors);
              }

              const normalisedRooms =
                localRooms.map(normaliseRoomForEditor);

              setRooms(normalisedRooms);
              setWaypoints(localWaypoints);
              setEdges(localEdges);

              recordHistory(
                normalisedRooms,
                localWaypoints,
                localEdges
              );

              setSaveMessage({
                type: 'warning',
                text:
                  'Server unavailable. Showing your local draft.'
              });

              return;

            } catch (localError) {
              console.error(
                'Failed to restore local draft:',
                localError
              );
            }
          }
        }

        if (!cancelled) {
          setSaveMessage({
            type: 'danger',
            text:
              'Unable to load this map. Please try again.'
          });
        }
      }
    };

    loadMapData();

    return () => {
      cancelled = true;
    };

  }, [buildingId, isNewMapRequest, navigate]);

  const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));

    const allMaps =
      JSON.parse(localStorage.getItem('user_building_maps')) || [];

    const updatedMaps = [
      ...allMaps.filter((m) => m.id !== data.id),
      data
    ];

    localStorage.setItem(
      'user_building_maps',
      JSON.stringify(updatedMaps)
    );
  };

  const handleSaveMap = async (statusType = 'draft') => {
    if (!buildingId) {
      setSaveMessage({
        type: 'danger',
        text: 'Cannot save map: building ID is missing.'
      });

      return;
    }

    setIsSaving(true);

    const mapData = {
      /*
      The backend uses the authenticated session user as the
      owner. Do NOT send owner/userId as trusted authorization.
      */

      id: buildingId,
      buildingId: buildingId,

      title:
        mapTitle ||
        'Untitled Map',

      status:
        statusType,

      floors,
      floorSize,
      rooms,
      waypoints,

      /*
      MapEditor uses edges internally. Send both names for
      the current Maps API and older Building records.
      */
      edges,
      connections: edges,
      nodes: waypoints,

      isPublished:
        statusType === 'completed' ||
        statusType === 'published',

      qrLocations,

      blockedNodeIds,
      blockedRoomIds,
      blockedEdgeKeys,

      accessibilityPrefs,

      floorBoundaries,

      updatedAt:
        new Date().toISOString()
    };

    const storageKey =
      `map_draft_${buildingId}`;

    try {
      /*
      ========================================================
      SERVER IS THE SOURCE OF TRUTH
      ========================================================
      */

      const response =
        await API.post(
          '/maps',
          mapData
        );

      const savedBuilding =
        response.data?.map ||
        response.data?.building ||
        null;

      if (!savedBuilding) {
        throw new Error(
          'Server did not return the saved map.'
        );
      }

      /*
      ========================================================
      SAVE LOCAL COPY ONLY AFTER SERVER SUCCESS
      ========================================================
      */

      saveToLocalStorage(
        storageKey,
        {
          ...mapData,

          _id:
            savedBuilding._id ||
            mapData._id,

          owner:
            savedBuilding.owner,

          id:
            savedBuilding.id ||
            mapData.id,

          buildingId:
            savedBuilding.buildingId ||
            mapData.buildingId
        }
      );

      // Preserve the old version-history functionality after a confirmed server save.
      createLocalMapVersion(
        statusType === 'completed' ? 'Published' : 'Manual save'
      );
      setAutoSaveState('saved');

      setSaveMessage({
        type: 'success',
        text:
          `Saved to MongoDB Atlas & ${statusType.toUpperCase()}!`
      });

    } catch (err) {
      const status =
        err.response?.status;

      console.error(
        'Map save failed:',
        status,
        err.response?.data ||
        err.message
      );

      /*
      ========================================================
      401 = SESSION EXPIRED
      ========================================================
      */

      if (status === 401) {
        setSaveMessage({
          type: 'danger',
          text:
            'Your session has expired. Please login again.'
        });

        navigate('/login', {
          replace: true
        });

        return;
      }

      /*
      ========================================================
      403 = NOT OWNER / NOT AUTHORIZED
      ========================================================
      */

      if (status === 403) {
        setSaveMessage({
          type: 'danger',
          text:
            'You do not have permission to edit this map.'
        });

        return;
      }

      /*
      ========================================================
      404 = MAP NOT FOUND / ACCESS DENIED
      ========================================================
      */

      if (status === 404) {
        setSaveMessage({
          type: 'danger',
          text:
            'Map not found or you do not have permission to edit it.'
        });

        return;
      }

      /*
      ========================================================
      NETWORK FAILURE ONLY
      ========================================================
      If there is no HTTP response, the backend could not be
      reached. Preserve a local draft so work is not lost.
      */

      if (!err.response) {
        saveToLocalStorage(
          storageKey,
          mapData
        );

        setSaveMessage({
          type: 'warning',
          text:
            `Server unavailable. Saved locally as ${statusType.toUpperCase()}.`
        });

        return;
      }

      /*
      ========================================================
      OTHER SERVER ERROR
      ========================================================
      */

      setSaveMessage({
        type: 'danger',
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to save map.'
      });

    } finally {
      setIsSaving(false);

      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    }
  };

  const handleAddFloor = () => {
    const name = window.prompt(
      'Enter new floor name (e.g., 4th FLOOR):'
    );

    if (name && name.trim()) {
      const trimmed = name.trim();

      if (!floors.includes(trimmed)) {
        setFloors((prev) => [...prev, trimmed]);
        setActiveFloor(trimmed);
      }
    }
  };

  const handleRemoveFloor = (e, floorNameToRemove) => {
    e.stopPropagation();

    if (floors.length <= 1) {
      alert('A building map must have at least one floor.');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete "${floorNameToRemove}" and all its elements?`
      )
    ) {
      const nextFloors = floors.filter(
        (f) => f !== floorNameToRemove
      );

      setFloors(nextFloors);

      const removedWaypointIds = new Set(
        waypoints
          .filter(
            (w) =>
              (w.floor || '1st FLOOR') === floorNameToRemove
          )
          .map((w) => w.id)
      );

      const nextRooms = rooms.filter(
        (r) =>
          (r.floor || '1st FLOOR') !== floorNameToRemove
      );

      const nextWaypoints = waypoints.filter(
        (w) =>
          (w.floor || '1st FLOOR') !== floorNameToRemove
      );

      const nextEdges = edges.filter(
        (e) =>
          !removedWaypointIds.has(e.from) &&
          !removedWaypointIds.has(e.to)
      );

      const nextQrLocations = qrLocations.filter(
        (q) => q.floor !== floorNameToRemove
      );

      setRooms(nextRooms);
      setWaypoints(nextWaypoints);
      setEdges(nextEdges);
      setQrLocations(nextQrLocations);

      recordHistory(nextRooms, nextWaypoints, nextEdges);

      if (activeFloor === floorNameToRemove) {
        setActiveFloor(nextFloors[0]);
      }
    }
  };

  const handleAddRoom = (item) => {
    const sizeRule = getRoomSizeRule(item.type);

    const roomId = `room_${Date.now()}`;
    const wpId = `wp_${Date.now()}`;

    const rawX = 120 + (currentRooms.length % 5) * 60;
    const rawY =
      120 + Math.floor(currentRooms.length / 5) * 60;

    // Different node types start at sensible sizes, but every object can
    // subsequently be resized independently.
    const width = sizeRule.width;
    const height = sizeRule.height;

    const x = applyGrid(rawX);
    const y = applyGrid(rawY);

    const newRoom = {
      _id: roomId,
      name: item.label,
      type: item.type,
      floor: activeFloor,
      x,
      y,
      width,
      height,
      rotation: 0,
      bgColor: item.color,
      borderColor: item.borderColor,
      waypointId: wpId
    };

    const newWp = {
      id: wpId,
      x: x + width / 2,
      y: y + height / 2,
      floor: activeFloor,
      isDoor: true
    };

    const nextRooms = [...rooms, newRoom];
    const nextWaypoints = [...waypoints, newWp];

    setRooms(nextRooms);
    setWaypoints(nextWaypoints);
    setSelectedRoomId(roomId);
    setSelectedRoomIds([roomId]);

    recordHistory(nextRooms, nextWaypoints, edges);
  };

  const handleRoomMouseDown = (e, room) => {
    if (e.button !== 0) return;

    e.stopPropagation();

    setContextMenu(null);
    setSelectedWaypointId(null);
    setSelectedSafetyEdgeKey('');

    if (e.shiftKey && activeTool === 'select') {
      setSelectedRoomIds((prev) => {
        const exists = prev.includes(room._id);
        const next = exists
          ? prev.filter((id) => id !== room._id)
          : [...prev, room._id];

        setSelectedRoomId(next.length ? next[next.length - 1] : null);
        return next;
      });
      setInteraction(null);
      return;
    }

    const activeSelection = selectedRoomIds.length
      ? selectedRoomIds
      : [room._id];

    if (!activeSelection.includes(room._id)) {
      setSelectedRoomIds([room._id]);
      setSelectedRoomId(room._id);
    } else {
      setSelectedRoomId(room._id);
    }

    if (activeTool === 'select') {
      const groupRooms = rooms.filter((r) =>
        activeSelection.includes(r._id)
      );

      setInteraction({
        mode: groupRooms.length > 1 ? 'multiDrag' : 'drag',
        id: room._id,
        ids: groupRooms.map((r) => r._id),
        startX: e.clientX,
        startY: e.clientY,
        origX: room.x,
        origY: room.y,
        origins: groupRooms.map((r) => ({
          id: r._id,
          x: r.x,
          y: r.y
        })),
        wpId: room.waypointId
      });
    }
  };

  const handleResizeMouseDown = (e, room) => {
    if (e.button !== 0) return;

    e.stopPropagation();

    const direction =
      e.currentTarget?.dataset?.resizeHandle || 'se';

    const rule = getRoomSizeRule(room.type);

    setSelectedRoomId(room._id);
    setSelectedWaypointId(null);
    setInteraction({
      mode: 'resize',
      id: room._id,
      startX: e.clientX,
      startY: e.clientY,
      origW: room.width,
      origH: room.height,
      origX: room.x,
      origY: room.y,
      roomX: room.x,
      roomY: room.y,
      minW: rule.minWidth,
      minH: rule.minHeight,
      handle: direction,
      wpId: room.waypointId
    });
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button === 1 || e.spaceKey) {
      setIsPanning(true);

      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    } else {
      handleCanvasClick(e);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });

      return;
    }

    if (!interaction) return;

    const deltaX =
      (e.clientX - interaction.startX) / zoom;

    const deltaY =
      (e.clientY - interaction.startY) / zoom;

    if (interaction.mode === 'multiDrag') {
      const originMap = new Map(
        (interaction.origins || []).map((item) => [item.id, item])
      );

      setRooms((prev) =>
        prev.map((r) => {
          const origin = originMap.get(r._id);
          if (!origin) return r;

          return {
            ...r,
            x: Math.max(0, applyGrid(origin.x + deltaX)),
            y: Math.max(0, applyGrid(origin.y + deltaY))
          };
        })
      );

      setWaypoints((prev) =>
        prev.map((w) => {
          const room = rooms.find((r) => r.waypointId === w.id);
          if (!room || !originMap.has(room._id)) return w;

          const origin = originMap.get(room._id);
          return {
            ...w,
            x: Math.max(0, applyGrid(origin.x + deltaX + room.width / 2)),
            y: Math.max(0, applyGrid(origin.y + deltaY + room.height / 2))
          };
        })
      );
    } else if (interaction.mode === 'drag') {
      const newX = Math.max(
        0,
        applyGrid(interaction.origX + deltaX)
      );

      const newY = Math.max(
        0,
        applyGrid(interaction.origY + deltaY)
      );

      setRooms((prev) =>
        prev.map((r) =>
          r._id === interaction.id
            ? { ...r, x: newX, y: newY }
            : r
        )
      );

      const room = rooms.find(
        (r) => r._id === interaction.id
      );

      if (room && interaction.wpId) {
        setWaypoints((prev) =>
          prev.map((w) =>
            w.id === interaction.wpId
              ? {
                  ...w,
                  x: newX + room.width / 2,
                  y: newY + room.height / 2
                }
              : w
          )
        );
      }
    } else if (interaction.mode === 'rotate') {
      const currentAngle =
        Math.atan2(
          e.clientY - interaction.centerY,
          e.clientX - interaction.centerX
        ) *
        (180 / Math.PI);

      let nextRotation =
        interaction.origRotation +
        (currentAngle - interaction.startAngle);

      // Keep the value compact and predictable.
      nextRotation = ((nextRotation + 180) % 360 + 360) % 360 - 180;
      nextRotation = Math.round(nextRotation);

      setRooms((prev) =>
        prev.map((r) =>
          r._id === interaction.id
            ? {
                ...r,
                rotation: nextRotation
              }
            : r
        )
      );
    } else if (interaction.mode === 'resize') {
      /*
       * Eight independent handles:
       * n / s / e / w / ne / nw / se / sw
       *
       * The opposite edge stays fixed, so resizing feels like a normal
       * design/editor tool. The minimum is type-specific rather than one
       * large global minimum, allowing very small washrooms/rooms.
       */
      const handle = interaction.handle || 'se';

      let nextX = interaction.origX;
      let nextY = interaction.origY;
      let nextWidth = interaction.origW;
      let nextHeight = interaction.origH;

      if (handle.includes('e')) {
        nextWidth = interaction.origW + deltaX;
      }

      if (handle.includes('s')) {
        nextHeight = interaction.origH + deltaY;
      }

      if (handle.includes('w')) {
        nextWidth = interaction.origW - deltaX;
        nextX = interaction.origX + deltaX;
      }

      if (handle.includes('n')) {
        nextHeight = interaction.origH - deltaY;
        nextY = interaction.origY + deltaY;
      }

      const minW = interaction.minW || 24;
      const minH = interaction.minH || 20;

      if (nextWidth < minW) {
        if (handle.includes('w')) {
          nextX = interaction.origX + interaction.origW - minW;
        }
        nextWidth = minW;
      }

      if (nextHeight < minH) {
        if (handle.includes('n')) {
          nextY = interaction.origY + interaction.origH - minH;
        }
        nextHeight = minH;
      }

      nextX = Math.max(0, applyGrid(nextX));
      nextY = Math.max(0, applyGrid(nextY));
      nextWidth = Math.max(minW, applyGrid(nextWidth));
      nextHeight = Math.max(minH, applyGrid(nextHeight));

      setRooms((prev) =>
        prev.map((r) =>
          r._id === interaction.id
            ? {
                ...r,
                x: nextX,
                y: nextY,
                width: nextWidth,
                height: nextHeight
              }
            : r
        )
      );

      if (interaction.wpId) {
        setWaypoints((prev) =>
          prev.map((w) =>
            w.id === interaction.wpId
              ? {
                  ...w,
                  x: nextX + nextWidth / 2,
                  y: nextY + nextHeight / 2
                }
              : w
          )
        );
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (interaction) {
      setInteraction(null);
      recordHistory(rooms, waypoints, edges);
    }
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

      setZoom((prev) =>
        Math.min(Math.max(prev * zoomFactor, 0.4), 3)
      );
    }
  };

  const handleRoomContextMenu = (e, room) => {
    e.preventDefault();
    e.stopPropagation();

    if (canvasRef.current) {
      const rect =
        canvasRef.current.getBoundingClientRect();

      setSelectedRoomId(room._id);

      setContextMenu({
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
        type: 'room',
        targetId: room._id
      });
    }
  };

  const handleWaypointContextMenu = (e, wp) => {
    e.preventDefault();
    e.stopPropagation();

    if (canvasRef.current) {
      const rect =
        canvasRef.current.getBoundingClientRect();

      setSelectedWaypointId(wp.id);

      setContextMenu({
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
        type: 'waypoint',
        targetId: wp.id
      });
    }
  };

  const handleCanvasClick = (e) => {
    setContextMenu(null);
    setSelectedRoomId(null);
    setSelectedRoomIds([]);
    setSelectedWaypointId(null);
    setSelectedSafetyEdgeKey('');

    if (
      activeTool === 'addWaypoint' &&
      canvasRef.current
    ) {
      const rect =
        canvasRef.current.getBoundingClientRect();

      const rawX =
        (e.clientX - rect.left) / zoom;

      const rawY =
        (e.clientY - rect.top) / zoom;

      const x = applyGrid(rawX);
      const y = applyGrid(rawY);

      const nextWaypoints = [
        ...waypoints,
        {
          id: `wp_${Date.now()}`,
          x,
          y,
          floor: activeFloor,
          isDoor: false
        }
      ];

      setWaypoints(nextWaypoints);
      recordHistory(rooms, nextWaypoints, edges);
    }
  };

  const handleWaypointClick = (e, wpId) => {
    if (e.button !== 0) return;

    e.stopPropagation();

    setContextMenu(null);

    if (activeTool === 'connect') {
      if (!connectStartNode) {
        setConnectStartNode(wpId);
      } else if (connectStartNode === wpId) {
        setConnectStartNode(null);
      } else {
        const existingIdx = edges.findIndex(
          (edge) =>
            (edge.from === connectStartNode &&
              edge.to === wpId) ||
            (edge.from === wpId &&
              edge.to === connectStartNode)
        );

        let nextEdges = [];

        if (existingIdx >= 0) {
          nextEdges = edges.filter(
            (_, idx) => idx !== existingIdx
          );
        } else {
          nextEdges = [
            ...edges,
            {
              from: connectStartNode,
              to: wpId
            }
          ];
        }

        setEdges(nextEdges);
        setConnectStartNode(wpId);
        recordHistory(rooms, waypoints, nextEdges);
        setValidationOpen(true);
      }
    } else {
      setSelectedWaypointId(wpId);
      setSelectedRoomId(null);
      setSelectedSafetyEdgeKey('');
    }
  };

  const handleSetQrLocation = useCallback(
    (wpId) => {
      const wp = waypoints.find((w) => w.id === wpId);
      if (!wp) return;

      const parentRoom = rooms.find(
        (r) => r.waypointId === wpId
      );

      const existingQr = qrLocations.find(
        (q) => q.nodeId === wpId
      );

      if (existingQr) {
        setQrModalNode(existingQr);
        setContextMenu(null);
        return;
      }

      const qrLocation = {
        id: `qr_${Date.now()}`,
        nodeId: wpId,
        buildingId,
        floor: wp.floor || activeFloor,
        roomId: parentRoom?._id || null,
        roomName: parentRoom?.name || 'Unnamed Location',
        label: parentRoom?.name || 'Indoor Location',
        createdAt: new Date().toISOString()
      };

      const nextQrLocations = [
        ...qrLocations,
        qrLocation
      ];

      setQrLocations(nextQrLocations);
      setQrModalNode(qrLocation);
      setContextMenu(null);
    },
    [
      waypoints,
      rooms,
      qrLocations,
      buildingId,
      activeFloor
    ]
  );

  const handleRemoveQrLocation = useCallback(
    (qrId) => {
      const nextQrLocations = qrLocations.filter(
        (q) => q.id !== qrId
      );

      setQrLocations(nextQrLocations);
      setQrModalNode(null);
    },
    [qrLocations]
  );

  const handleConfirmStairLink = () => {
    if (!stairModalSource || !targetStairWpId) return;

    const sourceRoom = rooms.find(
      (r) => r.waypointId === stairModalSource.id
    );

    const targetRoom = rooms.find(
      (r) => r.waypointId === targetStairWpId
    );

    // Safety check: only a Stairs-to-Stairs or Elevator-to-Elevator
    // connection is a valid vertical connector. This is intentionally
    // additive and does not modify any existing normal path behaviour.
    if (!sourceRoom || !['Stairs', 'Elevator'].includes(sourceRoom.type)) {
      alert('The source node must belong to a Stairs or Elevator element.');
      return;
    }

    if (!targetRoom || !['Stairs', 'Elevator'].includes(targetRoom.type)) {
      alert('Choose a Stairs or Elevator node on another floor.');
      return;
    }

    if (sourceRoom.type !== targetRoom.type) {
      alert(
        `Cannot connect ${sourceRoom.type} to ${targetRoom.type}. Connect the same type across floors (Stairs → Stairs or Elevator → Elevator).`
      );
      return;
    }

    if (stairModalSource.floor === targetRoom.floor) {
      alert(
        'Inter-floor links must connect stairways or elevators on DIFFERENT floors.'
      );
      return;
    }

    const existingEdge = edges.find(
      (e) =>
        e.isCrossFloor &&
        ((e.from === stairModalSource.id &&
          e.to === targetStairWpId) ||
          (e.from === targetStairWpId &&
            e.to === stairModalSource.id))
    );

    if (!existingEdge) {
      const nextEdges = [
        ...edges,
        {
          from: stairModalSource.id,
          to: targetStairWpId,
          isCrossFloor: true,
          connectorType: sourceRoom.type,
          connectionCost: sourceRoom.type === 'Elevator' ? 25 : 60
        }
      ];

      setEdges(nextEdges);
      recordHistory(rooms, waypoints, nextEdges);
    }

    setStairModalSource(null);
    setTargetStairWpId('');
  };

  // ============================================================
  // SAFETY / EMERGENCY HELPERS
  // ============================================================
  const makeEdgeKey = useCallback((from, to) => [from, to].sort().join('::'), []);
  const getParentRoomForNode = useCallback((nodeId) => rooms.find((r) => r.waypointId === nodeId), [rooms]);
  const isNodeSafetyBlocked = useCallback((nodeId) => {
    if (blockedNodeIds.includes(nodeId)) return true;
    const room = getParentRoomForNode(nodeId);
    return !!room && blockedRoomIds.includes(room._id);
  }, [blockedNodeIds, blockedRoomIds, getParentRoomForNode]);
  const isSafetyEdgeBlocked = useCallback((from, to) => blockedEdgeKeys.includes(makeEdgeKey(from, to)), [blockedEdgeKeys, makeEdgeKey]);
  const getNodeType = useCallback((nodeId) => getParentRoomForNode(nodeId)?.type || 'Node', [getParentRoomForNode]);

  const buildEmergencyGraph = useCallback(() => {
    const graph = {};
    waypoints.forEach((w) => { graph[w.id] = {}; });
    const allowed = (from, to, edge = {}) => {
      if (isNodeSafetyBlocked(from) || isNodeSafetyBlocked(to) || isSafetyEdgeBlocked(from, to)) return false;
      const a = getNodeType(from), b = getNodeType(to);
      const stairs = a === 'Stairs' || b === 'Stairs';
      const elevator = a === 'Elevator' || b === 'Elevator';
      if (emergencyType === 'fire' && elevator) return false;
      if ((accessibilityPrefs.wheelchair || accessibilityPrefs.avoidStairs) && stairs) return false;
      if (accessibilityPrefs.avoidElevators && elevator) return false;
      if (accessibilityPrefs.avoidNarrow && edge.narrow) return false;
      return true;
    };
    edges.forEach((edge) => {
      const w1 = waypoints.find((w) => w.id === edge.from), w2 = waypoints.find((w) => w.id === edge.to);
      if (!w1 || !w2 || !allowed(edge.from, edge.to, edge)) return;
      let weight = edge.customDistance > 0 ? edge.customDistance : edge.isCrossFloor ? (edge.connectionCost || 50) : w1.floor === w2.floor ? Math.hypot(w1.x-w2.x,w1.y-w2.y)*PIXELS_TO_METERS : 0;
      if (weight <= 0) return;
      if (accessibilityPrefs.wheelchair && (getNodeType(edge.from)==='Elevator' || getNodeType(edge.to)==='Elevator')) weight *= 0.75;
      if (accessibilityPrefs.minimizeWalking && edge.isCrossFloor) weight *= 0.75;
      graph[edge.from][edge.to] = weight; graph[edge.to][edge.from] = weight;
    });
    const vertical = waypoints.filter((w) => ['Stairs','Elevator'].includes(getNodeType(w.id)));
    for (let i=0;i<vertical.length;i++) for (let j=i+1;j<vertical.length;j++) {
      const a=vertical[i], b=vertical[j], ra=getParentRoomForNode(a.id), rb=getParentRoomForNode(b.id);
      if (!ra || !rb || a.floor===b.floor || ra.type!==rb.type) continue;
      if (isNodeSafetyBlocked(a.id)||isNodeSafetyBlocked(b.id)) continue;
      if (emergencyType==='fire' && ra.type==='Elevator') continue;
      if ((accessibilityPrefs.wheelchair||accessibilityPrefs.avoidStairs)&&ra.type==='Stairs') continue;
      if (accessibilityPrefs.avoidElevators&&ra.type==='Elevator') continue;
      const same=(ra.name||'').trim().toLowerCase()===(rb.name||'').trim().toLowerCase();
      if (same || !ra.name || !rb.name) { let cost=ra.type==='Elevator'?30:70; if(accessibilityPrefs.wheelchair&&ra.type==='Elevator')cost*=0.75; graph[a.id][b.id]=graph[a.id][b.id]||cost; graph[b.id][a.id]=graph[b.id][a.id]||cost; }
    }
    return graph;
  }, [waypoints, edges, isNodeSafetyBlocked, isSafetyEdgeBlocked, getNodeType, getParentRoomForNode, emergencyType, accessibilityPrefs]);

  const runEmergencyEvacuation = useCallback(() => {
    const startWpId=currentLocationNodeId || rooms.find((r)=>r._id===startRoomId)?.waypointId;
    if(!startWpId){alert('Set your current location first using QR/manual location.');return;}
    if(isNodeSafetyBlocked(startWpId)){alert('Your current location is marked blocked. Choose a safe current location.');return;}
    const exits=rooms.filter((r)=>r.waypointId&&!blockedRoomIds.includes(r._id)&&(emergencyType==='fire'?r.type==='EmergencyExit':['EmergencyExit','Entrance'].includes(r.type)));
    if(!exits.length){alert(emergencyType==='fire'?'No Emergency Exit exists. Add an Emergency Exit to the map first.':'No safe Emergency Exit or Entrance exists.');return;}
    const graph=buildEmergencyGraph(), dist={}, prev={}, unvisited=new Set(waypoints.map(w=>w.id));
    waypoints.forEach(w=>{dist[w.id]=Infinity;prev[w.id]=null;}); dist[startWpId]=0;
    while(unvisited.size){let current=null;unvisited.forEach(id=>{if(current===null||dist[id]<dist[current])current=id;});if(!current||dist[current]===Infinity)break;unvisited.delete(current);for(const n in graph[current]){const alt=dist[current]+graph[current][n];if(alt<dist[n]){dist[n]=alt;prev[n]=current;}}}
    const best=exits.map(room=>({room,distance:dist[room.waypointId]})).filter(x=>Number.isFinite(x.distance)).sort((a,b)=>a.distance-b.distance)[0];
    if(!best){alert('No safe evacuation route is available. Check blocked corridors/exits.');setEmergencyPath([]);return;}
    const path=[];let curr=best.room.waypointId;while(curr){path.unshift(curr);curr=prev[curr];}
    if(path[0]!==startWpId){alert('No safe evacuation route is available.');return;}
    const distance=Math.round(best.distance), speed=accessibilityPrefs.wheelchair?0.85:1.1, seconds=Math.max(1,Math.round(distance/speed));
    setEmergencyPath(path);setNavigationPath(path);setTotalDistance(distance);setEmergencyDistance(distance);setEmergencyTimeSeconds(seconds);setEmergencyExitId(best.room._id);setEmergencyMode(true);setCurrentLocationNodeId(startWpId);setEmergencyStatus(emergencyType==='fire'?'🔥 FIRE EMERGENCY — USE FIRE EXITS ONLY':'🚨 EMERGENCY EVACUATION ACTIVE');
     recordUniversalNavAnalyticsEvent('emergency_route');
    const startNode=waypoints.find(w=>w.id===startWpId);if(startNode?.floor)setActiveFloor(startNode.floor);
  }, [currentLocationNodeId,startRoomId,rooms,blockedRoomIds,isNodeSafetyBlocked,buildEmergencyGraph,accessibilityPrefs,emergencyType,waypoints]);

  const stopEmergencyMode=useCallback(()=>{setEmergencyMode(false);setEmergencyPath([]);setEmergencyExitId('');setEmergencyDistance(0);setEmergencyTimeSeconds(0);setEmergencyStatus('');},[]);
  const reportBlockedTarget=useCallback((kind)=>{
    const wpId=selectedWaypointId||rooms.find(r=>r._id===selectedRoomId)?.waypointId;
    const room=selectedRoomId?rooms.find(r=>r._id===selectedRoomId):null;
    if(['exit','stair','elevator'].includes(kind)&&!room){alert('Select the relevant map element first.');return;}

    // Corridor blocking: if an individual edge is selected, block ONLY that
    // connection. Otherwise keep the old fallback behaviour and block the
    // connected paths around the selected node.
    if(kind==='corridor'){
      if(selectedSafetyEdgeKey){
        setBlockedEdgeKeys(prev=>prev.includes(selectedSafetyEdgeKey)?prev:[...prev,selectedSafetyEdgeKey]);
        setEmergencyStatus('🚧 Selected corridor/path marked blocked');
        return;
      }
      if(!wpId){alert('Select a corridor/path or a connected waypoint first.');return;}
      const connected=edges.filter(e=>e.from===wpId||e.to===wpId);
      if(!connected.length){alert('No connected path was found for this node.');return;}
      setBlockedEdgeKeys(prev=>[...new Set([...prev,...connected.map(e=>makeEdgeKey(e.from,e.to))])]);
      setEmergencyStatus('🚧 Connected corridor/path marked blocked');
      return;
    }

    const wanted=kind==='stair'?'Stairs':kind==='elevator'?'Elevator':null;
    if(wanted&&room.type!==wanted){alert(`Select a ${wanted} element first.`);return;}
    setBlockedRoomIds(prev=>prev.includes(room._id)?prev:[...prev,room._id]);
    setEmergencyStatus(`🚫 ${room.name} marked unavailable`);
  },[selectedWaypointId,selectedRoomId,rooms,edges,makeEdgeKey,selectedSafetyEdgeKey]);

  const unblockSelectedSafetyItem=useCallback(()=>{
    if(selectedSafetyEdgeKey){
      setBlockedEdgeKeys(prev=>prev.filter(k=>k!==selectedSafetyEdgeKey));
      setEmergencyStatus('✅ Selected corridor/path restored');
      setSelectedSafetyEdgeKey('');
      return;
    }

    const room=selectedRoomId?rooms.find(r=>r._id===selectedRoomId):null;
    if(room && blockedRoomIds.includes(room._id)){
      setBlockedRoomIds(prev=>prev.filter(id=>id!==room._id));
      setEmergencyStatus(`✅ ${room.name} restored`);
      return;
    }

    const wpId=selectedWaypointId;
    if(wpId && blockedNodeIds.includes(wpId)){
      setBlockedNodeIds(prev=>prev.filter(id=>id!==wpId));
      setEmergencyStatus('✅ Selected node restored');
      return;
    }

    alert('Select a blocked corridor, room, staircase, elevator, exit, or node first.');
  },[selectedSafetyEdgeKey,selectedRoomId,selectedWaypointId,rooms,blockedRoomIds,blockedNodeIds]);

  const clearSafetyBlocks=useCallback(()=>{
    setBlockedNodeIds([]);
    setBlockedRoomIds([]);
    setBlockedEdgeKeys([]);
    setSelectedSafetyEdgeKey('');
    setEmergencyStatus('All reported blockages cleared.');
  },[]);

  // ============================================================
  // ROUTE OPTIONS — additive layer over the existing router
  // ============================================================
  const computeIndoorRoute = useCallback((startWpId, destinationRoomId, prefs = accessibilityPrefs) => {
    const destRoom = rooms.find((r) => r._id === destinationRoomId);
    if (!startWpId || !destRoom || !destRoom.waypointId) return null;

    const destWp = destRoom.waypointId;
    const graph = {};
    waypoints.forEach((w) => { graph[w.id] = {}; });

    edges.forEach((edge) => {
      const { from, to, isCrossFloor, connectionCost, customDistance, narrow } = edge;
      const w1 = waypoints.find((w) => w.id === from);
      const w2 = waypoints.find((w) => w.id === to);
      if (!w1 || !w2) return;

      // Keep all existing safety rules active.
      if (isNodeSafetyBlocked(from) || isNodeSafetyBlocked(to) || isSafetyEdgeBlocked(from, to)) return;

      const fromType = getNodeType(from);
      const toType = getNodeType(to);
      const touchesStairs = fromType === 'Stairs' || toType === 'Stairs';
      const touchesElevator = fromType === 'Elevator' || toType === 'Elevator';

      if ((prefs.wheelchair || prefs.avoidStairs) && touchesStairs) return;
      if (prefs.avoidElevators && touchesElevator) return;
      if (prefs.avoidNarrow && narrow) return;

      let weight = 0;
      if (customDistance !== undefined && customDistance !== null && customDistance > 0) {
        weight = Number(customDistance);
      } else if (isCrossFloor) {
        weight = Number(connectionCost || 50);
      } else if (w1.floor === w2.floor) {
        weight = Math.hypot(w1.x - w2.x, w1.y - w2.y) * PIXELS_TO_METERS;
      }

      if (weight > 0) {
        if (prefs.wheelchair && touchesElevator) weight *= 0.75;
        if (prefs.minimizeWalking && isCrossFloor) weight *= 0.75;
        graph[from][to] = weight;
        graph[to][from] = weight;
      }
    });

    // Preserve the existing automatic vertical connections between matching
    // stairs/elevators on different floors.
    const verticalNodes = waypoints.filter((w) => {
      const parent = rooms.find((r) => r.waypointId === w.id);
      return parent && (parent.type === 'Stairs' || parent.type === 'Elevator');
    });

    for (let i = 0; i < verticalNodes.length; i++) {
      for (let j = i + 1; j < verticalNodes.length; j++) {
        const w1 = verticalNodes[i], w2 = verticalNodes[j];
        const r1 = rooms.find((r) => r.waypointId === w1.id);
        const r2 = rooms.find((r) => r.waypointId === w2.id);
        if (!r1 || !r2 || w1.floor === w2.floor || r1.type !== r2.type) continue;
        if (isNodeSafetyBlocked(w1.id) || isNodeSafetyBlocked(w2.id)) continue;
        if ((prefs.wheelchair || prefs.avoidStairs) && r1.type === 'Stairs') continue;
        if (prefs.avoidElevators && r1.type === 'Elevator') continue;

        const sameName = (r1.name || '').trim().toLowerCase() === (r2.name || '').trim().toLowerCase();
        if (sameName || !r1.name || !r2.name) {
          let cost = r1.type === 'Elevator' ? 30 : 70;
          if (prefs.wheelchair && r1.type === 'Elevator') cost *= 0.75;
          if (!graph[w1.id][w2.id]) graph[w1.id][w2.id] = cost;
          if (!graph[w2.id][w1.id]) graph[w2.id][w1.id] = cost;
        }
      }
    }

    const distances = {};
    const previous = {};
    const unvisited = new Set(waypoints.map((w) => w.id));
    waypoints.forEach((w) => { distances[w.id] = Infinity; previous[w.id] = null; });
    distances[startWpId] = 0;

    while (unvisited.size > 0) {
      let current = null;
      unvisited.forEach((id) => {
        if (current === null || distances[id] < distances[current]) current = id;
      });
      if (!current || distances[current] === Infinity || current === destWp) break;
      unvisited.delete(current);
      for (const neighbor in graph[current]) {
        const alt = distances[current] + graph[current][neighbor];
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = current;
        }
      }
    }

    if (!Number.isFinite(distances[destWp])) return null;

    const path = [];
    let curr = destWp;
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }
    if (path[0] !== startWpId) return null;

    const distance = Math.max(1, Math.round(distances[destWp]));
    const speed = prefs.wheelchair ? 0.85 : 1.1;
    const seconds = Math.max(1, Math.round(distance / speed));
    return { path, distance, seconds };
  }, [rooms, waypoints, edges, accessibilityPrefs, isNodeSafetyBlocked, isSafetyEdgeBlocked, getNodeType]);

  const [routeOptions, setRouteOptions] = useState([]);
  const [routeOptionsOpen, setRouteOptionsOpen] = useState(false);
  const [selectedRouteOptionId, setSelectedRouteOptionId] = useState('');

  const formatRouteTime = useCallback((seconds) => {
    const total = Math.max(1, Math.round(seconds || 0));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return minutes > 0 ? `${minutes} min ${secs.toString().padStart(2, '0')} sec` : `${secs} sec`;
  }, []);

  const buildRouteOptions = useCallback((startWpId, destinationRoomId) => {
    const base = { ...accessibilityPrefs };
    const variants = [
      { id: 'fastest', icon: '🟢', label: 'Fastest', prefs: base, speed: 1 },
      { id: 'accessible', icon: '♿', label: 'Accessible', prefs: { ...base, wheelchair: true, avoidStairs: true, avoidElevators: false }, speed: 1 },
      { id: 'elevator', icon: '🛗', label: 'Elevator', prefs: { ...base, wheelchair: false, avoidStairs: true, avoidElevators: false }, speed: 1 },
      { id: 'emergency', icon: '🚨', label: 'Emergency / Safe', prefs: { ...base, avoidNarrow: true, avoidElevators: true }, speed: 1 }
    ];

    return variants.map((variant) => {
      const result = computeIndoorRoute(startWpId, destinationRoomId, variant.prefs);
      if (!result) return null;
      return { ...variant, ...result };
    }).filter(Boolean);
  }, [accessibilityPrefs, computeIndoorRoute]);

  const selectRouteOption = useCallback((option) => {
    if (!option) return;
    setSelectedRouteOptionId(option.id);
    setRouteOptionsOpen(false);
    setNavigationPath(option.path);
    setTotalDistance(option.distance);
    setCurrentLocationNodeId(option.path[0]);
    setIsSimulating(false);
    setSimulationProgress(0);

    const startNode = waypoints.find((w) => w.id === option.path[0]);
    if (startNode?.floor && startNode.floor !== activeFloor) setActiveFloor(startNode.floor);

    recordUniversalNavAnalyticsEvent('route_success', {
      accessible: option.id === 'accessible' || option.id === 'elevator' || Boolean(
        accessibilityPrefs.wheelchair || accessibilityPrefs.avoidStairs || accessibilityPrefs.avoidNarrow || accessibilityPrefs.minimizeWalking || accessibilityPrefs.avoidElevators
      )
    });
  }, [waypoints, activeFloor, accessibilityPrefs]);

  const calculateRouteFromNode = useCallback((startWpId, destinationRoomId) => {
    setIsSimulating(false);
    setSimulationProgress(0);

    const destRoom = rooms.find((r) => r._id === destinationRoomId);
    if (!startWpId || !destRoom) {
      alert('Please select your current location and destination.');
      return;
    }
    if (!destRoom.waypointId) {
      alert('Destination does not have a valid linked node.');
      return;
    }

    recordUniversalNavAnalyticsEvent('route_attempt');
    recordUniversalNavAnalyticsEvent('destination_search', { name: destRoom.name || 'Unnamed destination' });

    const options = buildRouteOptions(startWpId, destinationRoomId);
    if (!options.length) {
      alert('No valid route connects this location to the destination.');
      setNavigationPath([]);
      setTotalDistance(0);
      setRouteOptions([]);
      setRouteOptionsOpen(false);
      return;
    }

    setRouteOptions(options);
    setSelectedRouteOptionId('');
    setRouteOptionsOpen(true);

    // Preserve the old behavior as a safe fallback: the first/fastest route
    // is previewed on the map, but the user can explicitly choose another option.
    selectRouteOption(options[0]);
    setRouteOptionsOpen(true);
  }, [rooms, buildRouteOptions, selectRouteOption]);

  const handleFindRoute = () => {
    const startRoom = rooms.find(
      (r) => r._id === startRoomId
    );

    if (!startRoom) {
      alert('Please select a Start Room.');
      return;
    }

    calculateRouteFromNode(
      startRoom.waypointId,
      destRoomId
    );
  };

  const handleFindRouteFromQr = () => {
    if (!currentLocationNodeId) {
      alert(
        'Please select or scan your current location first.'
      );
      return;
    }

    calculateRouteFromNode(
      currentLocationNodeId,
      destRoomId
    );
  };

  const handleSelectQrLocation = (qr) => {
    setCurrentLocationNodeId(qr.nodeId);
    setStartRoomId('');

    const node = waypoints.find(
      (w) => w.id === qr.nodeId
    );

    if (
      node?.floor &&
      node.floor !== activeFloor
    ) {
      setActiveFloor(node.floor);
    }
  };

  const instructions = useMemo(() => {
    if (!navigationPath || navigationPath.length < 2) {
      return [];
    }

    const nodes = navigationPath
      .map((id) =>
        waypoints.find((w) => w.id === id)
      )
      .filter(Boolean);

    if (nodes.length < 2) return [];

    const result = [];

    const firstNode = nodes[0];

    const firstQr = qrLocations.find(
      (q) => q.nodeId === firstNode.id
    );

    const startRoom = rooms.find(
      (r) => r.waypointId === nodes[0].id
    );

    result.push({
      icon: firstQr ? '📍' : '🚀',
      title: firstQr ? 'Current Location' : 'Start',
      text: firstQr
        ? `You are at ${
            firstQr.label
          } (${
            nodes[0].floor || '1st FLOOR'
          })`
        : `Start at ${
            startRoom
              ? startRoom.name
              : 'Start Location'
          } (${
            nodes[0].floor || '1st FLOOR'
          })`
    });

    for (let i = 0; i < nodes.length - 1; i++) {
      const current = nodes[i];
      const next = nodes[i + 1];

      if (current.floor !== next.floor) {
        const parentRoom = rooms.find(
          (r) => r.waypointId === current.id
        );

        const type =
          parentRoom?.type === 'Elevator'
            ? 'Elevator'
            : 'Stairs';

        result.push({
          icon: type === 'Elevator' ? '🛗' : '🪜',
          title: `Take ${type}`,
          text: `Go from ${current.floor} to ${next.floor} via ${type}`
        });

        continue;
      }

      const matchingEdge = edges.find(
        (e) =>
          (e.from === current.id &&
            e.to === next.id) ||
          (e.from === next.id &&
            e.to === current.id)
      );

      const distMeters =
        matchingEdge?.customDistance ??
        Math.hypot(
          next.x - current.x,
          next.y - current.y
        ) * PIXELS_TO_METERS;

      const distStr = formatDistanceMeters(distMeters);

      if (
        i > 0 &&
        nodes[i - 1].floor === current.floor
      ) {
        const prev = nodes[i - 1];

        const dx1 = current.x - prev.x;
        const dy1 = current.y - prev.y;
        const dx2 = next.x - current.x;
        const dy2 = next.y - current.y;

        const cross =
          dx1 * dy2 - dy1 * dx2;

        const dot =
          dx1 * dx2 + dy1 * dy2;

        if (Math.abs(cross) > 100) {
          if (cross > 0) {
            result.push({
              icon: '↪️',
              title: 'Turn Right',
              text: `Turn Right and walk ${distStr}`
            });
          } else {
            result.push({
              icon: '↩️',
              title: 'Turn Left',
              text: `Turn Left and walk ${distStr}`
            });
          }
        } else if (dot > 0) {
          result.push({
            icon: '⬆️',
            title: 'Continue Straight',
            text: `Walk straight for ${distStr}`
          });
        }
      } else {
        result.push({
          icon: '🚶',
          title: 'Walk',
          text: `Walk ${distStr}`
        });
      }
    }

    const endRoom = rooms.find(
      (r) =>
        r.waypointId ===
        nodes[nodes.length - 1].id
    );

    result.push({
      icon: '🏁',
      title: 'Destination',
      text: `Arrive at ${
        endRoom
          ? endRoom.name
          : 'Destination'
      } (${
        nodes[nodes.length - 1].floor ||
        '1st FLOOR'
      })`
    });

    return result;
  }, [
    navigationPath,
    waypoints,
    rooms,
    edges,
    qrLocations
  ]);

  const handleClearRoute = () => {
    stopEmergencyMode();
    setIsSimulating(false);
    setSimulationProgress(0);
    setNavigationPath([]);
    setTotalDistance(0);
    setStartRoomId('');
    setDestRoomId('');
    setCurrentLocationNodeId('');
    setRouteOptions([]);
    setRouteOptionsOpen(false);
    setSelectedRouteOptionId('');
  };

  const toggleSimulation = () => {
    if (!navigationPath.length) return;

    if (simulationProgress >= 1) {
      setSimulationProgress(0);
    }

    setIsSimulating((prev) => !prev);
  };

  const availableStairNodes = waypoints.filter((w) => {
    if (
      !stairModalSource ||
      w.id === stairModalSource.id
    ) {
      return false;
    }

    const sourceRoom = rooms.find(
      (r) => r.waypointId === stairModalSource.id
    );
    const parentRoom = rooms.find(
      (r) => r.waypointId === w.id
    );

    // Show only valid vertical targets: same connector type, different floor.
    return (
      sourceRoom &&
      parentRoom &&
      ['Stairs', 'Elevator'].includes(sourceRoom.type) &&
      parentRoom.type === sourceRoom.type &&
      (w.floor || '1st FLOOR') !==
        (stairModalSource.floor || '1st FLOOR')
    );
  });

  const currentQrLocations = qrLocations.filter(
    (q) =>
      (q.floor || '1st FLOOR') === activeFloor
  );

  // Additive navigation marker: never changes editing/routing state.
  // It is rendered only on the floor containing the selected current location.
  const currentLocationWaypoint = currentWaypoints.find(
    (wp) => wp.id === currentLocationNodeId
  );

  // Smart-search distance is based on the same indoor routing graph used by
  // navigation, so the search result does not invent a separate map distance.
  // When no current location is set, no distance is shown.
  const getSearchDistanceMeters = useCallback((room) => {
    if (!currentLocationNodeId || !room?.waypointId) return null;

    const route = computeIndoorRoute(
      currentLocationNodeId,
      room._id,
      accessibilityPrefs
    );

    return route?.distance ?? null;
  }, [currentLocationNodeId, computeIndoorRoute, accessibilityPrefs]);

  const handleSmartSearchDestination = useCallback((roomId) => {
    const room = rooms.find((r) => r._id === roomId);
    if (room?.floor && room.floor !== activeFloor) {
      setActiveFloor(room.floor);
    }
    setDestRoomId(roomId);
  }, [rooms, activeFloor]);

  // ADDITIVE: Explore Around Me. Uses the same indoor routing graph as the
  // existing navigation/search features; it does not create a second routing system.
  const nearbyRooms = useMemo(() => {
    if (!currentLocationNodeId) return [];

    const currentNode = waypoints.find((w) => w.id === currentLocationNodeId);
    if (!currentNode) return [];

    return rooms
      .filter((room) => room?.waypointId && room.waypointId !== currentLocationNodeId)
      .map((room) => {
        const route = computeIndoorRoute(
          currentLocationNodeId,
          room._id,
          accessibilityPrefs
        );
        if (!route || !Number.isFinite(Number(route.distance))) return null;

        return {
          room,
          distance: Number(route.distance),
          sameFloor: (room.floor || '1st FLOOR') === (currentNode.floor || '1st FLOOR')
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.sameFloor !== b.sameFloor) return a.sameFloor ? -1 : 1;
        return a.distance - b.distance;
      })
      .slice(0, 8);
  }, [currentLocationNodeId, waypoints, rooms, computeIndoorRoute, accessibilityPrefs]);

  const exploreAroundCategories = [
    { key: 'All', label: 'All', icon: '📍' },
    { key: 'Cafeteria', label: 'Food', icon: '🍽️' },
    { key: 'Washroom', label: 'Facilities', icon: '🚻' },
    { key: 'Lab', label: 'Labs', icon: '🧪' },
    { key: 'Exits', label: 'Exits', icon: '🚪' },
    { key: 'Elevator', label: 'Elevators', icon: '🛗' },
    { key: 'Stairs', label: 'Stairs', icon: '🪜' },
    { key: 'Accessible', label: '♿ Accessible', icon: '♿' }
  ];

  const [exploreAroundCategory, setExploreAroundCategory] = useState('All');

  const matchesExploreCategory = useCallback((room) => {
    if (exploreAroundCategory === 'All') return true;
    if (exploreAroundCategory === 'Exits') {
      return ['EmergencyExit', 'Entrance'].includes(room?.type);
    }
    if (exploreAroundCategory === 'Accessible') {
      return !['Stairs'].includes(room?.type) && room?.accessible !== false && room?.wheelchairAccessible !== false;
    }
    return room?.type === exploreAroundCategory;
  }, [exploreAroundCategory]);

  const visibleNearbyRooms = useMemo(
    () => nearbyRooms.filter(({ room }) => matchesExploreCategory(room)),
    [nearbyRooms, matchesExploreCategory]
  );

  const handleExploreAroundRoom = useCallback((roomId) => {
    if (!currentLocationNodeId) return;

    const room = rooms.find((r) => r._id === roomId);
    if (!room) return;

    // Keep the existing destination/routing flow intact. This simply feeds
    // the selected nearby destination into the same route calculator.
    setDestRoomId(roomId);
    calculateRouteFromNode(currentLocationNodeId, roomId);
  }, [currentLocationNodeId, rooms, calculateRouteFromNode]);

  return (
    <div
      className="d-flex flex-column vh-100 bg-dark text-light overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <style>{`
        @keyframes universalnav-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(34,197,94,.85), 0 0 10px rgba(34,197,94,.8);
          }
          70% {
            box-shadow: 0 0 0 16px rgba(34,197,94,0), 0 0 18px rgba(34,197,94,.95);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34,197,94,0), 0 0 10px rgba(34,197,94,.8);
          }
        }

        @keyframes universalnav-location-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: .95;
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
          }
        }

        @keyframes universalnav-location-ring {
          0% {
            transform: translate(-50%, -50%) scale(.65);
            opacity: .75;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.65);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.65);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .universalnav-location-marker,
          .universalnav-location-ring {
            animation: none !important;
          }
        }
      `}</style>
      {/* HEADER */}
      <div className="universalnav-editor-toolbar px-3 py-2 border-bottom border-secondary bg-dark">
        <div className="universalnav-toolbar-group">
          <input
            type="text"
            className="form-control bg-secondary text-light border-0 fw-bold fs-5 py-1 px-2"
            style={{ width: '200px' }}
            value={mapTitle}
            onChange={(e) => setMapTitle(e.target.value)}
          />

          <div className="btn-group ms-2">
            {floors.map((fl) => (
              <button
                key={fl}
                className={`btn btn-sm d-flex align-items-center gap-1 ${
                  activeFloor === fl
                    ? 'btn-primary fw-bold'
                    : 'btn-outline-secondary text-light'
                }`}
                onClick={() => setActiveFloor(fl)}
              >
                <span>{fl}</span>

                <span
                  className="badge rounded-pill bg-dark bg-opacity-50 px-1 text-light"
                  style={{
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                  onClick={(e) =>
                    handleRemoveFloor(e, fl)
                  }
                  title={`Remove ${fl}`}
                >
                  ✕
                </span>
              </button>
            ))}

            <button
              className="btn btn-sm btn-outline-info"
              onClick={handleAddFloor}
            >
              ➕ Floor
            </button>
          </div>
        </div>

        <div className="universalnav-toolbar-group bg-secondary bg-opacity-20 px-2 py-1 rounded border border-secondary">
          <button
            className="btn btn-sm btn-dark text-light"
            onClick={handleUndo}
            disabled={historyStep <= 0}
            title="Undo (Ctrl+Z)"
          >
            ↩️
          </button>

          <button
            className="btn btn-sm btn-dark text-light"
            onClick={handleRedo}
            disabled={
              historyStep >= history.length - 1
            }
            title="Redo (Ctrl+Y)"
          >
            ↪️
          </button>

          <div className="btn-group btn-group-sm ms-1" role="group" aria-label="Editor actions">
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={copySelectedRooms}
              disabled={!selectedRoomIds.length && !selectedRoomId}
              title="Copy selected room(s) (Ctrl+C)"
            >
              📋
            </button>
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={pasteCopiedRooms}
              disabled={!clipboardRooms.length}
              title="Paste copied room(s) (Ctrl+V)"
            >
              📌
            </button>
            <button
              type="button"
              className="btn btn-outline-info"
              onClick={() => duplicateSelectedRooms()}
              disabled={!selectedRoomIds.length && !selectedRoomId}
              title="Duplicate selected room(s) (Ctrl+D)"
            >
              ⧉
            </button>
          </div>

          <div className="dropdown ms-1">
            <button
              className="btn btn-sm btn-outline-warning dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              disabled={selectedRoomIds.length < 2}
              title="Align selected rooms"
            >
              ↔ Align
            </button>
            <ul className="dropdown-menu dropdown-menu-dark shadow">
              {[
                ['left', 'Align Left'],
                ['center', 'Align Center'],
                ['right', 'Align Right'],
                ['top', 'Align Top'],
                ['middle', 'Align Middle'],
                ['bottom', 'Align Bottom']
              ].map(([mode, label]) => (
                <li key={mode}>
                  <button
                    className="dropdown-item"
                    type="button"
                    onClick={() => alignSelectedRooms(mode)}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-success ms-1"
            onClick={() => setVersionHistoryOpen(true)}
            title="Map version history"
          >
            🕘
          </button>

          <div className="small text-secondary ms-1 d-flex align-items-center" title="Auto-save status">
            {autoSaveState === 'saving' && '⟳ Saving...'}
            {autoSaveState === 'saved' && '✓ Saved'}
            {autoSaveState === 'local' && '⚠ Local'}
          </div>

          <div className="vr bg-secondary my-1"></div>

          <div className="form-check form-switch m-0 ms-1 d-flex align-items-center gap-1">
            <input
              className="form-check-input my-0"
              type="checkbox"
              id="gridToggle"
              checked={enableGrid}
              onChange={(e) =>
                setEnableGrid(e.target.checked)
              }
            />

            <label
              className="form-check-label small text-light"
              htmlFor="gridToggle"
            >
              Grid Snap
            </label>
          </div>

          <select
            className="form-select form-select-sm bg-dark text-light border-secondary ms-1 py-0 px-2"
            style={{ width: '70px' }}
            value={gridSize}
            onChange={(e) =>
              setGridSize(Number(e.target.value))
            }
            disabled={!enableGrid}
          >
            <option value="8">8px</option>
            <option value="16">16px</option>
            <option value="32">32px</option>
          </select>
        </div>

        <div className="universalnav-toolbar-group universalnav-toolbar-actions">
          <div className="btn-group me-2">
            <button
              className="btn btn-sm btn-dark text-light"
              onClick={() =>
                setZoom((z) => Math.min(z + 0.15, 3))
              }
              title="Zoom In"
            >
              🔍+
            </button>

            <button
              className="btn btn-sm btn-dark text-light"
              onClick={() =>
                setZoom((z) => Math.max(z - 0.15, 0.4))
              }
              title="Zoom Out"
            >
              🔍-
            </button>

            <button
              className="btn btn-sm btn-dark text-light"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              title="Reset View"
            >
              🎯 Reset
            </button>
          </div>

          <button
            className={`btn btn-sm ${
              activeTool === 'select'
                ? 'btn-warning fw-bold'
                : 'btn-outline-light'
            }`}
            onClick={() => {
              setActiveTool('select');
              setConnectStartNode(null);
            }}
          >
            ✋ Drag / Select
          </button>

          <button
            className={`btn btn-sm ${
              activeTool === 'addWaypoint'
                ? 'btn-success fw-bold'
                : 'btn-outline-light'
            }`}
            onClick={() => {
              setActiveTool('addWaypoint');
              setConnectStartNode(null);
            }}
          >
            📍 Add Node
          </button>

          <button
            className={`btn btn-sm ${
              activeTool === 'connect'
                ? 'btn-info fw-bold'
                : 'btn-outline-light'
            }`}
            onClick={() => {
              setActiveTool('connect');
              setConnectStartNode(null);
            }}
          >
            🔗 Connect Paths{' '}
            {connectStartNode
              ? '(Select next node)'
              : ''}
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm fw-bold ${boundaryPanelOpen ? 'btn-info text-dark' : 'btn-outline-info'}`}
            onClick={() => setBoundaryPanelOpen((v) => !v)}
            title="Define or edit the current floor boundary"
          >
            🏢 Boundary
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-info fw-bold"
            onClick={handleOpenVenueOverview}
            title="Open Venue Overview"
          >
            🏢 Overview
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-success fw-bold"
            onClick={handleOpenAnalytics}
            title="Open UniversalNav Analytics"
          >
            📊 Analytics
          </button>

          <button
            type="button"
            className={`btn btn-sm fw-bold ${validationOpen ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
            onClick={() => setValidationOpen((v) => !v)}
            title="Validate the current map connectivity"
          >
            ⚠️ Validate {mapValidation.issueCount > 0 ? `(${mapValidation.issueCount})` : '✓'}
          </button>

          <button
            className={`btn btn-sm fw-bold ${emergencyMode ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setEmergencyCenterOpen(true)}
            title="Open Emergency & Safety Center"
          >
            🚨 Emergency
          </button>

          <button
            className="btn btn-sm btn-outline-info fw-semibold"
            onClick={() => handleSaveMap('draft')}
            disabled={isSaving}
          >
            💾 Save Draft
          </button>

          <button
            className="btn btn-sm btn-success fw-bold"
            onClick={() => handleSaveMap('completed')}
            disabled={isSaving}
          >
            Publish Complete
          </button>

          <button
            className="btn btn-sm btn-outline-danger ms-1"
            onClick={() => navigate('/dashboard')}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`alert alert-${
            saveMessage.type === 'success'
              ? 'success'
              : 'danger'
          } py-1 mb-0 rounded-0 text-center small fw-semibold`}
        >
          {saveMessage.text}
        </div>
      )}

      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* ADDITIVE multi-selection status */}
        {selectedRoomIds.length > 1 && (
          <div
            className="position-fixed bottom-0 start-50 translate-middle-x mb-3 bg-dark border border-info rounded-pill px-3 py-2 text-info small fw-bold shadow-lg"
            style={{ zIndex: 1200 }}
          >
            ☑ {selectedRoomIds.length} rooms selected · Shift-click to add/remove · Ctrl+D duplicate
          </div>
        )}

        {/* LEFT SIDEBAR */}
        <div
          id="universalnav-left-sidebar"
          className="p-3 border-end border-secondary bg-dark overflow-auto d-flex flex-column gap-3 universalnav-editor-sidebar"
          style={{
            width: '310px',
            minWidth: '310px'
          }}
        >
          {/* ==================================================
              🏢 VENUE OVERVIEW
              Additive card; no existing controls removed.
          ================================================== */}
          <div className="bg-secondary bg-opacity-10 border border-info rounded p-3 text-light">
            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
              <div>
                <div className="small text-info fw-bold text-uppercase">🏢 Venue Overview</div>
                <div className="fw-bold text-light text-truncate" style={{ maxWidth: '190px' }}>{mapTitle || 'Building'}</div>
              </div>
              <div className="d-flex gap-1">
                <button
                  type="button"
                  className="btn btn-sm btn-info text-dark fw-bold py-0 px-2"
                  style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                  onClick={handleOpenVenueOverview}
                >
                  Open
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-success fw-bold py-0 px-2"
                  style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                  onClick={handleOpenAnalytics}
                  title="Open Analytics"
                >
                  📊
                </button>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-1">
              <span className="badge bg-dark border border-secondary">📍 {floors.length} Floors</span>
              <span className="badge bg-dark border border-secondary">🚪 {rooms.filter((r) => !['Stairs','Elevator'].includes(r.type)).length} Rooms</span>
              <span className="badge bg-dark border border-secondary">🛗 {rooms.filter((r) => r.type === 'Elevator').length} Elevators</span>
              <span className="badge bg-dark border border-secondary">🪜 {rooms.filter((r) => r.type === 'Stairs').length} Stairs</span>
              <span className="badge bg-dark border border-secondary">🚻 {rooms.filter((r) => r.type === 'Washroom').length} Washrooms</span>
              <span className="badge bg-dark border border-secondary">🚨 {rooms.filter((r) => r.type === 'EmergencyExit').length} Exits</span>
            </div>
          </div>

          {/* 🚨 EMERGENCY / SAFETY CENTER - intentionally above Navigation */}
          <div id="emergency-safety-center" className={`rounded p-3 text-light border ${emergencyMode ? 'border-danger bg-danger bg-opacity-25' : 'border-danger'}`} style={{ boxShadow: emergencyMode ? '0 0 18px rgba(220,53,69,.45)' : 'none' }}>
            <div className="d-flex justify-content-between align-items-center mb-2"><h6 className="fw-bold text-danger mb-0 text-uppercase">🚨 Emergency & Safety</h6>{emergencyMode&&<span className="badge bg-danger">ACTIVE</span>}</div>
            <div className="small text-secondary mb-2">Safest exit routing + blocked-area reporting + accessibility.</div>
            <select className="form-select form-select-sm bg-dark text-light border-danger mb-2" value={emergencyType} onChange={e=>setEmergencyType(e.target.value)}>
              <option value="evacuation">🚨 Emergency Evacuation</option><option value="fire">🔥 Fire Emergency — Fire Exits Only</option>
            </select>
            <button className="btn btn-danger btn-sm w-100 fw-bold mb-2" onClick={runEmergencyEvacuation}>🚨 Start Emergency Evacuation</button>
            {emergencyMode&&<div className="bg-dark rounded p-2 mb-2 border border-danger"><div className="fw-bold text-danger small">{emergencyStatus}</div>{(()=>{const exit=rooms.find(r=>r._id===emergencyExitId);return <><div className="text-light small mt-1">🚪 Nearest safe exit: <strong>{exit?.name||'Exit'}</strong></div><div className="text-warning small">📏 {formatDistanceMeters(emergencyDistance)} • ⏱️ {formatEmergencyTime(emergencyTimeSeconds)}</div></>})()}<button className="btn btn-outline-light btn-sm w-100 mt-2" onClick={stopEmergencyMode}>Exit Emergency Mode</button></div>}
            <div className="border-top border-secondary pt-2 mt-2"><div className="small fw-bold text-info mb-2">♿ Accessibility Preferences</div>
              {[['wheelchair','♿ Wheelchair accessible'],['avoidStairs','🪜 Avoid stairs'],['avoidNarrow','↔️ Avoid narrow corridors'],['minimizeWalking','🚶 Minimize walking'],['avoidElevators','🛗 Avoid elevators']].map(([key,label])=><label key={key} className="d-flex align-items-center gap-2 small mb-1"><input type="checkbox" checked={!!accessibilityPrefs[key]} onChange={e=>setAccessibilityPrefs(prev=>({...prev,[key]:e.target.checked,...(key==='wheelchair'&&e.target.checked?{avoidStairs:true}:{})}))}/><span>{label}</span></label>)}
              {(accessibilityPrefs.wheelchair||accessibilityPrefs.avoidStairs)&&<div className="alert alert-info py-1 px-2 mb-0 mt-2 small">♿ Accessible route: elevator is allowed unless “Avoid elevators” is selected.</div>}
            </div>
            <div className="border-top border-secondary pt-2 mt-2"><div className="small fw-bold text-warning mb-2">🚫 Report blocked / unsafe area</div><div className="small text-secondary mb-2">Select a room/node, or click a path line to select one exact corridor connection.</div>
              {selectedSafetyEdgeKey&&<div className="small bg-warning bg-opacity-10 border border-warning rounded p-2 mb-2 text-warning">🟠 Selected path will be blocked individually.</div>}
              <div className="d-grid gap-1">
                <button className="btn btn-sm btn-outline-danger" onClick={()=>reportBlockedTarget('corridor')}>🚧 Corridor / Path Blocked</button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>reportBlockedTarget('stair')}>🚫 Staircase Unavailable</button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>reportBlockedTarget('elevator')}>🚫 Elevator Unavailable</button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>reportBlockedTarget('exit')}>🚪 Exit Unavailable</button>
                {(selectedSafetyEdgeKey || (selectedRoomId&&blockedRoomIds.includes(selectedRoomId)) || (selectedWaypointId&&blockedNodeIds.includes(selectedWaypointId)))&&<button className="btn btn-sm btn-outline-success" onClick={unblockSelectedSafetyItem}>✅ Restore Selected Item</button>}
                {(blockedNodeIds.length||blockedRoomIds.length||blockedEdgeKeys.length)>0&&<button className="btn btn-sm btn-outline-warning" onClick={clearSafetyBlocks}>♻️ Clear All Reported Blockages</button>}
              </div></div>
          </div>

          {/* ======================================================
              ⚠️ MAP VALIDATION
              Read-only diagnostics for the map editor.
          ====================================================== */}
          {validationOpen && (
            <div className="bg-dark border border-warning rounded p-3 text-light shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <div className="fw-bold text-warning">⚠️ MAP VALIDATION</div>
                  <div className="small text-secondary">Live connectivity checks for the current map</div>
                </div>
                <button className="btn btn-sm btn-outline-light py-0 px-2" onClick={() => setValidationOpen(false)}>✕</button>
              </div>

              <div className={`rounded p-2 mb-2 border ${mapValidation.status === 'success' ? 'border-success bg-success bg-opacity-10' : mapValidation.status === 'warning' ? 'border-warning bg-warning bg-opacity-10' : 'border-danger bg-danger bg-opacity-10'}`}>
                <div className="fw-bold">
                  {mapValidation.passed ? '✅ MAP LOOKS VALID' : mapValidation.errors.length ? '❌ FIX REQUIRED' : '⚠️ REVIEW WARNINGS'}
                </div>
                <div className="small text-secondary">
                  {mapValidation.passed ? 'No connectivity problems detected.' : `${mapValidation.errors.length} error(s) • ${mapValidation.warnings.length} warning(s)`}
                </div>
              </div>

              <div className="row g-1 mb-2">
                {mapValidation.checks.map((check) => (
                  <div className="col-6" key={check.label}>
                    <div className="bg-secondary bg-opacity-25 rounded px-2 py-1 small d-flex justify-content-between">
                      <span>{check.label}</span><strong>{check.value}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {mapValidation.errors.length > 0 && (
                <div className="mb-2">
                  <div className="small fw-bold text-danger mb-1">❌ Problems to fix</div>
                  <div className="d-grid gap-1">
                    {mapValidation.errors.map((item) => (
                      <button key={item.key} type="button" className="btn btn-sm btn-outline-danger text-start" onClick={() => {
                        if (!item.nodeId) return;
                        setSelectedWaypointId(item.nodeId);
                        setSelectedRoomId(null);
                        const node = waypoints.find((w) => w.id === item.nodeId);
                        if (node?.floor) setActiveFloor(node.floor);
                      }}>
                        ❌ {item.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mapValidation.warnings.length > 0 && (
                <div>
                  <div className="small fw-bold text-warning mb-1">⚠️ Warnings</div>
                  <div className="d-grid gap-1">
                    {mapValidation.warnings.map((item) => (
                      <button key={item.key} type="button" className="btn btn-sm btn-outline-warning text-start" onClick={() => {
                        if (!item.nodeId) return;
                        setSelectedWaypointId(item.nodeId);
                        setSelectedRoomId(null);
                        const node = waypoints.find((w) => w.id === item.nodeId);
                        if (node?.floor) setActiveFloor(node.floor);
                      }}>
                        ⚠️ {item.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mapValidation.passed && (
                <div className="small text-success fw-semibold">✓ All current nodes and paths pass the basic connectivity checks.</div>
              )}
            </div>
          )}

          {/* NAVIGATION */}
          <div id="universalnav-navigation-panel" className="bg-secondary bg-opacity-20 border border-secondary rounded p-3 text-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-info mb-0 small text-uppercase">
                Navigation Simulation
              </h6>

              {(navigationPath.length > 0 ||
                startRoomId ||
                destRoomId ||
                currentLocationNodeId) && (
                <button
                  className="btn btn-sm btn-outline-danger py-0 px-2 small"
                  onClick={handleClearRoute}
                >
                  ✕ Close Route
                </button>
              )}
            </div>

            {/* CURRENT LOCATION */}
            <div className="border border-info rounded p-2 mb-3 bg-info bg-opacity-10">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small fw-bold text-info">
                  📍 Where are you?
                </span>

                {currentLocationNodeId && (
                  <span className="badge bg-success">
                    ✓ Set
                  </span>
                )}
              </div>

              {currentLocationNodeId ? (
                <>
                  {(() => {
                    const currentNode =
                      waypoints.find(
                        (w) =>
                          w.id ===
                          currentLocationNodeId
                      );

                    const currentQr =
                      qrLocations.find(
                        (q) =>
                          q.nodeId ===
                          currentLocationNodeId
                      );

                    return (
                      <div className="bg-dark rounded p-2 mb-2">
                        <div className="fw-bold text-light small">
                          {currentQr?.label ||
                            rooms.find(
                              (r) =>
                                r.waypointId ===
                                currentLocationNodeId
                            )?.name ||
                            'Current Location'}
                        </div>

                        <div className="small text-secondary">
                          {currentNode?.floor ||
                            '1st FLOOR'}
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    className="btn btn-sm btn-outline-warning w-100"
                    onClick={() =>
                      setCurrentLocationNodeId('')
                    }
                  >
                    Change Location
                  </button>
                </>
              ) : (
                <>
                  <div className="small text-secondary mb-2">
                    Set the starting point using a QR location or manually.
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <button
                      className="btn btn-sm btn-primary fw-bold"
                      onClick={() => {
                        if (qrLocations.length === 0) {
                          alert(
                            'No QR locations have been created yet. Right-click a waypoint and select "Create QR Location".'
                          );
                          return;
                        }

                        handleSelectQrLocation(
                          qrLocations[0]
                        );
                      }}
                      disabled={
                        qrLocations.length === 0
                      }
                    >
                      📷 Select QR Location
                    </button>

                    <select
                      className="form-select form-select-sm bg-dark text-light border-secondary"
                      value={currentLocationNodeId}
                      onChange={(e) => {
                        setCurrentLocationNodeId(
                          e.target.value
                        );
                        setStartRoomId('');
                      }}
                    >
                      <option value="">
                        Choose location manually...
                      </option>

                      {waypoints.map((wp) => {
                        const parentRoom =
                          rooms.find(
                            (r) =>
                              r.waypointId === wp.id
                          );

                        const qr =
                          qrLocations.find(
                            (q) =>
                              q.nodeId === wp.id
                          );

                        return (
                          <option
                            key={wp.id}
                            value={wp.id}
                          >
                            {qr?.label ||
                              parentRoom?.name ||
                              'Node'} (
                            {wp.floor ||
                              '1st FLOOR'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* QR LOCATIONS */}
            {qrLocations.length > 0 && (
              <div className="mb-3">
                <label className="form-label small text-secondary mb-1">
                  Saved QR Locations
                </label>

                <select
                  className="form-select form-select-sm bg-dark text-light border-secondary"
                  value={
                    qrLocations.some(
                      (q) =>
                        q.nodeId ===
                        currentLocationNodeId
                    )
                      ? currentLocationNodeId
                      : ''
                  }
                  onChange={(e) => {
                    const qr =
                      qrLocations.find(
                        (q) =>
                          q.nodeId ===
                          e.target.value
                      );

                    if (qr) {
                      handleSelectQrLocation(qr);
                    }
                  }}
                >
                  <option value="">
                    Select QR location...
                  </option>

                  {qrLocations.map((qr) => (
                    <option
                      key={qr.id}
                      value={qr.nodeId}
                    >
                      📱 {qr.label} — {qr.floor}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CLASSIC START ROOM */}
            <div className="border-top border-secondary pt-2">
              <label className="form-label small text-secondary mb-1">
                Start Room (Classic Mode)
              </label>

              <select
                className="form-select form-select-sm bg-dark text-light border-secondary fw-semibold"
                value={startRoomId}
                onChange={(e) => {
                  setStartRoomId(e.target.value);
                  setCurrentLocationNodeId('');
                }}
              >
                <option value="">
                  Select Start Room...
                </option>

                {rooms.map((r) => (
                  <option
                    key={r._id}
                    value={r._id}
                  >
                    {r.name} (
                    {r.floor || '1st FLOOR'})
                  </option>
                ))}
              </select>
            </div>

            {/* =================================================
                NEW DESTINATION SEARCH UI
            ================================================= */}
            <div className="d-flex flex-column gap-2 mt-2">
              <DestinationSearch
                rooms={rooms}
                selectedRoomId={destRoomId}
                getDistanceMeters={getSearchDistanceMeters}
                onSelectRoom={handleSmartSearchDestination}
              />

              {/* =================================================
                  📍 EXPLORE AROUND ME — additive feature
              ================================================= */}
              {currentLocationNodeId && (
                <div className="border border-success rounded-3 p-2 mt-1 bg-success bg-opacity-10">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div>
                      <div className="fw-bold text-success">📍 Explore Around Me</div>
                      <div className="small text-secondary">Nearby places from your current location</div>
                    </div>
                    <span className="badge bg-success">{visibleNearbyRooms.length}</span>
                  </div>

                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {exploreAroundCategories.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`btn btn-sm py-1 px-2 ${
                          exploreAroundCategory === item.key
                            ? 'btn-success fw-bold'
                            : 'btn-outline-secondary text-light'
                        }`}
                        onClick={() => setExploreAroundCategory(item.key)}
                      >
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="small fw-bold text-light mb-1">NEARBY</div>

                  {visibleNearbyRooms.length === 0 ? (
                    <div className="small text-secondary py-2">
                      No reachable locations found for this category.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-1">
                      {visibleNearbyRooms.slice(0, 6).map(({ room, distance }) => (
                        <button
                          key={`nearby-${room._id}`}
                          type="button"
                          className="btn btn-sm btn-dark border border-secondary text-start p-2"
                          onClick={() => handleExploreAroundRoom(room._id)}
                          title={`Navigate to ${room.name || 'location'}`}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '18px' }}>{getRoomIconForRoom(room)}</span>
                            <div className="flex-grow-1 min-w-0">
                              <div className="fw-semibold text-light text-truncate">
                                {room.name || 'Unnamed Location'}
                              </div>
                              <div className="small text-secondary">
                                {room.floor || '1st FLOOR'} • {room.type === 'Lab' ? 'Laboratory' : room.type || 'Room'}
                              </div>
                            </div>
                            <span className="text-success fw-bold small">
                              {formatDistanceMeters(distance)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="small text-secondary mt-2">
                    Tap a place to start routing immediately.
                  </div>
                </div>
              )}

              <button
                className="btn btn-sm btn-info w-100 fw-bold mt-1"
                onClick={handleFindRouteFromQr}
                disabled={
                  !currentLocationNodeId ||
                  !destRoomId
                }
              >
                📍 Navigate From My Location
              </button>

              <button
                className="btn btn-sm btn-primary w-100 fw-bold"
                onClick={handleFindRoute}
                disabled={
                  !startRoomId ||
                  !destRoomId
                }
              >
                Find Shortest Route
              </button>

              {totalDistance > 0 && (
                <div className="badge bg-success w-100 py-2 mt-1 fs-6">
                  Total Distance:{' '}
                  {formatDistanceMeters(
                    totalDistance
                  )}
                </div>
              )}
            </div>

            {/* =================================================
                ROUTE OPTIONS
            ================================================= */}
            {routeOptions.length > 0 && routeOptionsOpen && (
              <div className="border border-info rounded-3 p-2 mt-2 bg-info bg-opacity-10">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div>
                    <div className="fw-bold text-info">🧭 Choose your route</div>
                    <div className="small text-secondary">Select the route that fits your needs.</div>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setRouteOptionsOpen(false)}>✕</button>
                </div>
                <div className="d-flex flex-column gap-2">
                  {routeOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`btn text-start border rounded-3 p-2 ${selectedRouteOptionId === option.id ? 'btn-info text-dark border-info' : 'btn-dark border-secondary text-light'}`}
                      onClick={() => selectRouteOption(option)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-5">{option.icon}</span>
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-bold">{option.label}</div>
                          <div className="small opacity-75">{formatRouteTime(option.seconds)} • {formatDistanceMeters(option.distance)}</div>
                        </div>
                        {selectedRouteOptionId === option.id && <span>✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SIMULATION */}
            {navigationPath.length > 1 && (
              <div className="d-flex flex-column gap-2 border-top border-secondary pt-2 mt-2">
                <div className="d-flex align-items-center gap-1">
                  <button
                    className={`btn btn-sm ${
                      isSimulating
                        ? 'btn-warning'
                        : 'btn-success'
                    } fw-bold flex-grow-1`}
                    onClick={toggleSimulation}
                  >
                    {isSimulating
                      ? '⏸ Pause'
                      : simulationProgress >= 1
                      ? '🔄 Replay'
                      : '▶ Play'}
                  </button>

                  <button
                    className="btn btn-sm btn-outline-secondary text-light"
                    onClick={() => {
                      setIsSimulating(false);
                      setSimulationProgress(0);
                    }}
                  >
                    ⏹
                  </button>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <input
                    type="range"
                    className="form-range flex-grow-1"
                    min="0"
                    max="1"
                    step="0.005"
                    value={simulationProgress}
                    onChange={(e) => {
                      setIsSimulating(false);
                      setSimulationProgress(
                        parseFloat(e.target.value)
                      );
                    }}
                  />

                  <span
                    className="small text-secondary fw-bold"
                    style={{ minWidth: '35px' }}
                  >
                    {Math.round(
                      simulationProgress * 100
                    )}
                    %
                  </span>
                </div>

                <div className="d-flex align-items-center justify-content-between">
                  <span className="small text-secondary">
                    Speed:
                  </span>

                  <select
                    className="form-select form-select-sm bg-dark text-light border-secondary py-0 px-2"
                    style={{ width: '80px' }}
                    value={simSpeed}
                    onChange={(e) =>
                      setSimSpeed(
                        Number(e.target.value)
                      )
                    }
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1">1.0x</option>
                    <option value="2">2.0x</option>
                    <option value="3">3.0x</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* INSTRUCTIONS */}
          {instructions.length > 0 && (
            <div className="bg-secondary bg-opacity-20 border border-secondary rounded p-3 text-light">
              <h6 className="fw-bold text-warning mb-2 small text-uppercase d-flex align-items-center gap-1">
                🧭 Turn-By-Turn Instructions
              </h6>

              <div
                className="d-flex flex-column gap-2"
                style={{
                  maxHeight: '250px',
                  overflowY: 'auto'
                }}
              >
                {instructions.map((step, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-start gap-2 bg-dark p-2 rounded border border-secondary"
                  >
                    <span className="fs-5">
                      {step.icon}
                    </span>

                    <div className="d-flex flex-column">
                      <span className="fw-bold text-info small">
                        {step.title}
                      </span>

                      <span className="text-light small">
                        {step.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR LIST */}
          {qrLocations.length > 0 && (
            <div className="bg-secondary bg-opacity-20 border border-secondary rounded p-3">
              <h6 className="fw-bold text-success mb-2 small text-uppercase">
                📱 QR Locations
              </h6>

              <div className="d-flex flex-column gap-2">
                {currentQrLocations.map((qr) => (
                  <button
                    key={qr.id}
                    className="btn btn-sm btn-outline-success text-start"
                    onClick={() =>
                      setQrModalNode(qr)
                    }
                  >
                    📱 {qr.label}

                    <span className="d-block text-secondary small">
                      {qr.floor}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BUILDING ELEMENTS */}
          {navigationPath.length === 0 && (
            <div>
              <h6 className="fw-bold text-light small text-uppercase mb-3">
                Building Elements
              </h6>

              <div className="d-flex flex-column gap-2 mb-4">
                {COMPONENT_PALETTE.map((item) => (
                  <button
                    key={item.type}
                    className="btn btn-outline-secondary text-start text-light py-2 px-3 d-flex align-items-center gap-2"
                    onClick={() =>
                      handleAddRoom(item)
                    }
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor:
                          item.color,
                        border:
                          `2px solid ${item.borderColor}`,
                        display: 'inline-block'
                      }}
                    />

                    <span className="small fw-semibold">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER CANVAS */}
        <div className="flex-grow-1 d-flex flex-column bg-black p-3 overflow-auto align-items-center justify-start position-relative">
          <div
            ref={canvasRef}
            className="position-relative bg-dark border border-secondary rounded overflow-hidden shadow"
            style={{
              width: `${floorSize.width}px`,
              height: `${floorSize.height}px`,
              transform:
                `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
              cursor:
                isPanning
                  ? 'grabbing'
                  : activeTool ===
                    'addWaypoint'
                  ? 'crosshair'
                  : 'default',
              transition:
                isPanning
                  ? 'none'
                  : 'transform 0.05s ease-out'
            }}
            onMouseDown={handleCanvasMouseDown}
          >
            {/* ADDITIVE FLOOR BOUNDARY OVERLAY. It does not modify rooms, nodes or paths. */}
            <BuildingBoundary
              width={floorSize.width}
              height={floorSize.height}
              boundary={floorBoundaries[activeFloor] || null}
              activeFloor={activeFloor}
              open={boundaryPanelOpen}
              onClose={() => setBoundaryPanelOpen(false)}
              onChange={(nextBoundary) => {
                setFloorBoundaries((prev) => ({
                  ...prev,
                  [activeFloor]: nextBoundary
                }));
              }}
              portalTargetId="universalnav-left-sidebar"
            />

            {/* SVG EDGES */}
            <svg
              className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none"
              style={{ zIndex: 1 }}
            >
              {edges.map((edge, idx) => {
                const {
                  from,
                  to,
                  isCrossFloor,
                  customDistance
                } = edge;

                const w1 = waypoints.find(
                  (w) => w.id === from
                );

                const w2 = waypoints.find(
                  (w) => w.id === to
                );

                if (!w1 || !w2) return null;

                const isOnActiveFloor =
                  w1.floor === activeFloor ||
                  w2.floor === activeFloor;

                if (!isOnActiveFloor) return null;

                const isPathSegment =
                  navigationPath.includes(from) &&
                  navigationPath.includes(to) &&
                  Math.abs(
                    navigationPath.indexOf(from) -
                      navigationPath.indexOf(to)
                  ) === 1;

                const isEmergencySegment =
                  emergencyMode && emergencyPath.includes(from) && emergencyPath.includes(to) &&
                  Math.abs(emergencyPath.indexOf(from) - emergencyPath.indexOf(to)) === 1;
                const edgeSafetyKey = makeEdgeKey(from, to);
                const isBlockedEdge = isSafetyEdgeBlocked(from, to);
                const isSelectedSafetyEdge = selectedSafetyEdgeKey === edgeSafetyKey;

                const midX = (w1.x + w2.x) / 2;
                const midY = (w1.y + w2.y) / 2;

                const distMeters =
                  customDistance ??
                  Math.hypot(
                    w2.x - w1.x,
                    w2.y - w1.y
                  ) * PIXELS_TO_METERS;

                return (
                  <g key={idx}>
                    <line
                      x1={w1.x}
                      y1={w1.y}
                      x2={w2.x}
                      y2={w2.y}
                      stroke={
                        isBlockedEdge ? '#DC2626' :
                        isEmergencySegment ? '#22C55E' :
                        isSelectedSafetyEdge ? '#F59E0B' :
                        isPathSegment ? '#38BDF8' :
                        isCrossFloor ? '#A855F7' : '#64748B'
                      }
                      strokeWidth={isBlockedEdge || isEmergencySegment || isSelectedSafetyEdge ? 6 : isPathSegment ? 4 : isCrossFloor ? 3 : 2}
                      strokeDasharray={isBlockedEdge ? '8 5' : isPathSegment || isCrossFloor ? '6 4' : 'none'}
                      style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSafetyEdgeKey(edgeSafetyKey);
                        setSelectedRoomId(null);
                        setSelectedWaypointId(null);
                        setEmergencyStatus(isBlockedEdge ? '🚫 Blocked corridor selected' : '🟠 Corridor/path selected — you can report it blocked');
                      }}
                    />

                    {!isCrossFloor && (
                      <g
                        transform={`translate(${midX}, ${midY})`}
                        style={{
                          cursor: 'pointer',
                          pointerEvents: 'all'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCustomDistancePrompt(edge);
                        }}
                      >
                        <rect
                          x="-22"
                          y="-9"
                          width="44"
                          height="18"
                          rx="4"
                          fill={
                            customDistance
                              ? '#0284C7'
                              : '#1E293B'
                          }
                          stroke={
                            customDistance
                              ? '#38BDF8'
                              : '#475569'
                          }
                          strokeWidth="1"
                        />

                        <text
                          x="0"
                          y="3"
                          fill={
                            customDistance
                              ? '#FFFFFF'
                              : '#38BDF8'
                          }
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {formatDistanceMeters(
                            distMeters
                          )}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* ROOMS */}
            {currentRooms.map((room) => (
              <div
                key={room._id}
                className={`position-absolute rounded d-flex flex-column align-items-center justify-content-center shadow ${
                  selectedRoomIds.includes(room._id)
                    ? 'border border-warning border-3'
                    : 'border border-secondary'
                }`}
                style={{
                  left: `${room.x}px`,
                  top: `${room.y}px`,
                  width: `${room.width}px`,
                  height: `${room.height}px`,
                  backgroundColor:
                    emergencyMode && blockedRoomIds.includes(room._id)
                      ? '#7F1D1D'
                      : room.bgColor || '#1E293B',
                  borderColor:
                    blockedRoomIds.includes(room._id)
                      ? '#EF4444'
                      : room.borderColor || '#475569',
                  opacity:
                    emergencyMode &&
                    !emergencyPath.includes(room.waypointId) &&
                    !blockedRoomIds.includes(room._id)
                      ? 0.28
                      : 1,
                  cursor: activeTool === 'select' ? 'grab' : 'default',
                  zIndex:
                    emergencyMode && emergencyPath.includes(room.waypointId)
                      ? 6
                      : 2,
                  userSelect: 'none',
                  transform: `rotate(${Number(room.rotation || 0)}deg)`,
                  transformOrigin: 'center center'
                }}
                onMouseDown={(e) =>
                  handleRoomMouseDown(e, room)
                }
                onContextMenu={(e) =>
                  handleRoomContextMenu(e, room)
                }
              >
                <span
                  className="fw-bold text-dark text-center px-1 small text-truncate"
                  style={{
                    maxWidth: '100%',
                    pointerEvents: 'none'
                  }}
                >
                  {room.name}
                </span>

                {/* ROTATE HANDLE */}
                {selectedRoomId === room._id && activeTool === 'select' && (
                  <div
                    className="position-absolute bg-info border border-light rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '14px',
                      height: '14px',
                      top: '-28px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      cursor: 'grab',
                      zIndex: 20,
                      fontSize: '8px'
                    }}
                    title="Drag to rotate"
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      e.stopPropagation();

                      const canvas = canvasRef.current;
                      if (!canvas) return;

                      const rect = canvas.getBoundingClientRect();
                      const centerX =
                        rect.left +
                        (room.x + room.width / 2) * zoom;
                      const centerY =
                        rect.top +
                        (room.y + room.height / 2) * zoom;

                      const startAngle =
                        Math.atan2(
                          e.clientY - centerY,
                          e.clientX - centerX
                        ) *
                        (180 / Math.PI);

                      setInteraction({
                        mode: 'rotate',
                        id: room._id,
                        startAngle,
                        origRotation: Number(room.rotation || 0),
                        centerX,
                        centerY,
                        wpId: room.waypointId
                      });
                    }}
                  >
                    ↻
                  </div>
                )}

                {/* 8 RESIZE HANDLES */}
                {selectedRoomId === room._id && activeTool === 'select' && (
                  <>
                    {[
                      ['nw', 'top-0 start-0', 'nwse-resize'],
                      ['n', 'top-0 start-50', 'ns-resize'],
                      ['ne', 'top-0 end-0', 'nesw-resize'],
                      ['w', 'top-50 start-0', 'ew-resize'],
                      ['e', 'top-50 end-0', 'ew-resize'],
                      ['sw', 'bottom-0 start-0', 'nesw-resize'],
                      ['s', 'bottom-0 start-50', 'ns-resize'],
                      ['se', 'bottom-0 end-0', 'nwse-resize']
                    ].map(([direction, position, cursor]) => (
                      <div
                        key={direction}
                        data-resize-handle={direction}
                        className={`position-absolute ${position} bg-info border border-light rounded-circle`}
                        style={{
                          width: '10px',
                          height: '10px',
                          transform: position.includes('50')
                            ? 'translate(-50%, -50%)'
                            : undefined,
                          cursor,
                          zIndex: 21
                        }}
                        title={`Resize ${direction.toUpperCase()}`}
                        onMouseDown={(e) =>
                          handleResizeMouseDown(e, room)
                        }
                      />
                    ))}
                  </>
                )}
              </div>
            ))}

            {/* WAYPOINTS */}
            {currentWaypoints.map((wp) => {
              const isStairNode =
                rooms.some(
                  (r) =>
                    r.waypointId === wp.id &&
                    (r.type === 'Stairs' ||
                      r.type === 'Elevator')
                );

              const hasCrossFloorLink =
                edges.some(
                  (e) =>
                    e.isCrossFloor &&
                    (e.from === wp.id ||
                      e.to === wp.id)
                );

              const isConnectingActive =
                connectStartNode === wp.id;

              const isQrLocation =
                qrLocations.some(
                  (q) => q.nodeId === wp.id
                );

              return (
                <div
                  key={wp.id}
                  className={`position-absolute rounded-circle shadow d-flex align-items-center justify-content-center ${
                    isConnectingActive
                      ? 'bg-warning border border-light'
                      : isQrLocation
                      ? 'bg-danger border border-light'
                      : selectedWaypointId ===
                        wp.id
                      ? 'bg-warning'
                      : hasCrossFloorLink
                      ? 'border border-light'
                      : wp.isDoor
                      ? 'bg-info'
                      : 'bg-success'
                  }`}
                  style={{
                    left: `${wp.x - 8}px`,
                    top: `${wp.y - 8}px`,
                    width: '16px',
                    height: '16px',
                    backgroundColor:
                      isConnectingActive
                        ? '#F59E0B'
                        : isQrLocation
                        ? '#EF4444'
                        : hasCrossFloorLink
                        ? '#A855F7'
                        : undefined,
                    cursor: 'pointer',
                    zIndex: 3
                  }}
                  onMouseDown={(e) =>
                    handleWaypointClick(
                      e,
                      wp.id
                    )
                  }
                  onContextMenu={(e) =>
                    handleWaypointContextMenu(
                      e,
                      wp
                    )
                  }
                  title={
                    isQrLocation
                      ? '📱 QR Indoor Position — Right-click to view QR'
                      : isStairNode
                      ? 'Stairs / Elevator Node (Right-click to link across floors)'
                      : 'Standard Node'
                  }
                >
                  {isQrLocation && (
                    <span
                      style={{
                        fontSize: '8px',
                        lineHeight: 1
                      }}
                    >
                      📱
                    </span>
                  )}
                </div>
              );
            })}

            {/* YOU ARE HERE - additive, non-interactive navigation marker */}
            {currentLocationWaypoint && (
              <div
                className="universalnav-location-marker position-absolute"
                style={{
                  left: `${currentLocationWaypoint.x}px`,
                  top: `${currentLocationWaypoint.y}px`,
                  width: '1px',
                  height: '1px',
                  zIndex: 25,
                  pointerEvents: 'none'
                }}
                aria-label="You are here"
              >
                {/* Expanding pulse ring */}
                <div
                  className="universalnav-location-ring position-absolute rounded-circle"
                  style={{
                    left: '0',
                    top: '0',
                    width: '30px',
                    height: '30px',
                    border: '3px solid #22C55E',
                    background: 'rgba(34,197,94,.14)',
                    pointerEvents: 'none'
                  }}
                />

                {/* Label */}
                <div
                  className="position-absolute bg-dark text-white fw-bold rounded-pill px-2 py-1 shadow"
                  style={{
                    left: '50%',
                    bottom: '18px',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontSize: '11px',
                    lineHeight: '1.2',
                    border: '1px solid #22C55E',
                    boxShadow: '0 2px 8px rgba(0,0,0,.45)'
                  }}
                >
                  🟢 You are here
                </div>

                {/* Maps-style location dot */}
                <div
                  className="universalnav-location-dot position-absolute rounded-circle"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '18px',
                    height: '18px',
                    background: '#22C55E',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,.65)',
                    animation: 'universalnav-location-pulse 1.8s ease-in-out infinite'
                  }}
                />

                {/* Small downward pointer */}
                <div
                  className="position-absolute"
                  style={{
                    left: '50%',
                    top: '12px',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '8px solid #FFFFFF',
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.45))'
                  }}
                />
              </div>
            )}

            <SimulationMarker
              navigationPath={navigationPath}
              waypoints={waypoints}
              activeFloor={activeFloor}
              setActiveFloor={setActiveFloor}
              isSimulating={isSimulating}
              simSpeed={simSpeed}
              simulationProgress={
                simulationProgress
              }
              onProgressChange={(newProgress) =>
                setSimulationProgress(
                  newProgress
                )
              }
              onComplete={() =>
                setIsSimulating(false)
              }
            />

            {/* CONTEXT MENU */}
            {contextMenu && (
              <div
                className="position-absolute bg-dark border border-secondary rounded shadow p-2"
                style={{
                  left: `${contextMenu.x}px`,
                  top: `${contextMenu.y}px`,
                  zIndex: 100,
                  width: '200px'
                }}
                onMouseDown={(e) =>
                  e.stopPropagation()
                }
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <div className="px-2 py-1 small fw-bold text-primary border-bottom border-secondary mb-1">
                  Element Actions
                </div>

                {contextMenu.type === 'room' ? (
                  <>
                    <button
                      className="btn btn-sm btn-dark text-start w-100 text-light py-1"
                      onMouseDown={(e) => {
                        e.stopPropagation();

                        const name =
                          window.prompt(
                            'Rename room:',
                            selectedRoom?.name
                          );

                        if (name) {
                          const nextRooms =
                            rooms.map(
                              (r) =>
                                r._id ===
                                contextMenu.targetId
                                  ? {
                                      ...r,
                                      name
                                    }
                                  : r
                            );

                          setRooms(nextRooms);

                          recordHistory(
                            nextRooms,
                            waypoints,
                            edges
                          );
                        }

                        setContextMenu(null);
                      }}
                    >
                      ✏️ Rename
                    </button>

                    <div className="d-flex align-items-center justify-content-between px-2 py-1">
                      <label
                        htmlFor="roomColorInput"
                        className="small text-light m-0"
                      >
                        🎨 Change Color
                      </label>

                      <input
                        id="roomColorInput"
                        type="color"
                        className="form-control form-control-color bg-transparent border-0 p-0"
                        style={{
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer'
                        }}
                        value={
                          rooms.find(
                            (r) =>
                              r._id ===
                              contextMenu.targetId
                          )?.bgColor ||
                          '#1E293B'
                        }
                        onChange={(e) => {
                          const nextRooms =
                            rooms.map(
                              (r) =>
                                r._id ===
                                contextMenu.targetId
                                  ? {
                                      ...r,
                                      bgColor:
                                        e.target.value
                                    }
                                  : r
                            );

                          setRooms(nextRooms);

                          recordHistory(
                            nextRooms,
                            waypoints,
                            edges
                          );
                        }}
                      />
                    </div>

                    <button
                      className="btn btn-sm btn-dark text-start w-100 text-danger py-1"
                      onMouseDown={(e) => {
                        e.stopPropagation();

                        handleDeleteRoom(
                          contextMenu.targetId
                        );
                      }}
                    >
                      🗑️ Delete Room
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-sm btn-dark text-start w-100 text-success py-1"
                      onMouseDown={(e) => {
                        e.stopPropagation();

                        handleSetQrLocation(
                          contextMenu.targetId
                        );
                      }}
                    >
                      📱{' '}
                      {qrLocations.some(
                        (q) =>
                          q.nodeId ===
                          contextMenu.targetId
                      )
                        ? 'View QR Code'
                        : 'Create QR Location'}
                    </button>

                    {edges.some(
                      (e) =>
                        e.from ===
                          contextMenu.targetId ||
                        e.to ===
                          contextMenu.targetId
                    ) && (
                      <button
                        className="btn btn-sm btn-dark text-start w-100 text-warning py-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();

                          const connectedEdge =
                            edges.find(
                              (e) =>
                                e.from ===
                                  contextMenu.targetId ||
                                e.to ===
                                  contextMenu.targetId
                            );

                          if (connectedEdge) {
                            handleCustomDistancePrompt(
                              connectedEdge
                            );
                          }

                          setContextMenu(null);
                        }}
                      >
                        📏 Custom Distance
                      </button>
                    )}

                    {rooms.some(
                      (r) =>
                        r.waypointId ===
                          contextMenu.targetId &&
                        (r.type ===
                          'Stairs' ||
                          r.type ===
                            'Elevator')
                    ) && (
                      <button
                        className="btn btn-sm btn-dark text-start w-100 text-info py-1"
                        onMouseDown={(e) => {
                          e.stopPropagation();

                          const wp =
                            waypoints.find(
                              (w) =>
                                w.id ===
                                contextMenu.targetId
                            );

                          setStairModalSource(wp);
                          setContextMenu(null);
                        }}
                      >
                        🔗 Link to Floor...
                      </button>
                    )}

                    <button
                      className="btn btn-sm btn-dark text-start w-100 text-danger py-1"
                      onMouseDown={(e) => {
                        e.stopPropagation();

                        handleDeleteWaypoint(
                          contextMenu.targetId
                        );
                      }}
                    >
                      🗑️ Delete Node
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          📊 ANALYTICS DASHBOARD
      ====================================================== */}
      {analyticsOpen && (
        <AnalyticsDashboard
          title={mapTitle}
          rooms={rooms}
          floors={floors}
          onClose={handleCloseAnalytics}
        />
      )}

      {/* ======================================================
          🏢 VENUE OVERVIEW MODAL
      ====================================================== */}
      {venueOverviewOpen && (
        <VenueOverview
          title={mapTitle}
          floors={floors}
          rooms={rooms}
          onClose={handleCloseVenueOverview}
          onNavigate={() => {
            setVenueOverviewOpen(false);
            // Keep the existing editor visible and focus the navigation area.
            const navPanel = document.getElementById('universalnav-navigation-panel');
            if (navPanel) navPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onViewMap={() => {
            setVenueOverviewOpen(false);
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          onEmergency={() => {
            setVenueOverviewOpen(false);
            setEmergencyCenterOpen(true);
          }}
          onAccessibility={() => {
            setVenueOverviewOpen(false);
            setEmergencyCenterOpen(true);
          }}
          onSelectDestination={handleOverviewDestination}
        />
      )}

      {/* ======================================================
          🚨 EMERGENCY & SAFETY CENTER
          Additive modal: existing sidebar controls remain intact.
      ====================================================== */}
      {emergencyCenterOpen && (
        <div className="position-fixed top-0 start-0 vh-100 vw-100 d-flex align-items-center justify-content-center" style={{ zIndex: 2000, background: 'rgba(0,0,0,.78)' }} onMouseDown={(e) => e.stopPropagation()}>
          <div className={`bg-dark text-light border ${emergencyMode ? 'border-danger' : 'border-secondary'} rounded-4 shadow-lg p-4`} style={{ width: 'min(520px, 92vw)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div><div className="text-danger fw-bold fs-4">🚨 Emergency & Safety</div><div className="small text-secondary">Evacuation routing, fire exits and blocked-area reporting</div></div>
              <button className="btn btn-sm btn-outline-light" onClick={() => setEmergencyCenterOpen(false)}>✕</button>
            </div>
            <div className="rounded-3 p-3 mb-3 border border-danger">
              <label className="form-label small fw-bold text-warning">Emergency mode</label>
              <select className="form-select bg-dark text-light border-danger mb-2" value={emergencyType} onChange={(e) => setEmergencyType(e.target.value)}>
                <option value="evacuation">🚨 Emergency Evacuation — nearest safe exit</option>
                <option value="fire">🔥 Fire Emergency — fire exits only</option>
              </select>
              <button className="btn btn-danger w-100 fw-bold" onClick={runEmergencyEvacuation}>{emergencyMode ? '🔄 Recalculate Safe Evacuation Route' : '🚨 Start Emergency Evacuation'}</button>
            </div>
            {emergencyMode && <div className="rounded-3 p-3 mb-3 border border-danger bg-danger bg-opacity-10">
              <div className="fw-bold text-danger">{emergencyStatus}</div>
              {(() => { const exit = rooms.find((r) => r._id === emergencyExitId); return <><div className="fs-5 fw-bold mt-2">🚪 Nearest safe exit: {exit?.name || 'Exit'}</div><div className="text-warning fw-bold">📏 Distance: {formatDistanceMeters(emergencyDistance)}</div><div className="text-info fw-bold">⏱️ Estimated time: {formatEmergencyTime(emergencyTimeSeconds)}</div></>; })()}
              <div className="small text-secondary mt-2">⚠️ Blocked/unsafe connections and exits are excluded from this route.</div>
              <button className="btn btn-outline-light btn-sm mt-2 w-100" onClick={stopEmergencyMode}>Exit Emergency Mode</button>
            </div>}
            <div className="border border-info rounded-3 p-3 mb-3">
              <div className="fw-bold text-info mb-2">♿ Accessibility Preferences</div>
              {[['wheelchair','♿ Wheelchair accessible'],['avoidStairs','🪜 Avoid stairs'],['avoidNarrow','↔️ Avoid narrow corridors'],['minimizeWalking','🚶 Minimize walking'],['avoidElevators','🛗 Avoid elevators']].map(([key,label]) => <label key={key} className="d-flex align-items-center gap-2 small mb-2"><input type="checkbox" checked={!!accessibilityPrefs[key]} onChange={(e) => setAccessibilityPrefs((prev) => ({...prev,[key]:e.target.checked,...(key === 'wheelchair' && e.target.checked ? {avoidStairs:true} : {})}))}/><span>{label}</span></label>)}
              {(accessibilityPrefs.wheelchair || accessibilityPrefs.avoidStairs) && <div className="small text-info bg-info bg-opacity-10 rounded p-2">♿ Elevator is allowed for wheelchair users unless <strong>Avoid elevators</strong> is selected.</div>}
            </div>
            <div className="border border-warning rounded-3 p-3">
              <div className="fw-bold text-warning mb-1">🚫 Report blocked / unsafe area</div><div className="small text-secondary mb-2">Select a room/node, or click a path line to select one exact corridor connection.</div>
              {selectedSafetyEdgeKey && <div className="small bg-warning bg-opacity-10 border border-warning rounded p-2 mb-2 text-warning">🟠 Selected path will be blocked individually.</div>}
              <div className="d-grid gap-2">
                <button className="btn btn-outline-danger btn-sm" onClick={() => reportBlockedTarget('corridor')}>🚧 Corridor / Path Blocked</button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => reportBlockedTarget('stair')}>🚫 Staircase Unavailable</button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => reportBlockedTarget('elevator')}>🚫 Elevator Unavailable</button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => reportBlockedTarget('exit')}>🚪 Exit Unavailable</button>
                {(selectedSafetyEdgeKey || (selectedRoomId && blockedRoomIds.includes(selectedRoomId)) || (selectedWaypointId && blockedNodeIds.includes(selectedWaypointId))) && <button className="btn btn-outline-success btn-sm" onClick={unblockSelectedSafetyItem}>✅ Restore Selected Item</button>}
                {(blockedNodeIds.length || blockedRoomIds.length || blockedEdgeKeys.length) > 0 && <button className="btn btn-outline-warning btn-sm" onClick={clearSafetyBlocks}>♻️ Clear All Reported Blockages</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          ADDITIVE MAP VERSION HISTORY
      ============================================================ */}
      {versionHistoryOpen && (
        <div
          className="position-fixed top-0 start-0 vh-100 vw-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1600 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setVersionHistoryOpen(false);
          }}
        >
          <div
            className="bg-dark border border-info rounded-3 p-4 text-light shadow-lg"
            style={{ width: '520px', maxWidth: '92vw', maxHeight: '80vh', overflow: 'auto' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-0 fw-bold text-info">🕘 Map Version History</h5>
                <div className="small text-secondary">
                  Local checkpoints are kept separately from your existing map data.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setVersionHistoryOpen(false)}
              >
                ✕
              </button>
            </div>

            {!versionHistory.length ? (
              <div className="text-secondary small border border-secondary rounded p-3">
                No versions yet. Save Draft or Publish Complete to create the first checkpoint.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {versionHistory.map((version) => (
                  <div
                    key={version.id}
                    className="border border-secondary rounded p-3 bg-secondary bg-opacity-10"
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-bold">{version.label}</div>
                        <div className="small text-secondary">
                          {new Date(version.createdAt).toLocaleString()}
                        </div>
                        <div className="small text-info mt-1">
                          {version.rooms?.length || 0} rooms · {version.edges?.length || 0} paths · {version.floors?.length || 0} floors
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => {
                          if (window.confirm('Restore this map version? Your current unsaved changes will remain recoverable through Undo only.')) {
                            restoreMapVersion(version);
                          }
                        }}
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* INTER-FLOOR MODAL */}
      {stairModalSource && (
        <div
          className="position-fixed top-0 start-0 vh-100 vw-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1050 }}
        >
          <div
            className="bg-dark border border-secondary rounded p-4 text-light shadow-lg"
            style={{ width: '420px' }}
          >
            <h5 className="fw-bold text-info mb-2">
              🔗 Link Stairs / Elevator Across Floors
            </h5>

            <p className="small text-secondary mb-3">
              Select a destination Stair or Elevator on another floor to connect pathfinding across levels.
            </p>

            <div className="mb-3">
              <label className="form-label small text-secondary">
                Target Stair/Elevator Node
              </label>

              <select
                className="form-select bg-secondary text-light border-0"
                value={targetStairWpId}
                onChange={(e) =>
                  setTargetStairWpId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Choose target node...
                </option>

                {availableStairNodes.map((w) => {
                  const parent =
                    rooms.find(
                      (r) =>
                        r.waypointId === w.id
                    );

                  return (
                    <option
                      key={w.id}
                      value={w.id}
                    >
                      {parent?.name || 'Stair'} — Floor:{' '}
                      {w.floor || '1st FLOOR'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  setStairModalSource(null)
                }
              >
                Cancel
              </button>

              <button
                className="btn btn-sm btn-primary fw-bold"
                onClick={handleConfirmStairLink}
                disabled={!targetStairWpId}
              >
                Connect Floors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {qrModalNode && (
        <div
          className="position-fixed top-0 start-0 vh-100 vw-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1100 }}
        >
          <div
            className="bg-dark border border-secondary rounded p-4 text-light shadow-lg text-center"
            style={{ width: '430px' }}
          >
            <h5 className="fw-bold text-info mb-2">
              📱 Indoor Position QR
            </h5>

            <p className="small text-secondary mb-3">
              Place this QR code at the physical location shown below.
            </p>

            <div className="bg-white p-3 rounded d-inline-block mb-3">
              <QRCodeCanvas
  value={`${window.location.origin}/navigate/${encodeURIComponent(
    qrModalNode.buildingId
  )}?nodeId=${encodeURIComponent(
    qrModalNode.nodeId
  )}&floor=${encodeURIComponent(
    qrModalNode.floor
  )}`}
  size={220}
  level="H"
  marginSize={4}
/>
            </div>

            <div className="bg-secondary bg-opacity-25 rounded p-3 mb-3 text-start">
              <div className="small text-secondary">
                Location
              </div>

              <div className="fw-bold text-light">
                {qrModalNode.label}
              </div>

              <div className="small text-info">
                Floor: {qrModalNode.floor}
              </div>

              <div className="small text-secondary mt-1">
                Node: {qrModalNode.nodeId}
              </div>

              <div className="small text-secondary">
                Building: {qrModalNode.buildingId}
              </div>
            </div>

            <div className="bg-black rounded p-2 mb-3 text-start">
              <div className="small text-secondary mb-1">
                QR Data
              </div>

              <code
                className="small text-info d-block"
                style={{
                  wordBreak: 'break-all'
                }}
              >
                {JSON.stringify({
                  type: 'UniversalNavLocation',
                  version: 1,
                  buildingId:
                    qrModalNode.buildingId,
                  nodeId:
                    qrModalNode.nodeId,
                  floor:
                    qrModalNode.floor
                })}
              </code>
            </div>

            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() =>
                  handleRemoveQrLocation(
                    qrModalNode.id
                  )
                }
              >
                🗑️ Remove QR
              </button>

              <button
                className="btn btn-sm btn-primary fw-bold"
                onClick={() =>
                  setQrModalNode(null)
                }
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(overviewModal, document.body);
}

/* ================================================================
   SIMULATION MARKER
   ================================================================ */

function SimulationMarker({
  navigationPath,
  waypoints,
  activeFloor,
  setActiveFloor,
  isSimulating,
  simSpeed,
  simulationProgress,
  onProgressChange,
  onComplete
}) {
  const markerRef = useRef(null);
  const animFrameRef = useRef(null);
  const progressRef = useRef(simulationProgress);

  useEffect(() => {
    progressRef.current = simulationProgress;
  }, [simulationProgress]);

  const pathData = useMemo(() => {
    if (!navigationPath || navigationPath.length < 2) {
      return null;
    }

    const pathNodes = navigationPath
      .map((id) =>
        waypoints.find((w) => w.id === id)
      )
      .filter(Boolean);

    if (pathNodes.length < 2) return null;

    let totalLen = 0;
    const segments = [];

    for (let i = 0; i < pathNodes.length - 1; i++) {
      const p1 = pathNodes[i];
      const p2 = pathNodes[i + 1];

      const isCross = p1.floor !== p2.floor;

      const dist = isCross
        ? 20
        : Math.hypot(
            p2.x - p1.x,
            p2.y - p1.y
          );

      segments.push({
        p1,
        p2,
        dist,
        startDist: totalLen
      });

      totalLen += dist;
    }

    return {
      pathNodes,
      segments,
      totalLen
    };
  }, [navigationPath, waypoints]);

  const getCurrentPos = useCallback(
    (progress) => {
      if (!pathData) return null;

      const {
        segments,
        totalLen,
        pathNodes
      } = pathData;

      if (totalLen === 0) {
        return { ...pathNodes[0] };
      }

      const targetDist = progress * totalLen;

      for (let i = 0; i < segments.length; i++) {
        const {
          p1,
          p2,
          dist,
          startDist
        } = segments[i];

        if (
          targetDist <=
            startDist + dist ||
          i === segments.length - 1
        ) {
          const segProgress =
            dist === 0
              ? 0
              : Math.max(
                  0,
                  Math.min(
                    1,
                    (targetDist - startDist) /
                      dist
                  )
                );

          if (p1.floor !== p2.floor) {
            const activeNode =
              segProgress >= 0.5
                ? p2
                : p1;

            return {
              x: activeNode.x,
              y: activeNode.y,
              floor: activeNode.floor
            };
          }

          return {
            x:
              p1.x +
              (p2.x - p1.x) *
                segProgress,
            y:
              p1.y +
              (p2.y - p1.y) *
                segProgress,
            floor: p1.floor
          };
        }
      }

      const last =
        pathNodes[pathNodes.length - 1];

      return {
        x: last.x,
        y: last.y,
        floor: last.floor
      };
    },
    [pathData]
  );

  const currentPos =
    getCurrentPos(simulationProgress);

  useEffect(() => {
    if (!isSimulating || !pathData) {
      return;
    }

    let lastTime = performance.now();

    const animate = (time) => {
      const delta =
        (time - lastTime) / 1000;

      lastTime = time;

      const increment =
        0.12 * simSpeed * delta;

      progressRef.current = Math.min(
        1,
        progressRef.current + increment
      );

      const pos = getCurrentPos(
        progressRef.current
      );

      if (
        pos &&
        pos.floor &&
        pos.floor !== activeFloor
      ) {
        setActiveFloor(pos.floor);
      }

      if (
        markerRef.current &&
        pos
      ) {
        markerRef.current.style.transform =
          `translate3d(${pos.x - 12}px, ${pos.y - 12}px, 0px) scale(1.1)`;

        markerRef.current.style.display =
          pos.floor === activeFloor
            ? 'flex'
            : 'none';
      }

      onProgressChange(
        progressRef.current
      );

      if (progressRef.current >= 1) {
        onComplete();
      } else {
        animFrameRef.current =
          requestAnimationFrame(animate);
      }
    };

    animFrameRef.current =
      requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(
          animFrameRef.current
        );
      }
    };
  }, [
    isSimulating,
    simSpeed,
    pathData,
    activeFloor,
    getCurrentPos,
    onProgressChange,
    onComplete,
    setActiveFloor
  ]);

  if (!currentPos) return null;

  return (
    <div
      ref={markerRef}
      className="position-absolute rounded-circle bg-warning border border-white shadow align-items-center justify-content-center"
      style={{
        top: 0,
        left: 0,
        width: '24px',
        height: '24px',
        zIndex: 20,
        display:
          currentPos.floor === activeFloor
            ? 'flex'
            : 'none',
        transform:
          `translate3d(${currentPos.x - 12}px, ${currentPos.y - 12}px, 0px) scale(1.1)`,
        boxShadow: '0 0 14px #F59E0B',
        willChange: 'transform',
        transition:
          isSimulating
            ? 'none'
            : 'transform 0.08s ease-out'
      }}
      title="Live Navigation Position"
    >
      <span
        className="m-auto"
        style={{
          fontSize: '12px',
          userSelect: 'none'
        }}
      >
        🚶
      </span>
    </div>
  );
}
