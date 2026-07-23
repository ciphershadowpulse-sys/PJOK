# PETUNJUK INTEGRASI SUPABASE & DEPLOYMENT NETLIFY

Aplikasi Absensi Guru Olahraga (PJOK) telah dikonfigurasi penuh agar terhubung dengan **Supabase PostgreSQL Database** dan di-deploy ke **Netlify**.

---

## 🟢 1. Menghubungkan Database Supabase (Live Backend)

1. Buka [Supabase Dashboard](https://supabase.com) dan buat Project Baru.
2. Masuk ke menu **SQL Editor** di dashboard Supabase Anda.
3. Buka file [supabase/schema.sql](file:///c:/Users/Monk/Desktop/PJOK/supabase/schema.sql) di project ini, salin seluruh kodenya, dan jalankan (**Run**) di SQL Editor.
4. Salin kunci API dari **Project Settings -> API**:
   - `Project URL`
   - `anon / public API key`
5. Buka file `.env` di folder project Anda (`C:\Users\Monk\Desktop\PJOK\.env`) dan isikan:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

Aplikasi akan **secara otomatis beralih menggunakan Supabase Database** secara live saat `.env` diisi dan koneksi internet tersedia!

---

## 🌐 2. Deploy ke Netlify (Otomatis & Gratis)

### Cara A: Deploy via GitHub (Direkomendasikan)
1. Buat repository baru di GitHub Anda dan push folder `PJOK` ini ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial PJOK Attendance App"
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```
2. Login ke [Netlify.com](https://netlify.com) dan klik **Add new site -> Import an existing project**.
3. Hubungkan ke repository GitHub Anda.
4. Netlify akan membaca file `netlify.toml` secara otomatis:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Masuk ke **Site settings -> Environment variables** di Netlify, lalu tambahkan:
   - Key: `VITE_SUPABASE_URL` | Value: `(URL Supabase Anda)`
   - Key: `VITE_SUPABASE_ANON_KEY` | Value: `(Anon Key Supabase Anda)`
6. Klik **Deploy site**. Aplikasi web Anda langsung aktif & online!

### Cara B: Deploy Manual via Netlify Drop (Drag & Drop)
1. Jalankan build di lokal:
   ```bash
   cmd /c npm run build
   ```
2. Buka [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag & drop folder `dist` (`C:\Users\Monk\Desktop\PJOK\dist`) ke area upload Netlify.

---

## 🔑 Akun Login Guru (Demo)

- **Pak Budi, S.Pd:** Username: `budi_pjok` | Password: `password123`
- **Bu Siti, S.Pd:** Username: `siti_pjok` | Password: `password123`
