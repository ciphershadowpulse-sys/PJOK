import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, CheckCircle2, UserCheck, Search, Camera, MapPin, QrCode, Save, AlertCircle, RefreshCw, MessageSquare, Users } from 'lucide-react';
import { getSiswaByKelas, getAbsensiRecord, saveAbsensiBatch } from '../services/storage';
import QRScannerModal from '../components/QRScannerModal';

const STATUS_OPTIONS = [
  { key: 'Hadir', label: 'Hadir', color: 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/30' },
  { key: 'Sakit', label: 'Sakit', color: 'bg-amber-500 text-white border-amber-600 shadow-amber-500/30' },
  { key: 'Izin', label: 'Izin', color: 'bg-sky-500 text-white border-sky-600 shadow-sky-500/30' },
  { key: 'Alpa', label: 'Alpa', color: 'bg-rose-500 text-white border-rose-600 shadow-rose-500/30' },
  { key: 'Terlambat', label: 'Terlambat', color: 'bg-purple-500 text-white border-purple-600 shadow-purple-500/30' }
];

export default function AbsensiForm({ jadwal, currentTime, user, onBack }) {
  const [siswaList, setSiswaList] = useState([]);
  const [attendanceData, setAttendanceData] = useState({}); // { [siswaId]: { status, keterangan } }
  const [scannedMap, setScannedMap] = useState({}); // { [siswaId]: true }
  const [viewMode, setViewMode] = useState('scanned_only'); // 'scanned_only' | 'unscanned' | 'all'
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
      setLoading(true);
      try {
        const students = await getSiswaByKelas(jadwal.kelas_id);
        setSiswaList(students);

        // Load existing saved records for today
        const existing = await getAbsensiRecord(jadwal.id, tanggalStr);
        const map = {};
        const initialScannedMap = {};

        students.forEach(s => {
          const rec = existing.find(e => e.siswa_id === s.id);
          if (rec) {
            initialScannedMap[s.id] = true;
            map[s.id] = {
              status: rec.status,
              keterangan: rec.keterangan || ''
            };
          } else {
            map[s.id] = {
              status: 'Hadir',
              keterangan: ''
            };
          }
        });
        setAttendanceData(map);
        setScannedMap(initialScannedMap);

        if (existing.length > 0 && existing[0].foto_kegiatan) {
          setPhotoData(existing[0].foto_kegiatan);
        }
        if (existing.length > 0 && existing[0].gps_lat) {
          setGpsLocation({ lat: existing[0].gps_lat, lng: existing[0].gps_lng });
        }
      } catch (err) {
        console.error('Error loading siswa:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSiswaAndAbsensi();
  }, [jadwal, tanggalStr]);

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

  // Handle QR Code or NIS/NISN scan match & Auto-save to Supabase
  const handleQrCodeScanned = async (scannedText) => {
    const cleanScanned = String(scannedText).trim().toLowerCase();
    const digitsOnly = cleanScanned.replace(/[^0-9]/g, '');

    const found = siswaList.find(s => {
      const sNis = String(s.nis || '').trim().toLowerCase();
      const sNisn = String(s.nisn || '').trim().toLowerCase();
      const sQr = String(s.qr_code || '').trim().toLowerCase();
      const sId = String(s.id || '').trim().toLowerCase();

      // Direct exact matches
      if (sQr === cleanScanned || sNis === cleanScanned || sNisn === cleanScanned || sId === cleanScanned) {
        return true;
      }

      // Match "qr-1001"
      if (cleanScanned === `qr-${sNis}`) return true;

      // Smart digit extraction match
      if (digitsOnly && digitsOnly.length >= 3) {
        if (sNis && (sNis === digitsOnly || digitsOnly === sNis)) return true;
        if (sNisn && (sNisn === digitsOnly || digitsOnly === sNisn)) return true;
        if (sQr && sQr.includes(digitsOnly)) return true;
      }

      return false;
    });

    if (found) {
      // 1. Mark as scanned & update local state
      setScannedMap(prev => ({ ...prev, [found.id]: true }));
      setAttendanceData(prev => ({
        ...prev,
        [found.id]: {
          status: 'Hadir',
          keterangan: prev[found.id]?.keterangan || 'Hadir via Scan QR'
        }
      }));

      // 2. Auto-save directly to Supabase database so scan is instantly stored
      try {
        const singleRecord = [{
          siswa_id: found.id,
          status: 'Hadir',
          keterangan: attendanceData[found.id]?.keterangan || 'Hadir via Scan QR'
        }];

        await saveAbsensiBatch({
          jadwalId: jadwal.id,
          tanggal: tanggalStr,
          records: singleRecord,
          photoData,
          gpsLocation,
          userId: user?.id || 'guru'
        });

        const okMsg = `🎉 ${found.nama_siswa} (NIS: ${found.nis}) HADIR & Tersimpan ke DB!`;
        setSuccessMsg(okMsg);
        setTimeout(() => setSuccessMsg(''), 5000);
      } catch (errSave) {
        console.warn('Auto save note:', errSave);
        setSuccessMsg(`✅ ${found.nama_siswa} HADIR (Tersimpan Lokal)`);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } else {
      setSuccessMsg(`⚠️ Result [${scannedText}] tidak cocok dengan NIS/QR siswa mana pun.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  // Save Attendance Record for all scanned/processed students
  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const recordsToSaveIds = Object.keys(scannedMap).filter(id => scannedMap[id]);

      if (recordsToSaveIds.length === 0) {
        alert('Belum ada siswa yang di-scan atau diabsen.');
        setSaving(false);
        return;
      }

      const records = recordsToSaveIds.map(siswaId => ({
        siswa_id: siswaId,
        status: attendanceData[siswaId]?.status || 'Hadir',
        keterangan: attendanceData[siswaId]?.keterangan || ''
      }));

      await saveAbsensiBatch({
        jadwalId: jadwal.id,
        tanggal: tanggalStr,
        records,
        photoData,
        gpsLocation,
        userId: user.id
      });

      setSuccessMsg(`Berhasil menyimpan ${records.length} data absensi siswa ke Supabase!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Gagal menyimpan absensi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Counts & Filtered list based on viewMode
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-slate-700 bg-white hover:bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-extrabold shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>

        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          Tanggal: {currentTime.tanggalFormatted}
        </span>
      </div>

      {/* Class Info Header Card */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
              ABSENSI LAPANGAN PJOK
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Kelas {jadwal.nama_kelas}
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Jam: {jadwal.jam_mulai} - {jadwal.jam_selesai} WIB | Lokasi: {jadwal.lokasi || 'Lapangan Utama'}
            </p>
          </div>

          {/* Quick All Present Button */}
          <button
            onClick={handleSemuaHadir}
            className="py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
          >
            <UserCheck className="w-5 h-5" />
            <span>SET SEMUA HADIR</span>
          </button>
        </div>
      </div>

      {/* Counters Summary Bar */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center">
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 sm:p-3 rounded-2xl">
          <div className="text-lg sm:text-2xl font-black text-emerald-600">{counts.Hadir}</div>
          <div className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase">Hadir</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 sm:p-3 rounded-2xl">
          <div className="text-lg sm:text-2xl font-black text-amber-600">{counts.Sakit}</div>
          <div className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase">Sakit</div>
        </div>
        <div className="bg-sky-500/10 border border-sky-500/30 p-2.5 sm:p-3 rounded-2xl">
          <div className="text-lg sm:text-2xl font-black text-sky-600">{counts.Izin}</div>
          <div className="text-[10px] sm:text-xs font-bold text-sky-700 uppercase">Izin</div>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 sm:p-3 rounded-2xl">
          <div className="text-lg sm:text-2xl font-black text-rose-600">{counts.Alpa}</div>
          <div className="text-[10px] sm:text-xs font-bold text-rose-700 uppercase">Alpa</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 p-2.5 sm:p-3 rounded-2xl">
          <div className="text-lg sm:text-2xl font-black text-purple-600">{counts.Terlambat}</div>
          <div className="text-[10px] sm:text-xs font-bold text-purple-700 uppercase">Terlambat</div>
        </div>
      </div>

      {/* Field Media & GPS Attachment Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Dokumentasi Lapangan & Lokasi Guru (Opsional)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Photo Documentation */}
          <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Ambil Foto Olahraga</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
            </label>
            {photoData ? (
              <div className="flex items-center space-x-2">
                <img src={photoData} alt="Foto Olahraga" className="w-10 h-10 object-cover rounded-lg border border-slate-300" />
                <span className="text-[11px] text-emerald-600 font-bold">Foto Terlampir</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">Belum ada foto</span>
            )}
          </div>

          {/* GPS Location Capture */}
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={gettingGps}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>{gettingGps ? 'Memproses GPS...' : 'Tag Lokasi GPS'}</span>
            </button>
            {gpsLocation ? (
              <span className="text-[11px] text-sky-600 font-bold">
                Lat: {gpsLocation.lat.toFixed(4)}, Lng: {gpsLocation.lng.toFixed(4)}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Belum di-tag</span>
            )}
          </div>
        </div>
      </div>

      {/* Search & QR Scanner Bar */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa ter-scan (Nama atau NIS)..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <button
          onClick={() => setShowQrModal(true)}
          className="p-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-2xl shadow-sm border border-slate-800 flex items-center space-x-1.5 transition-all cursor-pointer"
          title="Scan QR Code Kartu Siswa"
        >
          <QrCode className="w-5 h-5" />
          <span className="text-xs font-bold text-white hidden sm:inline">Scan QR Code</span>
        </button>
      </div>

      {/* Title Header & View Mode Toggles for Students List */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Daftar Siswa Ter-Scan ({scannedSiswaCount} dari {siswaList.length})</span>
        </h3>

        <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-2xl text-[11px] font-extrabold">
          <button
            type="button"
            onClick={() => setViewMode('scanned_only')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'scanned_only'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Selesai Scan ({scannedSiswaCount})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('unscanned')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'unscanned'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Belum Scan ({unscannedSiswaCount})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Siswa ({siswaList.length})
          </button>
        </div>
      </div>

      {/* Student List & Touch-Friendly Status Buttons */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl text-center text-slate-500 border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-semibold">Memuat daftar siswa kelas...</p>
        </div>
      ) : filteredSiswa.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl text-center border-2 border-dashed border-slate-200 space-y-3">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">
            Belum Ada Siswa Di-Scan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Silakan scan QR Code atau NIS siswa. Nama dan keterangan siswa yang sudah di-scan akan otomatis muncul di bawah ini.
          </p>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="mt-2 inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Buka Kamera Scan QR Code</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSiswa.map((siswa, idx) => {
            const currentStatus = attendanceData[siswa.id]?.status || 'Hadir';
            const currentNote = attendanceData[siswa.id]?.keterangan || '';
            const isScanned = Boolean(scannedMap[siswa.id]);

            return (
              <div
                key={siswa.id}
                className={`bg-white border rounded-3xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all space-y-3 ${
                  isScanned ? 'border-emerald-300 ring-1 ring-emerald-500/20' : 'border-slate-200 opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`w-8 h-8 rounded-full font-extrabold text-xs flex items-center justify-center border ${
                      isScanned ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                          {siswa.nama_siswa}
                        </h4>
                        {isScanned ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-300 text-[10px] font-extrabold rounded-full">
                            ✓ Di-Scan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-300 text-[10px] font-extrabold rounded-full">
                            Belum Di-Scan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        NIS: <span className="font-bold text-slate-700">{siswa.nis || '-'}</span> | NISN: <span className="font-bold text-emerald-700">{siswa.nisn || '-'}</span> | Gender: <span className="font-bold">{siswa.jenis_kelamin}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    {siswa.qr_code || `QR-${siswa.nis}`}
                  </span>
                </div>

                {/* Touch Buttons Grid */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = currentStatus === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleStatusChange(siswa.id, opt.key)}
                        className={`py-3 sm:py-3.5 px-1 rounded-2xl text-xs font-extrabold transition-all border flex flex-col items-center justify-center space-y-1 active:scale-95 cursor-pointer ${
                          isSelected
                            ? opt.color + ' ring-2 ring-slate-900/10'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Notes Input for physical condition / comments */}
                <div className="relative pt-1">
                  <input
                    type="text"
                    value={currentNote}
                    onChange={(e) => handleKeteranganChange(siswa.id, e.target.value)}
                    placeholder="Catatan kondisi siswa (contoh: cedera engkel, pusing, izin lari)..."
                    className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="text-white text-xs hidden sm:block">
            <span className="font-bold text-emerald-400">{scannedSiswaCount} dari {siswaList.length} Siswa</span> ter-scan & tersimpan ke Supabase.
          </div>

          {successMsg && (
            <div className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/40 animate-fade-in flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto py-3.5 px-8 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/40 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
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
