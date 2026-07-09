// routes/orders.js
// Order lifecycle:
//   POST /api/orders              create pending order + Flutterwave charge
//   GET  /api/orders/mine         buyer history
//   GET  /api/orders/sales        artist sales history
//   GET  /api/orders/:id          single order (buyer/artist/admin)
//   GET  /api/orders/:id/verify   poll Flutterwave for live status

const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Order = require('../models/Order');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const { authRequired } = require('../middleware/auth');

// Use mock payment service if FLW_SECRET_KEY is not configured
const useMockPayment = !process.env.FLW_SECRET_KEY || process.env.FLW_SECRET_KEY.includes('replace_me');
const flw = useMockPayment ? require('../services/mockPayment') : require('../services/flutterwave');

const router = express.Router();

const PLATFORM_COMMISSION_PCT = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicOrder(o) {
  return {
    id: o._id,
    artworkId: o.artworkId,
    buyerId: o.buyerId,
    artistId: o.artistId,
    amount: o.amount,
    commission: o.commission,
    artistEarnings: o.artistEarnings,
    currency: o.currency,
    txRef: o.txRef,
    flwRef: o.flwRef,
    status: o.status,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    paymentLink: o.paymentLink,
    errorMessage: o.errorMessage,
    createdAt: o.createdAt,
    completedAt: o.completedAt,
  };
}

function clientRedirect(req) {
  // After payment, Flutterwave redirects the buyer here.
  // In dev the Vite dev server is on 5173; in prod the same host.
  const base = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/order/`;
}

// --- create order (start charge) ---
router.post('/', authRequired, async (req, res, next) => {
  try {
    const { artworkId, customerEmail, customerPhone } = req.body || {};
    if (!artworkId) return res.status(400).json({ error: 'artworkId is required' });
    if (!mongoose.isValidObjectId(artworkId)) return res.status(400).json({ error: 'invalid artworkId' });
    if (!customerEmail || !EMAIL_RE.test(customerEmail)) {
      return res.status(400).json({ error: 'valid customerEmail is required' });
    }
    if (!customerPhone) {
      return res.status(400).json({ error: 'customerPhone is required for mobile money' });
    }
    const phoneDigits = String(customerPhone).replace(/[^0-9]/g, '');
    if (phoneDigits.length < 9) {
      return res.status(400).json({ error: 'phone number looks too short' });
    }

    const art = await Artwork.findById(artworkId);
    if (!art) return res.status(404).json({ error: 'artwork not found' });
    if (art.sold) return res.status(409).json({ error: 'artwork already sold' });

    const artist = await User.findById(art.artistId);
    if (!artist) return res.status(404).json({ error: 'artist not found' });
    if (!artist.subaccountId) {
      return res.status(409).json({
        error: "This artist hasn't set up payments yet, contact them to finish onboarding.",
      });
    }
    if (artist._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "you can't buy your own artwork" });
    }

    const amount = Math.round(Number(art.price));
    const commission = Math.round((amount * PLATFORM_COMMISSION_PCT) / 100);
    const artistEarnings = amount - commission;

    const txRef = `kartz_${uuidv4()}`;

    // Create the Flutterwave charge first. If it fails we never persist the order.
    let flwResp;
    try {
      flwResp = await flw.createMobileMoneyCharge({
        txRef,
        amount,
        currency: 'RWF',
        email: customerEmail,
        phone: phoneDigits,
        subaccountId: artist.subaccountId,
        artworkTitle: art.title,
        redirectUrl: clientRedirect(req),
      });
    } catch (err) {
      return res.status(502).json({ error: err.message || 'payment provider error' });
    }

    if (!flwResp || flwResp.status !== 'success' || !flwResp.data) {
      return res.status(502).json({
        error: (flwResp && flwResp.message) || 'payment provider did not return a charge',
      });
    }

    const order = await Order.create({
      artworkId: art._id,
      buyerId: req.user._id,
      artistId: artist._id,
      amount,
      commission,
      artistEarnings,
      currency: 'RWF',
      txRef,
      flwRef: String(flwResp.data.id || ''),
      status: 'pending',
      customerEmail: customerEmail.toLowerCase(),
      customerPhone: phoneDigits,
      paymentLink: String(flwResp.data.link || ''),
    });

    res.status(201).json({
      order: publicOrder(order),
      flw: {
        status: flwResp.status,
        message: flwResp.message,
        paymentLink: flwResp.data.link,
        transactionId: flwResp.data.id,
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- buyer's orders ---
router.get('/mine', authRequired, async (req, res, next) => {
  try {
    const items = await Order.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('artworkId')
      .populate('artistId', 'username displayName avatar');
    res.json({ items: items.map(publicOrder) });
  } catch (err) {
    next(err);
  }
});

// --- artist's sales ---
router.get('/sales', authRequired, async (req, res, next) => {
  try {
    const items = await Order.find({ artistId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('artworkId')
      .populate('buyerId', 'username email');
    res.json({ items: items.map(publicOrder) });
  } catch (err) {
    next(err);
  }
});

// --- single order ---
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const o = await Order.findById(req.params.id)
      .populate('artworkId')
      .populate('buyerId', 'username email displayName')
      .populate('artistId', 'username email displayName avatar');
    if (!o) return res.status(404).json({ error: 'order not found' });
    const uid = req.user._id.toString();
    const isOwner =
      o.buyerId && o.buyerId._id.toString() === uid;
    const isArtist =
      o.artistId && o.artistId._id.toString() === uid;
    if (!isOwner && !isArtist && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    res.json({ order: publicOrder(o) });
  } catch (err) {
    next(err);
  }
});

// --- verify order status with Flutterwave ---
// The frontend can poll this while the buyer is approving the MoMo prompt.
router.get('/:id/verify', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const o = await Order.findById(req.params.id);
    if (!o) return res.status(404).json({ error: 'order not found' });
    const uid = req.user._id.toString();
    if (
      o.buyerId.toString() !== uid &&
      o.artistId.toString() !== uid &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'forbidden' });
    }
    if (!o.flwRef) {
      return res.json({ order: publicOrder(o), verified: false });
    }
    const v = await flw.verifyTransaction(o.flwRef);
    const txStatus = v && v.data && v.data.status;
    if (v && v.status === 'success' && txStatus === 'successful' && o.status !== 'completed') {
      o.status = 'completed';
      o.completedAt = new Date();
      await o.save();
      // mark the artwork as sold
      await Artwork.updateOne({ _id: o.artworkId, sold: false }, { sold: true });
    } else if (v && txStatus === 'failed' && o.status !== 'failed') {
      o.status = 'failed';
      o.errorMessage = (v.data && v.data.processor_response) || 'payment failed';
      await o.save();
    }
    res.json({ order: publicOrder(o), verified: true, provider: v && v.data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
