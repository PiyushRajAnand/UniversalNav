/**
 * Shortest Path Engine using Dijkstra's Algorithm
 */
function findShortestPath(nodes, connections, startNodeId, endNodeId) {
  const graph = {};

  // Build adjacency list
  nodes.forEach(node => {
    graph[node._id] = [];
  });

  connections.forEach(conn => {
    const weight = conn.distanceMeters || 1;
    if (graph[conn.fromRoomId]) {
      graph[conn.fromRoomId].push({ node: conn.toRoomId, weight });
    }
    if (conn.isBidirectional && graph[conn.toRoomId]) {
      graph[conn.toRoomId].push({ node: conn.fromRoomId, weight });
    }
  });

  const distances = {};
  const previous = {};
  const unvisited = new Set();

  nodes.forEach(node => {
    distances[node._id] = Infinity;
    previous[node._id] = null;
    unvisited.add(node._id.toString());
  });

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let current = null;
    for (const nodeId of unvisited) {
      if (current === null || distances[nodeId] < distances[current]) {
        current = nodeId;
      }
    }

    if (distances[current] === Infinity || current === endNodeId.toString()) {
      break;
    }

    unvisited.delete(current);

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      if (unvisited.has(neighbor.node.toString())) {
        const alt = distances[current] + neighbor.weight;
        if (alt < distances[neighbor.node]) {
          distances[neighbor.node] = alt;
          previous[neighbor.node] = current;
        }
      }
    }
  }

  // Reconstruct path
  const path = [];
  let curr = endNodeId.toString();

  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return {
    distance: distances[endNodeId],
    path: path[0] === startNodeId.toString() ? path : []
  };
}

module.exports = { findShortestPath };
