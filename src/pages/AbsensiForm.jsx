import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, CheckCircle2, UserCheck, Search, Camera, MapPin, QrCode, Save, AlertCircle, RefreshCw, MessageSquare, Users, Info, RotateCcw, Sparkles } from 'lucide-react';
import { getSiswaByKelas, getAbsensiRecord, saveAbsensiBatch } from '../services/storage';
import QRScannerModal from '../components/QRScannerModal';

const STATUS_OPTIONS = [
  { key: 'Hadir', label: 'Hadir', color: 'bg-[#10b981] text-white border-emerald-400 shadow-lg shadow-emerald-500/30' },
  { key: 'Sakit', label: 'Sakit', color: 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30' },
  { key: 'Izin', label: 'Izin', color: 'bg-sky-600 text-white border-sky-500 shadow-lg shadow-sky-600/30' },
  { key: 'Alpa', label: 'Alpa', color: 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30' },
  { key: 'Terlambat', label: 'Terlambat', color: 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30' }
];

export default function AbsensiForm({ jadwal, currentTime, user, onBack }) {
  // Resolve activeJadwal from props or localStorage fallback
  const activeJadwal = jadwal || (() => {
    try {
      const saved = localStorage.getItem('pjok_active_jadwal');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  })();

  const [siswaList, setSiswaList] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { [siswaId]: { status, keterangan } }
  const [scannedMap, setScannedMap] = useState({}); // { [siswaId]: true }
  const [viewMode, setViewMode] = useState('scanned_only'); // Default 'scanned_only': hanya tampilkan siswa yang sudah selesai di-scan
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Field documentation states
  const [photoData, setPhotoData] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gettingGps, setGettingGps] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const tanggalStr = currentTime.tanggalStr;

  useEffect(() => {
    async function loadSiswaAndAbsensi() {
      if (!activeJadwal || !activeJadwal.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let students = await getSiswaByKelas(activeJadwal.kelas_id, activeJadwal.nama_kelas);
        if (!students || !Array.isArray(students) || students.length === 0) {
          const { getAllSiswa } = await import('../services/storage');
          students = await getAllSiswa();
        }

        if (!students) students = [];

        // 1. Baca cache lokal terlebih dahulu
        const cacheKey = `pjok_scanned_cache_${activeJadwal.id}_${tanggalStr}`;
        const cachedRaw = localStorage.getItem(cacheKey);
        let cachedData = null;
        if (cachedRaw) {
          try { cachedData = JSON.parse(cachedRaw); } catch (e) {}
        }

        const map = cachedData?.attendanceData || {};
        const initialScannedMap = cachedData?.scannedMap || {};

        // 2. Load record absensi tersimpan dari Supabase
        const existing = await getAbsensiRecord(activeJadwal.id, tanggalStr);

        // 3. Gabungkan seluruh data yang tersimpan di DB
        if (existing && Array.isArray(existing)) {
          existing.forEach(rec => {
            if (rec && rec.siswa_id) {
              const recSiswaId = String(rec.siswa_id).trim();
              initialScannedMap[recSiswaId] = true;
              map[recSiswaId] = {
                status: rec.status || 'Hadir',
                keterangan: rec.keterangan || ''
              };
            }
          });
        }

        // 4. Inisialisasi status default untuk seluruh siswa kelas
        students.forEach(s => {
          const sId = String(s.id).trim();
          if (!map[sId]) {
            map[sId] = {
              status: 'Hadir',
              keterangan: ''
            };
          }
        });

        // 5. Jika ada siswa ter-scan yang belum ada di list kelas, ambil detail siswanya
        if (existing && Array.isArray(existing)) {
          for (const rec of existing) {
            if (rec && rec.siswa_id) {
              const recSiswaId = String(rec.siswa_id).trim();
              if (!students.some(s => String(s.id).trim() === recSiswaId)) {
                try {
                  const { getAllSiswa } = await import('../services/storage');
                  const allStudents = await getAllSiswa();
                  const foundStudent = allStudents.find(s => String(s.id).trim() === recSiswaId);
                  if (foundStudent) {
                    students.push(foundStudent);
                  }
                } catch (e) {}
              }
            }
          }
        }

        setSiswaList([...students]);
        setAttendanceData(map);
        setScannedMap(initialScannedMap);

        if (existing && existing.length > 0 && existing[0].foto_kegiatan) {
          setPhotoData(existing[0].foto_kegiatan);
        }
        if (existing && existing.length > 0 && existing[0].gps_lat) {
          setGpsLocation({ lat: existing[0].gps_lat, lng: existing[0].gps_lng });
        }
      } catch (err) {
        console.error('Error loading siswa:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSiswaAndAbsensi();
  }, [activeJadwal?.id, tanggalStr]);

  // Simpan cache lokal otomatis
  useEffect(() => {
    if (activeJadwal && activeJadwal.id && Object.keys(scannedMap).length > 0) {
      try {
        const cacheKey = `pjok_scanned_cache_${activeJadwal.id}_${tanggalStr}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          scannedMap,
          attendanceData
        }));
      } catch (e) {}
    }
  }, [scannedMap, attendanceData, activeJadwal, tanggalStr]);

  // Bulk action "Semua Hadir"
  const handleSemuaHadir = () => {
    const updatedAttendance = { ...attendanceData };
    const updatedScanned = { ...scannedMap };
    siswaList.forEach(s => {
      updatedAttendance[s.id] = { ...updatedAttendance[s.id], status: 'Hadir' };
      updatedScanned[s.id] = true;
    });
    setAttendanceData(updatedAttendance);
    setScannedMap(updatedScanned);
  };

  // Change individual student status & mark as scanned/processed
  const handleStatusChange = (siswaId, newStatus) => {
    setScannedMap(prev => ({ ...prev, [siswaId]: true }));
    setAttendanceData(prev => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        status: newStatus
      }
    }));
  };

  // Un-scan / Reset student back to unscanned list
  const handleUnscanSiswa = (siswaId) => {
    setScannedMap(prev => {
      const next = { ...prev };
      delete next[siswaId];
      return next;
    });
  };

  // Change individual student note
  const handleKeteranganChange = (siswaId, text) => {
    setAttendanceData(prev => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        keterangan: text
      }
    }));
  };

  // Handle Photo Upload
  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoData(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle GPS Capture
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung lokasi GPS.');
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGettingGps(false);
      },
      (error) => {
        alert('Gagal mengambil lokasi GPS: ' + error.message);
        setGettingGps(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Audio Beep Sound Effect Generator
  const playSuccessBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio play note:', e);
    }
  };

  // Handle QR Code scan match
  const handleQrCodeScanned = async (scannedText) => {
    const cleanScanned = String(scannedText).trim().toLowerCase();
    const digitsOnly = cleanScanned.replace(/[^0-9]/g, '');

    let found = siswaList.find(s => {
      const sNis = String(s.nis || '').trim().toLowerCase();
      const sNisn = String(s.nisn || '').trim().toLowerCase();
      const sQr = String(s.qr_code || '').trim().toLowerCase();
      const sId = String(s.id || '').trim().toLowerCase();

      if (sQr === cleanScanned || sNis === cleanScanned || sNisn === cleanScanned || sId === cleanScanned) return true;
      if (cleanScanned === `qr-${sNis}` || cleanScanned === `qr-${sNisn}`) return true;
      if (digitsOnly && digitsOnly.length >= 3) {
        if (sNis === digitsOnly || sNisn === digitsOnly) return true;
        if (sQr && sQr.includes(digitsOnly)) return true;
      }
      if (sQr && (sQr.includes(cleanScanned) || cleanScanned.includes(sQr))) return true;
      return false;
    });

    if (!found) {
      try {
        const { getAllSiswa } = await import('../services/storage');
        const allStudents = await getAllSiswa();
        const foundInAll = allStudents.find(s => {
          const sNis = String(s.nis || '').trim().toLowerCase();
          const sNisn = String(s.nisn || '').trim().toLowerCase();
          const sQr = String(s.qr_code || '').trim().toLowerCase();
          const sId = String(s.id || '').trim().toLowerCase();

          if (sQr === cleanScanned || sNis === cleanScanned || sNisn === cleanScanned || sId === cleanScanned) return true;
          if (cleanScanned === `qr-${sNis}` || cleanScanned === `qr-${sNisn}`) return true;
          if (digitsOnly && digitsOnly.length >= 3) {
            if (sNis === digitsOnly || sNisn === digitsOnly) return true;
            if (sQr && sQr.includes(digitsOnly)) return true;
          }
          if (sQr && (sQr.includes(cleanScanned) || cleanScanned.includes(sQr))) return true;
          return false;
        });

        if (foundInAll) {
          found = foundInAll;
          setSiswaList(prev => {
            if (prev.some(x => x.id === found.id)) return prev;
            return [...prev, found];
          });
        }
      } catch (e) {
        console.warn('Fallback search error:', e);
      }
    }

    if (found) {
      playSuccessBeep();

      setScannedMap(prev => ({ ...prev, [found.id]: true }));
      setAttendanceData(prev => ({
        ...prev,
        [found.id]: {
          status: 'Hadir',
          keterangan: prev[found.id]?.keterangan || 'Hadir via Scan QR'
        }
      }));

      try {
        const singleRecord = [{
          siswa_id: found.id,
          status: 'Hadir',
          keterangan: 'Hadir via Scan QR'
        }];

        await saveAbsensiBatch({
          jadwalId: activeJadwal?.id || 'jadwal',
          tanggal: tanggalStr,
          records: singleRecord,
          photoData,
          gpsLocation,
          userId: user?.id || 'guru'
        });

        const okMsg = `🎉 ${found.nama_siswa} (NIS: ${found.nis || '-'}) HADIR & Tersimpan di DB!`;
        setSuccessMsg(okMsg);
        setTimeout(() => setSuccessMsg(''), 5000);
      } catch (errSave) {
        console.warn('Auto save error:', errSave);
        setSuccessMsg(`✅ ${found.nama_siswa} HADIR (Tersimpan Lokal)`);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } else {
      setSuccessMsg(`⚠️ Result [${scannedText}] tidak cocok dengan NIS/NISN/QR siswa.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  // Save Attendance Record
  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const recordsToSaveIds = Object.keys(scannedMap).filter(id => scannedMap[id]);

      if (recordsToSaveIds.length === 0) {
        alert('Belum ada siswa yang di-scan atau diabsen. Silakan scan QR Code siswa terlebih dahulu.');
        setSaving(false);
        return;
      }

      const records = recordsToSaveIds.map(siswaId => {
        const s = siswaList.find(item => String(item.id).trim() === String(siswaId).trim()) || {};
        return {
          siswa_id: siswaId,
          nis: s.nis || null,
          nisn: s.nisn || null,
          nama_siswa: s.nama_siswa || null,
          status: attendanceData[siswaId]?.status || 'Hadir',
          keterangan: attendanceData[siswaId]?.keterangan || ''
        };
      });

      await saveAbsensiBatch({
        jadwalId: activeJadwal?.id || 'jadwal',
        tanggal: tanggalStr,
        records,
        photoData,
        gpsLocation,
        userId: user?.id || 'guru'
      });

      setSuccessMsg(`🎉 Berhasil menyimpan ${records.length} data absensi siswa!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Gagal menyimpan absensi:', err);
      alert('Gagal menyimpan absensi: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const scannedSiswaIds = Object.keys(scannedMap).filter(id => scannedMap[id]);
  const scannedSiswaCount = scannedSiswaIds.length;
  const unscannedSiswaCount = siswaList.length - scannedSiswaCount;

  const counts = {
    Hadir: scannedSiswaIds.filter(id => attendanceData[id]?.status === 'Hadir').length,
    Sakit: scannedSiswaIds.filter(id => attendanceData[id]?.status === 'Sakit').length,
    Izin: scannedSiswaIds.filter(id => attendanceData[id]?.status === 'Izin').length,
    Alpa: scannedSiswaIds.filter(id => attendanceData[id]?.status === 'Alpa').length,
    Terlambat: scannedSiswaIds.filter(id => attendanceData[id]?.status === 'Terlambat').length,
  };

  const filteredSiswa = siswaList.filter(s => {
    const matchesSearch =
      s.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nis && s.nis.includes(searchQuery)) ||
      (s.nisn && s.nisn.includes(searchQuery));

    if (!matchesSearch) return false;

    const isScanned = Boolean(scannedMap[s.id]);
    if (viewMode === 'scanned_only') return isScanned;
    if (viewMode === 'unscanned') return !isScanned;
    return true; // 'all'
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 animate-fade-in">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-zinc-300 bg-[#121324] hover:bg-[#1a1c38] hover:text-white px-4 py-2.5 rounded-2xl border border-[#242747] text-sm font-black transition-all duration-300 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#c084fc]" />
          <span>Kembali ke Dashboard</span>
        </button>

        <span className="text-xs font-black text-zinc-300 bg-[#121324] px-4 py-2 rounded-2xl border border-[#242747]">
          Tanggal: {currentTime.tanggalFormatted}
        </span>
      </div>

      {/* Class Info Header Card (Finova Dark Violet Glow) */}
      <div className="bg-gradient-to-br from-[#12132a] via-[#1a1c3b] to-[#101124] text-white p-6 sm:p-8 rounded-3xl border border-[#242747] shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#8b5cf6]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div>
            <span className="bg-[#8b5cf6]/20 text-[#c084fc] text-xs font-black px-3.5 py-1 rounded-full border border-[#8b5cf6]/30 tracking-wider flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              ABSENSI LAPANGAN PJOK
            </span>
            <h1 className="text-2xl sm:text-4xl font-black mt-2 tracking-tight">
              Kelas <span className="bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#f43f5e] bg-clip-text text-transparent">{jadwal.nama_kelas}</span>
            </h1>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              Jam: {jadwal.jam_mulai} - {jadwal.jam_selesai} WIB | Lokasi: {jadwal.lokasi || 'Lapangan Utama'}
            </p>
          </div>

          {/* Quick All Present Button */}
          <button
            onClick={handleSemuaHadir}
            className="py-3.5 px-6 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:from-[#9333ea] hover:to-[#581c87] text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-[#8b5cf6]/35 flex items-center justify-center space-x-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <UserCheck className="w-5 h-5 stroke-[2.5]" />
            <span>SET SEMUA HADIR</span>
          </button>
        </div>
      </div>

      {/* PRIMARY SCAN METRICS BANNER */}
      <div className="bg-[#121324] p-6 rounded-3xl border border-[#242747] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242747] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30 flex items-center justify-center font-black text-lg">
              📊
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Ringkasan Scan Kelas {activeJadwal?.nama_kelas}</h3>
              <p className="text-xs text-zinc-400 font-medium">Status scanning absensi murid real-time</p>
            </div>
          </div>
          <div className="text-xs font-black text-[#c084fc] bg-[#8b5cf6]/15 px-4 py-2 rounded-full border border-[#8b5cf6]/30 self-start sm:self-auto shadow-sm">
            {siswaList.length > 0 ? Math.round((scannedSiswaCount / siswaList.length) * 100) : 0}% Selesai Di-Scan
          </div>
        </div>

        {/* 3 Main Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Keseluruhan Murid */}
          <div className="bg-[#181a33] text-white p-5 rounded-2xl shadow-md border border-[#242747] hover:border-[#8b5cf6]/50 transition-all flex items-center justify-between group">
            <div>
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Keseluruhan Murid</div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">{siswaList.length} <span className="text-xs font-semibold text-zinc-400">Siswa</span></div>
              <div className="text-[10px] text-zinc-400 font-medium mt-1">Terdaftar di Kelas {activeJadwal?.nama_kelas}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#1d1f3d] border border-[#242747] flex items-center justify-center text-2xl font-black group-hover:scale-110 transition-transform">
              👥
            </div>
          </div>

          {/* Card 2: Berhasil Di-Scan */}
          <div className="bg-gradient-to-br from-emerald-600/20 to-teal-700/20 text-white p-5 rounded-2xl shadow-md border border-emerald-500/40 flex items-center justify-between group">
            <div>
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Berhasil Di-Scan</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{scannedSiswaCount} <span className="text-xs font-semibold text-emerald-300">Siswa</span></div>
              <div className="text-[10px] text-emerald-300 font-medium mt-1">Sudah absensi hari ini</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl font-black group-hover:scale-110 transition-transform">
              ✅
            </div>
          </div>

          {/* Card 3: Belum Di-Scan */}
          <div className="bg-gradient-to-br from-[#8b5cf6]/20 to-amber-600/20 text-white p-5 rounded-2xl shadow-md border border-[#8b5cf6]/40 flex items-center justify-between group">
            <div>
              <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Belum Di-Scan</div>
              <div className="text-2xl sm:text-3xl font-black text-[#c084fc] mt-1">{unscannedSiswaCount} <span className="text-xs font-semibold text-purple-300">Siswa</span></div>
              <div className="text-[10px] text-purple-300 font-medium mt-1">Menunggu scan QR / manual</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center text-2xl font-black group-hover:scale-110 transition-transform">
              ⏳
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="w-full h-3 bg-[#0b0c16] rounded-full overflow-hidden border border-[#242747] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#a855f7] via-[#8b5cf6] to-[#f43f5e] rounded-full transition-all duration-500"
              style={{ width: `${siswaList.length > 0 ? Math.round((scannedSiswaCount / siswaList.length) * 100) : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Status Breakdown Counters */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl">
          <div className="text-lg sm:text-2xl font-black text-emerald-400">{counts.Hadir}</div>
          <div className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase">Hadir</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl">
          <div className="text-lg sm:text-2xl font-black text-amber-400">{counts.Sakit}</div>
          <div className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase">Sakit</div>
        </div>
        <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-2xl">
          <div className="text-lg sm:text-2xl font-black text-sky-400">{counts.Izin}</div>
          <div className="text-[10px] sm:text-xs font-bold text-sky-300 uppercase">Izin</div>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl">
          <div className="text-lg sm:text-2xl font-black text-rose-400">{counts.Alpa}</div>
          <div className="text-[10px] sm:text-xs font-bold text-rose-300 uppercase">Alpa</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-2xl">
          <div className="text-lg sm:text-2xl font-black text-purple-400">{counts.Terlambat}</div>
          <div className="text-[10px] sm:text-xs font-bold text-purple-300 uppercase">Terlambat</div>
        </div>
      </div>

      {/* Field Media & GPS Attachment Card */}
      <div className="bg-[#121324] p-5 rounded-3xl border border-[#242747] shadow-xl space-y-4">
        <h3 className="text-xs font-black text-zinc-300 uppercase tracking-wider">
          Dokumentasi Lapangan & Lokasi Guru (Opsional)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Photo Documentation */}
          <div className="flex items-center space-x-3 bg-[#181a33] p-4 rounded-2xl border border-[#242747]">
            <label className="cursor-pointer bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:scale-105 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 transition-all shadow-md">
              <Camera className="w-4 h-4 text-white" />
              <span>Ambil Foto Olahraga</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
            </label>
            {photoData ? (
              <div className="flex items-center space-x-2">
                <img src={photoData} alt="Foto Olahraga" className="w-10 h-10 object-cover rounded-xl border border-[#8b5cf6]/50" />
                <span className="text-[11px] text-emerald-400 font-bold">Foto Terlampir</span>
              </div>
            ) : (
              <span className="text-[11px] text-zinc-400 font-medium">Belum ada foto</span>
            )}
          </div>

          {/* GPS Location Capture */}
          <div className="flex items-center justify-between bg-[#181a33] p-4 rounded-2xl border border-[#242747]">
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={gettingGps}
              className="bg-[#1d1f3d] hover:bg-[#25284d] text-zinc-100 px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer border border-[#242747]"
            >
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>{gettingGps ? 'Memproses GPS...' : 'Tag Lokasi GPS'}</span>
            </button>
            {gpsLocation ? (
              <span className="text-[11px] text-sky-400 font-bold">
                Lat: {gpsLocation.lat.toFixed(4)}, Lng: {gpsLocation.lng.toFixed(4)}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400 font-medium">Belum di-tag</span>
            )}
          </div>
        </div>
      </div>

      {/* Search & QR Scanner Bar */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa ter-scan (Nama atau NIS)..."
            className="w-full pl-12 pr-4 py-3.5 bg-[#121324] border border-[#242747] rounded-2xl text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] shadow-xl"
          />
        </div>

        <button
          onClick={() => setShowQrModal(true)}
          className="px-5 py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:from-[#9333ea] hover:to-[#581c87] text-white rounded-2xl shadow-lg shadow-[#8b5cf6]/35 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 cursor-pointer font-black text-xs"
          title="Scan QR Code Kartu Siswa"
        >
          <QrCode className="w-5 h-5" />
          <span className="hidden sm:inline">Scan QR Code</span>
        </button>
      </div>

      {/* Title Header & View Mode Toggles for Students List */}
      <div className="bg-[#121324] p-5 sm:p-6 rounded-3xl border border-[#242747] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242747] pb-4">
          <div>
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-[#c084fc]" />
              <span>Progress Absensi Lapangan</span>
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              Selesai Scan: <span className="font-black text-[#c084fc]">{scannedSiswaCount} Siswa</span> | Sisa Belum Scan: <span className="font-black text-amber-400">{unscannedSiswaCount} Siswa</span> | Total: <span className="font-black text-white">{siswaList.length} Siswa</span>
            </p>
          </div>

          {/* TAB TOGGLES */}
          <div className="flex items-center space-x-1.5 bg-[#181a33] p-1.5 rounded-2xl text-[11px] font-black border border-[#242747]">
            <button
              type="button"
              onClick={() => setViewMode('scanned_only')}
              className={`px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'scanned_only'
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/35 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-[#25284d]'
              }`}
              title="Fungsi: Menampilkan daftar siswa yang SUDAH selesai di-scan"
            >
              <span>✓ Selesai Scan ({scannedSiswaCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('unscanned')}
              className={`px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'unscanned'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-[#25284d]'
              }`}
              title="Fungsi: Menampilkan sisa siswa yang BELUM di-scan"
            >
              <span>⏳ Belum Scan ({unscannedSiswaCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'all'
                  ? 'bg-[#242747] text-white shadow-sm scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-[#25284d]'
              }`}
              title="Fungsi: Menampilkan SELURUH siswa kelas secara lengkap"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Semua Siswa ({siswaList.length})</span>
            </button>
          </div>
        </div>

        {/* Usage Explanation Banner */}
        <div className="text-xs p-3.5 rounded-2xl border border-[#242747] bg-[#181a33] text-zinc-300 font-medium flex items-center space-x-3">
          <Info className="w-4 h-4 flex-shrink-0 text-[#c084fc]" />
          <span>
            {viewMode === 'scanned_only' && (
              <><strong>Fungsi & Kegunaan Tab Selesai Scan:</strong> Menampilkan siswa yang sudah berhasil di-scan atau diabsen. Gunakan tab ini untuk meninjau status dan menambah catatan khusus.</>
            )}
            {viewMode === 'unscanned' && (
              <><strong>Fungsi & Kegunaan Tab Belum Scan:</strong> Menampilkan sisa siswa yang belum scan QR code. Gunakan tab ini untuk memandu siswa scan QR atau memberi status manual jika siswa tidak membawa kartu.</>
            )}
            {viewMode === 'all' && (
              <><strong>Fungsi & Kegunaan Tab Semua Siswa:</strong> Menampilkan seluruh siswa kelas ini secara lengkap untuk peninjauan menyeluruh.</>
            )}
          </span>
        </div>
      </div>

      {/* Student List & Touch-Friendly Status Buttons */}
      {loading ? (
        <div className="bg-[#121324] p-12 rounded-3xl text-center text-zinc-400 border border-[#242747]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#a855f7] mb-3" />
          <p className="text-sm font-bold">Memuat daftar siswa kelas...</p>
        </div>
      ) : filteredSiswa.length === 0 ? (
        <div className="bg-[#121324] p-10 rounded-3xl text-center border-2 border-dashed border-[#242747] space-y-4">
          {viewMode === 'scanned_only' ? (
            <>
              <div className="w-16 h-16 bg-[#8b5cf6]/15 text-[#c084fc] rounded-2xl flex items-center justify-center mx-auto border border-[#8b5cf6]/30">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-white">
                Belum Ada Siswa Selesai Di-Scan (0 dari {siswaList.length} Siswa)
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto font-medium">
                Masih ada {unscannedSiswaCount} siswa yang belum di-scan. Silakan buka kamera untuk scan QR Code atau beralih ke tab "Belum Scan".
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:scale-105 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg shadow-[#8b5cf6]/35 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Buka Kamera Scan QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('unscanned')}
                  className="inline-flex items-center space-x-2 bg-[#181a33] hover:bg-[#25284d] text-zinc-200 font-black text-xs px-6 py-3.5 rounded-2xl border border-[#242747] transition-all cursor-pointer"
                >
                  <span>Lihat {unscannedSiswaCount} Siswa Belum Scan</span>
                </button>
              </div>
            </>
          ) : viewMode === 'unscanned' ? (
            <>
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-white">
                🎉 Semuanya Sudah Di-Scan! ({scannedSiswaCount} dari {siswaList.length} Siswa)
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto font-medium">
                Seluruh {siswaList.length} siswa kelas ini telah selesai di-scan dan terisi absensinya.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('scanned_only')}
                className="mt-2 inline-flex items-center space-x-2 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg shadow-[#8b5cf6]/35 transition-all cursor-pointer"
              >
                <span>Lihat {scannedSiswaCount} Siswa Selesai Scan</span>
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-[#181a33] text-zinc-400 rounded-2xl flex items-center justify-center mx-auto border border-[#242747]">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-white">
                Tidak Ada Siswa Cocok
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto font-medium">
                Tidak ada siswa yang sesuai dengan filter atau kata kunci pencarian Anda.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSiswa.map((siswa, idx) => {
            const currentStatus = attendanceData[siswa.id]?.status || 'Hadir';
            const currentNote = attendanceData[siswa.id]?.keterangan || '';
            const isScanned = Boolean(scannedMap[siswa.id]);

            return (
              <div
                key={siswa.id}
                className={`bg-[#121324] border rounded-3xl p-5 sm:p-6 shadow-xl transition-all duration-300 space-y-4 hover:border-[#8b5cf6]/50 ${
                  isScanned ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-[#242747]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-9 h-9 rounded-2xl font-black text-xs flex items-center justify-center border ${
                      isScanned ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#181a33] text-zinc-400 border-[#242747]'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h4 className="text-base font-black text-white leading-tight">
                          {siswa.nama_siswa}
                        </h4>
                        {isScanned ? (
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-full">
                            ✓ Di-Scan
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30 text-[10px] font-black rounded-full">
                            Belum Di-Scan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-medium mt-1">
                        NIS: <span className="font-bold text-zinc-200">{siswa.nis || '-'}</span> | NISN: <span className="font-bold text-[#c084fc]">{siswa.nisn || '-'}</span> | Gender: <span className="font-bold text-zinc-300">{siswa.jenis_kelamin}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-zinc-400 bg-[#181a33] px-3 py-1 rounded-xl border border-[#242747]">
                      {siswa.qr_code || `QR-${siswa.nis}`}
                    </span>

                    {isScanned && (
                      <button
                        type="button"
                        onClick={() => handleUnscanSiswa(siswa.id)}
                        className="text-[10px] font-bold text-zinc-400 hover:text-rose-400 bg-[#181a33] hover:bg-rose-500/10 px-2.5 py-1 rounded-xl border border-[#242747] transition-all flex items-center space-x-1 cursor-pointer"
                        title="Batal Scan siswa ini"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Batal</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Touch Status Buttons Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = currentStatus === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleStatusChange(siswa.id, opt.key)}
                        className={`py-3 sm:py-3.5 px-1 rounded-2xl text-xs font-black transition-all border flex flex-col items-center justify-center space-y-1 active:scale-95 cursor-pointer ${
                          isSelected
                            ? opt.color + ' scale-105'
                            : 'bg-[#181a33] border-[#242747] text-zinc-400 hover:text-white hover:bg-[#202347]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Notes Input */}
                <div className="relative pt-1">
                  <input
                    type="text"
                    value={currentNote}
                    onChange={(e) => handleKeteranganChange(siswa.id, e.target.value)}
                    placeholder="Catatan kondisi siswa (contoh: cedera engkel, pusing, izin lari)..."
                    className="w-full text-xs px-4 py-2.5 bg-[#181a33] border border-[#242747] rounded-xl font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e0f1d]/95 backdrop-blur-xl border-t border-[#242747] p-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="text-zinc-300 text-xs hidden sm:block font-medium">
            <span className="font-black text-[#c084fc]">{scannedSiswaCount} dari {siswaList.length} Siswa</span> ter-scan & tersimpan ke Supabase.
          </div>

          {successMsg && (
            <div className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-4 py-2 rounded-2xl border border-emerald-500/40 animate-fade-in flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:from-[#9333ea] hover:to-[#581c87] active:scale-95 text-white font-black text-sm rounded-2xl shadow-xl shadow-[#8b5cf6]/40 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>SIMPAN ABSENSI SISWA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onScanSuccess={handleQrCodeScanned}
      />

    </div>
  );
}
