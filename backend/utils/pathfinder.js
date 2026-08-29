/**
 * UniversalNav Multi-Floor A* Pathfinding Engine
 */

class PriorityQueue {
  constructor() {
    this.elements = [];
  }
  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }
  dequeue() {
    return this.elements.shift().element;
  }
  isEmpty() {
    return this.elements.length === 0;
  }
}

/**
 * Builds an adjacency graph from rooms and cross-floor connections.
 */
function buildGraph(rooms, connections) {
  const graph = new Map();
  const roomMap = new Map();

  rooms.forEach((room) => {
    graph.set(room._id.toString(), []);
    roomMap.set(room._id.toString(), room);
  });

  connections.forEach((conn) => {
    const fromId = conn.fromRoomId.toString();
    const toId = conn.toRoomId.toString();
    
    // Base weight calculated by physical distance * type modifier
    let baseWeight = conn.distanceMeters * (conn.weightModifier || 1.0);
    
    // Add realistic penalties for floor changes to optimize human comfort
    if (conn.type === 'Stair') baseWeight += 15; 
    if (conn.type === 'Lift') baseWeight += 10; 

    if (graph.has(fromId)) {
      graph.get(fromId).push({ node: toId, weight: baseWeight, connection: conn });
    }
    if (conn.isBidirectional && graph.has(toId)) {
      graph.get(toId).push({ node: fromId, weight: baseWeight, connection: conn });
    }
  });

  return { graph, roomMap };
}

/**
 * Euclidean heuristic distance between two rooms (including floor distance)
 */
function heuristic(roomA, roomB) {
  if (!roomA || !roomB) return 0;
  const dx = roomA.geometry.x - roomB.geometry.x;
  const dy = roomA.geometry.y - roomB.geometry.y;
  // Weight floor vertical distance (approx 10 meters per floor difference)
  const df = (roomA.floorLevel - roomB.floorLevel) * 500; 
  return Math.sqrt(dx * dx + dy * dy + df * df);
}

/**
 * Generates turn-by-turn navigation instructions for humans.
 */
function generateStepByStep(pathRooms, edgeConnections) {
  const instructions = [];
  
  for (let i = 0; i < pathRooms.length - 1; i++) {
    const current = pathRooms[i];
    const next = pathRooms[i + 1];
    const edge = edgeConnections[i];

    if (current.floorId.toString() !== next.floorId.toString()) {
      instructions.push({
        type: 'FLOOR_CHANGE',
        text: `Take ${edge.type} "${current.name}" to Level ${next.floorLevel}`,
        floorLevel: next.floorLevel,
        targetRoom: next.name
      });
    } else {
      instructions.push({
        type: 'WALK',
        text: `Walk ${Math.round(edge.distanceMeters)}m from ${current.name} to ${next.name}`,
        distance: edge.distanceMeters,
        targetRoom: next.name
      });
    }
  }
  return instructions;
}

/**
 * Calculates Multi-Floor Route using A* Algorithm
 */
function findShortestRoute(startRoomId, targetRoomId, rooms, connections, floors) {
  // Attach level integer to room objects for heuristics
  const floorLevelMap = new Map(floors.map(f => [f._id.toString(), f.level]));
  const enrichedRooms = rooms.map(r => ({
    ...r,
    floorLevel: floorLevelMap.get(r.floorId.toString()) || 0
  }));

  const { graph, roomMap } = buildGraph(enrichedRooms, connections);
  
  const startIdStr = startRoomId.toString();
  const targetIdStr = targetRoomId.toString();

  const frontier = new PriorityQueue();
  frontier.enqueue(startIdStr, 0);

  const cameFrom = new Map();
  const costSoFar = new Map();

  cameFrom.set(startIdStr, null);
  costSoFar.set(startIdStr, 0);

  const edgeUsed = new Map();

  while (!frontier.isEmpty()) {
    const current = frontier.dequeue();

    if (current === targetIdStr) break;

    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      const newCost = costSoFar.get(current) + neighbor.weight;
      
      if (!costSoFar.has(neighbor.node) || newCost < costSoFar.get(neighbor.node)) {
        costSoFar.set(neighbor.node, newCost);
        const priority = newCost + heuristic(roomMap.get(neighbor.node), roomMap.get(targetIdStr));
        frontier.enqueue(neighbor.node, priority);
        cameFrom.set(neighbor.node, current);
        edgeUsed.set(neighbor.node, neighbor.connection);
      }
    }
  }

  if (!cameFrom.has(targetIdStr)) {
    return { success: false, message: 'No route found between the specified locations.' };
  }

  // Reconstruct path
  let curr = targetIdStr;
  const pathRooms = [];
  const edgeConnections = [];

  while (curr !== null) {
    pathRooms.unshift(roomMap.get(curr));
    const parent = cameFrom.get(curr);
    if (parent !== null) {
      edgeConnections.unshift(edgeUsed.get(curr));
    }
    curr = parent;
  }

  let totalDistance = 0;
  let totalTime = 0;
  edgeConnections.forEach(conn => {
    totalDistance += conn.distanceMeters;
    totalTime += conn.walkingTimeSeconds;
  });

  const stepByStep = generateStepByStep(pathRooms, edgeConnections);

  return {
    success: true,
    totalDistance: Math.round(totalDistance),
    totalWalkingTimeSeconds: Math.round(totalTime),
    path: pathRooms,
    instructions: stepByStep
  };
}

module.exports = { findShortestRoute };
