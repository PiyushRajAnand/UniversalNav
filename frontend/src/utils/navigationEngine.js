/**
 * UniversalNav - Core Navigation & Pathfinding Engine
 * Handles multi-floor Dijkstra pathfinding, edge blockages, 
 * stair penalties, emergency evacuations, and voice synthesis.
 */

export function calculatePath({
  rooms = [],
  waypoints = [],
  edges = [],
  startRoomId = '',
  destRoomId = '',
  avoidStairs = false,
  isEmergencyMode = false,
  blockedEdges = new Set(),
  metersPerPixel = 0.1
}) {
  const startRoom = rooms.find((r) => r._id === startRoomId);
  if (!startRoom || !startRoom.waypointId) {
    return { error: 'Please select a valid starting location.' };
  }

  const startWp = startRoom.waypointId;
  let targetWpIds = [];

  // Emergency Evacuation Routing Mode
  if (isEmergencyMode) {
    const exitRooms = rooms.filter(
      (r) => r.type === 'EmergencyExit' || r.type === 'Entrance' || r.type === 'Main Entrance / Exit'
    );
    targetWpIds = exitRooms.map((r) => r.waypointId).filter(Boolean);
    if (targetWpIds.length === 0) {
      return { error: 'No Emergency Exits found on the map layout!' };
    }
  } else {
    const destRoom = rooms.find((r) => r._id === destRoomId);
    if (!destRoom || !destRoom.waypointId) {
      return { error: 'Please select a valid destination room.' };
    }
    targetWpIds = [destRoom.waypointId];
  }

  // 1. Build Dynamic Adjacency Graph
  const graph = {};
  waypoints.forEach((w) => (graph[w.id] = {}));

  edges.forEach(({ from, to, isCrossFloor, customDistance }) => {
    const edgeKey1 = `${from}-${to}`;
    const edgeKey2 = `${to}-${from}`;

    // Skip blocked corridors dynamically
    if (blockedEdges.has(edgeKey1) || blockedEdges.has(edgeKey2)) {
      return;
    }

    const w1 = waypoints.find((w) => w.id === from);
    const w2 = waypoints.find((w) => w.id === to);

    if (w1 && w2) {
      let weight = customDistance;
      if (weight === undefined) {
        const pxDist = Math.hypot(w1.x - w2.x, w1.y - w2.y);
        weight = isCrossFloor ? 5 : pxDist * metersPerPixel;
      }

      // Accessibility Penalty (Apply heavy weight penalty if avoidStairs is active)
      const involvesStairs = w1.type === 'Stairs' || w2.type === 'Stairs';
      if (avoidStairs && involvesStairs) {
        weight += 1000;
      }

      graph[from][to] = weight;
      graph[to][from] = weight;
    }
  });

  // 2. Dijkstra Algorithm Execution
  const distances = {};
  const previous = {};
  const unvisited = new Set(waypoints.map((w) => w.id));

  waypoints.forEach((w) => {
    distances[w.id] = Infinity;
    previous[w.id] = null;
  });
  distances[startWp] = 0;

  while (unvisited.size > 0) {
    let current = null;
    unvisited.forEach((id) => {
      if (current === null || distances[id] < distances[current]) current = id;
    });

    if (!current || distances[current] === Infinity) break;
    unvisited.delete(current);

    if (!isEmergencyMode && current === targetWpIds[0]) break;

    for (let neighbor in graph[current]) {
      let alt = distances[current] + graph[current][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    }
  }

  // 3. Resolve Path Target Node
  let bestTargetWp = targetWpIds[0];
  if (isEmergencyMode) {
    bestTargetWp = targetWpIds.reduce(
      (prev, curr) => (distances[curr] < distances[prev] ? curr : prev),
      targetWpIds[0]
    );
  }

  const path = [];
  let curr = bestTargetWp;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  if (path[0] !== startWp) {
    return { error: 'No unblocked, accessible route found to destination.' };
  }

  return {
    path,
    totalDistance: Math.round(distances[bestTargetWp] * 10) / 10
  };
}

/**
 * Web Speech API Voice Prompt Trigger
 */
export function speakInstruction(text, voiceEnabled = true) {
  if (!voiceEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}
