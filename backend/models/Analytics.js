const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
    startNodeLabel: { type: String, required: true },
    endNodeLabel: { type: String, required: true },
    avoidStairsUsed: { type: Boolean, default: false },
    searchTimestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analytics', analyticsSchema);
