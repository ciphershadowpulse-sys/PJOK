-- SCHEMA DATABASE UNTUK APLIKASI ABSENSI GURU OLAHRAGA (PJOK)
-- SUPABASE POSTGRESQL DDL

-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM ('guru');
CREATE TYPE jenis_kelamin_enum AS ENUM ('L', 'P');
CREATE TYPE status_absensi_enum AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat');
CREATE TYPE hari_enum AS ENUM ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu');

-- 2. TABEL USERS (Profil / Pengguna System)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(150) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    role user_role NOT NULL DEFAULT 'guru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL GURU
CREATE TABLE IF NOT EXISTS guru (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nama_guru VARCHAR(150) NOT NULL,
    nip VARCHAR(30) UNIQUE NOT NULL,
    mata_pelajaran VARCHAR(50) DEFAULT 'PJOK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL KELAS
CREATE TABLE IF NOT EXISTS kelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kelas VARCHAR(50) NOT NULL, -- Contoh: '5A', '5B', '6A'
    tingkat VARCHAR(10) NOT NULL,    -- Contoh: '5', '6'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL SISWA
CREATE TABLE IF NOT EXISTS siswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis VARCHAR(30) UNIQUE NOT NULL,
    nama_siswa VARCHAR(150) NOT NULL,
    kelas_id UUID REFERENCES kelas(id) ON DELETE CASCADE,
    jenis_kelamin jenis_kelamin_enum NOT NULL DEFAULT 'L',
    qr_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABEL JADWAL PELAJARAN
CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id UUID REFERENCES guru(id) ON DELETE CASCADE,
    kelas_id UUID REFERENCES kelas(id) ON DELETE CASCADE,
    hari hari_enum NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    mata_pelajaran VARCHAR(50) DEFAULT 'PJOK',
    lokasi VARCHAR(100) DEFAULT 'Lap. Utama Sekolah',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABEL ABSENSI
CREATE TABLE IF NOT EXISTS absensi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    jadwal_id UUID REFERENCES jadwal_pelajaran(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    aksi VARCHAR(100) NOT NULL,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SAMPLE SEED DATA UNTUK PENGUJIAN
INSERT INTO users (id, nama, username, email, role) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pak Budi Prasetyo, S.Pd', 'budi_pjok', 'budi@sekolah.sch.id', 'guru'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Bu Siti Aminah, S.Pd', 'siti_pjok', 'siti@sekolah.sch.id', 'guru')
ON CONFLICT DO NOTHING;

INSERT INTO guru (id, user_id, nama_guru, nip, mata_pelajaran) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pak Budi Prasetyo, S.Pd', '198504122010011005', 'PJOK'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Bu Siti Aminah, S.Pd', '198809232012022008', 'PJOK')
ON CONFLICT DO NOTHING;

INSERT INTO kelas (id, nama_kelas, tingkat) VALUES
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', '5A', '5'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c22', '5B', '5'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', '6A', '6')
ON CONFLICT DO NOTHING;

INSERT INTO jadwal_pelajaran (id, guru_id, kelas_id, hari, jam_mulai, jam_selesai, mata_pelajaran, lokasi) VALUES
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'Senin', '07:00:00', '08:30:00', 'PJOK', 'Lap. Basket Utama'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c22', 'Senin', '08:30:00', '10:00:00', 'PJOK', 'Lap. Sepak Bola'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Selasa', '07:00:00', '08:30:00', 'PJOK', 'Lap. Serbaguna')
ON CONFLICT DO NOTHING;

INSERT INTO siswa (id, nis, nama_siswa, kelas_id, jenis_kelamin, qr_code) VALUES
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', '1001', 'Ahmad Rizky Pratama', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'L', 'QR-1001'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02', '1002', 'Anisa Rahmawati', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'P', 'QR-1002'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03', '1003', 'Bagus Setiawan', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'L', 'QR-1003'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04', '1004', 'Citra Dewi Permata', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'P', 'QR-1004'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05', '1005', 'Daffa Al-Farizi', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'L', 'QR-1005'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e06', '1006', 'Eka Putri Lestari', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'P', 'QR-1006'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e07', '1007', 'Fajar Maulana', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'L', 'QR-1007'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e08', '1008', 'Gita Gutawa Putri', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'P', 'QR-1008'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e09', '1009', 'Hendra Kurniawan', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'L', 'QR-1009'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e10', '1010', 'Indah Permatasari', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'P', 'QR-1010'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', '1011', 'Bimo Putro', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c22', 'L', 'QR-1011'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e12', '1012', 'Dian Sastro', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c22', 'P', 'QR-1012')
ON CONFLICT DO NOTHING;
