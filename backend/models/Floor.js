const mongoose = require("mongoose");

const floorSchema = new mongoose.Schema(
  {
    /*
    ========================================================
    BUILDING RELATIONSHIP
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
    FLOOR LEVEL
    ========================================================

    Ground = 0
    Basement = -1
    Level 2 = 2
    */

    level: {
      type: Number,
      required: true,
      min: -100,
      max: 100,
    },

    /*
    ========================================================
    FLOOR NAME
    ========================================================
    */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    /*
    ========================================================
    BLUEPRINT
    ========================================================
    */

    blueprintUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    /*
    ========================================================
    FLOOR DIMENSIONS
    ========================================================
    */

    dimensions: {
      width: {
        type: Number,
        default: 1920,
        min: 1,
        max: 100000,
      },

      height: {
        type: Number,
        default: 1080,
        min: 1,
        max: 100000,
      },

      /*
      meters per pixel
      */

      scaleRatio: {
        type: Number,
        default: 1.0,
        min: 0.000001,
      },
    },
  },
  {
    timestamps: true,
  }
);

/*
============================================================
UNIQUE FLOOR PER BUILDING
============================================================

A building cannot contain two floors with the same level.

Example:

Building A:
  level -1 ✅
  level  0 ✅
  level  1 ✅

Building A:
  level 1 again ❌

Different building:
  level 1 ✅
============================================================
*/

floorSchema.index(
  {
    buildingId: 1,
    level: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Floor",
  floorSchema
);