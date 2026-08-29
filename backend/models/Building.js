const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
  {
    /*
    ========================================================
    IDENTIFICATION
    ========================================================
    */

    id: {
      type: String,
      sparse: true,
      index: true,
    },

    buildingId: {
      type: String,
      sparse: true,
      index: true,
    },


    /*
    ========================================================
    OWNER
    ========================================================
    */

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },


    /*
    ========================================================
    BASIC INFORMATION
    ========================================================
    */

    name: {
      type: String,
      default: "Untitled Building",
      trim: true,
    },

    title: {
      type: String,
      default: "Untitled Building",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
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
    FLOORS
    ========================================================
    */

    totalFloors: {
      type: Number,
      default: 1,
    },

    floors: {
      type: Array,
      default: [],
    },


    /*
    ========================================================
    MAP DATA
    ========================================================
    */

    rooms: {
      type: Array,
      default: [],
    },

    waypoints: {
      type: Array,
      default: [],
    },

    nodes: {
      type: Array,
      default: [],
    },

    edges: {
      type: Array,
      default: [],
    },

    connections: {
      type: Array,
      default: [],
    },

    boundaries: {
      type: Array,
      default: [],
    },


    /*
    ========================================================
    VERSION HISTORY
    ========================================================
    */

    versionHistory: [
      {
        version: {
          type: Number,
          default: 1,
        },

        snapshot: {
          type: Object,
        },

        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,

    /*
    Keep old MapEditor fields.
    */

    strict: false,
  }
);


module.exports = mongoose.model(
  "Building",
  buildingSchema
);