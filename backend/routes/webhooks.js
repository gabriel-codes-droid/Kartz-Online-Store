// routes/webhooks.js
// Flutterwave webhook receiver.
// Mounted at /api/webhooks (no body-parser for the whole app).
// We need the RAW body for signature verification, so this router
// uses express.raw() on this specific path.

const express = require('express');
const flw = require('../services/flutterwave');
const Order = require('../models/Order');
const Artwork = require('../models/Artwork');

const router = express.Router();

router.post(
  '/flutterwave',
  express.raw({ type: '*/*', limit: '1mb' }),
  async (req, res) => {
    const sig = req.header('verifi-hash') || req.header('Verifi-Hash');
    if (!flw.verifyWebhookSignature(sig)) {
      // eslint-disable-next-line no-console
      console.warn('[webhook] invalid signature');
      return res.status(401).json({ error: 'invalid signature' });
    }

    let payload;
    try {
      payload = JSON.parse(req.body.toString('utf8'));
    } catch (e) {
      return res.status(400).json({ error: 'invalid json' });
    }

    const event = payload && payload.event;
    const data = payload && payload.data;
    const txRef = data && (data.tx_ref || (data.meta && data.meta.tx_ref));
    const flwId = data && data.id;

    // eslint-disable-next-line no-console
    console.log(`[webhook] event=${event} txRef=${txRef} flwId=${flwId} status=${data && data.status}`);

    try {
      if (event === 'charge.completed' && data.status === 'successful') {
        const order = await Order.findOne({ txRef });
        if (order && order.status !== 'completed') {
          order.status = 'completed';
          order.completedAt = new Date();
          if (flwId) order.flwRef = String(flwId);
          await order.save();
          await Artwork.updateOne({ _id: order.artworkId, sold: false }, { sold: true });
        }
      } else if (event === 'charge.failed' || (event === 'charge.completed' && data.status === 'failed')) {
        const order = await Order.findOne({ txRef });
        if (order && order.status !== 'failed') {
          order.status = 'failed';
          order.errorMessage = (data && data.processor_response) || 'payment failed';
          if (flwId) order.flwRef = String(flwId);
          await order.save();
        }
      } else if (event === 'charge.cancelled' || event === 'charge.refunded') {
        const order = await Order.findOne({ txRef });
        if (order) {
          order.status = 'cancelled';
          await order.save();
        }
      }
      // Always 200 quickly so Flutterwave doesn't retry endlessly.
      return res.sendStatus(200);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[webhook] handler error', err.message);
      return res.sendStatus(200);
    }
  }
);

module.exports = router;
