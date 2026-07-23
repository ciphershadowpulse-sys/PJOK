import { supabase, isSupabaseConfigured } from '../lib/supabase';

// INITIAL SEED DATA FOR STANDALONE & DEMO MODE
const INITIAL_USERS = [
  { id: 'u1', nama: 'Pak Budi Prasetyo, S.Pd', username: 'budi_pjok', email: 'budi@sekolah.sch.id', role: 'guru' },
  { id: 'u2', nama: 'Bu Siti Aminah, S.Pd', username: 'siti_pjok', email: 'siti@sekolah.sch.id', role: 'guru' }
];

const INITIAL_GURU = [
  { id: 'g1', user_id: 'u1', nama_guru: 'Pak Budi Prasetyo, S.Pd', nip: '198504122010011005', mata_pelajaran: 'PJOK' },
  { id: 'g2', user_id: 'u2', nama_guru: 'Bu Siti Aminah, S.Pd', nip: '198809232012022008', mata_pelajaran: 'PJOK' }
];

const INITIAL_KELAS = [
  { id: 'k1', nama_kelas: '5A', tingkat: '5' },
  { id: 'k2', nama_kelas: '5B', tingkat: '5' },
  { id: 'k3', nama_kelas: '6A', tingkat: '6' },
  { id: 'k4', nama_kelas: '6B', tingkat: '6' }
];

const INITIAL_SISWA = [
  { id: 's01', nis: '1001', nama_siswa: 'Ahmad Rizky Pratama', kelas_id: 'k1', jenis_kelamin: 'L', qr_code: 'QR-1001' },
  { id: 's02', nis: '1002', nama_siswa: 'Anisa Rahmawati', kelas_id: 'k1', jenis_kelamin: 'P', qr_code: 'QR-1002' },
  { id: 's03', nis: '1003', nama_siswa: 'Bagus Setiawan', kelas_id: 'k1', jenis_kelamin: 'L', qr_code: 'QR-1003' },
  { id: 's04', nis: '1004', nama_siswa: 'Citra Dewi Permata', kelas_id: 'k1', jenis_kelamin: 'P', qr_code: 'QR-1004' },
  { id: 's05', nis: '1005', nama_siswa: 'Daffa Al-Farizi', kelas_id: 'k1', jenis_kelamin: 'L', qr_code: 'QR-1005' },
  { id: 's06', nis: '1006', nama_siswa: 'Eka Putri Lestari', kelas_id: 'k1', jenis_kelamin: 'P', qr_code: 'QR-1006' },
  { id: 's07', nis: '1007', nama_siswa: 'Fajar Maulana', kelas_id: 'k1', jenis_kelamin: 'L', qr_code: 'QR-1007' },
  { id: 's08', nis: '1008', nama_siswa: 'Gita Gutawa Putri', kelas_id: 'k1', jenis_kelamin: 'P', qr_code: 'QR-1008' },
  { id: 's09', nis: '1009', nama_siswa: 'Hendra Kurniawan', kelas_id: 'k1', jenis_kelamin: 'L', qr_code: 'QR-1009' },
  { id: 's10', nis: '1010', nama_siswa: 'Indah Permatasari', kelas_id: 'k1', jenis_kelamin: 'P', qr_code: 'QR-1010' },
  { id: 's11', nis: '1011', nama_siswa: 'Bimo Putro Nugroho', kelas_id: 'k2', jenis_kelamin: 'L', qr_code: 'QR-1011' },
  { id: 's12', nis: '1012', nama_siswa: 'Dian Sastrowardoyo', kelas_id: 'k2', jenis_kelamin: 'P', qr_code: 'QR-1012' }
];

const INITIAL_JADWAL = [
  { id: 'j1', guru_id: 'g1', kelas_id: 'k1', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: 'PJOK', lokasi: 'Lap. Basket Utama' },
  { id: 'j2', guru_id: 'g1', kelas_id: 'k2', hari: 'Senin', jam_mulai: '08:30', jam_selesai: '10:00', mata_pelajaran: 'PJOK', lokasi: 'Lap. Sepak Bola' },
  { id: 'j3', guru_id: 'g1', kelas_id: 'k3', hari: 'Selasa', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: 'PJOK', lokasi: 'Lap. Serbaguna' },
  { id: 'j4', guru_id: 'g2', kelas_id: 'k4', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: 'PJOK', lokasi: 'Lap. Bulutangkis' }
];

// Helper LocalStorage
function getLocal(key, defaultValue) {
  try {
    const data = localStorage.getItem(`pjok_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setLocal(key, value) {
  try {
    localStorage.setItem(`pjok_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// Inisialisasi Mock Store jika belum ada
export function initLocalStorage() {
  if (!localStorage.getItem('pjok_users')) setLocal('users', INITIAL_USERS);
  if (!localStorage.getItem('pjok_guru')) setLocal('guru', INITIAL_GURU);
  if (!localStorage.getItem('pjok_kelas')) setLocal('kelas', INITIAL_KELAS);
  if (!localStorage.getItem('pjok_siswa')) setLocal('siswa', INITIAL_SISWA);
  if (!localStorage.getItem('pjok_jadwal')) setLocal('jadwal', INITIAL_JADWAL);
  if (!localStorage.getItem('pjok_absensi')) setLocal('absensi', []);
  if (!localStorage.getItem('pjok_audit_logs')) setLocal('audit_logs', []);
  if (!localStorage.getItem('pjok_pending_sync')) setLocal('pending_sync', []);
}

initLocalStorage();

// SERVICE AUDIT LOG
export async function logAudit(userId, aksi, detail) {
  const log = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    user_id: userId,
    aksi,
    detail,
    created_at: new Date().toISOString()
  };
  const logs = getLocal('audit_logs', []);
  logs.unshift(log);
  setLocal('audit_logs', logs);

  if (isSupabaseConfigured && navigator.onLine) {
    try {
      await supabase.from('audit_logs').insert([{ user_id: userId, aksi, detail }]);
    } catch (e) {
      console.warn('Supabase audit log insert fallback:', e);
    }
  }
}

// AUTH SERVICE
export async function loginUser(username, password) {
  // Jika Supabase terhubung, coba verifikasi dengan Supabase database
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .single();
      
      if (data && !error) {
        logAudit(data.id, 'LOGIN', `User ${data.nama} (Guru PJOK) login via Supabase.`);
        return data;
      }
    } catch (e) {
      console.log('Supabase login fallback to local storage:', e);
    }
  }

  // Local fallback
  const users = getLocal('users', INITIAL_USERS);
  const matched = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  
  if (!matched) {
    throw new Error('Username atau password tidak ditemukan.');
  }

  logAudit(matched.id, 'LOGIN', `User ${matched.nama} (Guru PJOK) login.`);
  return matched;
}

// GET DATA GURU BY USER ID
export async function getGuruByUserId(userId) {
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('guru')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (data && !error) return data;
    } catch (e) {
      console.warn('Supabase getGuruByUserId fallback:', e);
    }
  }

  const listGuru = getLocal('guru', INITIAL_GURU);
  const found = listGuru.find(g => g.user_id === userId);
  return found || listGuru[0];
}

// JADWAL & PELAJARAN AKTIF SERVICE
export function checkScheduleStatus(jamMulaiStr, jamSelesaiStr, hariJadwal, currentDayStr, currentTimeStr) {
  if (hariJadwal.toLowerCase() !== currentDayStr.toLowerCase()) {
    return 'OTHER_DAY';
  }

  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const startMin = toMinutes(jamMulaiStr);
  const endMin = toMinutes(jamSelesaiStr);
  const curMin = toMinutes(currentTimeStr);

  if (curMin < startMin) {
    return 'PENDING';
  } else if (curMin >= startMin && curMin <= endMin) {
    return 'ACTIVE';
  } else {
    return 'FINISHED';
  }
}

export async function getJadwalGuru(guruId) {
  let jadwals = [];
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('jadwal_pelajaran')
        .select(`
          *,
          kelas:kelas_id(nama_kelas, tingkat),
          guru:guru_id(nama_guru)
        `)
        .eq('guru_id', guruId);
      
      if (data && !error && data.length > 0) {
        return data.map(j => ({
          ...j,
          nama_kelas: j.kelas?.nama_kelas || 'N/A',
          tingkat: j.kelas?.tingkat || '',
          nama_guru: j.guru?.nama_guru || ''
        }));
      }
    } catch (e) {
      console.warn('Supabase getJadwalGuru fallback:', e);
    }
  }

  // Local Fallback
  jadwals = getLocal('jadwal', INITIAL_JADWAL).filter(j => j.guru_id === guruId);
  const kelasList = getLocal('kelas', INITIAL_KELAS);
  const guruList = getLocal('guru', INITIAL_GURU);

  return jadwals.map(j => {
    const k = kelasList.find(item => item.id === j.kelas_id) || {};
    const g = guruList.find(item => item.id === j.guru_id) || {};
    return {
      ...j,
      nama_kelas: k.nama_kelas || 'N/A',
      tingkat: k.tingkat || '',
      nama_guru: g.nama_guru || ''
    };
  });
}

// GET SISWA PER KELAS
export async function getSiswaByKelas(kelasId) {
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .eq('kelas_id', kelasId);
      if (data && !error && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase getSiswaByKelas fallback:', e);
    }
  }

  const siswaList = getLocal('siswa', INITIAL_SISWA);
  return siswaList.filter(s => s.kelas_id === kelasId);
}

// ABSENSI DATA OPERATIONS
export async function getAbsensiRecord(jadwalId, tanggalStr) {
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('absensi')
        .select('*')
        .eq('jadwal_id', jadwalId)
        .eq('tanggal', tanggalStr);
      if (data && !error && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase getAbsensiRecord fallback:', e);
    }
  }

  const absensiList = getLocal('absensi', []);
  return absensiList.filter(a => a.jadwal_id === jadwalId && a.tanggal === tanggalStr);
}

export async function saveAbsensiBatch({ jadwalId, tanggal, records, photoData, gpsLocation, userId }) {
  const allAbsensi = getLocal('absensi', []);
  const filtered = allAbsensi.filter(a => !(a.jadwal_id === jadwalId && a.tanggal === tanggal));
  
  const newRecords = records.map(r => ({
    id: `abs_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    siswa_id: r.siswa_id,
    jadwal_id: jadwalId,
    tanggal,
    status: r.status || 'Hadir',
    keterangan: r.keterangan || '',
    foto_kegiatan: photoData || null,
    gps_lat: gpsLocation?.lat || null,
    gps_lng: gpsLocation?.lng || null,
    is_synced: false,
    created_at: new Date().toISOString()
  }));

  const updated = [...filtered, ...newRecords];
  setLocal('absensi', updated);

  logAudit(userId, 'SIMPAN_ABSENSI', `Guru melakukan simpan absensi jadwal ID ${jadwalId} tanggal ${tanggal} (${newRecords.length} siswa).`);

  // Try direct Supabase Save if online
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const toInsert = newRecords.map(r => ({
        siswa_id: r.siswa_id,
        jadwal_id: r.jadwal_id,
        tanggal: r.tanggal,
        status: r.status,
        keterangan: r.keterangan,
        foto_kegiatan: r.foto_kegiatan,
        gps_lat: r.gps_lat,
        gps_lng: r.gps_lng
      }));
      const { error } = await supabase.from('absensi').upsert(toInsert, { onConflict: 'siswa_id,jadwal_id,tanggal' });
      if (!error) {
        console.log('Saved directly to Supabase DB successfully.');
        return newRecords;
      }
    } catch (e) {
      console.warn('Direct Supabase save failed, queuing for offline sync:', e);
    }
  }

  // Pending queue sync
  const pending = getLocal('pending_sync', []);
  pending.push({ type: 'ABSENSI_BATCH', payload: { jadwalId, tanggal, records: newRecords } });
  setLocal('pending_sync', pending);

  return newRecords;
}

// SYNC ENGINE
export async function syncPendingData() {
  if (!isSupabaseConfigured || !navigator.onLine) return;
  const pending = getLocal('pending_sync', []);
  if (pending.length === 0) return;

  console.log('Synchronizing pending offline data to Supabase backend...');
  const newPending = [];

  for (const item of pending) {
    try {
      if (item.type === 'ABSENSI_BATCH') {
        const { records } = item.payload;
        const toInsert = records.map(r => ({
          siswa_id: r.siswa_id,
          jadwal_id: r.jadwal_id,
          tanggal: r.tanggal,
          status: r.status,
          keterangan: r.keterangan,
          foto_kegiatan: r.foto_kegiatan,
          gps_lat: r.gps_lat,
          gps_lng: r.gps_lng
        }));
        const { error } = await supabase.from('absensi').upsert(toInsert, { onConflict: 'siswa_id,jadwal_id,tanggal' });
        if (error) throw error;
      }
    } catch (e) {
      console.error('Failed to sync item:', item, e);
      newPending.push(item);
    }
  }

  setLocal('pending_sync', newPending);
}

// DATA APIS
export function getAllUsers() { return getLocal('users', INITIAL_USERS); }
export function getAllGuru() { return getLocal('guru', INITIAL_GURU); }
export function getAllKelas() { return getLocal('kelas', INITIAL_KELAS); }
export function getAllSiswa() { return getLocal('siswa', INITIAL_SISWA); }
export function getAllJadwal() { return getLocal('jadwal', INITIAL_JADWAL); }
export function getAllAbsensi() { return getLocal('absensi', []); }
export function getAuditLogs() { return getLocal('audit_logs', []); }

// MUTATIONS WITH SUPABASE SYNC
export async function addOrUpdateSiswa(siswaData) {
  const siswaList = getLocal('siswa', INITIAL_SISWA);
  let updated;
  let newItem;

  if (siswaData.id) {
    updated = siswaList.map(s => s.id === siswaData.id ? { ...s, ...siswaData } : s);
    newItem = { ...siswaData };
  } else {
    newItem = {
      ...siswaData,
      id: `s_${Date.now()}`,
      qr_code: `QR-${siswaData.nis}`
    };
    updated = [...siswaList, newItem];
  }
  setLocal('siswa', updated);

  if (isSupabaseConfigured && navigator.onLine) {
    try {
      await supabase.from('siswa').upsert([newItem]);
    } catch (e) {
      console.warn('Supabase siswa upsert fallback:', e);
    }
  }

  return updated;
}

export async function addOrUpdateJadwal(jadwalData) {
  const jadwals = getLocal('jadwal', INITIAL_JADWAL);
  let updated;
  let newItem;

  if (jadwalData.id) {
    updated = jadwals.map(j => j.id === jadwalData.id ? { ...j, ...jadwalData } : j);
    newItem = { ...jadwalData };
  } else {
    newItem = {
      ...jadwalData,
      id: `j_${Date.now()}`
    };
    updated = [...jadwals, newItem];
  }
  setLocal('jadwal', updated);

  if (isSupabaseConfigured && navigator.onLine) {
    try {
      await supabase.from('jadwal_pelajaran').upsert([newItem]);
    } catch (e) {
      console.warn('Supabase jadwal upsert fallback:', e);
    }
  }

  return updated;
}

export async function deleteJadwal(id) {
  const jadwals = getLocal('jadwal', INITIAL_JADWAL).filter(j => j.id !== id);
  setLocal('jadwal', jadwals);

  if (isSupabaseConfigured && navigator.onLine) {
    try {
      await supabase.from('jadwal_pelajaran').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteJadwal fallback:', e);
    }
  }

  return jadwals;
}

export async function deleteSiswa(id) {
  const siswa = getLocal('siswa', INITIAL_SISWA).filter(s => s.id !== id);
  setLocal('siswa', siswa);

  if (isSupabaseConfigured && navigator.onLine) {
    try {
      await supabase.from('siswa').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteSiswa fallback:', e);
    }
  }

  return siswa;
}
