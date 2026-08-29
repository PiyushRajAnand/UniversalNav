const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true, index: true },
  fromRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  toRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  fromFloorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
  toFloorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
  type: { 
    type: String, 
    enum: ['Corridor', 'Stair', 'Lift', 'Escalator'], 
    default: 'Corridor' 
  },
  distanceMeters: { type: Number, required: true },
  walkingTimeSeconds: { type: Number, required: true },
  isAccessible: { type: Boolean, default: true }, // Wheelchair / ramp accessible
  isBidirectional: { type: Boolean, default: true },
  weightModifier: { type: Number, default: 1.0 } // Priority multiplier for pathfinding
}, { timestamps: true });

module.exports = mongoose.model('Connection', connectionSchema);
