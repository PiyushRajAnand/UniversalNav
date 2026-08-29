/**
 * Auto-generates a navigable mathematical graph behind the scenes
 * from blueprint visual objects (Rooms, Corridors, Lifts, Stairs).
 */

// Helper to compute Euclidean distance between two points (in meters)
export function getDistance(p1, p2, scaleRatio = 0.05) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy) * scaleRatio;
}

/**
 * Automatically builds graph nodes and edges from blueprint elements
 */
export function generateGraphFromBlueprint(elements, connections = []) {
  const nodes = [];
  const edges = [];

  // 1. Auto-generate Nodes for Rooms, Halls, Lifts, and Stairs (at shape center)
  elements.forEach((el) => {
    if (['Corridor', 'WalkingPath'].includes(el.type)) return;

    const centerX = el.x + (el.width || 0) / 2;
    const centerY = el.y + (el.height || 0) / 2;

    nodes.push({
      id: `node_${el._id || el.id}`,
      elementId: el._id || el.id,
      name: el.name,
      type: el.type,
      floorLevel: el.floorLevel,
      x: centerX,
      y: centerY,
      isDoor: false
    });
  });

  // 2. Auto-generate Nodes for Corridor Polyline Waypoints & Intersections
  elements.filter(el => ['Corridor', 'WalkingPath'].includes(el.type)).forEach((corridor) => {
    const points = corridor.points || [];
    const corridorNodes = [];

    points.forEach((pt, idx) => {
      const nodeId = `node_corr_${corridor._id || corridor.id}_${idx}`;
      const node = {
        id: nodeId,
        elementId: corridor._id || corridor.id,
        name: `${corridor.name} Point ${idx + 1}`,
        type: 'WayPoint',
        floorLevel: corridor.floorLevel,
        x: pt.x,
        y: pt.y,
        isDoor: false
      };
      nodes.push(node);
      corridorNodes.push(node);
    });

    // Automatically link adjacent points along the corridor path
    for (let i = 0; i < corridorNodes.length - 1; i++) {
      const dist = getDistance(corridorNodes[i], corridorNodes[i + 1]);
      edges.push({
        from: corridorNodes[i].id,
        to: corridorNodes[i + 1].id,
        weight: dist,
        type: 'Corridor',
        isBidirectional: true
      });
    }
  });

  // 3. Automatically Snap/Connect Rooms to Nearest Corridor Waypoints
  const roomNodes = nodes.filter(n => !['WayPoint'].includes(n.type));
  const waypoints = nodes.filter(n => n.type === 'WayPoint');

  roomNodes.forEach((roomNode) => {
    let nearestWaypoint = null;
    let minDistance = Infinity;

    waypoints.forEach((wp) => {
      if (wp.floorLevel === roomNode.floorLevel) {
        const dist = getDistance(roomNode, wp);
        if (dist < minDistance && dist <= 15) { // 15-meter auto-snap threshold
          minDistance = dist;
          nearestWaypoint = wp;
        }
      }
    });

    if (nearestWaypoint) {
      edges.push({
        from: roomNode.id,
        to: nearestWaypoint.id,
        weight: minDistance,
        type: 'DoorAccess',
        isBidirectional: true
      });
    }
  });

  // 4. Connect Vertical Transport (Lifts & Stairs) across floors
  const verticalTransport = nodes.filter(n => ['Lift', 'Stair', 'Escalator'].includes(n.type));
  for (let i = 0; i < verticalTransport.length; i++) {
    for (let j = i + 1; j < verticalTransport.length; j++) {
      const t1 = verticalTransport[i];
      const t2 = verticalTransport[j];

      // If they match in name & align vertically (e.g. "Lift A" on Floor 0 & Floor 1)
      if (t1.name === t2.name && Math.abs(t1.x - t2.x) < 30 && Math.abs(t1.y - t2.y) < 30) {
        const floorDiff = Math.abs(t1.floorLevel - t2.floorLevel);
        const verticalPenalty = t1.type === 'Lift' ? 10 * floorDiff : 18 * floorDiff;

        edges.push({
          from: t1.id,
          to: t2.id,
          weight: verticalPenalty,
          type: t1.type,
          isBidirectional: true
        });
      }
    }
  }

  return { nodes, edges };
}
