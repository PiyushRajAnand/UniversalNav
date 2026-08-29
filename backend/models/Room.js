const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true, index: true },
  floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true, index: true },
  name: { type: String, required: true },
  roomNumber: { type: String, default: '' },
  department: { type: String, default: '' },
  category: { 
    type: String, 
    enum: [
      'Room', 'Classroom', 'Lab', 'Office', 'Cabin', 'Corridor', 
      'Stair', 'Lift', 'Exit', 'Emergency Exit', 'Washroom', 
      'Cafeteria', 'Parking', 'Reception'
    ],
    default: 'Room'
  },
  capacity: { type: Number, default: 0 },
  description: { type: String, default: '' },
  color: { type: String, default: '#3b82f6' },
  icon: { type: String, default: 'door' },
  geometry: {
    shapeType: { type: String, enum: ['Rectangle', 'Circle', 'Polygon'], default: 'Rectangle' },
    // Standard coordinates (top-left x, y for rect; center x, y for circle)
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, default: 100 },
    height: { type: Number, default: 80 },
    radius: { type: Number, default: 40 },
    polygonPoints: [{ x: Number, y: Number }] // Array of coordinates for complex shapes
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
