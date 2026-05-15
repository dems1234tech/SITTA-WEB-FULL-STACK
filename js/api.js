/* api.js — SITTA Frontend API Helper
 * Semua komunikasi ke backend terpusat di sini.
 * Gantikan localStorage dengan fungsi-fungsi ini.
 */

// Menggunakan URL tunnel publik jika dibuka dari GitHub Pages, 
// jika tidak, gunakan path relatif (bekerja di localhost & tunnel langsung).
const API_BASE = window.location.origin.includes('github.io') 
  ? 'https://urban-ceo-reynolds-nations.trycloudflare.com/api' 
  : (window.location.origin + '/api');

// ─── TOKEN MANAGEMENT ─────────────────────────────────────────────────────────
function getToken() {
  return sessionStorage.getItem('sitta_token');
}

function setToken(token) {
  sessionStorage.setItem('sitta_token', token);
}

function clearToken() {
  sessionStorage.removeItem('sitta_token');
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('userName');
}

// ─── BASE FETCH WRAPPER ───────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP Error ${res.status}`);
    return data;
  } catch (err) {
    // Jika backend offline, lempar error dengan pesan jelas
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('❌ Server backend tidak berjalan! Jalankan: cd backend && node server.js');
    }
    throw err;
  }
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
async function apiLogin(email, password) {
  const res = await apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (res.success) {
    setToken(res.token);
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userName', res.user.nama);
    sessionStorage.setItem('userRole', res.user.role);
  }
  return res;
}

function apiLogout() {
  clearToken();
}

// ─── STOK ─────────────────────────────────────────────────────────────────────
async function apiGetStok() {
  const res = await apiFetch('/stok');
  return res.data;
}

async function apiAddStok(item) {
  return apiFetch('/stok', { method: 'POST', body: JSON.stringify(item) });
}

async function apiUpdateStok(kode, updates) {
  return apiFetch(`/stok/${kode}`, { method: 'PUT', body: JSON.stringify(updates) });
}

async function apiDeleteStok(kode) {
  return apiFetch(`/stok/${kode}`, { method: 'DELETE' });
}

// ─── HISTORY ──────────────────────────────────────────────────────────────────
async function apiGetHistory(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await apiFetch(`/history${qs ? '?' + qs : ''}`);
  return res.data;
}

async function apiCheckout(items, pengguna) {
  return apiFetch('/history', {
    method: 'POST',
    body: JSON.stringify({ items, pengguna })
  });
}

// ─── TRACKING ─────────────────────────────────────────────────────────────────
async function apiGetTracking(nomorDO) {
  return apiFetch(`/tracking/${encodeURIComponent(nomorDO)}`);
}
