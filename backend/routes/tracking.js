// routes/tracking.js — Tracking Routes (lowdb)
const express = require('express');
const db = require('../database');
const router = express.Router();

// GET /api/tracking/:do
router.get('/:do', (req, res) => {
  const nomorDO = req.params.do;

  // Cari di tabel tracking
  const tracking = db.get('tracking').find({ nomorDO }).value();
  if (tracking) return res.json({ success: true, data: tracking });

  // Fallback: cari di history
  const histItem = db.get('history').find({ nomorDO }).value();
  if (!histItem)
    return res.status(404).json({ success: false, message: 'Nomor DO tidak ditemukan.' });

  const isSelesai = histItem.status === 'Selesai';
  const perjalanan = [
    { waktu: histItem.tanggal + ' 08:00', keterangan: 'Pesanan Diterima & Diverifikasi' },
    { waktu: histItem.tanggal + ' 10:30', keterangan: `Billing Dicetak (${histItem.nomorBill})` },
    { waktu: histItem.tanggal + ' 14:00', keterangan: 'Bahan Ajar Dikemas di Gudang' },
  ];
  if (isSelesai) perjalanan.push({ waktu: histItem.tanggal + ' 17:00', keterangan: 'Paket Telah Diterima (Selesai)' });

  res.json({
    success: true,
    data: {
      nomorDO, nama: histItem.pengguna, status: histItem.status,
      ekspedisi: 'SITTA Logistics', tanggalKirim: histItem.tanggal,
      total: `Rp ${(histItem.jumlah * 150000).toLocaleString('id-ID')}`,
      progress: isSelesai ? 100 : 50, perjalanan
    }
  });
});

module.exports = router;
