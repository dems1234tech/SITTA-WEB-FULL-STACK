// routes/history.js — Transaction History Routes (lowdb)
const express = require('express');
const db = require('../database');
const { verifyToken } = require('./auth');
const router = express.Router();

// GET /api/history
router.get('/', (req, res) => {
  const { status, q } = req.query;
  let history = db.get('history').value();

  if (status && status !== 'Semua') history = history.filter(h => h.status === status);
  if (q) {
    const lq = q.toLowerCase();
    history = history.filter(h =>
      h.pengguna.toLowerCase().includes(lq) || h.bahanAjar.toLowerCase().includes(lq) ||
      h.id.toLowerCase().includes(lq) || h.nomorDO.includes(lq)
    );
  }

  // Map to frontend-compatible keys
  const mapped = history.map(h => ({ ...h, do: h.nomorDO, bill: h.nomorBill, resi: h.nomorResi }));
  res.json({ success: true, data: mapped });
});

// POST /api/history — Checkout
router.post('/', verifyToken, (req, res) => {
  const { items, pengguna } = req.body;
  if (!items || !items.length)
    return res.status(400).json({ success: false, message: 'Tidak ada item untuk di-checkout.' });

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const trxId  = 'TRX-' + Math.floor(Math.random() * 100000);
  const doId   = 'DO-'   + (2026000000 + Math.floor(Math.random() * 10000));
  const billId = 'BILL-' + Math.floor(Math.random() * 90000 + 10000);
  const resiId = 'RESI-UT' + Math.floor(Math.random() * 900000 + 100000);

  let total = 0;
  const errors = [];

  for (const item of items) {
    const stockItem = db.get('stok').find({ kodeBarang: item.kode }).value();
    if (!stockItem) { errors.push(`Item ${item.kode} tidak ditemukan.`); continue; }
    if (stockItem.stok < item.qty) { errors.push(`Stok "${stockItem.namaBarang}" tidak mencukupi.`); continue; }

    // Deduct stock
    db.get('stok').find({ kodeBarang: item.kode }).assign({ stok: Math.max(0, stockItem.stok - item.qty) }).write();

    // Add history record
    db.get('history').push({
      id: trxId, tanggal: dateStr, nomorDO: doId, nomorBill: billId, nomorResi: resiId,
      pengguna, bahanAjar: item.nama, jumlah: item.qty, status: 'Proses'
    }).write();

    total += (item.price || 150000) * item.qty;
  }

  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

  // Add tracking entry
  const timeStr = now.toLocaleString('id-ID');
  db.get('tracking').push({
    nomorDO: doId, nama: pengguna, status: 'Proses', ekspedisi: 'SITTA Logistics',
    tanggalKirim: dateStr, total: `Rp ${total.toLocaleString('id-ID')}`, progress: 10,
    perjalanan: [
      { waktu: timeStr, keterangan: 'Pesanan Diterima & Diverifikasi oleh Sistem' },
      { waktu: timeStr, keterangan: `Billing Dicetak (${billId})` }
    ]
  }).write();

  res.status(201).json({
    success: true, message: 'Transaksi berhasil.',
    data: { trxId, doId, billId, resiId, dateStr, total }
  });
});

module.exports = router;
