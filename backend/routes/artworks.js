// routes/artworks.js
// Public read endpoints + artist-only write endpoints.

const express = require('express');
const mongoose = require('mongoose');

const Artwork = require('../models/Artwork');
const User = require('../models/User');
const { authRequired, artistRequired } = require('../middleware/auth');

const router = express.Router();

// --- list artworks (public) ---
// Query: ?q=text  &category=painting  &sort=newest|price-asc|price-desc
router.get('/', async (req, res, next) => {
  try {
    const { q, category, sort } = req.query;
    const filter = {};
    if (q) filter.title = { $regex: String(q), $options: 'i' };
    if (category && Artwork.CATEGORIES.includes(String(category))) {
      filter.category = category;
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'price-asc') sortObj = { price: 1 };
    else if (sort === 'price-desc') sortObj = { price: -1 };

    const items = await Artwork.find(filter)
      .sort(sortObj)
      .limit(200)
      .populate('artistId', 'username displayName avatar');

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// --- single artwork (public) ---
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const art = await Artwork.findById(req.params.id).populate(
      'artistId',
      'username displayName avatar bio'
    );
    if (!art) return res.status(404).json({ error: 'artwork not found' });
    res.json({ artwork: art });
  } catch (err) {
    next(err);
  }
});

// --- create (artist) ---
router.post('/', authRequired, artistRequired, async (req, res, next) => {
  try {
    const { title, description, price, category, imageUrl } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 1) {
      return res.status(400).json({ error: 'price must be a positive number (RWF)' });
    }
    if (!Artwork.CATEGORIES.includes(String(category))) {
      return res.status(400).json({ error: `category must be one of ${Artwork.CATEGORIES.join(', ')}` });
    }
    if (!req.user.subaccountId) {
      // artists must have a subaccount before they can sell
      return res.status(400).json({
        error: 'finish artist onboarding first: set up mobile money payments in your profile',
      });
    }
    const art = await Artwork.create({
      title: String(title).trim().slice(0, 120),
      description: String(description || '').slice(0, 4000),
      price: Math.round(priceNum),
      category,
      imageUrl: String(imageUrl || '').slice(0, 1000),
      artistId: req.user._id,
    });
    res.status(201).json({ artwork: art });
  } catch (err) {
    next(err);
  }
});

// --- update (owner) ---
router.put('/:id', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ error: 'artwork not found' });
    if (art.artistId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'not your artwork' });
    }
    const { title, description, price, category, imageUrl } = req.body || {};
    if (typeof title === 'string') art.title = title.trim().slice(0, 120);
    if (typeof description === 'string') art.description = description.slice(0, 4000);
    if (price !== undefined) {
      const p = Number(price);
      if (!Number.isFinite(p) || p < 1) return res.status(400).json({ error: 'invalid price' });
      art.price = Math.round(p);
    }
    if (category && Artwork.CATEGORIES.includes(String(category))) art.category = category;
    if (typeof imageUrl === 'string') art.imageUrl = imageUrl.slice(0, 1000);
    await art.save();
    res.json({ artwork: art });
  } catch (err) {
    next(err);
  }
});

// --- delete (owner or admin) ---
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ error: 'artwork not found' });
    if (art.artistId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'not your artwork' });
    }
    await art.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// --- artworks by artist (public) ---
router.get('/by-artist/:artistId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.artistId)) {
      return res.status(400).json({ error: 'invalid artist id' });
    }
    const items = await Artwork.find({ artistId: req.params.artistId })
      .sort({ createdAt: -1 })
      .populate('artistId', 'username displayName avatar');
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// --- like artwork (auth required) ---
router.post('/:id/like', authRequired, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ error: 'artwork not found' });
    
    const userId = req.user._id;
    const alreadyLiked = art.likedBy.includes(userId);
    
    if (alreadyLiked) {
      // Unlike
      art.likedBy = art.likedBy.filter(id => id.toString() !== userId.toString());
      art.likes = Math.max(0, art.likes - 1);
    } else {
      // Like
      art.likedBy.push(userId);
      art.likes += 1;
    }
    
    await art.save();
    res.json({ artwork: art, liked: !alreadyLiked });
  } catch (err) {
    next(err);
  }
});

// --- share artwork (public, just increments counter) ---
router.post('/:id/share', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const art = await Artwork.findById(req.params.id);
    if (!art) return res.status(404).json({ error: 'artwork not found' });
    
    art.shares += 1;
    await art.save();
    res.json({ artwork: art, shares: art.shares });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
