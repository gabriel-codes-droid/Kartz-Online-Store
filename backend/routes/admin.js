// routes/admin.js
// Admin-only endpoints. All require role=admin.
const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Order = require('../models/Order');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired, adminRequired);

// --- summary stats ---
router.get('/stats', async (_req, res, next) => {
  try {
    const [users, artists, artworks, completedOrders, recentOrders] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: { $in: ['artist', 'admin'] } }),
      Artwork.countDocuments({}),
      Order.find({ status: 'completed' }).select('amount commission artistEarnings createdAt').lean(),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('artworkId', 'title')
        .populate('buyerId', 'username email')
        .populate('artistId', 'username displayName')
        .lean(),
    ]);

    const totalSales = completedOrders.reduce((s, o) => s + o.amount, 0);
    const totalCommission = completedOrders.reduce((s, o) => s + o.commission, 0);
    const totalArtistEarnings = completedOrders.reduce((s, o) => s + o.artistEarnings, 0);
    const totalCompleted = completedOrders.length;

    // 7-day series for the chart
    const seriesMap = new Map();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      seriesMap.set(d.toISOString().slice(0, 10), { sales: 0, commission: 0 });
    }
    for (const o of completedOrders) {
      const key = new Date(o.completedAt || o.createdAt).toISOString().slice(0, 10);
      if (seriesMap.has(key)) {
        const v = seriesMap.get(key);
        v.sales += o.amount;
        v.commission += o.commission;
      }
    }
    const series = Array.from(seriesMap.entries()).map(([date, v]) => ({ date, ...v }));

    res.json({
      users,
      artists,
      artworks,
      totalCompleted,
      totalSales,
      totalCommission,
      totalArtistEarnings,
      series,
      recentOrders: recentOrders.map((o) => ({
        id: o._id,
        amount: o.amount,
        commission: o.commission,
        status: o.status,
        createdAt: o.createdAt,
        artwork: o.artworkId,
        buyer: o.buyerId,
        artist: o.artistId,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// --- list users ---
router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .select('-password');
    res.json({ items: users });
  } catch (err) {
    next(err);
  }
});

// --- update role ---
router.put('/users/:id/role', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const { role } = req.body || {};
    if (!['user', 'artist', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'role must be user, artist or admin' });
    }
    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ error: "you can't demote yourself" });
    }
    const u = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!u) return res.status(404).json({ error: 'user not found' });
    res.json({ user: u.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
