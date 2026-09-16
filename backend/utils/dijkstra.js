/**
 * ====================================================
 * SHORTEST PATH ENGINE
 * ====================================================
 *
 * Dijkstra's shortest-path algorithm.
 *
 * The function works with the project's Connection
 * representation:
 *
 * connection.fromRoomId
 * connection.toRoomId
 * connection.distanceMeters
 *
 * It also supports:
 *
 * - bidirectional connections
 * - stair avoidance
 * - elevator avoidance
 * - accessibility filtering
 * - blocked nodes
 * - blocked edges
 *
 * The graph itself is kept generic so the navigation
 * controller can decide which nodes/connections are
 * relevant for a particular building.
 * ====================================================
 */

/*
====================================================
ID NORMALIZATION
====================================================
*/

const normalizeId = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toString();
};

/*
====================================================
EDGE KEY
====================================================
*/

const createEdgeKey = (
  from,
  to
) => {
  return `${normalizeId(from)}:${normalizeId(to)}`;
};

/*
====================================================
FIND SHORTEST PATH
====================================================
*/

function findShortestPath(
  nodes = [],
  connections = [],
  startNodeId,
  endNodeId,
  options = {}
) {
  const startId =
    normalizeId(startNodeId);

  const endId =
    normalizeId(endNodeId);

  /*
  ----------------------------------------------------
  OPTIONS
  ----------------------------------------------------
  */

  const {
    avoidStairs = false,
    avoidElevators = false,
    wheelchairAccessible = false,
    blockedNodeIds = [],
    blockedEdges = [],
  } = options;

  /*
  ----------------------------------------------------
  BASIC VALIDATION
  ----------------------------------------------------
  */

  if (!startId || !endId) {
    return {
      success: false,
      message:
        "Start and end nodes are required.",
      distance: Infinity,
      path: [],
    };
  }

  if (!Array.isArray(nodes)) {
    return {
      success: false,
      message:
        "Invalid navigation nodes.",
      distance: Infinity,
      path: [],
    };
  }

  if (!Array.isArray(connections)) {
    return {
      success: false,
      message:
        "Invalid navigation connections.",
      distance: Infinity,
      path: [],
    };
  }

  /*
  ----------------------------------------------------
  NODE SET
  ----------------------------------------------------
  */

  const nodeIds = new Set(
    nodes
      .map((node) =>
        normalizeId(node?._id)
      )
      .filter(Boolean)
  );

  /*
  ----------------------------------------------------
  START / END EXISTENCE
  ----------------------------------------------------
  */

  if (!nodeIds.has(startId)) {
    return {
      success: false,
      message:
        "Start node not found.",
      distance: Infinity,
      path: [],
    };
  }

  if (!nodeIds.has(endId)) {
    return {
      success: false,
      message:
        "End node not found.",
      distance: Infinity,
      path: [],
    };
  }

  /*
  ----------------------------------------------------
  BLOCKED NODE SET
  ----------------------------------------------------
  */

  const blockedNodes = new Set(
    Array.isArray(blockedNodeIds)
      ? blockedNodeIds
          .map(normalizeId)
          .filter(Boolean)
      : []
  );

  /*
  ----------------------------------------------------
  START/END BLOCK CHECK
  ----------------------------------------------------
  */

  if (
    blockedNodes.has(startId) ||
    blockedNodes.has(endId)
  ) {
    return {
      success: false,
      message:
        "Start or destination node is blocked.",
      distance: Infinity,
      path: [],
    };
  }

  /*
  ----------------------------------------------------
  GRAPH
  ----------------------------------------------------
  */

  const graph = {};

  nodeIds.forEach((id) => {
    graph[id] = [];
  });

  /*
  ----------------------------------------------------
  BLOCKED EDGE SET
  ----------------------------------------------------

  Supports entries such as:

    {
      from: "...",
      to: "..."
    }

  or:

    {
      fromNodeId: "...",
      toNodeId: "..."
    }
  */

  const blockedEdgeSet =
    new Set();

  if (Array.isArray(blockedEdges)) {
    blockedEdges.forEach(
      (edge) => {
        const from =
          edge?.from ??
          edge?.fromNodeId ??
          edge?.sourceNodeId;

        const to =
          edge?.to ??
          edge?.toNodeId ??
          edge?.targetNodeId;

        if (from && to) {
          blockedEdgeSet.add(
            createEdgeKey(from, to)
          );

          /*
          Treat blocked edges as
          bidirectional for routing.
          */

          blockedEdgeSet.add(
            createEdgeKey(to, from)
          );
        }
      }
    );
  }

  /*
  ----------------------------------------------------
  BUILD ADJACENCY LIST
  ----------------------------------------------------
  */

  connections.forEach(
    (connection) => {
      if (!connection) {
        return;
      }

      const fromId =
        normalizeId(
          connection.fromRoomId
        );

      const toId =
        normalizeId(
          connection.toRoomId
        );

      if (!fromId || !toId) {
        return;
      }

      /*
      Ignore connections referring to nodes
      outside the supplied graph.
      */

      if (
        !nodeIds.has(fromId) ||
        !nodeIds.has(toId)
      ) {
        return;
      }

      /*
      Ignore blocked nodes.
      */

      if (
        blockedNodes.has(fromId) ||
        blockedNodes.has(toId)
      ) {
        return;
      }

      /*
      Ignore blocked edge.
      */

      if (
        blockedEdgeSet.has(
          createEdgeKey(
            fromId,
            toId
          )
        )
      ) {
        return;
      }

      /*
      ------------------------------------------------
      ACCESSIBILITY
      ------------------------------------------------
      */

      if (
        wheelchairAccessible &&
        connection.isAccessible === false
      ) {
        return;
      }

      /*
      ------------------------------------------------
      STAIR AVOIDANCE
      ------------------------------------------------
      */

      if (
        avoidStairs &&
        connection.type === "Stair"
      ) {
        return;
      }

      /*
      ------------------------------------------------
      ELEVATOR AVOIDANCE
      ------------------------------------------------
      */

      if (
        avoidElevators &&
        connection.type === "Lift"
      ) {
        return;
      }

      /*
      ------------------------------------------------
      WEIGHT
      ------------------------------------------------
      */

      const distance =
        Number(
          connection.distanceMeters
        );

      if (
        !Number.isFinite(distance) ||
        distance < 0
      ) {
        return;
      }

      const modifier =
        Number(
          connection.weightModifier
        );

      const safeModifier =
        Number.isFinite(modifier) &&
        modifier > 0
          ? modifier
          : 1;

      const weight =
        distance *
        safeModifier;

      /*
      ------------------------------------------------
      FORWARD EDGE
      ------------------------------------------------
      */

      graph[fromId].push({
        node: toId,
        weight,
        type:
          connection.type || null,
      });

      /*
      ------------------------------------------------
      REVERSE EDGE
      ------------------------------------------------
      */

      if (
        connection.isBidirectional !==
        false
      ) {
        graph[toId].push({
          node: fromId,
          weight,
          type:
            connection.type || null,
        });
      }
    }
  );

  /*
  ----------------------------------------------------
  DIJKSTRA STATE
  ----------------------------------------------------
  */

  const distances = {};
  const previous = {};
  const unvisited = new Set();

  nodeIds.forEach(
    (nodeId) => {
      distances[nodeId] =
        Infinity;

      previous[nodeId] =
        null;

      unvisited.add(nodeId);
    }
  );

  distances[startId] = 0;

  /*
  ----------------------------------------------------
  MAIN DIJKSTRA LOOP
  ----------------------------------------------------
  */

  while (unvisited.size > 0) {
    let current = null;

    /*
    Find the unvisited node with the
    smallest known distance.
    */

    for (
      const nodeId of unvisited
    ) {
      if (
        current === null ||
        distances[nodeId] <
          distances[current]
      ) {
        current = nodeId;
      }
    }

    /*
    No reachable nodes remain.
    */

    if (
      current === null ||
      distances[current] === Infinity
    ) {
      break;
    }

    /*
    Destination reached.
    */

    if (current === endId) {
      break;
    }

    unvisited.delete(current);

    const neighbors =
      graph[current] || [];

    for (
      const neighbor of neighbors
    ) {
      const neighborId =
        normalizeId(
          neighbor.node
        );

      if (
        !unvisited.has(
          neighborId
        )
      ) {
        continue;
      }

      const alternativeDistance =
        distances[current] +
        neighbor.weight;

      if (
        alternativeDistance <
        distances[neighborId]
      ) {
        distances[neighborId] =
          alternativeDistance;

        previous[neighborId] =
          current;
      }
    }
  }

  /*
  ----------------------------------------------------
  DESTINATION UNREACHABLE
  ----------------------------------------------------
  */

  if (
    distances[endId] === Infinity
  ) {
    return {
      success: false,
      message:
        "No path found between the selected nodes.",
      distance: Infinity,
      path: [],
    };
  }

  /*
  ----------------------------------------------------
  RECONSTRUCT PATH
  ----------------------------------------------------
  */

  const path = [];

  let current =
    endId;

  while (current !== null) {
    path.unshift(current);

    if (current === startId) {
      break;
    }

    current =
      previous[current];
  }

  /*
  ----------------------------------------------------
  SAFETY CHECK
  ----------------------------------------------------
  */

  if (
    path.length === 0 ||
    path[0] !== startId
  ) {
    return {
      success: false,
      message:
        "Unable to reconstruct navigation path.",
      distance: Infinity,
      path: [],
    };
  }

  /*
  ----------------------------------------------------
  SUCCESS
  ----------------------------------------------------
  */

  return {
    success: true,
    distance: distances[endId],
    path,
  };
}

/*
====================================================
EXPORT
====================================================
*/

module.exports = {
  findShortestPath,
};