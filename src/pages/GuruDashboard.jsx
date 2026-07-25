import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Play, CheckCircle2, AlertCircle, RefreshCw, History, FileText, Plus, X, Users, Check, Sparkles, Activity } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">

      {/* Header Banner (Finova-Inspired Neon Violet & Purple Gradient Glow) */}
      <div className="bg-gradient-to-br from-[#12132a] via-[#1a1c3b] to-[#101124] border border-[#242747] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
        {/* Glow Orbs */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-[#8b5cf6]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-[#ec4899]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-[#8b5cf6]/20 text-[#c084fc] text-xs font-black px-3.5 py-1 rounded-full border border-[#8b5cf6]/40 tracking-wider flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                GURU OLAHRAGA (PJOK)
              </span>
              <span className="text-xs text-zinc-400 font-medium bg-[#14152a] px-3 py-1 rounded-full border border-[#242747]">
                NIP: {guruData?.nip || '198504122010011005'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Selamat Datang, <span className="bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#f43f5e] bg-clip-text text-transparent">{user.nama}</span> 👋
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl font-medium leading-relaxed">
              Kelola absensi pelajaran PJOK secara real-time di lapangan dengan sistem pemindaian QR Code cepat & responsif.
            </p>
          </div>

          {/* Time & Day Card Widget */}
          <div className="bg-[#14152a]/90 border border-[#242747] rounded-2xl p-4 sm:p-5 flex items-center space-x-4 shadow-xl hover:border-[#8b5cf6]/40 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white flex items-center justify-center font-black shadow-lg shadow-[#8b5cf6]/35 flex-shrink-0 animate-float">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">HARI & TANGGAL SEKARANG</div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                {currentTime.hari}, {currentTime.tanggalFormatted}
              </div>
              <div className="text-xs font-bold text-[#c084fc] flex items-center gap-1.5 mt-1">
                <Clock className="w-4 h-4" />
                <span>Jam Pelajaran: {currentTime.jam} WIB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action & Filter Shortcuts Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121324] p-4 rounded-3xl border border-[#242747] shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-zinc-400 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Activity className="w-4 h-4 text-[#a855f7]" />
            Filter Hari:
          </span>
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => {
            const isSelected = (selectedDayFilter ? selectedDayFilter === h : hariAktif === h);
            return (
              <button
                key={h}
                onClick={() => setSelectedDayFilter(h)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/35 scale-105'
                    : 'bg-[#181a33] hover:bg-[#202347] text-zinc-400 hover:text-white border border-[#242747]'
                }`}
              >
                {h} {hariAktif === h && '📌'}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            className="flex items-center space-x-2 text-xs font-black bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:from-[#9333ea] hover:to-[#581c87] text-white px-4 py-2.5 rounded-2xl transition-all duration-300 shadow-lg shadow-[#8b5cf6]/35 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Jadwal PJOK</span>
          </button>

          <button
            onClick={() => onNavigate('kelola')}
            className="flex items-center space-x-2 text-xs font-bold bg-[#181a33] hover:bg-[#202347] text-zinc-200 border border-[#242747] px-4 py-2.5 rounded-2xl transition-all duration-300 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Kelola Data</span>
          </button>

          <button
            onClick={() => onNavigate('riwayat')}
            className="flex items-center space-x-2 text-xs font-bold bg-[#181a33] hover:bg-[#202347] text-zinc-200 border border-[#242747] px-4 py-2.5 rounded-2xl transition-all duration-300 cursor-pointer"
          >
            <History className="w-4 h-4 text-sky-400" />
            <span>Riwayat Absensi</span>
          </button>
        </div>
      </div>

      {/* Jadwal Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>Jadwal Pelajaran PJOK ({activeHari})</span>
            <span className="bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30 text-xs px-3 py-1 rounded-full font-black">
              {filteredJadwals.length} Kelas Terdaftar
            </span>
          </h2>
          {selectedDayFilter && (
            <button
              onClick={() => setSelectedDayFilter('')}
              className="text-xs text-[#c084fc] hover:underline font-extrabold cursor-pointer"
            >
              Kembali ke Hari Ini ({hariAktif})
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-[#121324] p-12 rounded-3xl border border-[#242747] text-center text-zinc-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#a855f7] mb-3" />
            <p className="text-sm font-bold">Memuat jadwal pelajaran olahraga...</p>
          </div>
        ) : filteredJadwals.length === 0 ? (
          <div className="bg-[#121324] p-10 rounded-3xl border border-[#242747] text-center space-y-3">
            <div className="w-16 h-16 bg-[#181a33] border border-[#242747] rounded-2xl flex items-center justify-center mx-auto text-3xl">
              🏖️
            </div>
            <h3 className="text-base font-black text-white">Tidak Ada Jadwal Olahraga di Hari {activeHari}</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto font-medium">
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
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg shadow-[#8b5cf6]/35 hover:scale-105 transition-all cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Jadwal Hari {activeHari}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJadwals.map((jadwal) => {
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
                  className={`bg-[#121324] border rounded-3xl p-6 shadow-xl transition-all duration-300 relative flex flex-col justify-between overflow-hidden group hover:scale-[1.02] ${
                    isActive
                      ? 'border-[#f43f5e] ring-4 ring-[#f43f5e]/20'
                      : hasFilledToday
                      ? 'border-sky-500/50 bg-[#141630]'
                      : 'border-[#242747] hover:border-[#8b5cf6]/50'
                  }`}
                >
                  {/* Top Header Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-black text-white bg-[#181a33] px-4 py-1.5 rounded-2xl border border-[#242747] group-hover:border-[#8b5cf6]/50 transition-colors">
                        Kelas {jadwal.nama_kelas}
                      </span>

                      {isActive ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-[#f43f5e] to-[#e11d48] text-white shadow-lg shadow-rose-500/40 animate-pulse-glow">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                          <span>SEDANG BERLANGSUNG</span>
                        </span>
                      ) : hasFilledToday ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selesai ({stats.scannedCount} Siswa)</span>
                        </span>
                      ) : status === 'FINISHED' ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          <span>Waktu Terlewat</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Belum Dimulai</span>
                        </span>
                      )}
                    </div>

                    {/* Schedule Info */}
                    <div className="space-y-2 mb-5 text-xs">
                      <div className="flex items-center text-zinc-200 font-bold space-x-2.5">
                        <Clock className="w-4 h-4 text-[#c084fc] flex-shrink-0" />
                        <span>{jadwal.jam_mulai} - {jadwal.jam_selesai} WIB</span>
                      </div>

                      <div className="flex items-center text-zinc-400 font-medium space-x-2.5">
                        <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
                        <span>{jadwal.lokasi || 'Lapangan Utama'}</span>
                      </div>
                    </div>

                    {/* STUDENT SCAN STATS BREAKDOWN CARD */}
                    <div className="bg-[#181a33] border border-[#242747] rounded-2xl p-4 space-y-3 mb-5 group-hover:border-[#323661] transition-colors">
                      <div className="flex items-center justify-between text-xs font-black text-zinc-200">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#a855f7]" />
                          <span>Status Scan Kelas</span>
                        </span>
                        <span className="text-[#c084fc] font-black text-sm">{percentScanned}%</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 bg-[#0b0c16] rounded-full overflow-hidden border border-[#242747] p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-[#a855f7] via-[#8b5cf6] to-[#f43f5e] transition-all duration-500 rounded-full"
                          style={{ width: `${percentScanned}%` }}
                        ></div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="bg-[#121324] p-2 rounded-xl border border-[#242747]">
                          <div className="text-xs font-black text-white">{stats.totalSiswa}</div>
                          <div className="text-[9px] font-bold text-zinc-400 uppercase">Total Murid</div>
                        </div>
                        <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                          <div className="text-xs font-black text-emerald-400">{stats.scannedCount}</div>
                          <div className="text-[9px] font-bold text-emerald-300 uppercase">Di-Scan</div>
                        </div>
                        <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                          <div className="text-xs font-black text-amber-400">{stats.unscannedCount}</div>
                          <div className="text-[9px] font-bold text-amber-300 uppercase">Belum Scan</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Area for Absensi */}
                  <div className="pt-3 border-t border-[#242747]">
                    <button
                      onClick={() => onSelectJadwalForAbsensi(jadwal)}
                      className={`w-full py-3.5 px-4 font-black text-xs sm:text-sm rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#f43f5e] to-[#e11d48] hover:from-[#fb7185] hover:to-[#be123c] text-white shadow-rose-500/35 ring-2 ring-rose-400/50'
                          : 'bg-[#1b1d38] hover:bg-[#25284d] text-white border border-[#242747] hover:border-[#8b5cf6]/50'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current text-white" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060b]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121324] border border-[#242747] rounded-3xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#8b5cf6]/15 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-[#242747] pb-4">
              <h3 className="font-black text-base text-[#c084fc] flex items-center space-x-2">
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>Tambah Jadwal PJOK Baru</span>
              </h3>
              <button onClick={() => setShowAddJadwalModal(false)} className="text-zinc-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">Guru Pengampu</label>
                <input
                  type="text"
                  disabled
                  value={`${guruData?.nama_guru || user.nama} (Pemilik Akun)`}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-[#c084fc] font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">Pilih Kelas</label>
                <select
                  value={jadwalForm.kelas_id}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, kelas_id: e.target.value })}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#8b5cf6] focus:outline-none"
                >
                  {kelasList.map(k => (
                    <option key={k.id} value={k.id} className="bg-[#121324]">Kelas {k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">Hari Pelajaran</label>
                <select
                  value={jadwalForm.hari}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, hari: e.target.value })}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#8b5cf6] focus:outline-none"
                >
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => (
                    <option key={h} value={h} className="bg-[#121324]">{h}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1.5">Jam Mulai</label>
                  <input
                    type="time"
                    value={jadwalForm.jam_mulai}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, jam_mulai: e.target.value })}
                    className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white focus:ring-2 focus:ring-[#8b5cf6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1.5">Jam Selesai</label>
                  <input
                    type="time"
                    value={jadwalForm.jam_selesai}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, jam_selesai: e.target.value })}
                    className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white focus:ring-2 focus:ring-[#8b5cf6] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">Lokasi Olahraga</label>
                <input
                  type="text"
                  value={jadwalForm.lokasi}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, lokasi: e.target.value })}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white focus:ring-2 focus:ring-[#8b5cf6] focus:outline-none"
                  placeholder="Contoh: Lapangan Utama / Hall indoor"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingJadwal}
                  className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:from-[#9333ea] hover:to-[#581c87] font-black text-white text-xs rounded-xl shadow-lg shadow-[#8b5cf6]/35 transition-all cursor-pointer"
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
