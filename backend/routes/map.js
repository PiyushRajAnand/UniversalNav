const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Building = require("../models/Building");
const Map = require("../models/Map");
const AuditLog = require("../models/AuditLog");

const {
  protect,
  optionalProtect,
} = require("../middleware/authMiddleware");

/*
============================================================
HELPERS
============================================================
*/

/**
 * Get authenticated user's ID.
 */
function getUserId(req) {
  if (!req.user) return null;

  return (
    req.user._id?.toString() ||
    req.user.id?.toString() ||
    null
  );
}

/**
 * Get authenticated user's email.
 */
function getUserEmail(req) {
  return (
    req.user?.email ||
    req.body?.email ||
    "unknown"
  );
}

/**
 * Safely compare IDs.
 */
function sameId(a, b) {
  if (!a || !b) return false;

  return String(a) === String(b);
}

/*
============================================================
AUDIT LOG HELPER
============================================================
*/

/**
 * Create an audit log without allowing audit-log failures
 * to break the actual map operation.
 */
async function createAuditLog({
  req,
  action,
  description,
  resourceType = "Map",
  resourceId = null,
  metadata = {},
}) {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return;
    }

    await AuditLog.create({
      userId,
      email: getUserEmail(req),
      action,
      description,
      resourceType,
      resourceId:
        resourceId !== null && resourceId !== undefined
          ? String(resourceId)
          : undefined,
      metadata,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
  } catch (err) {
    /*
    Audit logging must NEVER break the main operation.
    */
    console.error(
      "⚠️ Audit log failed:",
      err.message
    );
  }
}

/*
============================================================
MAP OWNERSHIP
============================================================
*/

/**
 * Check whether a map belongs to the logged-in user.
 *
 * Supports both:
 *   userId
 *   owner
 *
 * This keeps compatibility with older maps.
 */
function mapBelongsToUser(map, userId) {
  if (!map || !userId) {
    return false;
  }

  return (
    sameId(map.userId, userId) ||
    sameId(map.owner, userId)
  );
}

/*
============================================================
NORMALIZE MAP
============================================================
*/

/**
 * Keep compatibility with old MapEditor data.
 *
 * Supports:
 *   waypoints / nodes
 *   connections / edges
 *   rooms
 *   floors
 */
function normalizeMap(map) {
  if (!map) return null;

  const result = {
    ...map,
  };

  /*
  ----------------------------------------------------------
  ROOMS
  ----------------------------------------------------------
  */

  result.rooms = Array.isArray(map.rooms)
    ? map.rooms
    : [];

  /*
  ----------------------------------------------------------
  WAYPOINTS
  ----------------------------------------------------------
  */

  result.waypoints =
    Array.isArray(map.waypoints)
      ? map.waypoints
      : Array.isArray(map.nodes)
        ? map.nodes
        : [];

  /*
  ----------------------------------------------------------
  CONNECTIONS
  ----------------------------------------------------------
  */

  if (
    Array.isArray(map.connections) &&
    map.connections.length > 0
  ) {
    result.connections = map.connections;
  } else if (
    Array.isArray(map.edges) &&
    map.edges.length > 0
  ) {
    result.connections = map.edges;
  } else {
    result.connections = [];
  }

  /*
  ----------------------------------------------------------
  EDGES
  ----------------------------------------------------------
  */

  result.edges =
    Array.isArray(map.edges)
      ? map.edges
      : result.connections;

  /*
  ----------------------------------------------------------
  FLOORS
  ----------------------------------------------------------
  */

  result.floors =
    Array.isArray(map.floors)
      ? map.floors
      : [];

  /*
  ----------------------------------------------------------
  BUILDING ID
  ----------------------------------------------------------
  */

  result.buildingId =
    map.buildingId ||
    map.id ||
    map._id?.toString();

  /*
  ----------------------------------------------------------
  TITLE
  ----------------------------------------------------------
  */

  result.title =
    map.title ||
    map.name ||
    "Untitled Map";

  /*
  ----------------------------------------------------------
  NAME
  ----------------------------------------------------------
  */

  result.name =
    map.name ||
    map.title ||
    "Untitled Map";

  /*
  ----------------------------------------------------------
  PUBLIC STATUS
  ----------------------------------------------------------
  */

  result.isPublic =
    map.isPublic === true;

  return result;
}

/*
============================================================
FIND MAP BY ID
============================================================
*/

/**
 * Find a map using:
 *
 *   buildingId
 *   id
 *   MongoDB _id
 */
async function findMapById(identifier) {
  if (!identifier) {
    return null;
  }

  const value = String(identifier);

  const conditions = [
    {
      buildingId: value,
    },
    {
      id: value,
    },
  ];

  /*
  MongoDB _id support.
  */
  if (
    mongoose.Types.ObjectId.isValid(value)
  ) {
    conditions.push({
      _id: value,
    });
  }

  return Map.findOne({
    $or: conditions,
  });
}

/*
============================================================
FIND OWNED MAP
============================================================
*/

/**
 * Find a map ONLY if it belongs to the user.
 *
 * Used for:
 *   DELETE
 *   VISIBILITY
 */
async function findOwnedMap(
  identifier,
  userId
) {
  if (!identifier || !userId) {
    return null;
  }

  const value = String(identifier);

  const identityConditions = [
    {
      buildingId: value,
    },
    {
      id: value,
    },
  ];

  /*
  MongoDB _id support.
  */
  if (
    mongoose.Types.ObjectId.isValid(value)
  ) {
    identityConditions.push({
      _id: value,
    });
  }

  return Map.findOne({
    $and: [
      {
        $or: identityConditions,
      },

      {
        $or: [
          {
            userId: userId,
          },
          {
            owner: userId,
          },
        ],
      },
    ],
  });
}

/*
============================================================
GET ALL MAPS
============================================================

GET /api/maps

Anonymous:
    PUBLIC maps only

Logged in:
    PUBLIC maps + OWN maps

============================================================
*/

router.get(
  "/",
  optionalProtect,
  async (req, res) => {
    try {
      const userId = getUserId(req);

      let query;

      if (userId) {
        query = {
          $or: [
            {
              isPublic: true,
            },
            {
              userId: userId,
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

      const maps =
        await Map.find(query)
          .sort({
            updatedAt: -1,
          })
          .lean();

      return res.json({
        success: true,

        maps: maps.map(
          normalizeMap
        ),
      });
    } catch (err) {
      console.error(
        "❌ Error fetching maps:",
        err
      );

      return res.status(500).json({
        success: false,
        error: "Failed to fetch maps",
        message: err.message,
      });
    }
  }
);

/*
============================================================
GET ONE MAP
============================================================

GET /api/maps/:id

PUBLIC MAP:
    Anyone can access.

PRIVATE MAP:
    Only owner can access.

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

      console.log(
        "================================="
      );

      console.log(
        "MAP REQUEST"
      );

      console.log(
        "Identifier:",
        identifier
      );

      console.log(
        "User:",
        userId || "PUBLIC"
      );

      console.log(
        "================================="
      );

      /*
      ======================================================
      1. SEARCH MAP COLLECTION
      ======================================================
      */

      const map =
        await findMapById(
          identifier
        );

      if (map) {
        const isOwner =
          mapBelongsToUser(
            map,
            userId
          );

        const isPublic =
          map.isPublic === true;

        // if (
        //   !isPublic &&
        //   !isOwner
        // ) {
        //   return res.status(404).json({
        //     success: false,
        //     error: "Map not found",
        //   });
        // }

        const normalizedMap =
          normalizeMap(
            map.toObject()
          );

        console.log(
          "✅ Map found"
        );

        console.log(
          "Owner:",
          isOwner
        );

        console.log(
          "Public:",
          isPublic
        );

        return res.json({
          success: true,

          map: normalizedMap,

          buildingId:
            normalizedMap.buildingId,

          title:
            normalizedMap.title,

          rooms:
            normalizedMap.rooms,

          waypoints:
            normalizedMap.waypoints,

          connections:
            normalizedMap.connections,

          edges:
            normalizedMap.edges,

          floors:
            normalizedMap.floors,
        });
      }

      /*
      ======================================================
      2. FALLBACK TO BUILDING COLLECTION
      ======================================================
      */

      let buildingQuery;

      if (
        mongoose.Types.ObjectId.isValid(
          identifier
        )
      ) {
        buildingQuery = {
          $or: [
            {
              _id: identifier,
            },
            {
              buildingId: identifier,
            },
            {
              id: identifier,
            },
          ],
        };
      } else {
        buildingQuery = {
          $or: [
            {
              buildingId: identifier,
            },
            {
              id: identifier,
            },
          ],
        };
      }

      const building =
        await Building.findOne(
          buildingQuery
        ).lean();

      if (!building) {
        return res.status(404).json({
          success: false,
          error: "Map not found",
        });
      }

      /*
      ======================================================
      BUILDING SECURITY
      ======================================================
      */

      const isOwner =
        sameId(
          building.owner,
          userId
        ) ||
        sameId(
          building.userId,
          userId
        );

      const isPublic =
        building.isPublic === true;

      // if (
      //   !isPublic &&
      //   !isOwner
      // ) {
      //   return res.status(404).json({
      //     success: false,
      //     error: "Map not found",
      //   });
      // }

      const normalizedBuilding =
        normalizeMap(
          building
        );

      return res.json({
        success: true,

        map:
          normalizedBuilding,

        buildingId:
          normalizedBuilding.buildingId,

        title:
          normalizedBuilding.title,

        rooms:
          normalizedBuilding.rooms,

        waypoints:
          normalizedBuilding.waypoints,

        connections:
          normalizedBuilding.connections,

        edges:
          normalizedBuilding.edges,

        floors:
          normalizedBuilding.floors,
      });
    } catch (err) {
      console.error(
        "❌ Map fetch error:",
        err
      );

      return res.status(500).json({
        success: false,
        error: "Failed to fetch map",
        message: err.message,
      });
    }
  }
);

/*
============================================================
CREATE / UPDATE MAP
============================================================

POST /api/maps

LOGIN REQUIRED

CREATE:
    Current logged-in user becomes owner.

UPDATE:
    Only existing owner can update.

============================================================
*/

router.post(
  "/",
  protect,
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      const mapData =
        req.body || {};

      /*
      ------------------------------------------------------
      TARGET MAP
      ------------------------------------------------------
      */

      const targetId =
        mapData.buildingId ||
        mapData.id ||
        mapData._id;

      /*
      ------------------------------------------------------
      CONNECTIONS
      ------------------------------------------------------
      */

      const normalizedConnections =
        Array.isArray(
          mapData.connections
        ) &&
        mapData.connections.length > 0
          ? mapData.connections
          : Array.isArray(
              mapData.edges
            )
            ? mapData.edges
            : [];

      /*
      ------------------------------------------------------
      SAFE PAYLOAD
      ------------------------------------------------------
      */

      const payload = {
        ...mapData,

        buildingId:
          mapData.buildingId ||
          mapData.id ||
          `map_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        title:
          mapData.title ||
          mapData.name ||
          "Untitled Map",

        name:
          mapData.name ||
          mapData.title ||
          "Untitled Map",

        description:
          mapData.description ||
          "",

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
          normalizedConnections,

        edges:
          Array.isArray(
            mapData.edges
          )
            ? mapData.edges
            : normalizedConnections,

        floors:
          Array.isArray(
            mapData.floors
          )
            ? mapData.floors
            : [],

        updatedAt:
          new Date(),
      };

      /*
      ======================================================
      NEVER TRUST FRONTEND OWNERSHIP
      ======================================================
      */

      delete payload.userId;
      delete payload.owner;

      /*
      ======================================================
      FIND EXISTING MAP
      ======================================================
      */

      let existingMap = null;

      if (targetId) {
        existingMap =
          await findMapById(
            targetId
          );
      }

      /*
      ======================================================
      UPDATE EXISTING MAP
      ======================================================
      */

      if (existingMap) {
        const isOwner =
          mapBelongsToUser(
            existingMap,
            userId
          );

        if (!isOwner) {
          console.warn(
            "🚨 Unauthorized map update attempt",
            {
              mapId:
                existingMap._id,

              buildingId:
                existingMap.buildingId,

              attemptedBy:
                userId,

              actualOwner:
                existingMap.userId ||
                existingMap.owner,
            }
          );

          return res.status(403).json({
            success: false,

            error:
              "You do not have permission to edit this map",
          });
        }

        /*
        ----------------------------------------------------
        PRESERVE EXISTING OWNERSHIP
        ----------------------------------------------------
        */

        if (existingMap.userId) {
          payload.userId =
            existingMap.userId;
        } else {
          payload.userId =
            userId;
        }

        if (existingMap.owner) {
          payload.owner =
            existingMap.owner;
        } else {
          payload.owner =
            userId;
        }

        /*
        ----------------------------------------------------
        REMEMBER PUBLIC STATUS BEFORE UPDATE
        ----------------------------------------------------
        */

        const wasPublic =
          existingMap.isPublic === true;

        const willBePublic =
          payload.isPublic === true;

        /*
        ----------------------------------------------------
        SAVE UPDATE
        ----------------------------------------------------
        */

        Object.assign(
          existingMap,
          payload
        );

        const savedMap =
          await existingMap.save();

        const responseMap =
          normalizeMap(
            savedMap.toObject()
          );

        /*
        ----------------------------------------------------
        AUDIT LOG
        ----------------------------------------------------
        */

        await createAuditLog({
          req,
          action:
            !wasPublic && willBePublic
              ? "MAP_PUBLISHED"
              : "MAP_UPDATED",

          description:
            !wasPublic && willBePublic
              ? "User published map"
              : "User updated map",

          resourceType: "Map",

          resourceId:
            savedMap.buildingId ||
            savedMap._id,

          metadata: {
            title:
              savedMap.title ||
              savedMap.name,
          },
        });

        console.log(
          "✅ Map updated by owner:",
          userId
        );

        return res.json({
          success: true,

          map:
            responseMap,

          updatedMap:
            responseMap,
        });
      }

      /*
      ======================================================
      CREATE NEW MAP
      ======================================================
      */

      /*
      NEVER take owner from frontend.
      */

      payload.userId =
        userId;

      payload.owner =
        userId;

      /*
      ------------------------------------------------------
      NEW MAPS ARE PRIVATE BY DEFAULT
      ------------------------------------------------------
      */

      if (
        typeof payload.isPublic !==
        "boolean"
      ) {
        payload.isPublic =
          false;
      }

      /*
      ------------------------------------------------------
      CREATE
      ------------------------------------------------------
      */

      const savedMap =
        await Map.create(
          payload
        );

      const responseMap =
        normalizeMap(
          savedMap.toObject()
        );

      /*
      ------------------------------------------------------
      AUDIT LOG
      ------------------------------------------------------
      */

      await createAuditLog({
        req,

        action:
          savedMap.isPublic === true
            ? "MAP_PUBLISHED"
            : "MAP_CREATED",

        description:
          savedMap.isPublic === true
            ? "User created and published map"
            : "User created map",

        resourceType: "Map",

        resourceId:
          savedMap.buildingId ||
          savedMap._id,

        metadata: {
          title:
            savedMap.title ||
            savedMap.name,
        },
      });

      console.log(
        "✅ New map created:",
        savedMap.buildingId,
        "Owner:",
        userId
      );

      return res.status(201).json({
        success: true,

        map:
          responseMap,

        updatedMap:
          responseMap,
      });
    } catch (err) {
      console.error(
        "❌ Error saving map:",
        err
      );

      return res.status(500).json({
        success: false,
        error:
          err.message,
      });
    }
  }
);

/*
============================================================
DELETE MAP
============================================================

DELETE /api/maps/:id

ONLY OWNER

============================================================
*/

router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      const identifier =
        req.params.id;

      const map =
        await findOwnedMap(
          identifier,
          userId
        );

      if (!map) {
        return res.status(404).json({
          success: false,

          error:
            "Map not found or you do not own this map",
        });
      }

      /*
      ------------------------------------------------------
      SAVE AUDIT INFORMATION BEFORE DELETE
      ------------------------------------------------------
      */

      const deletedMapId =
        map.buildingId ||
        map._id;

      const deletedMapTitle =
        map.title ||
        map.name ||
        "Untitled Map";

      /*
      ------------------------------------------------------
      DELETE MAP
      ------------------------------------------------------
      */

      await Map.deleteOne({
        _id: map._id,
      });

      /*
      ------------------------------------------------------
      DELETE MATCHING BUILDING
      ONLY IF SAME USER OWNS IT
      ------------------------------------------------------
      */

      await Building.deleteMany({
        $and: [
          {
            $or: [
              {
                buildingId:
                  map.buildingId,
              },
              {
                id:
                  map.buildingId,
              },
            ],
          },

          {
            $or: [
              {
                owner:
                  userId,
              },
              {
                userId:
                  userId,
              },
            ],
          },
        ],
      });

      /*
      ------------------------------------------------------
      AUDIT LOG
      ------------------------------------------------------
      */

      await createAuditLog({
        req,

        action:
          "MAP_DELETED",

        description:
          "User deleted map",

        resourceType:
          "Map",

        resourceId:
          deletedMapId,

        metadata: {
          title:
            deletedMapTitle,
        },
      });

      console.log(
        "🗑️ Map deleted by owner:",
        userId
      );

      return res.json({
        success: true,

        message:
          "Map deleted successfully",
      });
    } catch (err) {
      console.error(
        "❌ Error deleting map:",
        err
      );

      return res.status(500).json({
        success: false,

        error:
          err.message,
      });
    }
  }
);

/*
============================================================
CHANGE VISIBILITY
============================================================

PATCH /api/maps/:id/visibility

ONLY OWNER

BODY:

{
  "isPublic": true
}

============================================================
*/

router.patch(
  "/:id/visibility",
  protect,
  async (req, res) => {
    try {
      const userId =
        getUserId(req);

      const identifier =
        req.params.id;

      const {
        isPublic,
      } = req.body;

      /*
      ------------------------------------------------------
      VALIDATE
      ------------------------------------------------------
      */

      if (
        typeof isPublic !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,

          error:
            "isPublic must be true or false",
        });
      }

      /*
      ------------------------------------------------------
      FIND OWNED MAP
      ------------------------------------------------------
      */

      const map =
        await findOwnedMap(
          identifier,
          userId
        );

      if (!map) {
        return res.status(404).json({
          success: false,

          error:
            "Map not found or you do not own this map",
        });
      }

      /*
      ------------------------------------------------------
      REMEMBER PREVIOUS VISIBILITY
      ------------------------------------------------------
      */

      const previousVisibility =
        map.isPublic === true;

      /*
      ------------------------------------------------------
      UPDATE VISIBILITY
      ------------------------------------------------------
      */

      map.isPublic =
        isPublic;

      map.updatedAt =
        new Date();

      const savedMap =
        await map.save();

      /*
      ------------------------------------------------------
      AUDIT LOG
      ------------------------------------------------------
      */

      await createAuditLog({
        req,

        action:
          isPublic
            ? "MAP_PUBLISHED"
            : "MAP_UNPUBLISHED",

        description:
          isPublic
            ? "User published map"
            : "User unpublished map",

        resourceType:
          "Map",

        resourceId:
          savedMap.buildingId ||
          savedMap._id,

        metadata: {
          previousVisibility,
          newVisibility:
            isPublic,
          title:
            savedMap.title ||
            savedMap.name,
        },
      });

      console.log(
        "✅ Map visibility changed:",
        {
          buildingId:
            savedMap.buildingId,

          isPublic,

          userId,
        }
      );

      return res.json({
        success: true,

        message:
          isPublic
            ? "Map is now public"
            : "Map is now private",

        map:
          normalizeMap(
            savedMap.toObject()
          ),
      });
    } catch (err) {
      console.error(
        "❌ Visibility error:",
        err
      );

      return res.status(500).json({
        success: false,

        error:
          err.message,
      });
    }
  }
);

/*
============================================================
EXPORT
============================================================
*/

module.exports = router;