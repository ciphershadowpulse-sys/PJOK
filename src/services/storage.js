import { supabase, isSupabaseConfigured } from '../lib/supabase';

// AUDIT LOG SERVICE
export async function logAudit(userId, aksi, detail) {
  if (isSupabaseConfigured && navigator.onLine) {
    try {
      await supabase.from('audit_logs').insert([{ user_id: userId, aksi, detail }]);
    } catch (e) {
      console.warn('Audit log insert note:', e);
    }
  }
}

// REGISTER GURU MANDIRI DENGAN SUPABASE AUTH & DATABASE
export async function registerUser({ nama, email, username, nip, password }) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@sekolah.sch.id`;
  const cleanPassword = password || 'password123';

  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env atau Netlify Environment Variables.');
  }

  // 1. Register User via Supabase Auth
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
    const rawMsg = authError.message || (typeof authError === 'object' ? JSON.stringify(authError) : String(authError));
    if (rawMsg.toLowerCase().includes('rate limit')) {
      throw new Error('Batas pengiriman email Supabase terlampaui (Rate Limit). Solusi: Matikan centang "Confirm Email" di Supabase Dashboard -> Authentication -> Providers -> Email.');
    }
    if (rawMsg.includes('already registered') || rawMsg.includes('User already registered')) {
      throw new Error('Email atau Username ini sudah terdaftar di database Supabase. Silakan gunakan username lain atau login.');
    }
    throw new Error(rawMsg === '{}' ? 'Gagal mendaftar akun ke Supabase. Periksa kembali format email dan password Anda.' : rawMsg);
  }

  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error('Gagal mendapatkan ID pendaftaran dari Supabase.');
  }

  const newUser = {
    id: userId,
    nama: nama.trim(),
    username: cleanUsername,
    email: cleanEmail,
    role: 'guru'
  };

  const newGuru = {
    user_id: userId,
    nama_guru: nama.trim(),
    nip: nip ? nip.trim() : `NIP-${Date.now()}`,
    mata_pelajaran: 'PJOK'
  };

  // 2. Direct insert/upsert into Supabase public tables
  const { error: errUser } = await supabase.from('users').upsert([newUser], { onConflict: 'username' });
  if (errUser) console.warn('Supabase users table insert info:', errUser.message);

  const { error: errGuru } = await supabase.from('guru').upsert([newGuru], { onConflict: 'user_id' });
  if (errGuru) console.warn('Supabase guru table insert info:', errGuru.message);

  logAudit(userId, 'REGISTER', `Guru baru mendaftar: ${nama} (${cleanEmail})`);

  // Auto sign in if session was not automatically established
  if (!authData?.session) {
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

  const requiresEmailVerification = !authData?.session;
  return {
    user: newUser,
    requiresEmailVerification,
    email: cleanEmail
  };
}

// LOGIN SERVICE DENGAN SUPABASE AUTH & VERIFIKASI KETAT DATABASE
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
      .single();

    if (matchedUser && matchedUser.email) {
      targetEmail = matchedUser.email;
    } else {
      targetEmail = `${cleanId}@sekolah.sch.id`;
    }
  }

  // 1. Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: targetEmail,
    password: cleanPassword
  });

  if (authError) {
    if (authError.message.includes('Email not confirmed')) {
      throw new Error('Email Anda belum dikonfirmasi. Silakan periksa inbox email Anda.');
    }
    if (authError.message.includes('Invalid login credentials')) {
      throw new Error('Username/Email atau Password salah. Akun belum terdaftar di database.');
    }
    throw new Error(authError.message);
  }

  if (authData?.user) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${targetEmail},username.eq.${cleanId},id.eq.${authData.user.id}`)
      .single();

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

  throw new Error('Akun belum terdaftar di database Supabase. Silakan klik tab "Daftar Guru Baru" terlebih dahulu.');
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
      const { data, error } = await supabase
        .from('guru')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (data && !error) return data;
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
      const toInsert = records.map(r => ({
        siswa_id: r.siswa_id,
        jadwal_id: jadwalId,
        tanggal,
        status: r.status || 'Hadir',
        keterangan: r.keterangan || '',
        foto_kegiatan: photoData || null,
        gps_lat: gpsLocation?.lat || null,
        gps_lng: gpsLocation?.lng || null
      }));

      const { data, error } = await supabase
        .from('absensi')
        .upsert(toInsert, { onConflict: 'siswa_id,jadwal_id,tanggal' })
        .select('*');

      if (error) throw error;
      logAudit(userId, 'SIMPAN_ABSENSI', `Simpan absensi jadwal ID ${jadwalId} tanggal ${tanggal} (${records.length} siswa).`);
      return data || toInsert;
    } catch (e) {
      alert('Gagal menyimpan ke Supabase: ' + e.message);
      throw e;
    }
  }
  throw new Error('Koneksi Supabase tidak tersedia.');
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
    const { data } = await supabase.from('absensi').select('*');
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
export async function addOrUpdateSiswa(siswaData) {
  if (isSupabaseConfigured && navigator.onLine) {
    const payload = {
      ...siswaData,
      qr_code: siswaData.qr_code || `QR-${siswaData.nis}`
    };
    if (!payload.id) delete payload.id;

    const { data, error } = await supabase.from('siswa').upsert([payload]).select('*');
    if (error) throw error;
    return data;
  }
  throw new Error('Supabase tidak terhubung.');
}

export async function addOrUpdateJadwal(jadwalData) {
  if (isSupabaseConfigured && navigator.onLine) {
    const payload = { ...jadwalData };
    if (!payload.id) delete payload.id;

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
