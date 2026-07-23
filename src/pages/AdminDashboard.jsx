import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Calendar, Clock, ShieldCheck, Plus, Trash2, Edit, Save, X, Search, RefreshCw, Download, FileSpreadsheet, Upload, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getAllUsers, getAllGuru, getAllKelas, getAllSiswa, getAllJadwal, getAuditLogs, addOrUpdateSiswa, addOrUpdateSiswaBatch, addOrUpdateJadwal, deleteJadwal, deleteSiswa } from '../services/storage';

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('jadwal'); // 'jadwal', 'siswa', 'guru', 'logs'

  // Data states
  const [users, setUsers] = useState([]);
  const [guru, setGuru] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [siswa, setSiswa] = useState([]);
  const [jadwal, setJadwal] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [showSiswaModal, setShowSiswaModal] = useState(false);

  // Form states
  const [jadwalForm, setJadwalForm] = useState({
    id: '', guru_id: '', kelas_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: 'PJOK', lokasi: 'Lapangan Utama'
  });

  const [siswaForm, setSiswaForm] = useState({
    id: '', nis: '', nama_siswa: '', kelas_id: '', jenis_kelamin: 'L'
  });

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [uList, gList, kList, sList, jList, lList] = await Promise.all([
        getAllUsers(),
        getAllGuru(),
        getAllKelas(),
        getAllSiswa(),
        getAllJadwal(),
        getAuditLogs()
      ]);
      setUsers(uList || []);
      setGuru(gList || []);
      setKelas(kList || []);
      setSiswa(sList || []);
      setJadwal(jList || []);
      setLogs(lList || []);
    } catch (e) {
      console.error('Admin data load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Submit Jadwal Form
  const handleSaveJadwal = async (e) => {
    e.preventDefault();
    if (!jadwalForm.guru_id || !jadwalForm.kelas_id) {
      alert('Pilih Guru dan Kelas terlebih dahulu.');
      return;
    }
    try {
      await addOrUpdateJadwal(jadwalForm);
      setShowJadwalModal(false);
      await loadAllAdminData();
    } catch (err) {
      alert('Gagal menyimpan jadwal: ' + err.message);
    }
  };

  // Submit Siswa Form
  const handleSaveSiswa = async (e) => {
    e.preventDefault();
    if (!siswaForm.nis || !siswaForm.nama_siswa || !siswaForm.kelas_id) {
      alert('Lengkapi NIS, Nama Siswa, dan Kelas.');
      return;
    }
    try {
      await addOrUpdateSiswa(siswaForm);
      setShowSiswaModal(false);
      await loadAllAdminData();
    } catch (err) {
      alert('Gagal menyimpan siswa: ' + err.message);
    }
  };

  const handleDeleteJadwal = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      try {
        await deleteJadwal(id);
        await loadAllAdminData();
      } catch (err) {
        alert('Gagal menghapus jadwal: ' + err.message);
      }
    }
  };

  const handleDeleteSiswa = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
      try {
        await deleteSiswa(id);
        await loadAllAdminData();
      } catch (err) {
        alert('Gagal menghapus siswa: ' + err.message);
      }
    }
  };

  const fileInputRef = React.useRef(null);
  const [importStatusMsg, setImportStatusMsg] = useState('');

  // Download Excel Template for Importing Students
  const downloadSiswaTemplate = () => {
    const templateData = [
      { 'NIS': '1013', 'Nama Siswa': 'Ahmad Zaky Pratama', 'Nama Kelas': '5A', 'Jenis Kelamin (L/P)': 'L' },
      { 'NIS': '1014', 'Nama Siswa': 'Nabila Putri Setiawan', 'Nama Kelas': '5B', 'Jenis Kelamin (L/P)': 'P' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');
    XLSX.writeFile(workbook, 'Template_Import_Siswa_PJOK.xlsx');
  };

  // Handle Excel File Upload & Parse
  const handleImportSiswaExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        setImportStatusMsg('');
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet);

        if (!rawData || rawData.length === 0) {
          throw new Error('File Excel kosong atau format tidak sesuai.');
        }

        const toImport = [];
        for (const row of rawData) {
          const nis = String(row['NIS'] || row['nis'] || '').trim();
          const namaSiswa = String(row['Nama Siswa'] || row['nama_siswa'] || row['Nama'] || '').trim();
          const namaKelas = String(row['Nama Kelas'] || row['nama_kelas'] || row['Kelas'] || '').trim().toUpperCase();
          const genderRaw = String(row['Jenis Kelamin (L/P)'] || row['Jenis Kelamin'] || row['jenis_kelamin'] || 'L').trim().toUpperCase();
          const gender = genderRaw.startsWith('P') ? 'P' : 'L';

          if (!nis || !namaSiswa) continue;

          // Find matching class ID by class name or assign first class
          const matchedKelas = kelas.find(k => k.nama_kelas.toUpperCase() === namaKelas) || kelas[0];

          toImport.push({
            nis,
            nama_siswa: namaSiswa,
            kelas_id: matchedKelas?.id || null,
            jenis_kelamin: gender,
            qr_code: `QR-${nis}`
          });
        }

        if (toImport.length === 0) {
          throw new Error('Tidak ada data siswa valid yang ditemukan di file Excel.');
        }

        await addOrUpdateSiswaBatch(toImport);
        await loadAllAdminData();
        setImportStatusMsg(`🎉 Berhasil mengimpor ${toImport.length} data siswa dari file Excel ke database Supabase!`);
      } catch (err) {
        alert('Gagal mengimpor Excel: ' + err.message);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Kelola Data Siswa, Kelas & Jadwal Pelajaran</h1>
            <p className="text-xs text-slate-300">
              Pengaturan master data siswa, kelas, jadwal pelajaran PJOK, dan audit log aktivitas.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all ${
            activeTab === 'jadwal'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Jadwal Pelajaran ({jadwal.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('siswa')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all ${
            activeTab === 'siswa'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-sky-400" />
          <span>Data Siswa ({siswa.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guru')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all ${
            activeTab === 'guru'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Data Guru PJOK ({guru.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all ${
            activeTab === 'logs'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-400" />
          <span>Audit Logs ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: MANAJEMEN JADWAL PELAJARAN */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Jadwal Olahraga Terdaftar</h2>
            <button
              onClick={() => {
                setJadwalForm({ id: '', guru_id: guru[0]?.id || '', kelas_id: kelas[0]?.id || '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: 'PJOK', lokasi: 'Lapangan Utama' });
                setShowJadwalModal(true);
              }}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal PJOK</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase">
                  <th className="p-3.5">Hari</th>
                  <th className="p-3.5">Jam Pelajaran</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Guru Pengampu</th>
                  <th className="p-3.5">Lokasi</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {jadwal.map((j) => {
                  const g = guru.find(item => item.id === j.guru_id);
                  const k = kelas.find(item => item.id === j.kelas_id);
                  return (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{j.hari}</td>
                      <td className="p-3.5 text-slate-700 font-bold">{j.jam_mulai} - {j.jam_selesai}</td>
                      <td className="p-3.5 font-extrabold text-emerald-600">Kelas {k?.nama_kelas || '-'}</td>
                      <td className="p-3.5 text-slate-800">{g?.nama_guru || '-'}</td>
                      <td className="p-3.5 text-slate-600">{j.lokasi || 'Lapangan Utama'}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleDeleteJadwal(j.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN SISWA */}
      {activeTab === 'siswa' && (
        <div className="space-y-4">

          {/* Import Status Toast */}
          {importStatusMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-emerald-700 text-xs font-bold animate-fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{importStatusMsg}</span>
              </div>
              <button onClick={() => setImportStatusMsg('')} className="text-emerald-800 hover:text-emerald-950">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportSiswaExcel}
            accept=".xlsx, .xls"
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Daftar Siswa Sekolah</h2>
              <p className="text-xs text-slate-500 font-medium">Kelola data master siswa atau impor massal via file Excel</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Button Unduh Template Excel */}
              <button
                onClick={downloadSiswaTemplate}
                className="py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-extrabold text-xs rounded-2xl shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Unduh Format Contoh File Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Unduh Template Excel</span>
              </button>

              {/* Button Impor Excel Siswa */}
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Unggah dan Impor File Excel Siswa"
              >
                <Upload className="w-4 h-4" />
                <span>Impor Excel Siswa</span>
              </button>

              {/* Button Manual Tambah Siswa */}
              <button
                onClick={() => {
                  setSiswaForm({ id: '', nis: '', nama_siswa: '', kelas_id: kelas[0]?.id || '', jenis_kelamin: 'L' });
                  setShowSiswaModal(true);
                }}
                className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-sky-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase">
                  <th className="p-3.5">NIS</th>
                  <th className="p-3.5">Nama Siswa</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Gender</th>
                  <th className="p-3.5">QR Code ID</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {siswa.map((s) => {
                  const k = kelas.find(item => item.id === s.kelas_id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-600">{s.nis}</td>
                      <td className="p-3.5 font-extrabold text-slate-900">{s.nama_siswa}</td>
                      <td className="p-3.5 font-bold text-sky-600">Kelas {k?.nama_kelas || '-'}</td>
                      <td className="p-3.5">{s.jenis_kelamin}</td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-500">{s.qr_code}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteSiswa(s.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATA GURU */}
      {activeTab === 'guru' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">Data Guru Olahraga (PJOK)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guru.map(g => (
              <div key={g.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">{g.nama_guru}</h3>
                <p className="text-xs text-slate-600 font-medium">NIP: {g.nip}</p>
                <p className="text-xs text-emerald-600 font-bold">Mata Pelajaran: {g.mata_pelajaran}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h2 className="text-base font-extrabold text-slate-900">Audit Trail Aktivitas Sistem</h2>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-emerald-600 mr-2">[{log.aksi}]</span>
                  <span className="font-semibold text-slate-800">{log.detail}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{new Date(log.created_at).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH JADWAL */}
      {showJadwalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-emerald-400">Tambah Jadwal Olahraga</h3>
              <button onClick={() => setShowJadwalModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Pilih Guru PJOK</label>
                <select
                  value={jadwalForm.guru_id}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, guru_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                >
                  {guru.map(g => (
                    <option key={g.id} value={g.id}>{g.nama_guru}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Pilih Kelas</label>
                <select
                  value={jadwalForm.kelas_id}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, kelas_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                >
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Hari</label>
                <select
                  value={jadwalForm.hari}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, hari: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                >
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(h => (
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={jadwalForm.jam_selesai}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, jam_selesai: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Lokasi Olahraga</label>
                <input
                  type="text"
                  value={jadwalForm.lokasi}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, lokasi: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="Contoh: Lapangan Utama"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-white rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SISWA */}
      {showSiswaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-sky-400">Tambah Data Siswa</h3>
              <button onClick={() => setShowSiswaModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSiswa} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">NIS (Nomor Induk Siswa)</label>
                <input
                  type="text"
                  required
                  value={siswaForm.nis}
                  onChange={(e) => setSiswaForm({ ...siswaForm, nis: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="Contoh: 1015"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={siswaForm.nama_siswa}
                  onChange={(e) => setSiswaForm({ ...siswaForm, nama_siswa: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Kelas</label>
                <select
                  value={siswaForm.kelas_id}
                  onChange={(e) => setSiswaForm({ ...siswaForm, kelas_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                >
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Jenis Kelamin</label>
                <select
                  value={siswaForm.jenis_kelamin}
                  onChange={(e) => setSiswaForm({ ...siswaForm, jenis_kelamin: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 font-extrabold text-white rounded-xl shadow-lg shadow-sky-600/30"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
