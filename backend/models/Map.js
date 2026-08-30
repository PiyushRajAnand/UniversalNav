const mongoose = require("mongoose");

const mapSchema = new mongoose.Schema(
  {
    /*
    ========================================================
    OWNER
    ========================================================

    userId is kept because existing MapEditor/database
    data may already use it.

    owner is also kept for compatibility with Building.
    ========================================================
    */

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },


    /*
    ========================================================
    MAP IDENTIFICATION
    ========================================================
    */

    buildingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    id: {
      type: String,
      index: true,
    },

    title: {
      type: String,
      default: "Untitled Map",
    },

    name: {
      type: String,
      default: "Untitled Map",
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "Other",
    },


    /*
    ========================================================
    STATUS
    ========================================================
    */

    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "archived",
        "completed",
      ],
      default: "draft",
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },


    /*
    ========================================================
    FLOOR INFORMATION
    ========================================================
    */

    totalFloors: {
      type: Number,
      default: 1,
    },

    floors: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    floorSize: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        width: 1100,
        height: 750,
      },
    },


    /*
    ========================================================
    ROOMS
    ========================================================
    */

    rooms: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },


    /*
    ========================================================
    WAYPOINTS / NODES
    ========================================================
    */

    waypoints: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    nodes: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },


    /*
    ========================================================
    CONNECTIONS / EDGES
    ========================================================
    */

    connections: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    edges: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },


    /*
    ========================================================
    BOUNDARIES
    ========================================================
    */

    boundaries: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    blockedEdges: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    blockedNodeIds: {
      type: [String],
      default: [],
    },


    /*
    ========================================================
    ACCESSIBILITY
    ========================================================
    */

    accessibilityPrefs: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        avoidStairs: false,
        avoidNarrowCorridors: false,
        minimizeWalking: false,
        avoidElevators: false,
        wheelchairAccessible: false,
      },
    },


    /*
    ========================================================
    GENERAL MAP DATA
    ========================================================
    */

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /*
    Preserve additional MapEditor data.
    */

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,

    /*
    IMPORTANT:
    Existing MapEditor fields are not silently removed.
    */

    strict: false,
  }
);


/*
============================================================
INDEXES
============================================================
*/

// mapSchema.index({ userId: 1 });
// mapSchema.index({ owner: 1 });
// mapSchema.index({ buildingId: 1 });
mapSchema.index({ status: 1 });
mapSchema.index({ isPublic: 1 });


module.exports = mongoose.model(
  "Map",
  mapSchema,
  "maps"
);