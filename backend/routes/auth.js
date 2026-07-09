// routes/auth.js
// Endpoints:
//   POST /api/auth/signup           - create a regular user
//   POST /api/auth/login            - email/username + password
//   GET  /api/auth/me               - current user (auth required)
//   POST /api/auth/upgrade-artist   - upgrade user to artist + create subaccount

const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');
const { authRequired } = require('../middleware/auth');

// Use mock payment service if FLW_SECRET_KEY is not configured
const useMockPayment = !process.env.FLW_SECRET_KEY || process.env.FLW_SECRET_KEY.includes('replace_me');
const flw = useMockPayment ? require('../services/mockPayment') : require('../services/flutterwave');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function publicUser(user) {
  return user.toSafeJSON();
}

// --- signup ---
router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: 'username must be 3-30 chars (letters, numbers, _ . -)' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'email looks invalid' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }

    const lowerEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({
      $or: [{ email: lowerEmail }, { username }],
    });
    if (existing) {
      const field = existing.email === lowerEmail ? 'email' : 'username';
      return res.status(409).json({ error: `an account with that ${field} already exists` });
    }

    const user = await User.create({
      username: String(username).trim(),
      email: lowerEmail,
      password: String(password),
      role: 'user',
    });

    const token = signToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'an account with that email or username already exists' });
    }
    return next(err);
  }
});

// --- login ---
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, email, username, password } = req.body || {};
    const login = (identifier || email || username || '').toString().toLowerCase().trim();
    if (!login || !password) {
      return res.status(400).json({ error: 'email/username and password are required' });
    }
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }],
    });
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const token = signToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
});

// --- me ---
router.get('/me', authRequired, (req, res) => {
  return res.json({ user: publicUser(req.user) });
});

// --- upgrade to artist ---
// Collects the mobile money details, calls Flutterwave to create a
// subaccount (with 5% split to the platform), and updates the user.
router.post('/upgrade-artist', authRequired, async (req, res, next) => {
  try {
    const { phone, mobileProvider, displayName, bio, avatar } = req.body || {};
    if (!phone || !mobileProvider || !displayName) {
      return res.status(400).json({
        error: 'phone, mobileProvider (MMT or AIR) and displayName are required',
      });
    }
    if (!['MMT', 'AIR'].includes(mobileProvider)) {
      return res.status(400).json({ error: 'mobileProvider must be MMT (MTN) or AIR (Airtel)' });
    }
    const phoneDigits = String(phone).replace(/[^0-9]/g, '');
    if (phoneDigits.length < 9) {
      return res.status(400).json({ error: 'phone number looks too short' });
    }

    const user = req.user;
    if (user.role === 'artist' && user.subaccountId) {
      return res.json({ user: publicUser(user), alreadyArtist: true });
    }

    if (!user.subaccountId) {
      const { subaccountId } = await flw.createSubaccount({
        displayName: String(displayName).trim(),
        email: user.email,
        phone: phoneDigits,
        provider: mobileProvider,
      });
      user.subaccountId = subaccountId;
    }

    user.role = 'artist';
    user.phone = phoneDigits;
    user.mobileProvider = mobileProvider;
    user.displayName = String(displayName).trim();
    if (typeof bio === 'string') user.bio = bio;
    if (typeof avatar === 'string') user.avatar = avatar;
    await user.save();

    // issue a fresh token reflecting the new role
    const token = signToken(user);
    return res.json({ user: publicUser(user), token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
