-- SCHEMA DATABASE UNTUK APLIKASI ABSENSI GURU OLAHRAGA (PJOK)
-- POSTGRESQL DDL (MENGGUNAKAN VARCHAR STRING ID KONTINU, TANPA TYPE UUID)

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('guru');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE jenis_kelamin_enum AS ENUM ('L', 'P');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_absensi_enum AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hari_enum AS ENUM ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABEL USERS (Profil / Pengguna System)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    role user_role NOT NULL DEFAULT 'guru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL GURU
CREATE TABLE IF NOT EXISTS guru (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    nama_guru VARCHAR(150) NOT NULL,
    nip VARCHAR(50) UNIQUE NOT NULL,
    mata_pelajaran VARCHAR(50) DEFAULT 'PJOK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL KELAS
CREATE TABLE IF NOT EXISTS kelas (
    id VARCHAR(100) PRIMARY KEY,
    nama_kelas VARCHAR(50) NOT NULL,
    tingkat VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL SISWA
CREATE TABLE IF NOT EXISTS siswa (
    id VARCHAR(100) PRIMARY KEY,
    nis VARCHAR(30) UNIQUE NOT NULL,
    nama_siswa VARCHAR(150) NOT NULL,
    kelas_id VARCHAR(100) REFERENCES kelas(id) ON DELETE CASCADE,
    jenis_kelamin jenis_kelamin_enum NOT NULL DEFAULT 'L',
    qr_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABEL JADWAL PELAJARAN
CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
    id VARCHAR(100) PRIMARY KEY,
    guru_id VARCHAR(100) REFERENCES guru(id) ON DELETE CASCADE,
    kelas_id VARCHAR(100) REFERENCES kelas(id) ON DELETE CASCADE,
    hari hari_enum NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    mata_pelajaran VARCHAR(50) DEFAULT 'PJOK',
    lokasi VARCHAR(100) DEFAULT 'Lap. Utama Sekolah',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABEL ABSENSI
CREATE TABLE IF NOT EXISTS absensi (
    id VARCHAR(100) PRIMARY KEY,
    siswa_id VARCHAR(100) REFERENCES siswa(id) ON DELETE CASCADE,
    jadwal_id VARCHAR(100) REFERENCES jadwal_pelajaran(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    status status_absensi_enum NOT NULL DEFAULT 'Hadir',
    keterangan TEXT,
    foto_kegiatan TEXT,
    gps_lat NUMERIC(10, 8),
    gps_lng NUMERIC(11, 8),
    is_synced BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_siswa_jadwal_tanggal UNIQUE (siswa_id, jadwal_id, tanggal)
);

-- 8. TABEL AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    aksi VARCHAR(100) NOT NULL,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. HAPUS PEMBATASAN RLS (ROW LEVEL SECURITY) DAN BUAT KEBIJAKAN IZIN PERMISSIVE
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE guru DISABLE ROW LEVEL SECURITY;
ALTER TABLE kelas DISABLE ROW LEVEL SECURITY;
ALTER TABLE siswa DISABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_pelajaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE absensi DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_pelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on users" ON users;
CREATE POLICY "Allow all on users" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on guru" ON guru;
CREATE POLICY "Allow all on guru" ON guru FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on kelas" ON kelas;
CREATE POLICY "Allow all on kelas" ON kelas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on siswa" ON siswa;
CREATE POLICY "Allow all on siswa" ON siswa FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on jadwal_pelajaran" ON jadwal_pelajaran;
CREATE POLICY "Allow all on jadwal_pelajaran" ON jadwal_pelajaran FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on absensi" ON absensi;
CREATE POLICY "Allow all on absensi" ON absensi FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on audit_logs" ON audit_logs;
CREATE POLICY "Allow all on audit_logs" ON audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 10. BERIKAN HAK AKSES PENUH (GRANT) UNTUK PERAN ANON & AUTHENTICATED
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, postgres, service_role;

-- 11. AUTOMATIC TRIGGER PENDAFTARAN DARI SUPABASE AUTH KE TABEL PUBLIC USERS & GURU
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert ke tabel public.users
  INSERT INTO public.users (id, nama, username, email, role)
  VALUES (
    NEW.id::VARCHAR,
    COALESCE(NEW.raw_user_meta_data->>'nama', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    'guru'::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    nama = EXCLUDED.nama,
    username = EXCLUDED.username,
    email = EXCLUDED.email;

  -- Insert ke tabel public.guru
  INSERT INTO public.guru (id, user_id, nama_guru, nip, mata_pelajaran)
  VALUES (
    CONCAT('guru_', NEW.id::VARCHAR),
    NEW.id::VARCHAR,
    COALESCE(NEW.raw_user_meta_data->>'nama', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'nip', ''), CONCAT('NIP-', FLOOR(EXTRACT(EPOCH FROM NOW())))),
    'PJOK'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger pada tabel auth.users Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SAMPLE SEED DATA UNTUK PENGUJIAN LOKAL & SYSTEM
INSERT INTO users (id, nama, username, email, role) VALUES
  ('usr_budi', 'Pak Budi Prasetyo, S.Pd', 'budi_pjok', 'budi@sekolah.sch.id', 'guru'),
  ('usr_siti', 'Bu Siti Aminah, S.Pd', 'siti_pjok', 'siti@sekolah.sch.id', 'guru')
ON CONFLICT DO NOTHING;

INSERT INTO guru (id, user_id, nama_guru, nip, mata_pelajaran) VALUES
  ('guru_budi', 'usr_budi', 'Pak Budi Prasetyo, S.Pd', '198504122010011005', 'PJOK'),
  ('guru_siti', 'usr_siti', 'Bu Siti Aminah, S.Pd', '198809232012022008', 'PJOK')
ON CONFLICT DO NOTHING;

INSERT INTO kelas (id, nama_kelas, tingkat) VALUES
  ('kelas_5a', '5A', '5'),
  ('kelas_5b', '5B', '5'),
  ('kelas_6a', '6A', '6')
ON CONFLICT DO NOTHING;

INSERT INTO jadwal_pelajaran (id, guru_id, kelas_id, hari, jam_mulai, jam_selesai, mata_pelajaran, lokasi) VALUES
  ('jadwal_1', 'guru_budi', 'kelas_5a', 'Senin', '07:00:00', '08:30:00', 'PJOK', 'Lap. Basket Utama'),
  ('jadwal_2', 'guru_budi', 'kelas_5b', 'Senin', '08:30:00', '10:00:00', 'PJOK', 'Lap. Sepak Bola'),
  ('jadwal_3', 'guru_budi', 'kelas_6a', 'Selasa', '07:00:00', '08:30:00', 'PJOK', 'Lap. Serbaguna')
ON CONFLICT DO NOTHING;

INSERT INTO siswa (id, nis, nama_siswa, kelas_id, jenis_kelamin, qr_code) VALUES
  ('siswa_1001', '1001', 'Ahmad Rizky Pratama', 'kelas_5a', 'L', 'QR-1001'),
  ('siswa_1002', '1002', 'Anisa Rahmawati', 'kelas_5a', 'P', 'QR-1002'),
  ('siswa_1003', '1003', 'Bagus Setiawan', 'kelas_5a', 'L', 'QR-1003'),
  ('siswa_1004', '1004', 'Citra Dewi Permata', 'kelas_5a', 'P', 'QR-1004'),
  ('siswa_1005', '1005', 'Daffa Al-Farizi', 'kelas_5a', 'L', 'QR-1005'),
  ('siswa_1006', '1006', 'Eka Putri Lestari', 'kelas_5a', 'P', 'QR-1006'),
  ('siswa_1007', '1007', 'Fajar Maulana', 'kelas_5a', 'L', 'QR-1007'),
  ('siswa_1008', '1008', 'Gita Gutawa Putri', 'kelas_5a', 'P', 'QR-1008'),
  ('siswa_1009', '1009', 'Hendra Kurniawan', 'kelas_5a', 'L', 'QR-1009'),
  ('siswa_1010', '1010', 'Indah Permatasari', 'kelas_5a', 'P', 'QR-1010'),
  ('siswa_1011', '1011', 'Bimo Putro', 'kelas_5b', 'L', 'QR-1011'),
  ('siswa_1012', '1012', 'Dian Sastro', 'kelas_5b', 'P', 'QR-1012')
ON CONFLICT DO NOTHING;
