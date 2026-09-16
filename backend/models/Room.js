const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
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
    FLOOR RELATIONSHIP
    ========================================================
    */

    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
      index: true,
    },

    /*
    ========================================================
    BASIC INFORMATION
    ========================================================
    */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    roomNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    department: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    /*
    ========================================================
    ROOM CATEGORY
    ========================================================
    */

    category: {
      type: String,
      enum: [
        "Room",
        "Classroom",
        "Lab",
        "Office",
        "Cabin",
        "Corridor",
        "Stair",
        "Lift",
        "Exit",
        "Emergency Exit",
        "Washroom",
        "Cafeteria",
        "Parking",
        "Reception",
      ],
      default: "Room",
    },

    /*
    ========================================================
    CAPACITY
    ========================================================
    */

    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
    ========================================================
    DESCRIPTION
    ========================================================
    */

    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    /*
    ========================================================
    VISUAL APPEARANCE
    ========================================================

    Preserved because MapEditor can use these values when
    rendering rooms.
    */

    color: {
      type: String,
      default: "#3b82f6",
      trim: true,
      maxlength: 50,
    },

    icon: {
      type: String,
      default: "door",
      trim: true,
      maxlength: 100,
    },

    /*
    ========================================================
    GEOMETRY
    ========================================================

    IMPORTANT:
    Rectangle, Circle and Polygon are all preserved.

    MapEditor may use any of these shapes.
    */

    geometry: {
      shapeType: {
        type: String,
        enum: [
          "Rectangle",
          "Circle",
          "Polygon",
        ],
        default: "Rectangle",
      },

      /*
      Rectangle:
        top-left x/y

      Circle:
        center x/y
      */

      x: {
        type: Number,
        required: true,
      },

      y: {
        type: Number,
        required: true,
      },

      width: {
        type: Number,
        default: 100,
        min: 0,
      },

      height: {
        type: Number,
        default: 80,
        min: 0,
      },

      radius: {
        type: Number,
        default: 40,
        min: 0,
      },

      /*
      Polygon coordinates remain flexible enough for
      MapEditor-generated geometry.
      */

      polygonPoints: {
        type: [
          {
            x: {
              type: Number,
              required: true,
            },

            y: {
              type: Number,
              required: true,
            },
          },
        ],
        default: () => [],
      },
    },
  },

  {
    timestamps: true,
  }
);

/*
============================================================
USEFUL QUERY INDEX
============================================================
*/

roomSchema.index({
  buildingId: 1,
  floorId: 1,
});

module.exports = mongoose.model(
  "Room",
  roomSchema
);