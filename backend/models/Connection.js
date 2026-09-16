const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
  {
    /*
    ========================================================
    BUILDING
    ========================================================
    */

    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
      index: true,
    },

    /*
    ========================================================
    ROOM CONNECTION
    ========================================================
    */

    fromRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    toRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    /*
    ========================================================
    FLOOR CONNECTION
    ========================================================

    These are intentionally kept separate.

    They allow UniversalNav to represent:

    Floor 0 → Floor 1
    Floor 1 → Floor 2
    etc.

    through stairs, lifts/elevators or escalators.
    */

    fromFloorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
    },

    toFloorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
    },

    /*
    ========================================================
    CONNECTION TYPE
    ========================================================
    */

    type: {
      type: String,
      enum: [
        "Corridor",
        "Stair",
        "Lift",
        "Escalator",
      ],
      default: "Corridor",
      trim: true,
    },

    /*
    ========================================================
    DISTANCE
    ========================================================
    */

    distanceMeters: {
      type: Number,
      required: true,
      min: 0.001,
    },

    /*
    ========================================================
    WALKING TIME
    ========================================================
    */

    walkingTimeSeconds: {
      type: Number,
      required: true,
      min: 0.001,
    },

    /*
    ========================================================
    ACCESSIBILITY
    ========================================================
    */

    isAccessible: {
      type: Boolean,
      default: true,
    },

    /*
    ========================================================
    DIRECTION
    ========================================================
    */

    isBidirectional: {
      type: Boolean,
      default: true,
    },

    /*
    ========================================================
    PATHFINDING WEIGHT
    ========================================================

    A value greater than zero is required so that the
    pathfinding system never receives an invalid/negative
    weight.
    */

    weightModifier: {
      type: Number,
      default: 1.0,
      min: 0.001,
    },
  },
  {
    timestamps: true,
  }
);

/*
============================================================
NAVIGATION INDEXES
============================================================
*/

connectionSchema.index({
  buildingId: 1,
  fromFloorId: 1,
});

connectionSchema.index({
  buildingId: 1,
  toFloorId: 1,
});

connectionSchema.index({
  fromRoomId: 1,
  toRoomId: 1,
});

module.exports = mongoose.model(
  "Connection",
  connectionSchema
);