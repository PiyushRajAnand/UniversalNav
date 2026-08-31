import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useParams } from "react-router-dom";

/*
====================================================================
 PUBLIC NAVIGATION
 -------------------------------------------------------------------
 Read-only version of MapEditor routing.

 Uses the SAME map structure:
   rooms
   waypoints
   edges
   qrLocations
   blockedNodeIds
   blockedRoomIds
   blockedEdgeKeys
   floors
   floorSize

 Supports:
   ✓ Multi-floor maps
   ✓ Stairs
   ✓ Elevators
   ✓ Cross-floor routing
   ✓ Emergency exits
   ✓ Emergency evacuation
   ✓ Blocked rooms
   ✓ Blocked nodes
   ✓ Blocked corridors
   ✓ Route visualization
   ✓ Navigation simulation
   ✓ Floor switching during simulation
   ✓ Distance
   ✓ Route instructions
   ✓ You are here
   ✓ Read-only public view
====================================================================
*/

// Backend API base URL.
// Local development keeps the existing localhost backend.
// In production, set VITE_API_URL in the frontend deployment
// (for example: https://your-backend.onrender.com).
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "")
).replace(/\/$/, "");

const PIXELS_TO_METERS = 0.1;

const DEFAULT_FLOOR_SIZE = {
  width: 1100,
  height: 750
};

const ROOM_ICONS = {
  Room: "🚪",
  Classroom: "🎓",
  Auditorium: "🏛️",
  Washroom: "🚻",
  Stairs: "🪜",
  Elevator: "🛗",
  EmergencyExit: "🚨",
  Entrance: "🚪",
  Cafeteria: "🍽️",
  Lab: "🧪",
  Gym: "🏋️",
  Office: "💼",
  Storage: "📦",
  Library: "📚"
};

function getRoomIcon(room) {
  return ROOM_ICONS[room?.type] || "📍";
}

function formatDistanceMeters(meters) {
  const value = Number(meters || 0);

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} km`;
  }

  return `${Math.round(value)} m`;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.round(seconds || 0));

  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;

  if (minutes > 0) {
    return `${minutes} min ${String(secs).padStart(2, "0")} sec`;
  }

  return `${secs} sec`;
}

function getFloorName(floor, index) {
  if (typeof floor === "string") {
    return floor;
  }

  return (
    floor?.name ||
    floor?.floor ||
    floor?.label ||
    `Floor ${index + 1}`
  );
}

export default function PublicNavigation() {
  const { buildingId } = useParams();

  // ==============================================================
  // MAP STATE
  // ==============================================================

  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==============================================================
  // FLOOR
  // ==============================================================

  const [selectedFloor, setSelectedFloor] = useState("");

  // ==============================================================
  // ROUTING
  // ==============================================================

  const [startRoomId, setStartRoomId] = useState("");
  const [destinationRoomId, setDestinationRoomId] = useState("");

  const [navigationPath, setNavigationPath] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [routeSeconds, setRouteSeconds] = useState(0);

  const [routeError, setRouteError] = useState("");

  // ==============================================================
  // ROUTE OPTIONS
  // ==============================================================

  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedRouteOption, setSelectedRouteOption] =
    useState("fastest");

  // ==============================================================
  // ACCESSIBILITY
  // ==============================================================

  const [accessibilityPrefs, setAccessibilityPrefs] =
    useState({
      wheelchair: false,
      avoidStairs: false,
      avoidNarrow: false,
      minimizeWalking: false,
      avoidElevators: false
    });

  // ==============================================================
  // SIMULATION
  // ==============================================================

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] =
    useState(0);

  const [simSpeed, setSimSpeed] = useState(1);

  // ==============================================================
  // CURRENT LOCATION
  // ==============================================================

  const [currentLocationNodeId, setCurrentLocationNodeId] =
    useState("");

  // ==============================================================
  // EMERGENCY
  // ==============================================================

  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyType, setEmergencyType] =
    useState("evacuation");

  const [emergencyPath, setEmergencyPath] = useState([]);
  const [emergencyExitId, setEmergencyExitId] = useState("");

  const [emergencyDistance, setEmergencyDistance] =
    useState(0);

  const [emergencyTimeSeconds, setEmergencyTimeSeconds] =
    useState(0);

  const [emergencyStatus, setEmergencyStatus] =
    useState("");

  // ==============================================================
  // MAP VISIBILITY
  // ==============================================================

  const [showConnections, setShowConnections] =
    useState(true);

  const [showWaypoints, setShowWaypoints] =
    useState(true);

  // ==============================================================
  // SIMULATION REFS
  // ==============================================================

  const animationRef = useRef(null);

  // ==============================================================
  // LOAD MAP
  // ==============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      try {
        setLoading(true);
        setError("");

        console.log(
          "PUBLIC NAVIGATION MAP ID:",
          buildingId
        );

        if (!API_BASE_URL) {
          throw new Error(
            "Backend API URL is not configured. Set VITE_API_URL in the frontend deployment."
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/api/maps/${encodeURIComponent(buildingId)}`,
          {
            method: "GET",
            // Public QR navigation must not depend on a login/session.
            // Keep this request completely anonymous.
            credentials: "omit",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        console.log(
          "PUBLIC NAVIGATION API:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Failed to load map"
          );
        }

        if (!cancelled) {
          setMap(data.map || data);
        }
      } catch (err) {
        console.error(
          "PUBLIC NAVIGATION ERROR:",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load public map."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (buildingId) {
      loadMap();
    }

    return () => {
      cancelled = true;
    };
  }, [buildingId]);

  // ==============================================================
  // FLOORS
  // ==============================================================

  const floors = useMemo(() => {
    if (!map) return [];

    if (Array.isArray(map.floors)) {
      return map.floors.map((floor, index) =>
        getFloorName(floor, index)
      );
    }

    const names = new Set();

    (map.rooms || []).forEach((room) => {
      if (room.floor) {
        names.add(room.floor);
      }
    });

    (map.waypoints || []).forEach((wp) => {
      if (wp.floor) {
        names.add(wp.floor);
      }
    });

    return Array.from(names);
  }, [map]);

  // ==============================================================
  // INITIAL FLOOR
  // ==============================================================

  useEffect(() => {
    if (!selectedFloor && floors.length > 0) {
      setSelectedFloor(floors[0]);
    }
  }, [floors, selectedFloor]);

  // ==============================================================
  // DATA NORMALIZATION
  // ==============================================================

  const rooms = useMemo(() => {
    return Array.isArray(map?.rooms)
      ? map.rooms
      : [];
  }, [map]);

  const waypoints = useMemo(() => {
    return Array.isArray(map?.waypoints)
      ? map.waypoints
      : [];
  }, [map]);

  /*
   IMPORTANT:
   MapEditor stores edges.

   Older PublicNavigation versions used:
      map.connections || map.edges

   We keep both so old maps continue working.
  */

  const edges = useMemo(() => {
    if (Array.isArray(map?.edges)) {
      return map.edges;
    }

    if (Array.isArray(map?.connections)) {
      return map.connections;
    }

    return [];
  }, [map]);

  const qrLocations = useMemo(() => {
    return Array.isArray(map?.qrLocations)
      ? map.qrLocations
      : [];
  }, [map]);

  // ==============================================================
  // SAFETY DATA FROM MAPEDITOR
  // ==============================================================

  const blockedNodeIds = useMemo(() => {
    return Array.isArray(map?.blockedNodeIds)
      ? map.blockedNodeIds
      : [];
  }, [map]);

  const blockedRoomIds = useMemo(() => {
    return Array.isArray(map?.blockedRoomIds)
      ? map.blockedRoomIds
      : [];
  }, [map]);

  const blockedEdgeKeys = useMemo(() => {
    return Array.isArray(map?.blockedEdgeKeys)
      ? map.blockedEdgeKeys
      : [];
  }, [map]);

  // ==============================================================
  // FLOOR SIZE
  // ==============================================================

  const floorSize = useMemo(() => {
    return {
      width:
        Number(
          map?.floorSize?.width
        ) || DEFAULT_FLOOR_SIZE.width,

      height:
        Number(
          map?.floorSize?.height
        ) || DEFAULT_FLOOR_SIZE.height
    };
  }, [map]);

  // ==============================================================
  // CURRENT FLOOR DATA
  // ==============================================================

  const currentRooms = useMemo(() => {
    return rooms.filter(
      (room) =>
        (room.floor || "1st FLOOR") ===
        selectedFloor
    );
  }, [rooms, selectedFloor]);

  const currentWaypoints = useMemo(() => {
    return waypoints.filter(
      (wp) =>
        (wp.floor || "1st FLOOR") ===
        selectedFloor
    );
  }, [waypoints, selectedFloor]);

  // ==============================================================
  // EDGE KEY
  // ==============================================================

  const makeEdgeKey = useCallback(
    (from, to) => {
      return [String(from), String(to)]
        .sort()
        .join("::");
    },
    []
  );

  // ==============================================================
  // ROOM FOR WAYPOINT
  // ==============================================================

  const getParentRoomForNode = useCallback(
    (nodeId) => {
      return rooms.find(
        (room) =>
          String(room.waypointId) ===
          String(nodeId)
      );
    },
    [rooms]
  );

  // ==============================================================
  // NODE TYPE
  // ==============================================================

  const getNodeType = useCallback(
    (nodeId) => {
      return (
        getParentRoomForNode(nodeId)?.type ||
        "Node"
      );
    },
    [getParentRoomForNode]
  );

  // ==============================================================
  // BLOCKED NODE
  // ==============================================================

  const isNodeSafetyBlocked = useCallback(
    (nodeId) => {
      if (
        blockedNodeIds.includes(nodeId)
      ) {
        return true;
      }

      const room =
        getParentRoomForNode(nodeId);

      return (
        !!room &&
        blockedRoomIds.includes(
          room._id
        )
      );
    },
    [
      blockedNodeIds,
      blockedRoomIds,
      getParentRoomForNode
    ]
  );

  // ==============================================================
  // BLOCKED EDGE
  // ==============================================================

  const isSafetyEdgeBlocked =
    useCallback(
      (from, to) => {
        return blockedEdgeKeys.includes(
          makeEdgeKey(from, to)
        );
      },
      [
        blockedEdgeKeys,
        makeEdgeKey
      ]
    );

  // ==============================================================
  // ROOM WAYPOINT
  // ==============================================================

  const getRoomWaypoint = useCallback(
    (room) => {
      if (!room) return null;

      if (room.waypointId) {
        const wp = waypoints.find(
          (w) =>
            String(w.id) ===
            String(room.waypointId)
        );

        if (wp) return wp;
      }

      return null;
    },
    [waypoints]
  );

  // ==============================================================
  // CROSS FLOOR AUTOMATIC VERTICAL CONNECTIONS
  //
  // Same logic as MapEditor.
  // ==============================================================
  const addAutomaticVerticalConnections =
    useCallback(
      (graph) => {
        const verticalNodes =
          waypoints.filter((wp) => {
            const parent =
              getParentRoomForNode(
                wp.id
              );

            return (
              parent &&
              (
                parent.type === "Stairs" ||
                parent.type === "Elevator"
              )
            );
          });

        for (
          let i = 0;
          i < verticalNodes.length;
          i++
        ) {
          for (
            let j = i + 1;
            j < verticalNodes.length;
            j++
          ) {
            const w1 =
              verticalNodes[i];

            const w2 =
              verticalNodes[j];

            const r1 =
              getParentRoomForNode(
                w1.id
              );

            const r2 =
              getParentRoomForNode(
                w2.id
              );

            if (!r1 || !r2) {
              continue;
            }

            if (
              w1.floor === w2.floor
            ) {
              continue;
            }

            if (
              r1.type !== r2.type
            ) {
              continue;
            }

            if (
              isNodeSafetyBlocked(
                w1.id
              ) ||
              isNodeSafetyBlocked(
                w2.id
              )
            ) {
              continue;
            }

            if (
              accessibilityPrefs.wheelchair &&
              r1.type === "Stairs"
            ) {
              continue;
            }

            if (
              accessibilityPrefs.avoidStairs &&
              r1.type === "Stairs"
            ) {
              continue;
            }

            if (
              accessibilityPrefs.avoidElevators &&
              r1.type === "Elevator"
            ) {
              continue;
            }

            const sameName =
              String(
                r1.name || ""
              )
                .trim()
                .toLowerCase() ===
              String(
                r2.name || ""
              )
                .trim()
                .toLowerCase();

            if (
              sameName ||
              !r1.name ||
              !r2.name
            ) {
              let cost =
                r1.type === "Elevator"
                  ? 30
                  : 70;

              if (
                accessibilityPrefs.wheelchair &&
                r1.type === "Elevator"
              ) {
                cost *= 0.75;
              }

              if (
                !graph[w1.id][w2.id]
              ) {
                graph[w1.id][w2.id] =
                  cost;
              }

              if (
                !graph[w2.id][w1.id]
              ) {
                graph[w2.id][w1.id] =
                  cost;
              }
            }
          }
        }
      },
      [
        waypoints,
        getParentRoomForNode,
        isNodeSafetyBlocked,
        accessibilityPrefs
      ]
    );

  // ==============================================================
  // BUILD ROUTING GRAPH
  // ==============================================================

  const buildGraph = useCallback(
    (prefs = accessibilityPrefs) => {
      const graph = {};

      waypoints.forEach((wp) => {
        graph[wp.id] = {};
      });

      edges.forEach((edge) => {
        const from = edge.from;
        const to = edge.to;

        if (!from || !to) {
          return;
        }

        const w1 =
          waypoints.find(
            (wp) =>
              String(wp.id) ===
              String(from)
          );

        const w2 =
          waypoints.find(
            (wp) =>
              String(wp.id) ===
              String(to)
          );

        if (!w1 || !w2) {
          return;
        }

        // ----------------------------------------------------------
        // BLOCKED SAFETY DATA
        // ----------------------------------------------------------

        if (
          isNodeSafetyBlocked(from) ||
          isNodeSafetyBlocked(to)
        ) {
          return;
        }

        if (
          isSafetyEdgeBlocked(
            from,
            to
          )
        ) {
          return;
        }

        // ----------------------------------------------------------
        // TYPES
        // ----------------------------------------------------------

        const fromType =
          getNodeType(from);

        const toType =
          getNodeType(to);

        const touchesStairs =
          fromType === "Stairs" ||
          toType === "Stairs";

        const touchesElevator =
          fromType === "Elevator" ||
          toType === "Elevator";

        // ----------------------------------------------------------
        // ACCESSIBILITY
        // ----------------------------------------------------------

        if (
          (
            prefs.wheelchair ||
            prefs.avoidStairs
          ) &&
          touchesStairs
        ) {
          return;
        }

        if (
          prefs.avoidElevators &&
          touchesElevator
        ) {
          return;
        }

        if (
          prefs.avoidNarrow &&
          edge.narrow
        ) {
          return;
        }

        // ----------------------------------------------------------
        // DISTANCE
        // ----------------------------------------------------------

        let weight = 0;

        if (
          edge.customDistance !==
            undefined &&
          edge.customDistance !==
            null &&
          Number(edge.customDistance) >
            0
        ) {
          weight = Number(
            edge.customDistance
          );
        } else if (
          edge.isCrossFloor
        ) {
          weight = Number(
            edge.connectionCost ||
              50
          );
        } else if (
          w1.floor === w2.floor
        ) {
          weight =
            Math.hypot(
              Number(w1.x) -
                Number(w2.x),
              Number(w1.y) -
                Number(w2.y)
            ) *
            PIXELS_TO_METERS;
        }

        if (weight <= 0) {
          return;
        }

        if (
          prefs.wheelchair &&
          touchesElevator
        ) {
          weight *= 0.75;
        }

        if (
          prefs.minimizeWalking &&
          edge.isCrossFloor
        ) {
          weight *= 0.75;
        }

        if (!graph[from]) {
          graph[from] = {};
        }

        if (!graph[to]) {
          graph[to] = {};
        }

        graph[from][to] = weight;
        graph[to][from] = weight;
      });

      // ----------------------------------------------------------
      // AUTOMATIC STAIRS / ELEVATOR CONNECTIONS
      // ----------------------------------------------------------

      addAutomaticVerticalConnections(
        graph
      );

      return graph;
    },
    [
      waypoints,
      edges,
      accessibilityPrefs,
      isNodeSafetyBlocked,
      isSafetyEdgeBlocked,
      getNodeType,
      addAutomaticVerticalConnections
    ]
  );

  // ==============================================================
  // DIJKSTRA
  // ==============================================================

  const calculateShortestPath =
    useCallback(
      (
        graph,
        startId,
        destinationId
      ) => {
        if (
          !startId ||
          !destinationId
        ) {
          return null;
        }

        const distances = {};
        const previous = {};

        const unvisited =
          new Set(
            waypoints.map(
              (wp) => wp.id
            )
          );

        waypoints.forEach(
          (wp) => {
            distances[wp.id] =
              Infinity;

            previous[wp.id] = null;
          }
        );

        distances[startId] = 0;

        while (
          unvisited.size > 0
        ) {
          let current = null;

          unvisited.forEach(
            (id) => {
              if (
                current === null ||
                distances[id] <
                  distances[current]
              ) {
                current = id;
              }
            }
          );

          if (
            current === null ||
            distances[current] ===
              Infinity
          ) {
            break;
          }

          unvisited.delete(
            current
          );

          if (
            current ===
            destinationId
          ) {
            break;
          }

          const neighbours =
            graph[current] || {};

          Object.entries(
            neighbours
          ).forEach(
            ([neighbor, weight]) => {
              if (
                !unvisited.has(
                  neighbor
                )
              ) {
                return;
              }

              const alt =
                distances[current] +
                weight;

              if (
                alt <
                distances[neighbor]
              ) {
                distances[neighbor] =
                  alt;

                previous[neighbor] =
                  current;
              }
            }
          );
        }

        if (
          !Number.isFinite(
            distances[destinationId]
          )
        ) {
          return null;
        }

        const path = [];

        let current =
          destinationId;

        while (
          current !== null
        ) {
          path.unshift(
            current
          );

          current =
            previous[current];
        }

        if (
          path[0] !== startId
        ) {
          return null;
        }

        return {
          path,
          distance:
            Math.max(
              1,
              Math.round(
                distances[
                  destinationId
                ]
              )
            )
        };
      },
      [waypoints]
    );

  // ==============================================================
  // COMPUTE ROUTE
  // ==============================================================

  const computeRoute =
    useCallback(
      (
        startWpId,
        destinationId,
        prefs
      ) => {
        const destination =
          rooms.find(
            (room) =>
              String(room._id) ===
              String(destinationId)
          );

        if (
          !destination ||
          !destination.waypointId
        ) {
          return null;
        }

        const graph =
          buildGraph(prefs);

        return calculateShortestPath(
          graph,
          startWpId,
          destination.waypointId
        );
      },
      [
        rooms,
        buildGraph,
        calculateShortestPath
      ]
    );

  // ==============================================================
  // ROUTE OPTIONS
  // ==============================================================

  const buildRouteOptions =
    useCallback(
      (
        startWpId,
        destinationId
      ) => {
        const base = {
          ...accessibilityPrefs
        };

        const variants = [
          {
            id: "fastest",
            icon: "🟢",
            label: "Fastest",
            prefs: base
          },
          {
            id: "accessible",
            icon: "♿",
            label: "Accessible",
            prefs: {
              ...base,
              wheelchair: true,
              avoidStairs: true,
              avoidElevators: false
            }
          },
          {
            id: "elevator",
            icon: "🛗",
            label: "Elevator",
            prefs: {
              ...base,
              wheelchair: false,
              avoidStairs: true,
              avoidElevators: false
            }
          },
          {
            id: "safe",
            icon: "🚨",
            label: "Safest",
            prefs: {
              ...base,
              avoidNarrow: true,
              avoidElevators: true
            }
          }
        ];

        return variants
          .map((variant) => {
            const result =
              computeRoute(
                startWpId,
                destinationId,
                variant.prefs
              );

            if (!result) {
              return null;
            }

            const speed =
              variant.prefs.wheelchair
                ? 0.85
                : 1.1;

            const seconds =
              Math.max(
                1,
                Math.round(
                  result.distance /
                    speed
                )
              );

            return {
              ...variant,
              ...result,
              seconds
            };
          })
          .filter(Boolean);
      },
      [
        accessibilityPrefs,
        computeRoute
      ]
    );

  // ==============================================================
  // FIND NORMAL ROUTE
  // ==============================================================

  const handleFindRoute =
    useCallback(() => {
      setRouteError("");

      setNavigationPath([]);

      setTotalDistance(0);

      setRouteSeconds(0);

      setIsSimulating(false);

      setSimulationProgress(0);

      setEmergencyMode(false);

      const startRoom =
        rooms.find(
          (room) =>
            String(room._id) ===
            String(startRoomId)
        );

      const destinationRoom =
        rooms.find(
          (room) =>
            String(room._id) ===
            String(
              destinationRoomId
            )
        );

      if (!startRoom) {
        setRouteError(
          "Please select a starting point."
        );
        return;
      }

      if (!destinationRoom) {
        setRouteError(
          "Please select a destination."
        );
        return;
      }

      if (
        !startRoom.waypointId ||
        !destinationRoom.waypointId
      ) {
        setRouteError(
          "One of the selected locations does not have a linked waypoint."
        );
        return;
      }

      const options =
        buildRouteOptions(
          startRoom.waypointId,
          destinationRoom._id
        );

      if (!options.length) {
        setRouteError(
          "No route exists between these locations. Make sure the floors are connected through stairs or elevators, and check for blocked paths."
        );

        setRouteOptions([]);

        return;
      }

      setRouteOptions(options);

      const selected =
        options.find(
          (option) =>
            option.id ===
            selectedRouteOption
        ) ||
        options[0];

      setNavigationPath(
        selected.path
      );

      setTotalDistance(
        selected.distance
      );

      setRouteSeconds(
        selected.seconds
      );

      setSelectedRouteOption(
        selected.id
      );

      setCurrentLocationNodeId(
        selected.path[0]
      );

      // Automatically show start floor
      const startNode =
        waypoints.find(
          (wp) =>
            wp.id ===
            selected.path[0]
        );

      if (startNode?.floor) {
        setSelectedFloor(
          startNode.floor
        );
      }

      console.log(
        "PUBLIC ROUTE:",
        selected.path
      );
    },
    [
      rooms,
      startRoomId,
      destinationRoomId,
      buildRouteOptions,
      selectedRouteOption,
      waypoints
    ]
  );

  // ==============================================================
  // CHANGE ROUTE OPTION
  // ==============================================================

  const selectRouteOption =
    useCallback(
      (option) => {
        if (!option) return;

        setSelectedRouteOption(
          option.id
        );

        setNavigationPath(
          option.path
        );

        setTotalDistance(
          option.distance
        );

        setRouteSeconds(
          option.seconds
        );

        setSimulationProgress(0);

        setIsSimulating(false);

        const startNode =
          waypoints.find(
            (wp) =>
              wp.id ===
              option.path[0]
          );

        if (startNode?.floor) {
          setSelectedFloor(
            startNode.floor
          );
        }
      },
      [waypoints]
    );

  // ==============================================================
  // CLEAR ROUTE
  // ==============================================================

  const clearRoute =
    useCallback(() => {
      setNavigationPath([]);

      setTotalDistance(0);

      setRouteSeconds(0);

      setRouteOptions([]);

      setRouteError("");

      setIsSimulating(false);

      setSimulationProgress(0);

      setEmergencyMode(false);

      setEmergencyPath([]);

      setEmergencyExitId("");

      setEmergencyDistance(0);

      setEmergencyTimeSeconds(0);

      setEmergencyStatus("");
    }, []);

  // ==============================================================
  // EMERGENCY GRAPH
  // ==============================================================

  const buildEmergencyGraph =
    useCallback(() => {
      const graph = {};

      waypoints.forEach(
        (wp) => {
          graph[wp.id] = {};
        }
      );

      const allowed = (
        from,
        to,
        edge = {}
      ) => {
        if (
          isNodeSafetyBlocked(from) ||
          isNodeSafetyBlocked(to)
        ) {
          return false;
        }

        if (
          isSafetyEdgeBlocked(
            from,
            to
          )
        ) {
          return false;
        }

        const fromType =
          getNodeType(from);

        const toType =
          getNodeType(to);

        const stairs =
          fromType === "Stairs" ||
          toType === "Stairs";

        const elevator =
          fromType === "Elevator" ||
          toType === "Elevator";

        // Fire emergency:
        // DO NOT use elevators.
        if (
          emergencyType ===
            "fire" &&
          elevator
        ) {
          return false;
        }

        if (
          (
            accessibilityPrefs.wheelchair ||
            accessibilityPrefs.avoidStairs
          ) &&
          stairs
        ) {
          return false;
        }

        if (
          accessibilityPrefs.avoidElevators &&
          elevator
        ) {
          return false;
        }

        if (
          accessibilityPrefs.avoidNarrow &&
          edge.narrow
        ) {
          return false;
        }

        return true;
      };

      edges.forEach(
        (edge) => {
          const w1 =
            waypoints.find(
              (wp) =>
                wp.id ===
                edge.from
            );

          const w2 =
            waypoints.find(
              (wp) =>
                wp.id ===
                edge.to
            );

          if (!w1 || !w2) {
            return;
          }

          if (
            !allowed(
              edge.from,
              edge.to,
              edge
            )
          ) {
            return;
          }

          let weight = 0;

          if (
            edge.customDistance >
              0
          ) {
            weight =
              Number(
                edge.customDistance
              );
          } else if (
            edge.isCrossFloor
          ) {
            weight =
              Number(
                edge.connectionCost ||
                  50
              );
          } else if (
            w1.floor ===
            w2.floor
          ) {
            weight =
              Math.hypot(
                w1.x - w2.x,
                w1.y - w2.y
              ) *
              PIXELS_TO_METERS;
          }

          if (weight <= 0) {
            return;
          }

          if (
            accessibilityPrefs.wheelchair &&
            (
              getNodeType(
                edge.from
              ) === "Elevator" ||
              getNodeType(
                edge.to
              ) === "Elevator"
            )
          ) {
            weight *= 0.75;
          }

          graph[edge.from][
            edge.to
          ] = weight;

          graph[edge.to][
            edge.from
          ] = weight;
        }
      );

      // Same vertical fallback as MapEditor.
      addAutomaticVerticalConnections(
        graph
      );

      return graph;
    },
    [
      waypoints,
      edges,
      isNodeSafetyBlocked,
      isSafetyEdgeBlocked,
      getNodeType,
      emergencyType,
      accessibilityPrefs,
      addAutomaticVerticalConnections
    ]
  );

  // ==============================================================
  // EMERGENCY EVACUATION
  // ==============================================================

  const runEmergencyEvacuation =
    useCallback(() => {
      setRouteError("");

      let startWpId =
        currentLocationNodeId;

      if (!startWpId) {
        const startRoom =
          rooms.find(
            (room) =>
              String(room._id) ===
              String(startRoomId)
          );

        startWpId =
          startRoom?.waypointId;
      }

      if (!startWpId) {
        setRouteError(
          "Set your starting location first."
        );
        return;
      }

      if (
        isNodeSafetyBlocked(
          startWpId
        )
      ) {
        setRouteError(
          "Your current location is blocked. Choose another starting point."
        );
        return;
      }

      const validExitRooms =
        rooms.filter(
          (room) => {
            if (
              !room.waypointId
            ) {
              return false;
            }

            if (
              blockedRoomIds.includes(
                room._id
              )
            ) {
              return false;
            }

            if (
              emergencyType ===
              "fire"
            ) {
              return (
                room.type ===
                "EmergencyExit"
              );
            }

            return [
              "EmergencyExit",
              "Entrance"
            ].includes(
              room.type
            );
          }
        );

      if (
        !validExitRooms.length
      ) {
        setRouteError(
          emergencyType ===
            "fire"
            ? "No safe Emergency Exit exists."
            : "No safe Emergency Exit or Entrance exists."
        );

        return;
      }

      const graph =
        buildEmergencyGraph();

      // ----------------------------------------------------------
      // Dijkstra
      // ----------------------------------------------------------

      const distances = {};

      const previous = {};

      const unvisited =
        new Set(
          waypoints.map(
            (wp) => wp.id
          )
        );

      waypoints.forEach(
        (wp) => {
          distances[wp.id] =
            Infinity;

          previous[wp.id] =
            null;
        }
      );

      distances[startWpId] = 0;

      while (
        unvisited.size
      ) {
        let current = null;

        unvisited.forEach(
          (id) => {
            if (
              current === null ||
              distances[id] <
                distances[current]
            ) {
              current = id;
            }
          }
        );

        if (
          current === null ||
          distances[current] ===
            Infinity
        ) {
          break;
        }

        unvisited.delete(
          current
        );

        const neighbours =
          graph[current] || {};

        Object.entries(
          neighbours
        ).forEach(
          ([next, weight]) => {
            const alt =
              distances[current] +
              weight;

            if (
              alt <
              distances[next]
            ) {
              distances[next] =
                alt;

              previous[next] =
                current;
            }
          }
        );
      }

      // ----------------------------------------------------------
      // Find nearest reachable exit
      // ----------------------------------------------------------

      const candidates =
        validExitRooms
          .map((room) => ({
            room,
            distance:
              distances[
                room.waypointId
              ]
          }))
          .filter(
            (item) =>
              Number.isFinite(
                item.distance
              )
          )
          .sort(
            (a, b) =>
              a.distance -
              b.distance
          );

      const best =
        candidates[0];

      if (!best) {
        setRouteError(
          "No safe evacuation route is available. Check blocked corridors, stairs, elevators and exits."
        );

        return;
      }

      const path = [];

      let current =
        best.room.waypointId;

      while (current) {
        path.unshift(current);

        current =
          previous[current];
      }

      if (
        path[0] !== startWpId
      ) {
        setRouteError(
          "No safe evacuation route is available."
        );

        return;
      }

      const distance =
        Math.round(
          best.distance
        );

      const speed =
        accessibilityPrefs.wheelchair
          ? 0.85
          : 1.1;

      const seconds =
        Math.max(
          1,
          Math.round(
            distance / speed
          )
        );

      setEmergencyPath(
        path
      );

      setNavigationPath(
        path
      );

      setTotalDistance(
        distance
      );

      setRouteSeconds(
        seconds
      );

      setEmergencyDistance(
        distance
      );

      setEmergencyTimeSeconds(
        seconds
      );

      setEmergencyExitId(
        best.room._id
      );

      setEmergencyMode(
        true
      );

      setIsSimulating(false);

      setSimulationProgress(
        0
      );

      setCurrentLocationNodeId(
        startWpId
      );

      setEmergencyStatus(
        emergencyType ===
          "fire"
          ? "🔥 FIRE EMERGENCY — USE FIRE EXITS ONLY"
          : "🚨 EMERGENCY EVACUATION ACTIVE"
      );

      const startNode =
        waypoints.find(
          (wp) =>
            wp.id ===
            startWpId
        );

      if (
        startNode?.floor
      ) {
        setSelectedFloor(
          startNode.floor
        );
      }
    },
    [
      currentLocationNodeId,
      startRoomId,
      rooms,
      blockedRoomIds,
      waypoints,
      isNodeSafetyBlocked,
      buildEmergencyGraph,
      accessibilityPrefs,
      emergencyType
    ]
  );

  // ==============================================================
  // STOP EMERGENCY
  // ==============================================================

  const stopEmergency =
    useCallback(() => {
      setEmergencyMode(
        false
      );

      setEmergencyPath([]);

      setEmergencyExitId("");

      setEmergencyDistance(
        0
      );

      setEmergencyTimeSeconds(
        0
      );

      setEmergencyStatus("");
    }, []);

  // ==============================================================
  // ROUTE POSITION
  // ==============================================================

  const simulationPosition =
    useMemo(() => {
      if (
        navigationPath.length <
        2
      ) {
        return null;
      }

      const nodes =
        navigationPath
          .map((id) =>
            waypoints.find(
              (wp) =>
                wp.id === id
            )
          )
          .filter(Boolean);

      if (
        nodes.length < 2
      ) {
        return null;
      }

      const segments = [];

      let totalLength = 0;

      for (
        let i = 0;
        i < nodes.length - 1;
        i++
      ) {
        const p1 =
          nodes[i];

        const p2 =
          nodes[i + 1];

        const crossFloor =
          p1.floor !==
          p2.floor;

        const distance =
          crossFloor
            ? 20
            : Math.max(
                1,
                Math.hypot(
                  p2.x - p1.x,
                  p2.y - p1.y
                )
              );

        segments.push({
          p1,
          p2,
          distance,
          startDistance:
            totalLength
        });

        totalLength +=
          distance;
      }

      const target =
        simulationProgress *
        totalLength;

      for (
        let i = 0;
        i < segments.length;
        i++
      ) {
        const segment =
          segments[i];

        if (
          target <=
            segment.startDistance +
              segment.distance ||
          i ===
            segments.length - 1
        ) {
          const localProgress =
            segment.distance ===
            0
              ? 0
              : Math.max(
                  0,
                  Math.min(
                    1,
                    (
                      target -
                      segment.startDistance
                    ) /
                      segment.distance
                  )
                );

          if (
            segment.p1.floor !==
            segment.p2.floor
          ) {
            const node =
              localProgress >=
              0.5
                ? segment.p2
                : segment.p1;

            return {
              x: node.x,
              y: node.y,
              floor: node.floor
            };
          }

          return {
            x:
              segment.p1.x +
              (
                segment.p2.x -
                segment.p1.x
              ) *
                localProgress,

            y:
              segment.p1.y +
              (
                segment.p2.y -
                segment.p1.y
              ) *
                localProgress,

            floor:
              segment.p1.floor
          };
        }
      }

      const last =
        nodes[nodes.length - 1];

      return {
        x: last.x,
        y: last.y,
        floor: last.floor
      };
    }, [
      navigationPath,
      waypoints,
      simulationProgress
    ]);

  // ==============================================================
  // SIMULATION
  // ==============================================================

  useEffect(() => {
    if (
      !isSimulating ||
      !navigationPath.length
    ) {
      return;
    }

    let lastTime =
      performance.now();

    const animate = (
      time
    ) => {
      const delta =
        (time -
          lastTime) /
        1000;

      lastTime = time;

      const increment =
        0.12 *
        simSpeed *
        delta;

      setSimulationProgress(
        (previous) => {
          const next =
            Math.min(
              1,
              previous +
                increment
            );

          return next;
        }
      );

      animationRef.current =
        requestAnimationFrame(
          animate
        );
    };

    animationRef.current =
      requestAnimationFrame(
        animate
      );

    return () => {
      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, [
    isSimulating,
    navigationPath,
    simSpeed
  ]);

  // ==============================================================
  // SIMULATION FLOOR SWITCH
  // ==============================================================

  useEffect(() => {
    if (
      simulationPosition?.floor
    ) {
      setSelectedFloor(
        simulationPosition.floor
      );
    }

    if (
      simulationProgress >=
        1 &&
      isSimulating
    ) {
      setIsSimulating(
        false
      );
    }
  }, [
    simulationPosition,
    simulationProgress,
    isSimulating
  ]);

  // ==============================================================
  // ROUTE SEGMENT TEST
  // ==============================================================

  const isRouteSegment =
    useCallback(
      (from, to) => {
        const indexA =
          navigationPath.indexOf(
            from
          );

        const indexB =
          navigationPath.indexOf(
            to
          );

        return (
          indexA >= 0 &&
          indexB >= 0 &&
          Math.abs(
            indexA - indexB
          ) === 1
        );
      },
      [navigationPath]
    );

  const isEmergencySegment =
    useCallback(
      (from, to) => {
        const indexA =
          emergencyPath.indexOf(
            from
          );

        const indexB =
          emergencyPath.indexOf(
            to
          );

        return (
          indexA >= 0 &&
          indexB >= 0 &&
          Math.abs(
            indexA - indexB
          ) === 1
        );
      },
      [emergencyPath]
    );

  // ==============================================================
  // ROUTE INSTRUCTIONS
  // ==============================================================

  const instructions =
    useMemo(() => {
      if (
        navigationPath.length <
        2
      ) {
        return [];
      }

      const nodes =
        navigationPath
          .map((id) =>
            waypoints.find(
              (wp) =>
                wp.id === id
            )
          )
          .filter(Boolean);

      if (
        nodes.length < 2
      ) {
        return [];
      }

      const result = [];

      const first =
        nodes[0];

      const startRoom =
        rooms.find(
          (room) =>
            room.waypointId ===
            first.id
        );

      result.push({
        icon: "🚀",
        title: "Start",
        text: `Start at ${
          startRoom?.name ||
          "Current Location"
        } (${first.floor})`
      });

      for (
        let i = 0;
        i < nodes.length - 1;
        i++
      ) {
        const current =
          nodes[i];

        const next =
          nodes[i + 1];

        // --------------------------------------------------------
        // FLOOR CHANGE
        // --------------------------------------------------------

        if (
          current.floor !==
          next.floor
        ) {
          const room =
            rooms.find(
              (r) =>
                r.waypointId ===
                current.id
            );

          const type =
            room?.type ===
            "Elevator"
              ? "Elevator"
              : "Stairs";

          result.push({
            icon:
              type ===
              "Elevator"
                ? "🛗"
                : "🪜",

            title:
              `Take ${type}`,

            text:
              `Go from ${current.floor} to ${next.floor} via ${type}`
          });

          continue;
        }

        // --------------------------------------------------------
        // NORMAL WALK
        // --------------------------------------------------------

        const matchingEdge =
          edges.find(
            (edge) =>
              (
                edge.from ===
                  current.id &&
                edge.to ===
                  next.id
              ) ||
              (
                edge.from ===
                  next.id &&
                edge.to ===
                  current.id
              )
          );

        const distance =
          matchingEdge?.customDistance ??
          Math.hypot(
            next.x -
              current.x,
            next.y -
              current.y
          ) *
            PIXELS_TO_METERS;

        result.push({
          icon: "🚶",
          title: "Walk",
          text: `Walk ${formatDistanceMeters(
            distance
          )}`
        });
      }

      const last =
        nodes[nodes.length - 1];

      const destination =
        rooms.find(
          (room) =>
            room.waypointId ===
            last.id
        );

      result.push({
        icon: "🏁",
        title: "Destination",
        text: `Arrive at ${
          destination?.name ||
          "Destination"
        } (${last.floor})`
      });

      return result;
    }, [
      navigationPath,
      waypoints,
      rooms,
      edges
    ]);

  // ==============================================================
  // LOADING
  // ==============================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          background:
            "#07152f",
          color: "white",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          fontSize: 20
        }}
      >
        Loading building map...
      </div>
    );
  }

  // ==============================================================
  // ERROR
  // ==============================================================

  if (error) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          background:
            "#07152f",
          color: "white",
          padding: 40
        }}
      >
        <h2>
          Map Loading Error
        </h2>

        <p>{error}</p>

        <small>
          Building ID:{" "}
          {buildingId}
        </small>
      </div>
    );
  }

  if (!map) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          background:
            "#07152f",
          color: "white",
          padding: 40
        }}
      >
        Map not found.
      </div>
    );
  }

  // ==============================================================
  // CURRENT EMERGENCY EXIT
  // ==============================================================

  const emergencyExit =
    rooms.find(
      (room) =>
        room._id ===
        emergencyExitId
    );

  // ==============================================================
  // UI
  // ==============================================================

  return (
    <div
      style={{
        minHeight:
          "100vh",
        background:
          "#07152f",
        color: "white",
        padding:
          "25px"
      }}
    >
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div
        style={{
          marginBottom: 25
        }}
      >
        <h1
          style={{
            marginBottom: 5
          }}
        >
          {map.title ||
            map.name ||
            "Building Navigation"}
        </h1>

        <div
          style={{
            opacity: 0.7
          }}
        >
          Read-only public navigation
        </div>
      </div>

      {/* ========================================================
          ROUTE PANEL
      ======================================================== */}

      <div
        style={{
          background:
            "#101d3b",
          padding: 25,
          borderRadius: 16,
          marginBottom: 20,
          border:
            "1px solid #234579"
        }}
      >
        <h2>
          🧭 Find a Route
        </h2>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: 15,
            alignItems:
              "end"
          }}
        >
          {/* START */}

          <div>
            <label>
              <strong>
                Starting Point
              </strong>
            </label>

            <select
              value={
                startRoomId
              }
              onChange={(e) =>
                setStartRoomId(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                marginTop: 8,
                padding: 13,
                borderRadius:
                  8,
                background:
                  "#172b55",
                color:
                  "white",
                border:
                  "1px solid #4aa3ff"
              }}
            >
              <option value="">
                Select starting point
              </option>

              {rooms.map(
                (room) => (
                  <option
                    key={
                      room._id
                    }
                    value={
                      room._id
                    }
                  >
                    {getRoomIcon(
                      room
                    )}{" "}
                    {room.name ||
                      "Unnamed"}{" "}
                    —{" "}
                    {room.floor ||
                      "1st FLOOR"}
                  </option>
                )
              )}
            </select>
          </div>

          {/* DESTINATION */}

          <div>
            <label>
              <strong>
                Destination
              </strong>
            </label>

            <select
              value={
                destinationRoomId
              }
              onChange={(e) =>
                setDestinationRoomId(
                  e.target.value
                )
              }
              style={{
                width:
                  "100%",
                marginTop: 8,
                padding: 13,
                borderRadius:
                  8,
                background:
                  "#172b55",
                color:
                  "white",
                border:
                  "1px solid #4aa3ff"
              }}
            >
              <option value="">
                Select destination
              </option>

              {rooms.map(
                (room) => (
                  <option
                    key={
                      room._id
                    }
                    value={
                      room._id
                    }
                  >
                    {getRoomIcon(
                      room
                    )}{" "}
                    {room.name ||
                      "Unnamed"}{" "}
                    —{" "}
                    {room.floor ||
                      "1st FLOOR"}
                  </option>
                )
              )}
            </select>
          </div>

          {/* FIND */}

          <button
            onClick={
              handleFindRoute
            }
            disabled={
              !startRoomId ||
              !destinationRoomId
            }
            style={{
              padding:
                "13px 20px",
              borderRadius:
                8,
              border:
                "none",
              background:
                "#22c7f2",
              color:
                "white",
              fontWeight:
                "bold",
              cursor:
                !startRoomId ||
                !destinationRoomId
                  ? "not-allowed"
                  : "pointer"
            }}
          >
            🧭 Find Route
          </button>
        </div>

        {/* ======================================================
            ACCESSIBILITY
        ====================================================== */}

        <div
          style={{
            display:
              "flex",
            gap: 10,
            flexWrap:
              "wrap",
            marginTop: 18
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={
                accessibilityPrefs.wheelchair
              }
              onChange={(e) =>
                setAccessibilityPrefs(
                  (prev) => ({
                    ...prev,
                    wheelchair:
                      e.target.checked
                  })
                )
              }
            />{" "}
            ♿ Accessible
          </label>

          <label>
            <input
              type="checkbox"
              checked={
                accessibilityPrefs.avoidStairs
              }
              onChange={(e) =>
                setAccessibilityPrefs(
                  (prev) => ({
                    ...prev,
                    avoidStairs:
                      e.target.checked
                  })
                )
              }
            />{" "}
            🪜 Avoid Stairs
          </label>

          <label>
            <input
              type="checkbox"
              checked={
                accessibilityPrefs.avoidElevators
              }
              onChange={(e) =>
                setAccessibilityPrefs(
                  (prev) => ({
                    ...prev,
                    avoidElevators:
                      e.target.checked
                  })
                )
              }
            />{" "}
            🛗 Avoid Elevators
          </label>

          <label>
            <input
              type="checkbox"
              checked={
                accessibilityPrefs.avoidNarrow
              }
              onChange={(e) =>
                setAccessibilityPrefs(
                  (prev) => ({
                    ...prev,
                    avoidNarrow:
                      e.target.checked
                  })
                )
              }
            />{" "}
            Avoid Narrow Paths
          </label>
        </div>

        {/* ======================================================
            ROUTE ERROR
        ====================================================== */}

        {routeError && (
          <div
            style={{
              marginTop: 18,
              padding: 15,
              borderRadius: 9,
              background:
                "#421b25",
              border:
                "1px solid #ef4444",
              color:
                "#fecaca"
            }}
          >
            ⚠️{" "}
            {routeError}
          </div>
        )}

        {/* ======================================================
            ROUTE FOUND
        ====================================================== */}

        {navigationPath.length >
          0 && (
          <div
            style={{
              marginTop: 20,
              padding: 18,
              borderRadius: 12,
              background:
                "#102d45",
              border:
                "1px solid #22c7f2"
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                flexWrap:
                  "wrap",
                gap: 10
              }}
            >
              <div>
                <h3>
                  ✅ Route Found
                </h3>

                <div>
                  📏{" "}
                  {formatDistanceMeters(
                    totalDistance
                  )}{" "}
                  • ⏱️{" "}
                  {formatTime(
                    routeSeconds
                  )}
                </div>
              </div>

              <button
                onClick={
                  clearRoute
                }
                style={{
                  background:
                    "#7f1d1d",
                  color:
                    "white",
                  border:
                    "1px solid #ef4444",
                  borderRadius:
                    7,
                  padding:
                    "8px 13px"
                }}
              >
                ✕ Clear Route
              </button>
            </div>

            {/* ROUTE OPTIONS */}

            {routeOptions.length >
              0 && (
              <div
                style={{
                  display:
                    "flex",
                  gap: 8,
                  flexWrap:
                    "wrap",
                  marginTop: 15
                }}
              >
                {routeOptions.map(
                  (option) => (
                    <button
                      key={
                        option.id
                      }
                      onClick={() =>
                        selectRouteOption(
                          option
                        )
                      }
                      style={{
                        padding:
                          "8px 12px",
                        borderRadius:
                          8,
                        border:
                          "1px solid #4aa3ff",
                        background:
                          selectedRouteOption ===
                          option.id
                            ? "#22c7f2"
                            : "#172b55",
                        color:
                          "white"
                      }}
                    >
                      {
                        option.icon
                      }{" "}
                      {
                        option.label
                      }{" "}
                      •{" "}
                      {formatDistanceMeters(
                        option.distance
                      )}
                    </button>
                  )
                )}
              </div>
            )}

            {/* INSTRUCTIONS */}

            {instructions.length >
              0 && (
              <div
                style={{
                  marginTop: 18
                }}
              >
                <h4>
                  🧭 Directions
                </h4>

                {instructions.map(
                  (
                    instruction,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      style={{
                        display:
                          "flex",
                        gap: 10,
                        padding:
                          "9px 0",
                        borderBottom:
                          "1px solid rgba(255,255,255,.08)"
                      }}
                    >
                      <span>
                        {
                          instruction.icon
                        }
                      </span>

                      <div>
                        <strong>
                          {
                            instruction.title
                          }
                        </strong>

                        <div
                          style={{
                            opacity:
                              0.75
                          }}
                        >
                          {
                            instruction.text
                          }
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* SIMULATION */}

            {navigationPath.length >
              1 && (
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 15,
                  borderTop:
                    "1px solid #334155"
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    gap: 10,
                    alignItems:
                      "center",
                    flexWrap:
                      "wrap"
                  }}
                >
                  <button
                    onClick={() => {
                      if (
                        simulationProgress >=
                        1
                      ) {
                        setSimulationProgress(
                          0
                        );
                      }

                      setIsSimulating(
                        (prev) =>
                          !prev
                      );
                    }}
                    style={{
                      padding:
                        "9px 15px",
                      borderRadius:
                        8,
                      border:
                        "none",
                      background:
                        "#22c55e",
                      color:
                        "white",
                      fontWeight:
                        "bold"
                    }}
                  >
                    {isSimulating
                      ? "⏸ Pause"
                      : simulationProgress >=
                        1
                      ? "🔄 Replay"
                      : "▶ Simulate Route"}
                  </button>

                  <button
                    onClick={() => {
                      setIsSimulating(
                        false
                      );

                      setSimulationProgress(
                        0
                      );
                    }}
                    style={{
                      padding:
                        "9px 15px",
                      borderRadius:
                        8,
                      border:
                        "1px solid #64748b",
                      background:
                        "#172b55",
                      color:
                        "white"
                    }}
                  >
                    ⏹ Reset
                  </button>

                  <select
                    value={
                      simSpeed
                    }
                    onChange={(e) =>
                      setSimSpeed(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    style={{
                      padding:
                        "8px",
                      borderRadius:
                        7,
                      background:
                        "#172b55",
                      color:
                        "white"
                    }}
                  >
                    <option value="0.5">
                      0.5x
                    </option>

                    <option value="1">
                      1x
                    </option>

                    <option value="2">
                      2x
                    </option>

                    <option value="4">
                      4x
                    </option>
                  </select>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={
                    simulationProgress
                  }
                  onChange={(e) => {
                    setIsSimulating(
                      false
                    );

                    setSimulationProgress(
                      Number(
                        e.target.value
                      )
                    );
                  }}
                  style={{
                    width:
                      "100%",
                    marginTop: 12
                  }}
                />

                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.7
                  }}
                >
                  Simulation:{" "}
                  {Math.round(
                    simulationProgress *
                      100
                  )}
                  %
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          EMERGENCY CENTER
      ======================================================== */}

      <div
        style={{
          background:
            emergencyMode
              ? "#5b1b25"
              : "#3b1822",
          border:
            "1px solid #ef4444",
          padding: 20,
          borderRadius: 14,
          marginBottom: 20
        }}
      >
        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center"
          }}
        >
          <div>
            <h2>
              🚨 Emergency Evacuation
            </h2>

            <div
              style={{
                opacity: 0.8
              }}
            >
              Find the nearest reachable emergency exit,
              including routes across floors.
            </div>
          </div>

          {emergencyMode && (
            <span
              style={{
                background:
                  "#dc2626",
                padding:
                  "6px 10px",
                borderRadius:
                  20,
                fontWeight:
                  "bold"
              }}
            >
              ACTIVE
            </span>
          )}
        </div>

        <div
          style={{
            display:
              "flex",
            gap: 10,
            marginTop: 15,
            flexWrap:
              "wrap"
          }}
        >
          <select
            value={
              emergencyType
            }
            onChange={(e) =>
              setEmergencyType(
                e.target.value
              )
            }
            style={{
              padding:
                "10px",
              borderRadius:
                8,
              background:
                "#172b55",
              color:
                "white",
              border:
                "1px solid #ef4444"
            }}
          >
            <option value="evacuation">
              🚨 Emergency Evacuation
            </option>

            <option value="fire">
              🔥 Fire Emergency — Fire Exits Only
            </option>
          </select>

          <button
            onClick={
              runEmergencyEvacuation
            }
            style={{
              padding:
                "10px 18px",
              borderRadius:
                8,
              border:
                "none",
              background:
                "#ef4444",
              color:
                "white",
              fontWeight:
                "bold"
            }}
          >
            🚨 Route to Emergency Exit
          </button>

          {emergencyMode && (
            <button
              onClick={
                stopEmergency
              }
              style={{
                padding:
                  "10px 18px",
                borderRadius:
                  8,
                border:
                  "1px solid white",
                background:
                  "transparent",
                color:
                  "white"
              }}
            >
              Stop Emergency Mode
            </button>
          )}
        </div>

        {emergencyMode &&
          emergencyExit && (
            <div
              style={{
                marginTop: 15,
                padding: 15,
                background:
                  "#111827",
                borderRadius: 10
              }}
            >
              <strong>
                {emergencyStatus}
              </strong>

              <div
                style={{
                  marginTop: 7
                }}
              >
                🚪 Nearest safe exit:{" "}
                <strong>
                  {
                    emergencyExit.name
                  }
                </strong>
              </div>

              <div
                style={{
                  marginTop: 5,
                  color:
                    "#fbbf24"
                }}
              >
                📏{" "}
                {formatDistanceMeters(
                  emergencyDistance
                )}{" "}
                • ⏱️{" "}
                {formatTime(
                  emergencyTimeSeconds
                )}
              </div>
            </div>
          )}
      </div>

      {/* ========================================================
          FLOOR SELECTOR
      ======================================================== */}

      <div
        style={{
          background:
            "#101d3b",
          padding: 15,
          borderRadius: 12,
          marginBottom: 20,
          display:
            "flex",
          gap: 10,
          alignItems:
            "center",
          flexWrap:
            "wrap"
        }}
      >
        <strong>
          Floor:
        </strong>

        {floors.map(
          (floor) => (
            <button
              key={floor}
              onClick={() => {
                setSelectedFloor(
                  floor
                );
              }}
              style={{
                padding:
                  "10px 18px",
                borderRadius:
                  8,
                border:
                  "1px solid #4aa3ff",
                background:
                  selectedFloor ===
                  floor
                    ? "#22c7f2"
                    : "#172b55",
                color:
                  "white",
                fontWeight:
                  "bold"
              }}
            >
              {floor}
            </button>
          )
        )}
      </div>

      {/* ========================================================
          MAP CONTROLS
      ======================================================== */}

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "flex-end",
          gap: 10,
          marginBottom: 10
        }}
      >
        <button
          onClick={() =>
            setShowConnections(
              (v) => !v
            )
          }
          style={{
            padding:
              "8px 13px",
            borderRadius:
              7,
            border:
              "1px solid #475569",
            background:
              "#172b55",
            color:
              "white"
          }}
        >
          🔗{" "}
          {showConnections
            ? "Hide Connections"
            : "Show Connections"}
        </button>

        <button
          onClick={() =>
            setShowWaypoints(
              (v) => !v
            )
          }
          style={{
            padding:
              "8px 13px",
            borderRadius:
              7,
            border:
              "1px solid #475569",
            background:
              "#172b55",
            color:
              "white"
          }}
        >
          📍{" "}
          {showWaypoints
            ? "Hide Waypoints"
            : "Show Waypoints"}
        </button>
      </div>

      {/* ========================================================
          MAP
      ======================================================== */}

      <div
        style={{
          background:
            "#101d3b",
          padding: 20,
          borderRadius: 15
        }}
      >
        <h2>
          {selectedFloor}{" "}
          <span
            style={{
              fontSize: 14,
              opacity: 0.7
            }}
          >
            Read-only public view
          </span>
        </h2>

        <div
          style={{
            width:
              "100%",
            overflow:
              "auto",
            background:
              "#081936",
            borderRadius:
              12,
            border:
              "1px solid #234579"
          }}
        >
          <div
            style={{
              position:
                "relative",
              width:
                floorSize.width,
              height:
                floorSize.height,
              minWidth:
                floorSize.width,
              minHeight:
                floorSize.height,
              background:
                "#081936",
              overflow:
                "hidden"
            }}
          >
            {/* ==================================================
                FLOOR GRID
            ================================================== */}

            <div
              style={{
                position:
                  "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
                backgroundSize:
                  "25px 25px",
                pointerEvents:
                  "none"
              }}
            />

            {/* ==================================================
                EDGES / CONNECTIONS
            ================================================== */}

            {showConnections && (
              <svg
                width={
                  floorSize.width
                }
                height={
                  floorSize.height
                }
                style={{
                  position:
                    "absolute",
                  left: 0,
                  top: 0,
                  zIndex: 1,
                  pointerEvents:
                    "none"
                }}
              >
                {edges.map(
                  (
                    edge,
                    index
                  ) => {
                    const w1 =
                      waypoints.find(
                        (wp) =>
                          wp.id ===
                          edge.from
                      );

                    const w2 =
                      waypoints.find(
                        (wp) =>
                          wp.id ===
                          edge.to
                      );

                    if (
                      !w1 ||
                      !w2
                    ) {
                      return null;
                    }

                    const visible =
                      w1.floor ===
                        selectedFloor ||
                      w2.floor ===
                        selectedFloor;

                    if (
                      !visible
                    ) {
                      return null;
                    }

                    const blocked =
                      isSafetyEdgeBlocked(
                        edge.from,
                        edge.to
                      );

                    const route =
                      isRouteSegment(
                        edge.from,
                        edge.to
                      );

                    const emergencyRoute =
                      isEmergencySegment(
                        edge.from,
                        edge.to
                      );

                    const crossFloor =
                      Boolean(
                        edge.isCrossFloor
                      );

                    return (
                      <line
                        key={
                          `edge-${index}`
                        }
                        x1={
                          w1.x
                        }
                        y1={
                          w1.y
                        }
                        x2={
                          w2.x
                        }
                        y2={
                          w2.y
                        }
                        stroke={
                          blocked
                            ? "#ef4444"
                            : emergencyRoute
                            ? "#22c55e"
                            : route
                            ? "#38bdf8"
                            : crossFloor
                            ? "#a855f7"
                            : "#64748b"
                        }
                        strokeWidth={
                          blocked ||
                          emergencyRoute
                            ? 7
                            : route
                            ? 5
                            : crossFloor
                            ? 4
                            : 2
                        }
                        strokeDasharray={
                          blocked
                            ? "10 6"
                            : route ||
                              crossFloor
                            ? "7 5"
                            : undefined
                        }
                      />
                    );
                  }
                )}
              </svg>
            )}

            {/* ==================================================
                ROOMS
            ================================================== */}

            {currentRooms.map(
              (room) => {
                const blocked =
                  blockedRoomIds.includes(
                    room._id
                  );

                const isStart =
                  String(
                    room._id
                  ) ===
                  String(
                    startRoomId
                  );

                const isDestination =
                  String(
                    room._id
                  ) ===
                  String(
                    destinationRoomId
                  );

                const isEmergencyExit =
                  String(
                    room._id
                  ) ===
                  String(
                    emergencyExitId
                  );

                const onEmergencyPath =
                  emergencyPath.includes(
                    room.waypointId
                  );

                const onRoute =
                  navigationPath.includes(
                    room.waypointId
                  );

                return (
                  <div
                    key={
                      room._id
                    }
                    style={{
                      position:
                        "absolute",

                      left:
                        Number(
                          room.x || 0
                        ),

                      top:
                        Number(
                          room.y || 0
                        ),

                      width:
                        Number(
                          room.width ||
                            120
                        ),

                      height:
                        Number(
                          room.height ||
                            80
                        ),

                      backgroundColor:
                        blocked
                          ? "#7f1d1d"
                          : room.bgColor ||
                            "#ffffff",

                      color:
                        "#111",

                      border:
                        blocked
                          ? "3px solid #ef4444"
                          : isEmergencyExit
                          ? "4px solid #22c55e"
                          : isDestination
                          ? "4px solid #ef4444"
                          : isStart
                          ? "4px solid #22c55e"
                          : onEmergencyPath
                          ? "4px solid #22c55e"
                          : onRoute
                          ? "3px solid #38bdf8"
                          : `1px solid ${
                              room.borderColor ||
                              "#475569"
                            }`,

                      borderRadius:
                        8,

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      flexDirection:
                        "column",

                      textAlign:
                        "center",

                      padding:
                        5,

                      boxSizing:
                        "border-box",

                      transform:
                        `rotate(${Number(
                          room.rotation ||
                            0
                        )}deg)`,

                      zIndex:
                        onRoute ||
                        onEmergencyPath
                          ? 6
                          : 2,

                      opacity:
                        emergencyMode &&
                        !onEmergencyPath &&
                        !blocked
                          ? 0.35
                          : 1,

                      boxShadow:
                        onRoute ||
                        onEmergencyPath
                          ? "0 0 15px rgba(56,189,248,.55)"
                          : "0 3px 8px rgba(0,0,0,.25)"
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          18
                      }}
                    >
                      {getRoomIcon(
                        room
                      )}
                    </div>

                    <strong
                      style={{
                        fontSize:
                          12
                      }}
                    >
                      {
                        room.name
                      }
                    </strong>

                    {blocked && (
                      <span
                        style={{
                          fontSize:
                            9,
                          color:
                            "#fecaca",
                          fontWeight:
                            "bold"
                        }}
                      >
                        🚧 BLOCKED
                      </span>
                    )}

                    {isStart && (
                      <span
                        style={{
                          fontSize:
                            9,
                          color:
                            "#166534",
                          fontWeight:
                            "bold"
                        }}
                      >
                        START
                      </span>
                    )}

                    {isDestination && (
                      <span
                        style={{
                          fontSize:
                            9,
                          color:
                            "#991b1b",
                          fontWeight:
                            "bold"
                        }}
                      >
                        DESTINATION
                      </span>
                    )}

                    {isEmergencyExit && (
                      <span
                        style={{
                          fontSize:
                            9,
                          color:
                            "#166534",
                          fontWeight:
                            "bold"
                        }}
                      >
                        SAFE EXIT
                      </span>
                    )}
                  </div>
                );
              }
            )}

            {/* ==================================================
                WAYPOINTS
            ================================================== */}

            {showWaypoints &&
              currentWaypoints.map(
                (wp) => {
                  const blocked =
                    isNodeSafetyBlocked(
                      wp.id
                    );

                  const routeNode =
                    navigationPath.includes(
                      wp.id
                    );

                  const emergencyNode =
                    emergencyPath.includes(
                      wp.id
                    );

                  const isCrossFloor =
                    edges.some(
                      (edge) =>
                        edge.isCrossFloor &&
                        (
                          edge.from ===
                            wp.id ||
                          edge.to ===
                            wp.id
                        )
                    );

                  const room =
                    getParentRoomForNode(
                      wp.id
                    );

                  return (
                    <div
                      key={
                        wp.id
                      }
                      title={
                        room?.name ||
                        "Waypoint"
                      }
                      style={{
                        position:
                          "absolute",

                        left:
                          Number(
                            wp.x
                          ) - 7,

                        top:
                          Number(
                            wp.y
                          ) - 7,

                        width:
                          14,

                        height:
                          14,

                        borderRadius:
                          "50%",

                        background:
                          blocked
                            ? "#ef4444"
                            : emergencyNode
                            ? "#22c55e"
                            : routeNode
                            ? "#38bdf8"
                            : isCrossFloor
                            ? "#a855f7"
                            : "#22c55e",

                        border:
                          "2px solid white",

                        zIndex:
                          8,

                        boxShadow:
                          routeNode ||
                          emergencyNode
                            ? "0 0 12px rgba(56,189,248,.9)"
                            : "none"
                      }}
                    />
                  );
                }
              )}

            {/* ==================================================
                YOU ARE HERE
            ================================================== */}

            {simulationPosition &&
              simulationPosition.floor ===
                selectedFloor && (
                <div
                  style={{
                    position:
                      "absolute",

                    left:
                      simulationPosition.x -
                      14,

                    top:
                      simulationPosition.y -
                      14,

                    width:
                      28,

                    height:
                      28,

                    borderRadius:
                      "50%",

                    background:
                      "#f59e0b",

                    border:
                      "3px solid white",

                    boxShadow:
                      "0 0 18px #f59e0b",

                    zIndex:
                      30,

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      15
                  }}
                >
                  🚶
                </div>
              )}

            {/* ==================================================
                CURRENT LOCATION
            ================================================== */}

            {!isSimulating &&
              currentLocationNodeId &&
              (() => {
                const node =
                  waypoints.find(
                    (wp) =>
                      wp.id ===
                      currentLocationNodeId
                  );

                if (
                  !node ||
                  node.floor !==
                    selectedFloor
                ) {
                  return null;
                }

                return (
                  <div
                    style={{
                      position:
                        "absolute",

                      left:
                        node.x -
                        12,

                      top:
                        node.y -
                        12,

                      width:
                        24,

                      height:
                        24,

                      borderRadius:
                        "50%",

                      background:
                        "#22c55e",

                      border:
                        "3px solid white",

                      boxShadow:
                        "0 0 15px #22c55e",

                      zIndex:
                        25,

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center"
                    }}
                  >
                    📍
                  </div>
                );
              })()}
          </div>
        </div>
      </div>

      {/* ========================================================
          BLOCKED PATH LEGEND
      ======================================================== */}

      {(blockedEdgeKeys.length >
        0 ||
        blockedRoomIds.length >
          0 ||
        blockedNodeIds.length >
          0) && (
        <div
          style={{
            marginTop: 20,
            background:
              "#2b1720",
            border:
              "1px solid #ef4444",
            padding: 15,
            borderRadius: 10
          }}
        >
          <strong>
            🚧 Safety Information
          </strong>

          <div
            style={{
              marginTop: 7,
              opacity: 0.8
            }}
          >
            Some paths or locations have been
            marked unavailable by the building
            administrator. Routes automatically
            avoid these blocked areas.
          </div>

          <div
            style={{
              display:
                "flex",
              gap: 15,
              marginTop: 10,
              flexWrap:
                "wrap",
              fontSize: 13
            }}
          >
            {blockedEdgeKeys.length >
              0 && (
              <span>
                🔴{" "}
                {
                  blockedEdgeKeys.length
                }{" "}
                blocked paths
              </span>
            )}

            {blockedRoomIds.length >
              0 && (
              <span>
                🚫{" "}
                {
                  blockedRoomIds.length
                }{" "}
                blocked locations
              </span>
            )}

            {blockedNodeIds.length >
              0 && (
              <span>
                📍{" "}
                {
                  blockedNodeIds.length
                }{" "}
                blocked nodes
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          DATA SUMMARY
      ======================================================== */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
          marginTop: 20
        }}
      >
        <Stat
          icon="🏢"
          label="Rooms"
          value={
            rooms.length
          }
        />

        <Stat
          icon="📍"
          label="Waypoints"
          value={
            waypoints.length
          }
        />

        <Stat
          icon="🔗"
          label="Connections"
          value={
            edges.length
          }
        />

        <Stat
          icon="🏬"
          label="Floors"
          value={
            floors.length
          }
        />
      </div>
    </div>
  );
}

// ================================================================
// STAT CARD
// ================================================================

function Stat({
  icon,
  label,
  value
}) {
  return (
    <div
      style={{
        background:
          "#172b55",
        padding: 18,
        borderRadius: 12,
        border:
          "1px solid #294777"
      }}
    >
      <div
        style={{
          fontSize: 22
        }}
      >
        {icon}
      </div>

      <div
        style={{
          opacity: 0.7,
          fontSize: 13
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight:
            "bold"
        }}
      >
        {value}
      </div>
    </div>
  );
}