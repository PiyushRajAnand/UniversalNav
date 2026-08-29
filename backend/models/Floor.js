const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true, index: true },
  level: { type: Number, required: true }, // Ground = 0, Basement = -1, etc.
  name: { type: String, required: true }, // e.g., "Ground Floor", "Level 2"
  blueprintUrl: { type: String, default: '' }, // Background image URL
  dimensions: {
    width: { type: Number, default: 1920 },
    height: { type: Number, default: 1080 },
    scaleRatio: { type: Number, default: 1.0 } // meters per pixel
  }
}, { timestamps: true });

floorSchema.index({ buildingId: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('Floor', floorSchema);
