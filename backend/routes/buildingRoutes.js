const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Building = require("../models/Building");
const Map = require("../models/Map");

const Floor = require("../models/Floor");
const Room = require("../models/Room");
const Connection = require("../models/Connection");

const {
  protect,
  optionalProtect,
} = require("../middleware/authMiddleware");

const {
  findShortestPath,
} = require("../utils/dijkstra");


/*
============================================================
HELPERS
============================================================
*/


function isObjectId(value) {
  return (
    typeof value === "string" &&
    mongoose.Types.ObjectId.isValid(value)
  );
}


function getUserId(req) {
  if (!req.user) return null;

  return (
    req.user._id?.toString() ||
    req.user.id?.toString() ||
    null
  );
}


function sameId(a, b) {
  if (!a || !b) return false;

  return String(a) === String(b);
}


/*
============================================================
BUILDING OWNERSHIP
============================================================
*/

function buildingBelongsToUser(building, userId) {
  if (!building || !userId) {
    return false;
  }

  return (
    sameId(building.owner, userId) ||
    sameId(building.userId, userId)
  );
}


/*
============================================================
FIND BUILDING
============================================================
*/

async function findBuilding(identifier) {

  if (!identifier) {
    return null;
  }

  const value =
    String(identifier);


  let query;


  if (
    isObjectId(value)
  ) {

    query = {
      $or: [
        {
          _id: value,
        },

        {
          buildingId: value,
        },

        {
          id: value,
        },
      ],
    };

  } else {

    query = {
      $or: [
        {
          buildingId:
            value,
        },

        {
          id:
            value,
        },
      ],
    };
  }


  return Building.findOne(
    query
  );
}


/*
============================================================
GET /api/buildings

PUBLIC

Anonymous:
    public buildings

Logged in:
    public buildings + own buildings
============================================================
*/

router.get(
  "/",
  optionalProtect,
  async (req, res) => {

    try {

      const userId =
        getUserId(req);


      let query;


      if (userId) {

        query = {
          $or: [
            {
              isPublic: true,
            },

            {
              owner: userId,
            },
          ],
        };

      } else {

        query = {
          isPublic: true,
        };
      }


      const buildings =
        await Building.find(
          query
        )
          .sort({
            updatedAt: -1,
          })
          .lean();


      return res.json(
        buildings
      );

    } catch (error) {

      console.error(
        "Error fetching buildings:",
        error
      );


      return res.status(500).json({
        success: false,
        error:
          error.message,
      });
    }
  }
);


/*
============================================================
GET /api/buildings/dashboard

PUBLIC / OPTIONAL AUTH

Logged in:
    own + public

Anonymous:
    public only
============================================================
*/

router.get(
  "/dashboard",
  optionalProtect,
  async (req, res) => {

    try {

      const userId =
        getUserId(req);


      let query;


      if (userId) {

        query = {
          $or: [
            {
              isPublic: true,
            },

            {
              owner:
                userId,
            },
          ],
        };

      } else {

        query = {
          isPublic: true,
        };
      }


      const buildings =
        await Building.find(
          query
        )
          .sort({
            updatedAt: -1,
          })
          .lean();


      const buildingIds =
        buildings.map(
          (b) => b._id
        );


      const [
        collFloors,
        collRooms,
        collConnections,
      ] = await Promise.all([

        Floor.countDocuments({
          buildingId: {
            $in:
              buildingIds,
          },
        }),

        Room.countDocuments({
          buildingId: {
            $in:
              buildingIds,
          },
        }),

        Connection.countDocuments({
          buildingId: {
            $in:
              buildingIds,
          },
        }),
      ]);


      const embeddedFloors =
        buildings.reduce(
          (acc, b) =>
            acc +
            (b.floors?.length || 0),
          0
        );


      const embeddedRooms =
        buildings.reduce(
          (acc, b) =>
            acc +
            (b.rooms?.length || 0),
          0
        );


      const embeddedConnections =
        buildings.reduce(
          (acc, b) =>
            acc +
            (
              b.connections?.length ||
              b.edges?.length ||
              0
            ),
          0
        );


      const draftsCount =
        buildings.filter(
          (b) =>
            b.status === "draft" ||
            !b.status ||
            b.isDraft
        ).length;


      const publishedCount =
        buildings.filter(
          (b) =>
            b.status === "published" ||
            b.isPublished
        ).length;


      const archivedCount =
        buildings.filter(
          (b) =>
            b.status === "archived" ||
            b.isArchived
        ).length;


      return res.json({

        metrics: {

          totalBuildings:
            buildings.length,

          drafts:
            draftsCount,

          published:
            publishedCount,

          archived:
            archivedCount,

          totalFloors:
            Math.max(
              collFloors,
              embeddedFloors
            ),

          totalRooms:
            Math.max(
              collRooms,
              embeddedRooms
            ),

          totalConnections:
            Math.max(
              collConnections,
              embeddedConnections
            ),
        },

        buildings,

        maps:
          buildings,
      });

    } catch (error) {

      console.error(
        "Dashboard error:",
        error
      );


      return res.status(500).json({
        success: false,
        error:
          error.message,
      });
    }
  }
);


/*
============================================================
POST /api/buildings

LOGIN REQUIRED

CREATE:
    authenticated user owns building

UPDATE:
    only owner can update
============================================================
*/

router.post(
  "/",
  protect,
  async (req, res) => {

    try {

      const userId =
        getUserId(req);


      const mapData =
        req.body || {};


      /*
      NEVER TRUST FRONTEND OWNER
      */

      delete mapData.owner;
      delete mapData.userId;


      const buildingIdKey =
        mapData.buildingId ||
        mapData.id ||
        mapData._id;


      const payload = {
        ...mapData,

        name:
          mapData.name ||
          mapData.title ||
          "Untitled Map",

        title:
          mapData.title ||
          mapData.name ||
          "Untitled Map",

        status:
          mapData.status ||
          (
            mapData.isPublished
              ? "published"
              : "draft"
          ),

        floors:
          Array.isArray(
            mapData.floors
          )
            ? mapData.floors
            : [],

        rooms:
          Array.isArray(
            mapData.rooms
          )
            ? mapData.rooms
            : [],

        waypoints:
          Array.isArray(
            mapData.waypoints
          )
            ? mapData.waypoints
            : Array.isArray(
                mapData.nodes
              )
              ? mapData.nodes
              : [],

        connections:
          Array.isArray(
            mapData.connections
          )
            ? mapData.connections
            : Array.isArray(
                mapData.edges
              )
              ? mapData.edges
              : [],

        boundaries:
          Array.isArray(
            mapData.boundaries
          )
            ? mapData.boundaries
            : [],

        owner:
          userId,

        updatedAt:
          new Date(),
      };


      /*
      ======================================================
      UPDATE
      ======================================================
      */

      if (buildingIdKey) {

        let query;


        if (
          isObjectId(
            String(buildingIdKey)
          )
        ) {

          query = {
            $and: [

              {
                $or: [
                  {
                    _id:
                      buildingIdKey,
                  },

                  {
                    buildingId:
                      String(
                        buildingIdKey
                      ),
                  },

                  {
                    id:
                      String(
                        buildingIdKey
                      ),
                  },
                ],
              },

              {
                owner:
                  userId,
              },
            ],
          };

        } else {

          query = {
            $and: [

              {
                $or: [
                  {
                    buildingId:
                      String(
                        buildingIdKey
                      ),
                  },

                  {
                    id:
                      String(
                        buildingIdKey
                      ),
                  },
                ],
              },

              {
                owner:
                  userId,
              },
            ],
          };
        }


        const building =
          await Building.findOneAndUpdate(
            query,

            {
              $set:
                payload,
            },

            {
              new: true,
              runValidators: true,
            }
          );


        if (!building) {

          return res.status(404).json({
            success: false,

            error:
              "Building not found or access denied",
          });
        }


        console.log(
          "✅ Building updated by owner:",
          userId
        );


        return res.json({

          success: true,

          building,

          map:
            building,

          rooms:
            building.rooms ||
            [],

          waypoints:
            building.waypoints ||
            [],

          connections:
            building.connections ||
            [],

          floors:
            building.floors ||
            [],
        });
      }


      /*
      ======================================================
      CREATE
      ======================================================
      */

      const building =
        await Building.create({

          ...payload,

          owner:
            userId,
        });


      console.log(
        "✅ New building created:",
        building._id,
        "Owner:",
        userId
      );


      return res.status(201).json({

        success: true,

        building,

        map:
          building,

        rooms:
          building.rooms ||
          [],

        waypoints:
          building.waypoints ||
          [],

        connections:
          building.connections ||
          [],

        floors:
          building.floors ||
          [],
      });

    } catch (error) {

      console.error(
        "❌ Error saving building:",
        error
      );


      return res.status(400).json({
        success: false,
        error:
          error.message,
      });
    }
  }
);


/*
============================================================
POST /api/buildings/create

LOGIN REQUIRED
============================================================
*/

router.post(
  "/create",
  protect,
  async (req, res) => {

    try {

      const userId =
        getUserId(req);


      const {
        name,
        description,
        address,
        category,
        totalFloors,
      } = req.body;


      const floorCount =
        Number(totalFloors) > 0
          ? Number(totalFloors)
          : 1;


      const newBuilding =
        await Building.create({

          name:
            name ||
            "Untitled Map",

          title:
            name ||
            "Untitled Map",

          status:
            "draft",

          description,

          address,

          category:
            category ||
            "Other",

          totalFloors:
            floorCount,

          owner:
            userId,

          isPublic:
            false,
        });


      const floorPromises =
        [];


      for (
        let i = 0;
        i < floorCount;
        i++
      ) {

        floorPromises.push(
          Floor.create({

            buildingId:
              newBuilding._id,

            level:
              i,

            name:
              i === 0
                ? "Ground Floor"
                : `Floor ${i}`,
          })
        );
      }


      await Promise.all(
        floorPromises
      );


      console.log(
        "✅ Building created:",
        newBuilding._id,
        "Owner:",
        userId
      );


      return res.status(201).json({

        success: true,

        building:
          newBuilding,
      });

    } catch (error) {

      console.error(
        "❌ Error creating building:",
        error
      );


      return res.status(400).json({
        success: false,
        error:
          error.message,
      });
    }
  }
);


/*
============================================================
GET /api/buildings/:id

PUBLIC

Public building:
    anyone

Private building:
    owner only
============================================================
*/

router.get(
  "/:id",
  optionalProtect,
  async (req, res) => {

    try {

      const identifier =
        req.params.id;


      const userId =
        getUserId(req);


      /*
      ======================================================
      FIRST: MAP COLLECTION
      ======================================================
      */

      const map =
        await Map.findOne({
          $or: [

            {
              buildingId:
                identifier,
            },

            {
              id:
                identifier,
            },

            ...(isObjectId(identifier)
              ? [
                  {
                    _id:
                      identifier,
                  },
                ]
              : []),
          ],
        }).lean();


      if (map) {

        const isOwner =
          sameId(
            map.userId,
            userId
          ) ||
          sameId(
            map.owner,
            userId
          );


        const isPublic =
          map.isPublic === true;


        if (
          !isPublic &&
          !isOwner
        ) {

          return res.status(404).json({
            success: false,
            error:
              "Building not found",
          });
        }


        return res.json({

          ...map,

          floors:
            map.floors ||
            [],

          rooms:
            map.rooms ||
            [],

          waypoints:
            map.waypoints ||
            map.nodes ||
            [],

          connections:
            map.connections ||
            map.edges ||
            [],

          boundaries:
            map.boundaries ||
            [],
        });
      }


      /*
      ======================================================
      SECOND: BUILDING COLLECTION
      ======================================================
      */

      const building =
        await findBuilding(
          identifier
        );


      if (!building) {

        return res.status(404).json({
          success: false,
          error:
            "Building not found",
        });
      }


      const isOwner =
        buildingBelongsToUser(
          building,
          userId
        );


      const isPublic =
        building.isPublic === true;


      if (
        !isPublic &&
        !isOwner
      ) {

        return res.status(404).json({
          success: false,
          error:
            "Building not found",
        });
      }


      /*
      ======================================================
      FETCH SUB-COLLECTIONS
      ======================================================
      */

      const [
        floors,
        rooms,
        connections,
      ] = await Promise.all([

        Floor.find({
          buildingId:
            building._id,
        })
          .sort({
            level: 1,
          })
          .lean(),

        Room.find({
          buildingId:
            building._id,
        }).lean(),

        Connection.find({
          buildingId:
            building._id,
        }).lean(),
      ]);


      return res.json({

        ...building,

        floors:
          floors.length > 0
            ? floors
            : building.floors ||
              [],

        rooms:
          rooms.length > 0
            ? rooms
            : building.rooms ||
              [],

        waypoints:
          building.waypoints ||
          building.nodes ||
          [],

        connections:
          connections.length > 0
            ? connections
            : (
                building.connections ||
                building.edges ||
                []
              ),
      });

    } catch (error) {

      console.error(
        "❌ Error fetching building:",
        error
      );


      return res.status(500).json({
        success: false,
        error:
          error.message,
      });
    }
  }
);


/*
============================================================
DELETE /api/buildings/:id

LOGIN REQUIRED

ONLY OWNER
============================================================
*/

router.delete(
  "/:id",
  protect,
  async (req, res) => {

    try {

      const identifier =
        req.params.id;


      const userId =
        getUserId(req);


      const building =
        await findBuilding(
          identifier
        );


      if (!building) {

        return res.status(404).json({
          success: false,
          error:
            "Building not found",
        });
      }


      /*
      IMPORTANT:
      Ownership checked BEFORE deletion.
      */

      if (
        !buildingBelongsToUser(
          building,
          userId
        )
      ) {

        return res.status(403).json({
          success: false,
          error:
            "You do not have permission to delete this building",
        });
      }


      /*
      ======================================================
      DELETE EVERYTHING BELONGING TO BUILDING
      ======================================================
      */

      await Promise.all([

        Building.deleteOne({
          _id:
            building._id,
        }),

        Map.deleteMany({
          $or: [

            {
              buildingId:
                building.buildingId,
            },

            {
              buildingId:
                building._id.toString(),
            },

            {
              id:
                building.id,
            },
          ],
        }),

        Floor.deleteMany({
          buildingId:
            building._id,
        }),

        Room.deleteMany({
          buildingId:
            building._id,
        }),

        Connection.deleteMany({
          buildingId:
            building._id,
        }),
      ]);


      console.log(
        "🗑️ Building deleted by owner:",
        userId
      );


      return res.json({

        success: true,

        message:
          "Building map and sub-resources deleted successfully",
      });

    } catch (error) {

      console.error(
        "❌ Error deleting building:",
        error
      );


      return res.status(500).json({
        success: false,
        error:
          error.message,
      });
    }
  }
);


/*
============================================================
POST /api/buildings/:id/navigate

PUBLIC

Navigation remains available without login.

Private maps are protected.
============================================================
*/

router.post(
  "/:id/navigate",
  optionalProtect,
  async (req, res) => {

    try {

      const buildingId =
        req.params.id;


      const userId =
        getUserId(req);


      const {
        startRoomId,
        targetRoomId,
        startWaypointId,
        targetWaypointId,
      } = req.body;


      /*
      ======================================================
      FIRST SEARCH MAP
      ======================================================
      */

      const map =
        await Map.findOne({
          $or: [

            {
              buildingId:
                buildingId,
            },

            {
              id:
                buildingId,
            },

            ...(isObjectId(buildingId)
              ? [
                  {
                    _id:
                      buildingId,
                  },
                ]
              : []),
          ],
        }).lean();


      if (map) {

        const isOwner =
          sameId(
            map.userId,
            userId
          ) ||
          sameId(
            map.owner,
            userId
          );


        const isPublic =
          map.isPublic === true;


        if (
          !isPublic &&
          !isOwner
        ) {

          return res.status(404).json({
            success: false,
            error:
              "Map not found",
          });
        }


        const rooms =
          Array.isArray(
            map.rooms
          )
            ? map.rooms
            : [];


        const connections =
          Array.isArray(
            map.connections
          ) &&
          map.connections.length > 0

            ? map.connections

            : Array.isArray(
                map.edges
              )
              ? map.edges
              : [];


        const waypoints =
          Array.isArray(
            map.waypoints
          )
            ? map.waypoints
            : Array.isArray(
                map.nodes
              )
              ? map.nodes
              : [];


        const startRoom =
          rooms.find(
            (room) =>
              String(
                room.id
              ) ===
                String(
                  startRoomId
                ) ||
              String(
                room._id
              ) ===
                String(
                  startRoomId
                )
          );


        const targetRoom =
          rooms.find(
            (room) =>
              String(
                room.id
              ) ===
                String(
                  targetRoomId
                ) ||
              String(
                room._id
              ) ===
                String(
                  targetRoomId
                )
          );


        const actualStartWaypoint =
          startWaypointId ||
          startRoom?.waypointId ||
          startRoom?.waypoint ||
          startRoomId;


        const actualTargetWaypoint =
          targetWaypointId ||
          targetRoom?.waypointId ||
          targetRoom?.waypoint ||
          targetRoomId;


        /*
        ====================================================
        BUILD GRAPH
        ====================================================
        */

        const graph = {};


        connections.forEach(
          (connection) => {

            const from =
              String(
                connection.from ||
                connection.source ||
                ""
              );


            const to =
              String(
                connection.to ||
                connection.target ||
                ""
              );


            if (!from || !to) {
              return;
            }


            if (!graph[from]) {
              graph[from] = [];
            }


            if (!graph[to]) {
              graph[to] = [];
            }


            graph[from].push({

              node:
                to,

              distance:
                Number(
                  connection.distance
                ) || 1,
            });


            graph[to].push({

              node:
                from,

              distance:
                Number(
                  connection.distance
                ) || 1,
            });
          }
        );


        /*
        ====================================================
        DIJKSTRA
        ====================================================
        */

        const distances = {};
        const previous = {};
        const visited = new Set();


        Object.keys(
          graph
        ).forEach(
          (node) => {

            distances[node] =
              Infinity;

            previous[node] =
              null;
          }
        );


        if (
          !Object.prototype.hasOwnProperty.call(
            distances,
            actualStartWaypoint
          )
        ) {

          distances[
            actualStartWaypoint
          ] = Infinity;

          previous[
            actualStartWaypoint
          ] = null;

          graph[
            actualStartWaypoint
          ] = [];
        }


        if (
          !Object.prototype.hasOwnProperty.call(
            distances,
            actualTargetWaypoint
          )
        ) {

          distances[
            actualTargetWaypoint
          ] = Infinity;

          previous[
            actualTargetWaypoint
          ] = null;

          graph[
            actualTargetWaypoint
          ] = [];
        }


        distances[
          actualStartWaypoint
        ] = 0;


        while (true) {

          let current = null;
          let smallest = Infinity;


          Object.keys(
            distances
          ).forEach(
            (node) => {

              if (
                !visited.has(node) &&
                distances[node] <
                  smallest
              ) {

                smallest =
                  distances[node];

                current =
                  node;
              }
            }
          );


          if (
            current === null
          ) {
            break;
          }


          if (
            current ===
            actualTargetWaypoint
          ) {
            break;
          }


          visited.add(
            current
          );


          const neighbours =
            graph[current] ||
            [];


          neighbours.forEach(
            (edge) => {

              const newDistance =
                distances[current] +
                edge.distance;


              if (
                newDistance <
                distances[
                  edge.node
                ]
              ) {

                distances[
                  edge.node
                ] =
                  newDistance;

                previous[
                  edge.node
                ] =
                  current;
              }
            }
          );
        }


        /*
        ====================================================
        RECONSTRUCT PATH
        ====================================================
        */

        const path = [];


        let current =
          actualTargetWaypoint;


        if (
          current ===
          actualStartWaypoint
        ) {

          path.push(
            current
          );

        } else {

          while (
            current !== null &&
            current !== undefined
          ) {

            path.unshift(
              current
            );


            if (
              current ===
              actualStartWaypoint
            ) {
              break;
            }


            current =
              previous[current];
          }
        }


        /*
        ====================================================
        VALIDATE PATH
        ====================================================
        */

        const hasPath =
          path.length > 0 &&
          String(path[0]) ===
            String(
              actualStartWaypoint
            ) &&
          String(
            path[path.length - 1]
          ) ===
            String(
              actualTargetWaypoint
            );


        if (!hasPath) {

          return res.status(404).json({
            success: false,

            error:
              "No connections are available between the selected waypoints.",
          });
        }


        /*
        ====================================================
        WAYPOINT OBJECTS
        ====================================================
        */

        const routeWaypoints =
          path.map(
            (waypointId) => {

              return (
                waypoints.find(
                  (wp) =>
                    String(
                      wp.id ||
                      wp._id
                    ) ===
                    String(
                      waypointId
                    )
                ) || {
                  id:
                    waypointId,
                }
              );
            }
          );


        return res.json({

          success: true,

          distance:
            distances[
              actualTargetWaypoint
            ],

          path,

          waypoints:
            routeWaypoints,

          startWaypointId:
            actualStartWaypoint,

          targetWaypointId:
            actualTargetWaypoint,

          startRoom:
            startRoom || null,

          targetRoom:
            targetRoom || null,

          connectionsUsed:
            connections,
        });
      }


      /*
      ======================================================
      FALLBACK TO BUILDING
      ======================================================
      */

      const building =
        await findBuilding(
          buildingId
        );


      if (!building) {

        return res.status(404).json({
          success: false,
          error:
            "Building not found",
        });
      }


      const isOwner =
        buildingBelongsToUser(
          building,
          userId
        );


      const isPublic =
        building.isPublic === true;


      if (
        !isPublic &&
        !isOwner
      ) {

        return res.status(404).json({
          success: false,
          error:
            "Building not found",
        });
      }


      let rooms =
        building.rooms ||
        [];


      let connections =
        building.connections ||
        building.edges ||
        [];


      if (
        connections.length === 0
      ) {

        connections =
          await Connection.find({
            buildingId:
              building._id,
          }).lean();
      }


      if (
        rooms.length === 0
      ) {

        rooms =
          await Room.find({
            buildingId:
              building._id,
          }).lean();
      }


      const result =
        findShortestPath(
          rooms,
          connections,
          startRoomId,
          targetRoomId
        );


      return res.json({

        success: true,

        ...result,
      });

    } catch (error) {

      console.error(
        "❌ Navigation error:",
        error
      );


      return res.status(500).json({
        success: false,

        error:
          error.message,
      });
    }
  }
);


module.exports = router;