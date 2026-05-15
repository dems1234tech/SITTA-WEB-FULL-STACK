// server.js — SITTA Full-Stack Single File Backend
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'sitta_secret_key_ut_2026';

// ─── DATABASE SETUP ──────────────────────────────────────────────────────────
const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

db.defaults({
  users: [
    { id: 1, nama: 'Rina Wulandari',  email: 'rina@ut.ac.id',  password: 'rina123',  role: 'UPBJJ-UT',      lokasi: 'UPBJJ Jakarta'  },
    { id: 2, nama: 'Agus Pranoto',    email: 'agus@ut.ac.id',  password: 'agus123',  role: 'UPBJJ-UT',      lokasi: 'UPBJJ Makassar' },
    { id: 3, nama: 'Siti Marlina',    email: 'siti@ut.ac.id',  password: 'siti123',  role: 'Puslaba',       lokasi: 'Pusat'          },
    { id: 4, nama: 'Doni Setiawan',   email: 'doni@ut.ac.id',  password: 'doni123',  role: 'Fakultas',      lokasi: 'FISIP'          },
    { id: 5, nama: 'Admin SITTA',     email: 'admin@ut.ac.id', password: 'admin123', role: 'Administrator', lokasi: 'Pusat'          }
  ],
  stok: [
    { kodeBarang: 'ASIP4301', kodeLokasi: '0TMP01',     namaBarang: 'Pengantar Ilmu Komunikasi',  jenisBarang: 'BMP', edisi: '2', stok: 548, limit: 1000, cover: 'img/pengantar_komunikasi.jpg' },
    { kodeBarang: 'EKMA4216', kodeLokasi: '0JKT01',     namaBarang: 'Manajemen Keuangan',         jenisBarang: 'BMP', edisi: '3', stok: 392, limit: 800,  cover: 'img/manajemen_keuangan.jpg'   },
    { kodeBarang: 'EKMA4310', kodeLokasi: '0SBY02',     namaBarang: 'Kepemimpinan',               jenisBarang: 'BMP', edisi: '1', stok: 278, limit: 500,  cover: 'img/kepemimpinan.jpg'         },
    { kodeBarang: 'BIOL4211', kodeLokasi: '0MLG01',     namaBarang: 'Mikrobiologi Dasar',         jenisBarang: 'BMP', edisi: '2', stok: 165, limit: 400,  cover: 'img/mikrobiologi.jpg'         },
    { kodeBarang: 'PAUD4401', kodeLokasi: '0UPBJJBDG',  namaBarang: 'Perkembangan Anak Usia Dini',jenisBarang: 'BMP', edisi: '4', stok: 204, limit: 600,  cover: 'img/paud_perkembangan.jpg'    }
  ],
  history: [],
  tracking: []
}).write();

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // Serve frontend from root

// Auth Middleware
const verifyToken = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Silakan login.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Sesi berakhir.' });
  }
};

// ─── API ROUTES ──────────────────────────────────────────────────────────────

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Auth
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.get('users').find({ email, password }).value();
  if (!user) return res.status(401).json({ success: false, message: 'Email/password salah.' });
  const token = jwt.sign({ id: user.id, nama: user.nama, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ success: true, token, user });
});

// Stok CRUD
app.get('/api/stok', (req, res) => res.json({ success: true, data: db.get('stok').value() }));

app.post('/api/stok', verifyToken, (req, res) => {
  const exists = db.get('stok').find({ kodeBarang: req.body.kodeBarang }).value();
  if (exists) return res.status(400).json({ success: false, message: 'Kode sudah ada.' });
  db.get('stok').push(req.body).write();
  res.json({ success: true, message: 'Berhasil!' });
});

app.delete('/api/stok/:kode', verifyToken, (req, res) => {
  db.get('stok').remove({ kodeBarang: req.params.kode }).write();
  res.json({ success: true });
});

// History & Checkout
app.get('/api/history', (req, res) => {
  const { q } = req.query;
  let data = db.get('history').value();
  if (q) {
    const lq = q.toLowerCase();
    data = data.filter(h => h.pengguna.toLowerCase().includes(lq) || h.bahanAjar.toLowerCase().includes(lq) || h.nomorDO.includes(lq));
  }
  res.json({ success: true, data: data.map(h => ({ ...h, do: h.nomorDO, bill: h.nomorBill, resi: h.nomorResi })) });
});

app.post('/api/history', verifyToken, (req, res) => {
  const { items, pengguna } = req.body;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const doId = 'DO-' + Math.floor(Math.random() * 1000000);

  items.forEach(item => {
    const stock = db.get('stok').find({ kodeBarang: item.kode }).value();
    db.get('stok').find({ kodeBarang: item.kode }).assign({ stok: Math.max(0, stock.stok - item.qty) }).write();
    db.get('history').push({ id: 'TRX-'+Math.random(), tanggal: dateStr, nomorDO: doId, nomorBill: 'BILL-'+Math.random(), nomorResi: 'RESI-'+Math.random(), pengguna, bahanAjar: item.nama, jumlah: item.qty, status: 'Proses' }).write();
  });

  db.get('tracking').push({ nomorDO: doId, nama: pengguna, status: 'Proses', ekspedisi: 'SITTA Logistics', tanggalKirim: dateStr, progress: 20, perjalanan: [{ waktu: now.toLocaleString(), keterangan: 'Pesanan Diterima' }] }).write();

  res.json({ success: true, data: { doId, dateStr } });
});

// Tracking
app.get('/api/tracking/:do', (req, res) => {
  const data = db.get('tracking').find({ nomorDO: req.params.do }).value();
  if (!data) return res.status(404).json({ success: false, message: 'Tidak ditemukan.' });
  res.json({ success: true, data });
});

// Start
app.listen(PORT, () => console.log(`🚀 SITTA Backend running on port ${PORT}`));
