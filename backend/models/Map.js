const mongoose = require("mongoose");

const mapSchema = new mongoose.Schema(
  {
    /*
    ========================================================
    OWNER
    ========================================================

    Both userId and owner are intentionally preserved for
    compatibility with existing UniversalNav data.
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
      trim: true,
    },

    id: {
      type: String,
      index: true,
      trim: true,
    },

    title: {
      type: String,
      default: "Untitled Map",
      trim: true,
      maxlength: 200,
    },

    name: {
      type: String,
      default: "Untitled Map",
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    category: {
      type: String,
      default: "Other",
      trim: true,
      maxlength: 100,
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

    IMPORTANT:
    Keep floors flexible.

    UniversalNav supports multi-floor navigation,
    stairs, elevators and other floor interconnections.
    */

    totalFloors: {
      type: Number,
      default: 1,
      min: 1,
    },

    floors: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },

    floorSize: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        width: 1100,
        height: 750,
      }),
    },

    /*
    ========================================================
    ROOMS
    ========================================================

    Kept flexible for MapEditor room structures.
    */

    rooms: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },

    /*
    ========================================================
    WAYPOINTS / NODES
    ========================================================

    These remain flexible because the navigation system
    may contain different node types and metadata.

    Examples can include:
    - normal waypoints
    - entrances
    - stairs
    - elevators
    - emergency exits
    - accessibility nodes
    */

    waypoints: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },

    nodes: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },

    /*
    ========================================================
    CONNECTIONS / EDGES
    ========================================================

    DO NOT REMOVE.

    These are critical to routing and floor-to-floor
    navigation.

    Connections may represent relationships between:
    - rooms
    - waypoints
    - nodes
    - stairs
    - elevators
    - floors
    */

    connections: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },

    edges: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },

    /*
    ========================================================
    BOUNDARIES
    ========================================================
    */

    boundaries: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },

    /*
    ========================================================
    BLOCKED NAVIGATION ELEMENTS
    ========================================================
    */

    blockedEdges: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },

    blockedNodeIds: {
      type: [String],
      default: () => [],
    },

    /*
    ========================================================
    ACCESSIBILITY
    ========================================================
    */

    accessibilityPrefs: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        avoidStairs: false,
        avoidNarrowCorridors: false,
        minimizeWalking: false,
        avoidElevators: false,
        wheelchairAccessible: false,
      }),
    },

    /*
    ========================================================
    GENERAL MAP DATA
    ========================================================

    These flexible fields are deliberately preserved.

    MapEditor may store additional configuration,
    navigation information, floor information,
    simulation state or other map metadata here.
    */

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },

    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },

    /*
    ========================================================
    MAPEDITOR DATA
    ========================================================

    IMPORTANT:
    Do not remove or restrict this field.

    It exists specifically to preserve additional
    MapEditor data that is not represented by the
    top-level fields above.
    */

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },

  {
    timestamps: true,

    /*
    ========================================================
    IMPORTANT COMPATIBILITY SETTING
    ========================================================

    Keep strict:false.

    Existing UniversalNav MapEditor data may contain
    additional fields that are not explicitly represented
    in this schema.

    This prevents those fields from being silently removed
    or rejected during updates.
    */

    strict: false,
  }
);

/*
============================================================
INDEXES
============================================================
*/

// Ownership indexes are already provided by the fields.
// Keeping explicit indexes here would be redundant.

// mapSchema.index({ userId: 1 });
// mapSchema.index({ owner: 1 });
// mapSchema.index({ buildingId: 1 });

mapSchema.index({
  status: 1,
});

mapSchema.index({
  isPublic: 1,
});

module.exports = mongoose.model(
  "Map",
  mapSchema,
  "maps"
);