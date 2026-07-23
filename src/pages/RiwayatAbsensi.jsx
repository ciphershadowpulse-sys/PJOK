import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Filter, Download, PieChart, CheckCircle2, User, RefreshCw, FileText } from 'lucide-react';
import { getAllAbsensi, getAllSiswa, getAllKelas, getAllJadwal } from '../services/storage';

export default function RiwayatAbsensi({ onBack, onNavigateToLaporan }) {
  const [absensiList, setAbsensiList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterKelas, setFilterKelas] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [records, students, classes, schedules] = await Promise.all([
          getAllAbsensi(),
          getAllSiswa(),
          getAllKelas(),
          getAllJadwal()
        ]);

        setAbsensiList(records || []);
        setSiswaList(students || []);
        setKelasList(classes || []);
        setJadwalList(schedules || []);
      } catch (e) {
        console.error('Error loading history:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Map student, class & schedule details
  const enrichedRecords = absensiList.map(rec => {
    const s = siswaList.find(item => item.id === rec.siswa_id) || {};
    const k = kelasList.find(item => item.id === s.kelas_id) || {};
    const j = jadwalList.find(item => item.id === rec.jadwal_id) || {};
    return {
      ...rec,
      nama_siswa: s.nama_siswa || 'Siswa N/A',
      nis: s.nis || '-',
      nama_kelas: k.nama_kelas || 'N/A',
      jam_pelajaran: j.jam_mulai ? `${j.jam_mulai} - ${j.jam_selesai}` : '-'
    };
  });

  // Apply filters
  const filtered = enrichedRecords.filter(rec => {
    if (filterKelas && rec.nama_kelas !== filterKelas) return false;
    if (filterTanggal && rec.tanggal !== filterTanggal) return false;
    if (filterStatus && rec.status !== filterStatus) return false;
    return true;
  });

  // Statistics calculation
  const totalCount = filtered.length;
  const hadirCount = filtered.filter(f => f.status === 'Hadir').length;
  const percentageHadir = totalCount > 0 ? Math.round((hadirCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Riwayat Absensi Siswa PJOK</h1>
            <p className="text-xs text-slate-500 font-medium">
              Pantau catatan kehadiran per kelas, per tanggal, dan persentase tingkat partisipasi.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToLaporan()}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
        >
          <FileText className="w-4 h-4" />
          <span>Cetak & Export Laporan PDF/Excel</span>
        </button>
      </div>

      {/* Percentage Analytics Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl flex items-center space-x-4 col-span-1 md:col-span-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-2xl border border-emerald-500/30">
            {percentageHadir}%
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Persentase Kehadiran</div>
            <div className="text-xl font-extrabold text-white">
              {hadirCount} Dari {totalCount} Siswa Hadir
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Statistik dihitung berdasarkan filter data yang aktif.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="text-xs text-slate-500 font-bold uppercase">Total Catatan Absensi</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount} Record</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="text-xs text-slate-500 font-bold uppercase">Total Kelas Terdata</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{kelasList.length} Kelas</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Kelas</label>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map(k => (
              <option key={k.id} value={k.nama_kelas}>Kelas {k.nama_kelas}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Tanggal</label>
          <input
            type="date"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
          >
            <option value="">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Sakit">Sakit</option>
            <option value="Izin">Izin</option>
            <option value="Alpa">Alpa</option>
            <option value="Terlambat">Terlambat</option>
          </select>
        </div>
      </div>

      {/* Table Records */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl text-center text-slate-500 border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-semibold">Memuat data riwayat absensi...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl text-center space-y-2 border border-slate-200">
          <div className="text-3xl">📋</div>
          <h3 className="text-base font-bold text-slate-800">Belum Ada Data Riwayat</h3>
          <p className="text-xs text-slate-500">Tidak ada absensi yang sesuai dengan kriteria filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4">No</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Jam Pelajaran</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {filtered.map((item, idx) => {
                  let badgeColor = 'bg-emerald-100 text-emerald-800';
                  if (item.status === 'Sakit') badgeColor = 'bg-amber-100 text-amber-800';
                  if (item.status === 'Izin') badgeColor = 'bg-sky-100 text-sky-800';
                  if (item.status === 'Alpa') badgeColor = 'bg-rose-100 text-rose-800';
                  if (item.status === 'Terlambat') badgeColor = 'bg-purple-100 text-purple-800';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold">{item.tanggal}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.nama_siswa}
                        <span className="block text-[10px] text-slate-400 font-normal">NIS: {item.nis}</span>
                      </td>
                      <td className="py-3 px-4 font-bold">Kelas {item.nama_kelas}</td>
                      <td className="py-3 px-4 text-slate-600">{item.jam_pelajaran}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${badgeColor}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic">
                        {item.keterangan || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
