// models/Artwork.js
const mongoose = require('mongoose');

const CATEGORIES = ['painting', 'drawing', 'photography', 'digital', 'sculpture', 'other'];

const artworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 4000 },
    // RWF amount as Number (no decimals, integer francs)
    price: { type: Number, required: true, min: 1 },
    category: { type: String, enum: CATEGORIES, required: true, default: 'other' },
    imageUrl: { type: String, default: '' },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sold: { type: Boolean, default: false },
  },
  { timestamps: true }
);

artworkSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Artwork', artworkSchema);
