// server.js - Kartz backend entry point
// Loads env, connects Mongo, mounts routes, serves uploads.
// Run with: node server.js (or npm start).
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const artworkRoutes = require('./routes/artworks');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');
const uploadRoutes = require('./routes/upload');

const app = express();

// --- CORS ---
// Allow the Vite dev server (5173) and the production frontend origin
// (override with FRONTEND_ORIGIN env var in deployment).
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, server-to-server, webhooks)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// --- Body parsers ---
// IMPORTANT: webhook route needs the raw body for signature verification,
// so we mount it BEFORE express.json(). The webhook router handles its own
// raw-body parsing via express.raw() inside.
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Static uploads ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Health ---
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'kartz' }));

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// --- 404 ---
app.use('/api', (_req, res) => res.status(404).json({ error: 'not found' }));

// --- Error handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Never leak stack traces in production
  const status = err.status || 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[server error]', err.message);
  }
  res.status(status).json({ error: err.publicMessage || err.message || 'server error' });
});

// --- Boot ---
const PORT = process.env.PORT || 8080;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[kartz] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[kartz] failed to start:', err.message);
    process.exit(1);
  }
})();
