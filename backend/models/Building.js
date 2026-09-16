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
      trim: true,
    },

    buildingId: {
      type: String,
      sparse: true,
      index: true,
      trim: true,
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
      maxlength: 200,
    },

    title: {
      type: String,
      default: "Untitled Building",
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    address: {
      street: {
        type: String,
        trim: true,
        maxlength: 300,
      },

      city: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      state: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      country: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      zipCode: {
        type: String,
        trim: true,
        maxlength: 20,
      },
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
    FLOORS
    ========================================================
    */

    totalFloors: {
      type: Number,
      default: 1,
      min: 1,
    },

    floors: {
      type: Array,
      default: () => [],
    },

    /*
    ========================================================
    MAP DATA
    ========================================================

    These flexible arrays are intentionally preserved.

    MapEditor/PublicNavigation may store different map
    structures here, so we are NOT converting them into
    strict sub-schemas at this stage.
    */

    rooms: {
      type: Array,
      default: () => [],
    },

    waypoints: {
      type: Array,
      default: () => [],
    },

    nodes: {
      type: Array,
      default: () => [],
    },

    edges: {
      type: Array,
      default: () => [],
    },

    connections: {
      type: Array,
      default: () => [],
    },

    boundaries: {
      type: Array,
      default: () => [],
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
          min: 1,
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
    ========================================================
    IMPORTANT
    ========================================================

    Keep strict:false for now.

    UniversalNav's existing MapEditor stores flexible
    map structures. Tightening this prematurely could
    silently remove or reject existing fields.

    We can migrate to structured subdocuments later,
    after the complete MapEditor/PublicNavigation data
    flow has been verified.
    */

    strict: false,
  }
);

module.exports = mongoose.model(
  "Building",
  buildingSchema
);