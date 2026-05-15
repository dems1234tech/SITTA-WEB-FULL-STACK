// routes/stok.js — Stock CRUD Routes (lowdb)
const express = require('express');
const db = require('../database');
const { verifyToken } = require('./auth');
const router = express.Router();

// GET /api/stok
router.get('/', (req, res) => {
  const stok = db.get('stok').value();
  res.json({ success: true, data: stok });
});

// GET /api/stok/:kode
router.get('/:kode', (req, res) => {
  const item = db.get('stok').find({ kodeBarang: req.params.kode }).value();
  if (!item) return res.status(404).json({ success: false, message: 'Item tidak ditemukan.' });
  res.json({ success: true, data: item });
});

// POST /api/stok
router.post('/', verifyToken, (req, res) => {
  const { kodeBarang, kodeLokasi, namaBarang, jenisBarang, edisi, stok, limit, cover } = req.body;
  if (!kodeBarang || !namaBarang || !jenisBarang)
    return res.status(400).json({ success: false, message: 'kodeBarang, namaBarang, jenisBarang wajib diisi.' });

  const exists = db.get('stok').find({ kodeBarang }).value();
  if (exists)
    return res.status(409).json({ success: false, message: `Kode "${kodeBarang}" sudah ada.` });

  const newItem = { kodeBarang, kodeLokasi: kodeLokasi || '', namaBarang, jenisBarang, edisi: edisi || '1', stok: stok || 0, limit: limit || 1000, cover: cover || '' };
  db.get('stok').push(newItem).write();
  res.status(201).json({ success: true, message: 'Item berhasil ditambahkan.', data: newItem });
});

// PUT /api/stok/:kode
router.put('/:kode', verifyToken, (req, res) => {
  const item = db.get('stok').find({ kodeBarang: req.params.kode });
  if (!item.value()) return res.status(404).json({ success: false, message: 'Item tidak ditemukan.' });

  // Only update fields that are provided
  const updates = {};
  ['namaBarang','jenisBarang','edisi','cover','stok','limit','kodeLokasi'].forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  item.assign(updates).write();
  res.json({ success: true, message: 'Item diperbarui.', data: item.value() });
});

// DELETE /api/stok/:kode
router.delete('/:kode', verifyToken, (req, res) => {
  const item = db.get('stok').find({ kodeBarang: req.params.kode }).value();
  if (!item) return res.status(404).json({ success: false, message: 'Item tidak ditemukan.' });

  db.get('stok').remove({ kodeBarang: req.params.kode }).write();
  res.json({ success: true, message: `"${item.namaBarang}" berhasil dihapus.` });
});

module.exports = router;
