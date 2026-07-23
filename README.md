# Aplikasi Absensi Guru Olahraga (PJOK)

Aplikasi Web Absensi khusus Guru Olahraga (PJOK) sekolah yang dirancang modern, cepat, mobile-friendly (tombol besar untuk penggunaan di lapangan), mendukung deteksi otomatis jadwal aktif, GPS lokasi, foto kegiatan/dokumentasi, QR Code, serta Dashboard Admin & Export Laporan (PDF & Excel).

## 🚀 Fitur Utama

- **Autentikasi Guru & Permisi Role (Guru PJOK)**
- **Deteksi Pelajaran Aktif & Time Lock Otomatis**
- **Form Absensi Siswa Lapangan (Hadir, Sakit, Izin, Alpa, Terlambat, "Semua Hadir")**
- **Scanner QR Code Kartu Siswa & Manual Input NISN**
- **Tag GPS Lokasi & Foto Dokumentasi Kegiatan Olahraga**
- **Kelola Data Siswa, Kelas, dan Jadwal Pelajaran Olahraga**
- **Riwayat Kehadiran & Analytics Persentase Kehadiran**
- **Export Laporan Harian, Mingguan, Bulanan ke PDF Resmi & Excel (.xlsx)**

## 🛠️ Teknologi & Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **Backend & Database:** Supabase PostgreSQL & Supabase Auth
- **Deployment:** Netlify Ready
- **PWA & Offline:** Service Worker Ready

## 🔑 Menjalankan di Lokal

1. Clone repository ini:
   ```bash
   git clone https://github.com/ciphershadowpulse-sys/PJOK.git
   cd PJOK
   ```
2. Install dependensi:
   ```bash
   npm install
   ```
3. Buat file `.env` dan masukkan kredensial Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
   ```
4. Jalankan server lokal:
   ```bash
   npm run dev
   ```
