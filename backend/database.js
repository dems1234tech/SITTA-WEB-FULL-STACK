// database.js — Setup & Seed JSON Database (lowdb v1)
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// ─── SET DEFAULTS (initial data if db.json is empty) ─────────────────────────
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
  history: [
    { id: 'TRX001', tanggal: '2025-08-20', nomorDO: '2023001234', nomorBill: 'BILL-11111', nomorResi: 'RESI-UT111111', pengguna: 'Rina Wulandari', bahanAjar: 'Manajemen Keuangan',          jumlah: 50, status: 'Selesai' },
    { id: 'TRX002', tanggal: '2025-08-21', nomorDO: '2023005678', nomorBill: 'BILL-22222', nomorResi: 'RESI-UT222222', pengguna: 'Agus Pranoto',   bahanAjar: 'Perkembangan Anak Usia Dini', jumlah: 30, status: 'Selesai' },
    { id: 'TRX003', tanggal: '2025-08-22', nomorDO: '2023009999', nomorBill: 'BILL-33333', nomorResi: 'RESI-UT333333', pengguna: 'Doni Setiawan',  bahanAjar: 'Kepemimpinan',               jumlah: 20, status: 'Proses'  },
    { id: 'TRX004', tanggal: '2025-08-23', nomorDO: '2023007777', nomorBill: 'BILL-44444', nomorResi: 'RESI-UT444444', pengguna: 'Siti Marlina',   bahanAjar: 'Mikrobiologi Dasar',          jumlah: 15, status: 'Proses'  },
    { id: 'TRX005', tanggal: '2025-08-24', nomorDO: '2023003333', nomorBill: 'BILL-55555', nomorResi: 'RESI-UT555555', pengguna: 'Rina Wulandari', bahanAjar: 'Pengantar Ilmu Komunikasi',   jumlah: 40, status: 'Selesai' }
  ],
  tracking: [
    {
      nomorDO: '2023001234', nama: 'Rina Wulandari', status: 'Dalam Perjalanan',
      ekspedisi: 'JNE', tanggalKirim: '2025-08-25', total: 'Rp 180.000', progress: 50,
      perjalanan: [
        { waktu: '2025-08-25 10:12', keterangan: 'Penerimaan di Loket: TANGERANG SELATAN' },
        { waktu: '2025-08-25 14:07', keterangan: 'Tiba di Hub: TANGERANG SELATAN' },
        { waktu: '2025-08-25 17:00', keterangan: 'Diteruskan ke Kantor Jakarta Selatan' }
      ]
    },
    {
      nomorDO: '2023005678', nama: 'Agus Pranoto', status: 'Terkirim',
      ekspedisi: 'Pos Indonesia', tanggalKirim: '2025-08-25', total: 'Rp 220.000', progress: 100,
      perjalanan: [
        { waktu: '2025-08-25 10:12', keterangan: 'Penerimaan di Loket: TANGERANG SELATAN' },
        { waktu: '2025-08-25 14:07', keterangan: 'Tiba di Hub: TANGERANG SELATAN' },
        { waktu: '2025-08-25 16:30', keterangan: 'Diteruskan ke Kantor Kota Bandung' },
        { waktu: '2025-08-26 12:15', keterangan: 'Tiba di Hub: Kota BANDUNG' },
        { waktu: '2025-08-26 15:06', keterangan: 'Proses antar ke Cimahi' },
        { waktu: '2025-08-26 20:00', keterangan: 'Selesai Antar. Penerima: Agus Pranoto' }
      ]
    }
  ]
}).write();

console.log('✅ Database SITTA (db.json) siap.');
module.exports = db;
