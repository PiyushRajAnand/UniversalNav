const mongoose = require("mongoose");

// ============================================================
// NODE EDGE SCHEMA
// ============================================================

const edgeSchema = new mongoose.Schema(
  {
    /*
    ========================================================
    TARGET NODE
    ========================================================

    The target can belong to the same floor or another floor.

    This is important for:
    - stairs
    - elevators
    - multi-floor navigation
    */

    targetNode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Node",
      required: true,
    },

    /*
    ========================================================
    DISTANCE
    ========================================================
    */

    distance: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
    ========================================================
    FLOOR CONNECTION TYPES
    ========================================================
    */

    isStaircase: {
      type: Boolean,
      default: false,
    },

    isElevator: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// NODE SCHEMA
// ============================================================

const nodeSchema = new mongoose.Schema(
  {
    /*
    ========================================================
    FLOOR
    ========================================================

    Every navigation node belongs to a floor.

    A stair/elevator node can then connect through an edge
    to a node on another floor.
    */

    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
      index: true,
    },

    /*
    ========================================================
    LABEL
    ========================================================
    */

    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    /*
    ========================================================
    POSITION
    ========================================================

    Ratios are preserved exactly as the existing model uses
    them.
    */

    xRatio: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

    yRatio: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

    /*
    ========================================================
    NODE TYPE
    ========================================================
    */

    type: {
      type: String,
      enum: [
        "ROOM",
        "CORRIDOR",
        "ENTRANCE",
        "STAIRS",
        "ELEVATOR",
        "RESTROOM",
      ],
      default: "ROOM",
      index: true,
    },

    /*
    ========================================================
    EDGES
    ========================================================

    IMPORTANT:
    Do not remove staircase/elevator flags.

    These edges are part of the multi-floor routing
    architecture.
    */

    edges: {
      type: [edgeSchema],
      default: () => [],
    },
  },

  {
    timestamps: true,
  }
);

// ============================================================
// INDEX
// ============================================================

nodeSchema.index({
  floor: 1,
  type: 1,
});

module.exports = mongoose.model(
  "Node",
  nodeSchema
);