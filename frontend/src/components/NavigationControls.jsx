import React from 'react';

export default function NavigationControls({
  rooms = [],
  startRoomId = '',
  setStartRoomId = () => {},
  destRoomId = '',
  setDestRoomId = () => {},
  onCalculateRoute = () => {},
  avoidStairs = false,
  setAvoidStairs = () => {},
  isEmergencyMode = false,
  setIsEmergencyMode = () => {},
  voiceEnabled = true,
  setVoiceEnabled = () => {}
}) {
  return (
    <div 
      className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 bg-dark p-2 rounded border border-secondary w-100" 
      style={{ maxWidth: '1100px' }}
    >
      {/* Location Dropdowns */}
      <div className="d-flex align-items-center gap-2 flex-grow-1">
        <select
          className="form-select form-select-sm bg-secondary text-light border-0"
          value={startRoomId}
          onChange={(e) => setStartRoomId(e.target.value)}
        >
          <option value="">Select Start Room...</option>
          {rooms.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name} ({r.floor})
            </option>
          ))}
        </select>

        <select
          className="form-select form-select-sm bg-secondary text-light border-0"
          value={destRoomId}
          disabled={isEmergencyMode}
          onChange={(e) => setDestRoomId(e.target.value)}
        >
          <option value="">
            {isEmergencyMode ? '🚨 Emergency Target Exit' : 'Select Destination...'}
          </option>
          {rooms.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name} ({r.floor})
            </option>
          ))}
        </select>

        <button 
          className="btn btn-sm btn-primary text-nowrap fw-bold" 
          onClick={() => onCalculateRoute()}
        >
          Calculate
        </button>
      </div>

      {/* Mode Controls Toolbar */}
      <div className="d-flex align-items-center gap-3 bg-black bg-opacity-40 px-3 py-1 rounded border border-secondary">
        {/* Wheelchair Switch */}
        <div className="form-check form-switch m-0 d-flex align-items-center gap-1">
          <input
            className="form-check-input cursor-pointer"
            type="checkbox"
            id="accessibilitySwitch"
            checked={avoidStairs}
            onChange={(e) => setAvoidStairs(e.target.checked)}
          />
          <label className="form-check-label small text-light cursor-pointer" htmlFor="accessibilitySwitch">
            ♿ Avoid Stairs
          </label>
        </div>

        {/* Voice Navigation Switch */}
        <button
          className={`btn btn-xs ${voiceEnabled ? 'btn-info' : 'btn-outline-secondary text-light'} py-0 px-2`}
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          title="Toggle Voice Directions"
        >
          {voiceEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
        </button>

        {/* Emergency Evacuation Mode Button */}
        <button
          className={`btn btn-xs fw-bold py-1 px-2 ${
            isEmergencyMode ? 'btn-danger animate-pulse' : 'btn-outline-danger'
          }`}
          onClick={() => {
            const nextMode = !isEmergencyMode;
            setIsEmergencyMode(nextMode);
            if (nextMode) onCalculateRoute(null, true);
          }}
        >
          🚨 {isEmergencyMode ? 'EMERGENCY ACTIVE' : 'Evacuation Mode'}
        </button>
      </div>
    </div>
  );
}
