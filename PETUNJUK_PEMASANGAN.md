# PETUNJUK APLIKASI ABSENSI GURU OLAHRAGA (STANDALONE SUPABASE LIVE)

Aplikasi Web Absensi Guru Olahraga (PJOK) telah dibersihkan 100% dari seluruh data mock/demo dan modul simulasi. Aplikasi beroperasi secara **Mandiri, Riil, & Terhubung Langsung ke Backend Supabase Database**.

---

## 🟢 1. Menghubungkan Supabase Database (Live Backend)

1. Buka [Supabase Dashboard](https://supabase.com) dan buat Project Baru.
2. Masuk ke menu **SQL Editor** di Supabase Dashboard.
3. Salin seluruh kode dari file [supabase/schema.sql](file:///c:/Users/Monk/Desktop/PJOK/supabase/schema.sql) dan jalankan (**Run**) di SQL Editor.
4. Salin kredensial API dari **Project Settings -> API**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Masukkan kedua kredensial tersebut ke file `.env` (untuk pengujian lokal) dan ke **Environment Variables** di Netlify.

---

## 🔒 2. Autentikasi Mandiri Guru & Pendaftaran Riil

- **Daftar Guru Baru:** Menggunakan Supabase Auth (`supabase.auth.signUp`) untuk membuat akun Guru secara langsung di Supabase Auth & PostgreSQL Table `users` / `guru`.
- **Login Guru:** Menggunakan Supabase Auth (`supabase.auth.signInWithPassword`). Hanya akun yang telah terdaftar di database Supabase yang dapat masuk.
- **Sesi Login & Guard:** Sesi login tersimpan secara otomatis (`supabase.auth.getSession()`). Pembatasan akses halaman dashboard dilindungi ketat.

---

## 🌐 3. Deployment Netlify Drop

- Netlify murni menjadi tempat bertengger frontend static (`dist`).
- Jalankan kompilasi:
  ```bash
  cmd /c npm run build
  ```
- Upload folder `dist` (`C:\Users\Monk\Desktop\PJOK\dist`) ke **[app.netlify.com/drop](https://app.netlify.com/drop)**.
