// middleware/auth.js
// JWT auth middleware. Three guards:
//   authRequired  - any logged-in user
//   artistRequired - user with role 'artist' or 'admin'
//   adminRequired  - user with role 'admin'
//
// The token is read from the Authorization header as "Bearer <token>".

const jwt = require('jsonwebtoken');
const User = require('../models/User');

function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

async function authRequired(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) return res.status(401).json({ error: 'authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'user not found' });
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

function artistRequired(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'authentication required' });
  if (!['artist', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'artist role required' });
  }
  return next();
}

function adminRequired(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin role required' });
  return next();
}

module.exports = { authRequired, artistRequired, adminRequired };
