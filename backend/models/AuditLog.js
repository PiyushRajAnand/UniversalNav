const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // ============================================================
    // USER
    // ============================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // ============================================================
    // ACTION
    // ============================================================

    action: {
      type: String,

      enum: [
        // Authentication
        "LOGIN",
        "LOGOUT",

        // Maps
        "MAP_CREATED",
        "MAP_UPDATED",
        "MAP_DELETED",
        "MAP_PUBLISHED",
        "MAP_UNPUBLISHED",

        // Map elements
        "ROOM_CREATED",
        "ROOM_UPDATED",
        "ROOM_DELETED",

        "WAYPOINT_CREATED",
        "WAYPOINT_UPDATED",
        "WAYPOINT_DELETED",

        "CONNECTION_CREATED",
        "CONNECTION_UPDATED",
        "CONNECTION_DELETED",

        // Path / accessibility
        "PATH_BLOCKED",
        "PATH_UNBLOCKED",

        // Building
        "BUILDING_CREATED",
        "BUILDING_UPDATED",
        "BUILDING_DELETED",

        // Visibility
        "VISIBILITY_CHANGED",
      ],

      required: true,
      index: true,
    },

    // ============================================================
    // OPTIONAL DESCRIPTION
    // ============================================================

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // ============================================================
    // TARGET INFORMATION
    // ============================================================

    resourceType: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    resourceId: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    // ============================================================
    // EXTRA DETAILS
    // ============================================================

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ============================================================
    // REQUEST INFORMATION
    // ============================================================

    ipAddress: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    // ============================================================
    // TIMESTAMP
    // ============================================================

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEX FOR ADMIN DASHBOARD
// ============================================================

auditLogSchema.index({
  userId: 1,
  timestamp: -1,
});

auditLogSchema.index({
  action: 1,
  timestamp: -1,
});

module.exports = mongoose.model(
  "AuditLog",
  auditLogSchema
);