export const calculateDijkstraPath = (nodes, edges, startNodeId, endNodeId) => {
  const distances = {};
  const previous = {};
  const unvisited = new Set();

  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  });

  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    let currentNodeId = null;
    let smallestDistance = Infinity;

    unvisited.forEach(nodeId => {
      if (distances[nodeId] < smallestDistance) {
        smallestDistance = distances[nodeId];
        currentNodeId = nodeId;
      }
    });

    if (!currentNodeId || distances[currentNodeId] === Infinity) break;
    if (currentNodeId === endNodeId) break;

    unvisited.delete(currentNodeId);

    const neighbors = edges.filter(
      e => e.from === currentNodeId || e.to === currentNodeId
    );

    for (const edge of neighbors) {
      const neighborId = edge.from === currentNodeId ? edge.to : edge.from;
      if (!unvisited.has(neighborId)) continue;

      const alt = distances[currentNodeId] + edge.weight;
      if (alt < distances[neighborId]) {
        distances[neighborId] = alt;
        previous[neighborId] = currentNodeId;
      }
    }
  }

  const path = [];
  let curr = endNodeId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return path[0] === startNodeId ? path : [];
};
