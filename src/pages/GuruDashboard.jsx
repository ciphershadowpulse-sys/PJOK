import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Play, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, History, FileText } from 'lucide-react';
import { getGuruByUserId, getJadwalGuru, checkScheduleStatus, getAbsensiRecord } from '../services/storage';

export default function GuruDashboard({ user, currentTime, onSelectJadwalForAbsensi, onNavigate }) {
  const [guruData, setGuruData] = useState(null);
  const [jadwals, setJadwals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayFilter, setSelectedDayFilter] = useState('');
  const [absensiMap, setAbsensiMap] = useState({});

  const hariAktif = currentTime.hari; // e.g. 'Senin'
  const dateStr = currentTime.tanggalStr; // e.g. '2026-07-23'

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const guru = await getGuruByUserId(user.id);
        setGuruData(guru);

        const list = await getJadwalGuru(guru.id);
        setJadwals(list);

        // Load existing attendance counts for today
        const statusMap = {};
        for (const j of list) {
          const recs = await getAbsensiRecord(j.id, dateStr);
          statusMap[j.id] = recs.length;
        }
        setAbsensiMap(statusMap);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user, dateStr]);

  const activeHari = selectedDayFilter || hariAktif;
  const filteredJadwals = jadwals.filter(j => j.hari.toLowerCase() === activeHari.toLowerCase());

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
        <div className="flex items-center space-x-2">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Filter Hari:</span>
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(h => (
            <button
              key={h}
              onClick={() => setSelectedDayFilter(h)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                (selectedDayFilter ? selectedDayFilter === h : hariAktif === h)
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
            onClick={() => onNavigate('kelola')}
            className="flex items-center space-x-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl transition-all"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Kelola Data</span>
          </button>

          <button
            onClick={() => onNavigate('riwayat')}
            className="flex items-center space-x-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 px-3.5 py-2 rounded-xl transition-all shadow-sm"
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
              {filteredJadwals.length} Kelas
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
            <h3 className="text-base font-bold text-slate-800">Tidak Ada Jadwal Olahraga</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada kelas PJOK yang terjadwal pada hari {activeHari}. Silakan pilih hari lain atau gunakan simulasi waktu.
            </p>
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

              const hasFilledToday = (absensiMap[jadwal.id] || 0) > 0;
              const isActive = status === 'ACTIVE';

              return (
                <div
                  key={jadwal.id}
                  className={`bg-white border-2 rounded-3xl p-5 shadow-lg transition-all duration-200 relative flex flex-col justify-between overflow-hidden ${
                    isActive
                      ? 'border-emerald-500 ring-4 ring-emerald-500/10'
                      : hasFilledToday
                      ? 'border-sky-300 bg-sky-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-900 bg-slate-100 px-3.5 py-1 rounded-2xl border border-slate-200">
                      Kelas {jadwal.nama_kelas}
                    </span>

                    {isActive ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-md animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        <span>SEDRANG BERLANGSUNG</span>
                      </span>
                    ) : hasFilledToday ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selesai ({absensiMap[jadwal.id]} Siswa)</span>
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
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-slate-700 text-sm font-bold space-x-2">
                      <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{jadwal.jam_mulai} - {jadwal.jam_selesai} WIB</span>
                    </div>

                    <div className="flex items-center text-slate-600 text-xs font-medium space-x-2">
                      <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0" />
                      <span>{jadwal.lokasi || 'Lapangan Utama'}</span>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      Mata Pelajaran: <span className="font-bold text-slate-800">{jadwal.mata_pelajaran}</span>
                    </div>
                  </div>

                  {/* Dynamic Action Area & Time Lock Rules */}
                  <div className="pt-3 border-t border-slate-100">
                    {isActive ? (
                      <button
                        onClick={() => onSelectJadwalForAbsensi(jadwal)}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>MULAI ABSENSI SISWA</span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <button
                          disabled
                          className="w-full py-3 px-4 bg-slate-100 text-slate-400 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 cursor-not-allowed border border-slate-200"
                        >
                          <Play className="w-4 h-4" />
                          <span>Mulai Absensi (Terkunci)</span>
                        </button>

                        <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900 font-semibold text-center flex items-center justify-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>Absensi hanya dapat dilakukan pada jam pelajaran yang terjadwal.</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
