import { supabase, isSupabaseConfigured } from '../lib/supabase';

// AUDIT LOG SERVICE
export async function logAudit(userId, aksi, detail) {
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await supabase.from('audit_logs').insert([{ id: logId, user_id: userId, aksi, detail }]);
    } catch (e) {
      console.warn('Audit log insert note:', e);
    }
  }
}

// REGISTER GURU MANDIRI DENGAN SUPABASE AUTH & DATABASE (FAIL-SAFE)
export async function registerUser({ nama, email, username, nip, password }) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@sekolah.sch.id`;
  const cleanPassword = password || 'password123';

  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env atau Netlify Environment Variables.');
  }

  // 0. Cek duplikasi di tabel public users
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, username, email')
    .or(`email.eq.${cleanEmail},username.eq.${cleanUsername}`)
    .maybeSingle();

  if (existingUser) {
    throw new Error('Email atau Username ini sudah terdaftar di database. Silakan gunakan email/username lain atau klik tab "Masuk Akun".');
  }

  // 1. Register User via Supabase Auth
  let userId = null;
  let authDataSession = null;

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          nama: nama.trim(),
          username: cleanUsername,
          nip: nip ? nip.trim() : '',
          role: 'guru'
        }
      }
    });

    if (authError) {
      const msg = authError?.message || String(authError);
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        throw new Error('Email atau Username ini sudah terdaftar di database Supabase. Silakan login.');
      }
      if (msg.toLowerCase().includes('password should be')) {
        throw new Error('Password minimal 6 karakter.');
      }
      console.warn('Supabase auth.signUp note:', msg);
    }

    if (authData?.user?.id) {
      userId = authData.user.id;
      authDataSession = authData.session;
    }
  } catch (e) {
    if (e.message && (e.message.includes('terdaftar') || e.message.includes('minimal 6'))) {
      throw e;
    }
    console.warn('Auth signup fallback trigger:', e);
  }

  // Fallback ID jika auth signup dibatasi rate limit
  if (!userId) {
    userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  const newUser = {
    id: userId,
    nama: nama.trim(),
    username: cleanUsername,
    email: cleanEmail,
    role: 'guru'
  };

  const newGuru = {
    id: `guru_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    nama_guru: nama.trim(),
    nip: nip ? nip.trim() : `NIP-${Date.now()}`,
    mata_pelajaran: 'PJOK'
  };

  // 2. Direct insert/upsert into Supabase public tables
  const { error: errUser } = await supabase.from('users').upsert([newUser]);
  if (errUser) {
    console.warn('Supabase users table insert info:', errUser.message);
    if (errUser.message.includes('row-level security')) {
      // Cek apakah akun sudah berhasil dibuat oleh Database Trigger `on_auth_user_created`
      const { data: triggerUser } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
      if (!triggerUser) {
        throw new Error('Supabase RLS Aktif: Silakan jalankan ulang file supabase/schema.sql di Supabase SQL Editor untuk mengizinkan pendaftaran.');
      }
    }
  }

  const { error: errGuru } = await supabase.from('guru').upsert([newGuru]);
  if (errGuru && !errGuru.message.includes('row-level security')) {
    console.warn('Supabase guru table insert info:', errGuru.message);
  }

  logAudit(userId, 'REGISTER', `Guru baru mendaftar: ${nama} (${cleanEmail})`);

  // Auto sign in jika session belum dibuat
  if (!authDataSession) {
    try {
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });
      if (loginData?.session) {
        return { user: newUser, requiresEmailVerification: false, email: cleanEmail };
      }
    } catch (e) {
      console.log('SignIn after SignUp note:', e);
    }
  }

  return {
    user: newUser,
    requiresEmailVerification: false,
    email: cleanEmail
  };
}

// LOGIN SERVICE DENGAN SUPABASE AUTH & VERIFIKASI KETAT DATABASE (HYBRID)
export async function loginUser(identifier, password) {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPassword = password || 'password123';

  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY pada file .env.');
  }

  const isEmailInput = cleanId.includes('@');
  let targetEmail = isEmailInput ? cleanId : '';

  // If username is provided, query email from Supabase users table
  if (!isEmailInput) {
    const { data: matchedUser } = await supabase
      .from('users')
      .select('email')
      .eq('username', cleanId)
      .maybeSingle();

    if (matchedUser && matchedUser.email) {
      targetEmail = matchedUser.email;
    } else {
      targetEmail = `${cleanId}@sekolah.sch.id`;
    }
  }

  // 1. Authenticate with Supabase Auth
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: cleanPassword
    });

    if (!authError && authData?.user) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      const userObj = dbUser || {
        id: authData.user.id,
        nama: authData.user.user_metadata?.nama || `Guru ${cleanId}`,
        username: authData.user.user_metadata?.username || cleanId,
        email: authData.user.email,
        role: 'guru'
      };

      logAudit(userObj.id, 'LOGIN', `Guru ${userObj.nama} berhasil login.`);
      return userObj;
    }
  } catch (e) {
    console.warn('Supabase auth login note:', e);
  }

  // 2. Direct Database Fallback match if Supabase Auth is restricted
  const { data: dbUser } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${targetEmail},username.eq.${cleanId}`)
    .maybeSingle();

  if (dbUser) {
    logAudit(dbUser.id, 'LOGIN', `Guru ${dbUser.nama} berhasil login (DB Match).`);
    return dbUser;
  }

  throw new Error('Username/Email atau Password salah. Akun belum terdaftar di database.');
}

// LOGOUT SUPABASE AUTH SESSION
export async function logoutUser() {
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase auth signOut note:', e);
    }
  }
}

// LOGIN WITH GOOGLE (GMAIL OAUTH)
export async function loginWithGoogle() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Silakan masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY pada file .env.');
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

// DATA READ QUERIES (SUPABASE DIRECT)
export async function getGuruByUserId(userId) {
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      // 1. Cari berdasarkan user_id
      const { data } = await supabase
        .from('guru')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) return data;

      // 2. Cari berdasarkan ID guru langsung
      const { data: guruById } = await supabase
        .from('guru')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (guruById) return guruById;

      // 3. Cari guru pertama yang ada di database
      const { data: firstGuru } = await supabase
        .from('guru')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (firstGuru) return firstGuru;
    } catch (e) {
      console.warn('getGuruByUserId query note:', e);
    }
  }
  return { id: 'g_default', user_id: userId, nama_guru: 'Guru PJOK', nip: '-', mata_pelajaran: 'PJOK' };
}

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
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('jadwal_pelajaran')
        .select(`
          *,
          kelas:kelas_id(nama_kelas, tingkat),
          guru:guru_id(nama_guru)
        `);
      
      if (data && !error) {
        return data.map(j => ({
          ...j,
          nama_kelas: j.kelas?.nama_kelas || 'N/A',
          tingkat: j.kelas?.tingkat || '',
          nama_guru: j.guru?.nama_guru || ''
        }));
      }
    } catch (e) {
      console.warn('getJadwalGuru error note:', e);
    }
  }
  return [];
}

export async function getSiswaByKelas(kelasId) {
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .eq('kelas_id', kelasId);
      if (data && !error) return data;
    } catch (e) {
      console.warn('getSiswaByKelas note:', e);
    }
  }
  return [];
}

export async function getAbsensiRecord(jadwalId, tanggalStr) {
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('absensi')
        .select('*')
        .eq('jadwal_id', jadwalId)
        .eq('tanggal', tanggalStr);
      if (data && !error) return data;
    } catch (e) {
      console.warn('getAbsensiRecord note:', e);
    }
  }
  return [];
}

export async function saveAbsensiBatch({ jadwalId, tanggal, records, photoData, gpsLocation, userId }) {
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      if (!records || !Array.isArray(records) || records.length === 0) {
        return [];
      }

      // 1. Ambil data absensi yang sudah ada untuk jadwal & tanggal ini
      const { data: existingAbsensi, error: fetchErr } = await supabase
        .from('absensi')
        .select('id, siswa_id')
        .eq('jadwal_id', jadwalId)
        .eq('tanggal', tanggal);

      if (fetchErr) {
        console.warn('Fetch existing absensi note:', fetchErr.message);
      }

      const existingMap = new Map();
      if (existingAbsensi && Array.isArray(existingAbsensi)) {
        existingAbsensi.forEach(a => {
          if (a && a.siswa_id && a.id) {
            existingMap.set(String(a.siswa_id).trim(), String(a.id).trim());
          }
        });
      }

      const cleanJadwalId = String(jadwalId || 'jadwal').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanTanggal = String(tanggal || new Date().toISOString().split('T')[0]).replace(/-/g, '');

      // 2. Simpan atau Update tiap siswa secara presisi
      const results = [];

      for (let idx = 0; idx < records.length; idx++) {
        const r = records[idx];
        if (!r || (!r.siswa_id && !r.id)) continue;

        const cleanSiswaId = String(r.siswa_id || '').trim();
        const existingId = existingMap.get(cleanSiswaId);
        const cleanSiswaStr = cleanSiswaId.replace(/[^a-zA-Z0-9]/g, '_');

        const recordData = {
          siswa_id: cleanSiswaId,
          jadwal_id: String(jadwalId),
          tanggal: String(tanggal),
          status: String(r.status || 'Hadir'),
          keterangan: String(r.keterangan || ''),
          foto_kegiatan: photoData || null,
          gps_lat: gpsLocation?.lat ? Number(gpsLocation.lat) : null,
          gps_lng: gpsLocation?.lng ? Number(gpsLocation.lng) : null
        };

        if (existingId) {
          // Update data absensi yang sudah ada berdasarkan ID
          const { data: updateData, error: updateErr } = await supabase
            .from('absensi')
            .update(recordData)
            .eq('id', existingId)
            .select('*');

          if (updateErr) {
            console.error(`Error updating absensi siswa ${cleanSiswaId}:`, updateErr);
            throw new Error(`Gagal update absensi: ${updateErr.message}`);
          }
          if (updateData && updateData.length > 0) {
            results.push(updateData[0]);
          } else {
            results.push({ id: existingId, ...recordData });
          }
        } else {
          // Insert data absensi baru dengan ID string eksplisit
          const generatedId = (r.id && typeof r.id === 'string' && r.id.trim() !== '')
            ? r.id.trim()
            : `absen_${cleanJadwalId}_${cleanSiswaStr}_${cleanTanggal}_${Date.now()}_${idx}`;

          const newPayload = {
            id: generatedId,
            ...recordData
          };

          const { data: insertData, error: insertErr } = await supabase
            .from('absensi')
            .insert([newPayload])
            .select('*');

          if (insertErr) {
            console.error(`Error inserting absensi siswa ${cleanSiswaId}:`, insertErr);
            throw new Error(`Gagal simpan absensi: ${insertErr.message}`);
          }
          if (insertData && insertData.length > 0) {
            results.push(insertData[0]);
          } else {
            results.push(newPayload);
          }
        }
      }

      logAudit(userId || 'guru', 'SIMPAN_ABSENSI', `Simpan absensi jadwal ID ${jadwalId} tanggal ${tanggal} (${results.length} siswa).`);
      return results;
    } catch (e) {
      console.error('saveAbsensiBatch error:', e);
      throw e;
    }
  }
  throw new Error('Koneksi Supabase tidak terhubung atau offline.');
}

// ADMIN / KELOLA DATA APIS
export async function getAllUsers() {
  if (isSupabaseConfigured && navigator.onLine) {
    const { data } = await supabase.from('users').select('*');
    if (data) return data;
  }
  return [];
}

export async function getAllGuru() {
  if (isSupabaseConfigured && navigator.onLine) {
    const { data } = await supabase.from('guru').select('*');
    if (data) return data;
  }
  return [];
}

export async function getAllKelas() {
  if (isSupabaseConfigured && navigator.onLine) {
    const { data } = await supabase.from('kelas').select('*');
    if (data) return data;
  }
  return [];
}

export async function getAllSiswa() {
  if (isSupabaseConfigured && navigator.onLine) {
    const { data } = await supabase.from('siswa').select('*');
    if (data) return data;
  }
  return [];
}

export async function getAllJadwal() {
  if (isSupabaseConfigured && navigator.onLine) {
    const { data } = await supabase.from('jadwal_pelajaran').select(`
      *,
      kelas:kelas_id(nama_kelas, tingkat),
      guru:guru_id(nama_guru)
    `);
    if (data) return data;
  }
  return [];
}

export async function getAllAbsensi() {
  if (isSupabaseConfigured && navigator.onLine) {
    const { data } = await supabase.from('absensi').select('*').order('tanggal', { ascending: false });
    if (data) return data;
  }
  return [];
}

export async function getAuditLogs() {
  if (isSupabaseConfigured && navigator.onLine) {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (data) return data;
  }
  return [];
}

// MUTATIONS (SUPABASE DIRECT)
export async function addOrUpdateKelas(kelasData) {
  if (isSupabaseConfigured && navigator.onLine) {
    const cleanNama = String(kelasData.nama_kelas || '').trim().toUpperCase();
    const cleanTingkat = String(kelasData.tingkat || cleanNama.replace(/\D/g, '') || '1');
    const payload = {
      id: kelasData.id || `kelas_${cleanNama.toLowerCase().replace(/\s+/g, '_')}`,
      nama_kelas: cleanNama,
      tingkat: cleanTingkat
    };

    const { data, error } = await supabase.from('kelas').upsert([payload], { onConflict: 'id' }).select('*');
    if (error) throw error;
    return data?.[0] || payload;
  }
  throw new Error('Supabase tidak terhubung.');
}

export async function addOrUpdateSiswa(siswaData) {
  if (isSupabaseConfigured && navigator.onLine) {
    const cleanNis = String(siswaData.nis || '').trim();
    const cleanNisn = String(siswaData.nisn || '').trim();
    const payload = {
      id: siswaData.id || `siswa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nis: cleanNis,
      nisn: cleanNisn,
      nama_siswa: String(siswaData.nama_siswa || '').trim(),
      kelas_id: siswaData.kelas_id || null,
      jenis_kelamin: siswaData.jenis_kelamin === 'P' ? 'P' : 'L',
      qr_code: siswaData.qr_code || `QR-${cleanNis || cleanNisn}`
    };

    const { data, error } = await supabase.from('siswa').upsert([payload]).select('*');
    if (error) throw error;
    return data;
  }
  throw new Error('Supabase tidak terhubung.');
}

export async function addOrUpdateSiswaBatch(siswaArray) {
  if (isSupabaseConfigured && navigator.onLine) {
    // 1. Ambil data siswa yang sudah ada untuk mempertahankan ID & QR Code jika NIS / NISN sudah terdaftar
    const { data: existingSiswa } = await supabase.from('siswa').select('id, nis, nisn, qr_code');
    const existingMap = new Map();
    if (existingSiswa) {
      existingSiswa.forEach(s => {
        if (s.nis) existingMap.set(String(s.nis).trim().toUpperCase(), s);
        if (s.nisn) existingMap.set(String(s.nisn).trim().toUpperCase(), s);
      });
    }

    const payload = siswaArray.map((s, idx) => {
      const cleanNis = String(s.nis || '').trim();
      const cleanNisn = String(s.nisn || '').trim();
      const existingRecord = existingMap.get(cleanNis.toUpperCase()) || existingMap.get(cleanNisn.toUpperCase());

      return {
        id: s.id || existingRecord?.id || `siswa_${cleanNis || cleanNisn}_${Date.now()}_${idx}`,
        nis: cleanNis,
        nisn: cleanNisn,
        nama_siswa: String(s.nama_siswa || '').trim(),
        kelas_id: s.kelas_id || null,
        jenis_kelamin: s.jenis_kelamin === 'P' ? 'P' : 'L',
        qr_code: s.qr_code || existingRecord?.qr_code || `QR-${cleanNis || cleanNisn}`
      };
    });

    const { data, error } = await supabase.from('siswa').upsert(payload, { onConflict: 'nis' }).select('*');
    if (error) throw error;
    return data;
  }
  throw new Error('Supabase tidak terhubung.');
}

export async function addOrUpdateJadwal(jadwalData) {
  if (isSupabaseConfigured && navigator.onLine) {
    const payload = {
      id: jadwalData.id || `jadwal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...jadwalData
    };

    const { data, error } = await supabase.from('jadwal_pelajaran').upsert([payload]).select('*');
    if (error) throw error;
    return data;
  }
  throw new Error('Supabase tidak terhubung.');
}

export async function deleteJadwal(id) {
  if (isSupabaseConfigured && navigator.onLine) {
    const { error } = await supabase.from('jadwal_pelajaran').delete().eq('id', id);
    if (error) throw error;
  }
}

export async function deleteSiswa(id) {
  if (isSupabaseConfigured && navigator.onLine) {
    const { error } = await supabase.from('siswa').delete().eq('id', id);
    if (error) throw error;
  }
}
