// routes/upload.js
// Image upload endpoint. Uses multer with disk storage in /uploads.
// Returns the public URL to use in the Artwork create form.

const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const { authRequired, artistRequired } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8) || '.bin';
    const safe = `${Date.now()}_${uuidv4()}${ext}`;
    cb(null, safe);
  },
});

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(new Error('only jpg/png/webp/gif allowed'));
    return cb(null, true);
  },
});

router.post(
  '/image',
  authRequired,
  artistRequired,
  (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'upload failed' });
      }
      if (!req.file) return res.status(400).json({ error: 'no file uploaded' });
      const url = `/uploads/${req.file.filename}`;
      res.status(201).json({ url, filename: req.file.filename, size: req.file.size });
    });
  }
);

module.exports = router;
