// routes/auth.js — Authentication Routes (lowdb)
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = 'sitta_secret_key_ut_2026';

// POST /api/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });

  const user = db.get('users').find({ email, password }).value();
  if (!user)
    return res.status(401).json({ success: false, message: 'Email atau password salah.' });

  const token = jwt.sign(
    { id: user.id, nama: user.nama, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    success: true,
    message: `Selamat datang, ${user.nama}!`,
    token,
    user: { id: user.id, nama: user.nama, email: user.email, role: user.role, lokasi: user.lokasi }
  });
});

// GET /api/me
router.get('/me', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

function verifyToken(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token)
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Silakan login.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
}

module.exports = router;
module.exports.verifyToken = verifyToken;
