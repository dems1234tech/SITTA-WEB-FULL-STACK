// server.js — SITTA Express Server Entry Point
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes     = require('./routes/auth');
const stokRoutes     = require('./routes/stok');
const historyRoutes  = require('./routes/history');
const trackingRoutes = require('./routes/tracking');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static frontend files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api/stok', stokRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/tracking', trackingRoutes);

// ─── API HEALTH CHECK ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SITTA API is running 🚀', timestamp: new Date().toISOString() });
});

// ─── CATCH-ALL: Serve frontend for non-API routes ─────────────────────────────
app.get('*', (req, res) => {
  // Don't catch API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 SITTA Server berjalan di: http://localhost:${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Frontend: http://localhost:${PORT}/\n`);
});
