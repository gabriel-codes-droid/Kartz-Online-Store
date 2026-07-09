// models/Order.js
const mongoose = require('mongoose');

const STATUSES = ['pending', 'completed', 'failed', 'cancelled'];

const orderSchema = new mongoose.Schema(
  {
    artworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // All money in RWF, stored as Number (integer francs)
    amount: { type: Number, required: true, min: 1 },
    commission: { type: Number, required: true, min: 0 }, // platform take (5%)
    artistEarnings: { type: Number, required: true, min: 0 }, // 95% remainder
    currency: { type: String, default: 'RWF', required: true },
    txRef: { type: String, required: true, unique: true, index: true },
    flwRef: { type: String, default: '' },
    status: { type: String, enum: STATUSES, default: 'pending', required: true, index: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    paymentLink: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Order', orderSchema);
