import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Play, CheckCircle2, AlertCircle, RefreshCw, History, FileText, Plus, X, Users, Check } from 'lucide-react';
import { getGuruByUserId, getJadwalGuru, checkScheduleStatus, getAbsensiRecord, getScheduleStudentStats, getAllGuru, getAllKelas, addOrUpdateJadwal } from '../services/storage';

export default function GuruDashboard({ user, currentTime, onSelectJadwalForAbsensi, onNavigate }) {
  const [guruData, setGuruData] = useState(null);
  const [jadwals, setJadwals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayFilter, setSelectedDayFilter] = useState('');
  const [absensiStats, setAbsensiStats] = useState({});

  // Quick Add Schedule Modal States
  const [showAddJadwalModal, setShowAddJadwalModal] = useState(false);
  const [guruList, setGuruList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [savingJadwal, setSavingJadwal] = useState(false);
  const [jadwalForm, setJadwalForm] = useState({
    id: '', guru_id: '', kelas_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: 'PJOK', lokasi: 'Lapangan Utama'
  });

  const hariAktif = currentTime.hari; // e.g. 'Senin'
  const dateStr = currentTime.tanggalStr; // e.g. '2026-07-25'

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const guru = await getGuruByUserId(user.id, user);
      setGuruData(guru);

      const [list, gList, kList] = await Promise.all([
        getJadwalGuru(guru.id, user.id),
        getAllGuru(),
        getAllKelas()
      ]);
      setJadwals(list || []);
      setGuruList(gList || []);
      setKelasList(kList || []);

      // Load detailed student scan & total stats per schedule
      const statsMap = {};
      for (const j of (list || [])) {
        const stat = await getScheduleStudentStats(j.id, j.kelas_id, j.nama_kelas, dateStr);
        statsMap[j.id] = stat;
      }
      setAbsensiStats(statsMap);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user, dateStr]);

  const activeHari = selectedDayFilter || hariAktif;
  const filteredJadwals = jadwals.filter(j => j.hari.toLowerCase() === activeHari.toLowerCase());

  // Handle Quick Schedule Submit
  const handleSaveJadwal = async (e) => {
    e.preventDefault();
    if (!jadwalForm.kelas_id) {
      alert('Pilih Kelas terlebih dahulu.');
      return;
    }

    setSavingJadwal(true);
    try {
      const gId = guruData?.id || `guru_${user.id}`;
      await addOrUpdateJadwal({
        ...jadwalForm,
        guru_id: gId
      });
      setShowAddJadwalModal(false);
      setJadwalForm({ id: '', guru_id: '', kelas_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: 'PJOK', lokasi: 'Lapangan Utama' });
      await loadDashboardData();
    } catch (err) {
      alert('Gagal menyimpan jadwal: ' + err.message);
    } finally {
      setSavingJadwal(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                GURU OLAHRAGA (PJOK)
              </span>
              <span className="text-xs text-slate-400 font-medium">NIP: {guruData?.nip || '198504122010011005'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, <span className="text-emerald-400">{user.nama}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Kelola absensi pelajaran PJOK secara real-time di lapangan dengan mudah & cepat.
            </p>
          </div>

          {/* Time & Day Card */}
          <div className="bg-slate-950/60 border border-slate-700/80 rounded-2xl p-4 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">HARI & TANGGAL SEKARANG</div>
              <div className="text-base font-extrabold text-white">
                {currentTime.hari}, {currentTime.tanggalFormatted}
              </div>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Jam Pelajaran: {currentTime.jam} WIB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Shortcuts Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mr-1">Filter Hari:</span>
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => (
            <button
              key={h}
              onClick={() => setSelectedDayFilter(h)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${(selectedDayFilter ? selectedDayFilter === h : hariAktif === h)
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
            >
              {h} {hariAktif === h && '📌'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setJadwalForm({
                id: '',
                guru_id: guruData?.id || guruList[0]?.id || '',
                kelas_id: kelasList[0]?.id || '',
                hari: activeHari || 'Senin',
                jam_mulai: '07:00',
                jam_selesai: '08:30',
                mata_pelajaran: 'PJOK',
                lokasi: 'Lapangan Utama'
              });
              setShowAddJadwalModal(true);
            }}
            className="flex items-center space-x-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal PJOK</span>
          </button>

          <button
            onClick={() => onNavigate('kelola')}
            className="flex items-center space-x-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Kelola Data</span>
          </button>

          <button
            onClick={() => onNavigate('riwayat')}
            className="flex items-center space-x-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>Riwayat Absensi</span>
          </button>
        </div>
      </div>

      {/* Jadwal Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>Jadwal Pelajaran PJOK ({activeHari})</span>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {filteredJadwals.length} Kelas Terdaftar
            </span>
          </h2>
          {selectedDayFilter && (
            <button
              onClick={() => setSelectedDayFilter('')}
              className="text-xs text-emerald-600 hover:underline font-bold"
            >
              Kembali ke Hari Ini ({hariAktif})
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold">Memuat jadwal pelajaran olahraga...</p>
          </div>
        ) : filteredJadwals.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-2xl">
              🏖️
            </div>
            <h3 className="text-base font-bold text-slate-800">Tidak Ada Jadwal Olahraga di Hari {activeHari}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Belum ada jadwal kelas PJOK untuk hari {activeHari}. Anda dapat menambahkan jadwal tanpa batasan menggunakan tombol di bawah ini.
            </p>
            <button
              onClick={() => {
                setJadwalForm({
                  id: '',
                  guru_id: guruData?.id || guruList[0]?.id || '',
                  kelas_id: kelasList[0]?.id || '',
                  hari: activeHari || 'Senin',
                  jam_mulai: '07:00',
                  jam_selesai: '08:30',
                  mata_pelajaran: 'PJOK',
                  lokasi: 'Lapangan Utama'
                });
                setShowAddJadwalModal(true);
              }}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal Hari {activeHari}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJadwals.map((jadwal) => {
              // Status Deteksi Waktu
              const status = checkScheduleStatus(
                jadwal.jam_mulai,
                jadwal.jam_selesai,
                jadwal.hari,
                currentTime.hari,
                currentTime.jam
              );

              const stats = absensiStats[jadwal.id] || { totalSiswa: 0, scannedCount: 0, unscannedCount: 0 };
              const hasFilledToday = stats.scannedCount > 0;
              const isActive = status === 'ACTIVE';
              const percentScanned = stats.totalSiswa > 0 ? Math.round((stats.scannedCount / stats.totalSiswa) * 100) : 0;

              return (
                <div
                  key={jadwal.id}
                  className={`bg-white border-2 rounded-3xl p-5 shadow-lg transition-all duration-200 relative flex flex-col justify-between overflow-hidden ${isActive
                      ? 'border-emerald-500 ring-4 ring-emerald-500/10'
                      : hasFilledToday
                        ? 'border-sky-300 bg-sky-50/20'
                        : 'border-slate-200'
                    }`}
                >
                  {/* Top Status Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-black text-slate-900 bg-slate-100 px-3.5 py-1 rounded-2xl border border-slate-200">
                        Kelas {jadwal.nama_kelas}
                      </span>

                      {isActive ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-md animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          <span>SEDANG BERLANGSUNG</span>
                        </span>
                      ) : hasFilledToday ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selesai ({stats.scannedCount} Siswa)</span>
                        </span>
                      ) : status === 'FINISHED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                          <span>Waktu Terlewat</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Belum Dimulai</span>
                        </span>
                      )}
                    </div>

                    {/* Schedule Info */}
                    <div className="space-y-1.5 mb-4 text-xs">
                      <div className="flex items-center text-slate-700 font-bold space-x-2">
                        <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{jadwal.jam_mulai} - {jadwal.jam_selesai} WIB</span>
                      </div>

                      <div className="flex items-center text-slate-600 font-medium space-x-2">
                        <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0" />
                        <span>{jadwal.lokasi || 'Lapangan Utama'}</span>
                      </div>
                    </div>

                    {/* STUDENT SCAN STATS BREAKDOWN CARD */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span>Status Scan Kelas</span>
                        </span>
                        <span className="text-emerald-700 font-black">{percentScanned}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                          style={{ width: `${percentScanned}%` }}
                        ></div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-1 text-center pt-1">
                        <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                          <div className="text-xs font-black text-slate-900">{stats.totalSiswa}</div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase">Total Murid</div>
                        </div>
                        <div className="bg-emerald-50 p-1.5 rounded-xl border border-emerald-200">
                          <div className="text-xs font-black text-emerald-700">{stats.scannedCount}</div>
                          <div className="text-[9px] font-bold text-emerald-800 uppercase">Di-Scan</div>
                        </div>
                        <div className="bg-amber-50 p-1.5 rounded-xl border border-amber-200">
                          <div className="text-xs font-black text-amber-700">{stats.unscannedCount}</div>
                          <div className="text-[9px] font-bold text-amber-800 uppercase">Belum Scan</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Area for Absensi */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onSelectJadwalForAbsensi(jadwal)}
                      className={`w-full py-3.5 px-4 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95 ${isActive
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                        }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isActive ? 'MULAI ABSENSI (REALTIME)' : 'ABSENSI KELAS INI'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK ADD JADWAL MODAL */}
      {showAddJadwalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-emerald-400 flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Tambah Jadwal PJOK Baru</span>
              </h3>
              <button onClick={() => setShowAddJadwalModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Guru Pengampu</label>
                <input
                  type="text"
                  disabled
                  value={`${guruData?.nama_guru || user.nama} (Pemilik Akun)`}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Pilih Kelas</label>
                <select
                  value={jadwalForm.kelas_id}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, kelas_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Hari Pelajaran</label>
                <select
                  value={jadwalForm.hari}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, hari: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={jadwalForm.jam_mulai}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, jam_mulai: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={jadwalForm.jam_selesai}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, jam_selesai: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Lokasi Olahraga</label>
                <input
                  type="text"
                  value={jadwalForm.lokasi}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, lokasi: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Lapangan Utama / Hall indoor"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingJadwal}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  {savingJadwal ? 'Menyimpan Jadwal...' : 'Simpan Jadwal Olahraga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
