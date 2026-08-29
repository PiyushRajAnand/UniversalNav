const mongoose = require('mongoose');

const edgeSchema = new mongoose.Schema({
  targetNode: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
  distance: { type: Number, required: true },
  isStaircase: { type: Boolean, default: false },
  isElevator: { type: Boolean, default: false }
});

const nodeSchema = new mongoose.Schema(
  {
    floor: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
    label: { type: String, required: true, trim: true },
    xRatio: { type: Number, required: true },
    yRatio: { type: Number, required: true },
    type: {
      type: String,
      enum: ['ROOM', 'CORRIDOR', 'ENTRANCE', 'STAIRS', 'ELEVATOR', 'RESTROOM'],
      default: 'ROOM'
    },
    edges: [edgeSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Node', nodeSchema);
