const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true }
  },
  { timestamps: true }
);

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['RESIDENTIAL', 'COMMERCIAL', 'HOSPITAL', 'EDUCATIONAL', 'OFFICE'],
      default: 'COMMERCIAL'
    },
    address: { type: String, required: true },
    coverImage: { type: String },
    floors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Floor' }],
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', propertySchema);
