/* script-api.js — API Adapter Layer
 * File ini di-load SETELAH script.js dan menimpa fungsi data
 * yang sebelumnya menggunakan localStorage, menjadi API calls.
 */

// ─── OVERRIDE: Inisialisasi data dari API ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const isLoginPage = ['index.html','','index'].includes(window.location.pathname.split('/').pop());
  if (isLoginPage) return;

  if (sessionStorage.getItem('isLoggedIn') !== 'true') return;

  try {
    // Load stok & history dari backend, timpa variabel global
    [stockStore, historyStore] = await Promise.all([apiGetStok(), apiGetHistory()]);

    // Re-render setelah data API loaded
    if (document.getElementById('greeting'))       renderDashboard();
    if (document.getElementById('historyTableBody')) renderHistoryTable();
    if (document.getElementById('stokGrid'))       renderStockGrid();
    if (document.getElementById('billingList'))    setupTracking();
  } catch (err) {
    showApiError(err.message);
  }
});

// ─── OVERRIDE: Login ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  // Ganti event listener login lama dengan yang baru pakai API
  const newForm = loginForm.cloneNode(true);
  loginForm.parentNode.replaceChild(newForm, loginForm);

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass  = document.getElementById('password').value;
    const btn   = newForm.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

    try {
      const res = await apiLogin(email, pass);
      if (res.success) window.location.replace('dashboard.html');
    } catch (err) {
      alert(err.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
    }
  });
});

// ─── OVERRIDE: Logout ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a').forEach(a => {
    const t = a.textContent.trim().toLowerCase();
    if (t.includes('logout') || t.includes('keluar')) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        apiLogout();
        window.location.replace('index.html');
      });
    }
  });
});

// ─── OVERRIDE: Tambah Stok ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const addForm = document.getElementById('addForm');
  if (!addForm) return;

  const newForm = addForm.cloneNode(true);
  addForm.parentNode.replaceChild(newForm, addForm);

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlVal = (document.getElementById('coverUrl')?.value || '').trim();
    const cover  = window._coverBase64 || urlVal || 'img/placeholder.jpg';
    const payload = {
      kodeBarang: document.getElementById('kode').value,
      kodeLokasi: document.getElementById('lokasi').value,
      namaBarang: document.getElementById('nama').value,
      jenisBarang: document.getElementById('jenis').value,
      edisi: document.getElementById('edisi').value,
      stok: parseInt(document.getElementById('stok').value),
      limit: 1000,
      cover
    };
    try {
      const res = await apiAddStok(payload);
      stockStore = await apiGetStok();
      renderStockGrid();
      document.getElementById('addModal').classList.remove('show');
      setTimeout(() => document.getElementById('addModal').style.display = 'none', 300);
      showToast(res.message || 'Bahan ajar berhasil ditambahkan!');
      newForm.reset();
      window._coverBase64 = null;
    } catch (err) { showApiError(err.message); }
  });
});

// ─── OVERRIDE: Hapus Stok ────────────────────────────────────────────────────
window.openDeleteConfirm = (kode) => {
  window._deleteTargetKode = kode;
  const item = stockStore.find(b => b.kodeBarang === kode);
  const msgEl = document.getElementById('deleteModalMsg');
  if (item && msgEl) msgEl.textContent = `"${item.namaBarang}" (${kode}) akan dihapus secara permanen.`;
  const m = document.getElementById('deleteModal');
  if (m) { m.style.display = 'flex'; setTimeout(() => m.classList.add('show'), 10); }
};

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('confirmDeleteBtn');
  if (!btn) return;
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', async () => {
    const kode = window._deleteTargetKode;
    if (!kode) return;
    try {
      const res = await apiDeleteStok(kode);
      stockStore = await apiGetStok();
      renderStockGrid();
      const m = document.getElementById('deleteModal');
      if (m) { m.classList.remove('show'); setTimeout(() => m.style.display = 'none', 300); }
      showToast(res.message || 'Berhasil dihapus.');
      window._deleteTargetKode = null;
    } catch (err) { showApiError(err.message); }
  });
});

// ─── OVERRIDE: Checkout ──────────────────────────────────────────────────────
window.checkout = async () => {
  if (!cart.length) return;
  const pengguna = sessionStorage.getItem('userName') || 'Pengguna';

  try {
    const res = await apiCheckout(cart, pengguna);
    const { trxId, doId, billId, resiId, dateStr, total } = res.data;

    // Build receipt HTML
    let itemsHtml = '';
    cart.forEach(item => {
      const sub = (item.price || 150000) * item.qty;
      itemsHtml += `<div class="receipt-item"><span>${item.nama} x${item.qty}</span><span>Rp ${sub.toLocaleString()}</span></div>`;
    });

    const receiptHtml = `
      <div class="receipt-paper">
        <div class="receipt-header" style="margin-bottom:10px">
          <h3 style="margin:0;color:#000;font-size:16px">SITTA UNIVERSITAS TERBUKA</h3>
          <p style="font-size:9px;margin:3px 0">Sistem Informasi Transaksi & Tracking Bahan Ajar</p>
          <p style="font-size:11px;font-weight:bold;margin-top:5px;border-top:1px solid #000;padding-top:5px">STRUK PENGIRIMAN RESMI</p>
        </div>
        <div style="font-size:11px;margin-bottom:10px;line-height:1.4">
          <div style="display:flex;justify-content:space-between"><span>ID TRX:</span><strong>${trxId}</strong></div>
          <div style="display:flex;justify-content:space-between"><span>NO. DO:</span><strong>${doId}</strong></div>
          <div style="display:flex;justify-content:space-between;color:#d32f2f"><span>NO. BILLING:</span><strong>${billId}</strong></div>
          <div style="display:flex;justify-content:space-between;color:#1976d2"><span>NO. RESI:</span><strong>${resiId}</strong></div>
          <div style="display:flex;justify-content:space-between;border-top:1px dashed #ccc;margin-top:5px;padding-top:5px"><span>TANGGAL:</span><span>${dateStr}</span></div>
          <div style="display:flex;justify-content:space-between"><span>PETUGAS:</span><span>${pengguna}</span></div>
        </div>
        <div style="border-top:1px solid #000;padding-top:8px">${itemsHtml}</div>
        <div class="receipt-total" style="font-size:16px;margin-top:10px"><span>TOTAL:</span><span>Rp ${total.toLocaleString()}</span></div>
        <div class="receipt-footer"><p style="font-weight:bold">BARANG DALAM PROSES KIRIM</p><p>Pantau nomor resi di menu Tracking.</p></div>
      </div>`;

    // Refresh data dari server
    [stockStore, historyStore] = await Promise.all([apiGetStok(), apiGetHistory()]);
    if (document.getElementById('stokGrid')) renderStockGrid();
    if (document.getElementById('greeting')) renderDashboard();

    // Show receipt
    const receiptModal   = document.getElementById('receiptModal');
    const receiptContent = document.getElementById('receiptContent');
    if (receiptModal && receiptContent) {
      receiptContent.innerHTML = receiptHtml;
      receiptModal.style.display = 'flex';
      setTimeout(() => receiptModal.classList.add('show'), 10);
    }

    // Clear cart
    cart = [];
    localStorage.removeItem('sitta_cart');
    const cartModal = document.getElementById('cartModal');
    if (cartModal) { cartModal.classList.remove('show'); setTimeout(() => cartModal.style.display = 'none', 300); }
    updateCartBadge();
  } catch (err) { showApiError(err.message); }
};

// ─── OVERRIDE: Tracking Search ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchDO');
  if (!searchBtn) return;

  const newBtn = searchBtn.cloneNode(true);
  searchBtn.parentNode.replaceChild(newBtn, searchBtn);

  newBtn.addEventListener('click', async () => {
    const doVal     = document.getElementById('doNumber').value.trim();
    const resultDiv = document.getElementById('trackingResult');
    if (!doVal || !resultDiv) return;

    resultDiv.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    try {
      const res  = await apiGetTracking(doVal);
      const data = res.data;

      let timelineHtml = '';
      data.perjalanan.forEach((p, idx) => {
        const isActive = idx === data.perjalanan.length - 1 ? 'active' : '';
        timelineHtml += `
          <div class="timeline-item ${isActive}" style="display:flex;gap:20px;margin-bottom:20px">
            <div style="width:12px;height:12px;border-radius:50%;background:${isActive ? 'var(--primary)' : 'var(--border)'};margin-top:5px;box-shadow:${isActive ? '0 0 10px var(--primary)' : 'none'}"></div>
            <div><div style="font-size:12px;color:var(--text-muted)">${p.waktu}</div><div style="font-weight:600">${p.keterangan}</div></div>
          </div>`;
      });

      resultDiv.innerHTML = `
        <div class="card" style="animation:slideUp 0.4s ease;background:var(--surface);border:1px solid var(--border);padding:25px;border-radius:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;border-bottom:1px solid var(--border);padding-bottom:15px">
            <div><h4 style="color:var(--secondary);margin-bottom:5px;font-size:12px">NO. DO: ${data.nomorDO}</h4><h2 style="margin:0;font-size:22px">${data.nama}</h2></div>
            <span class="badge badge-info" style="font-size:12px;padding:6px 12px">${data.status}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px;background:rgba(255,255,255,0.03);padding:20px;border-radius:12px;border:1px solid var(--border)">
            <div><span style="display:block;font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:5px">Ekspedisi</span><strong>${data.ekspedisi}</strong></div>
            <div><span style="display:block;font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:5px">Tanggal</span><strong>${data.tanggalKirim}</strong></div>
            <div><span style="display:block;font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:5px">Total</span><strong>${data.total}</strong></div>
          </div>
          <h3 style="font-size:16px;margin-bottom:25px"><i class="fas fa-route" style="margin-right:10px;color:var(--primary)"></i>Riwayat Perjalanan</h3>
          <div style="padding-left:5px;position:relative">
            <div style="position:absolute;left:5px;top:10px;bottom:20px;width:2px;background:var(--border)"></div>
            ${timelineHtml}
          </div>
        </div>`;
    } catch (err) {
      resultDiv.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger);background:var(--surface);border-radius:16px;border:1px solid var(--border)"><i class="fas fa-exclamation-triangle" style="font-size:32px;margin-bottom:15px"></i><p>${err.message}</p></div>`;
    }
  });
});

// ─── HELPER: Show API Error ───────────────────────────────────────────────────
function showApiError(msg) {
  let toast = document.querySelector('.sitta-toast');
  if (toast) toast.remove();
  toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;padding:12px 25px;background:#ef4444;color:white;border-radius:30px;box-shadow:0 4px 20px rgba(239,68,68,0.4);display:flex;align-items:center;gap:10px;max-width:80%;text-align:center';
  toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}
