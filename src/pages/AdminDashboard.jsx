import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Calendar, Clock, ShieldCheck, Plus, Trash2, Edit, Save, X, Search, RefreshCw, Download, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getAllUsers, getAllGuru, getAllKelas, getAllSiswa, getAllJadwal, getAuditLogs, addOrUpdateKelas, addOrUpdateSiswa, addOrUpdateSiswaBatch, addOrUpdateJadwal, deleteJadwal, deleteSiswa } from '../services/storage';

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

  // Student Search & Filter states
  const [siswaSearch, setSiswaSearch] = useState('');
  const [siswaKelasFilter, setSiswaKelasFilter] = useState('semua');

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

  // Submit Siswa Form (Tambah / Edit)
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

  const handleEditJadwal = (j) => {
    setJadwalForm({
      id: j.id,
      guru_id: j.guru_id || guru[0]?.id || '',
      kelas_id: j.kelas_id || kelas[0]?.id || '',
      hari: j.hari || 'Senin',
      jam_mulai: j.jam_mulai ? String(j.jam_mulai).substring(0, 5) : '07:00',
      jam_selesai: j.jam_selesai ? String(j.jam_selesai).substring(0, 5) : '08:30',
      mata_pelajaran: j.mata_pelajaran || 'PJOK',
      lokasi: j.lokasi || 'Lapangan Utama'
    });
    setShowJadwalModal(true);
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

  const handleEditSiswa = (s) => {
    setSiswaForm({
      id: s.id,
      nis: s.nis || '',
      nama_siswa: s.nama_siswa || '',
      kelas_id: s.kelas_id || kelas[0]?.id || '',
      jenis_kelamin: s.jenis_kelamin || 'L'
    });
    setShowSiswaModal(true);
  };

  const fileInputRef = React.useRef(null);
  const [importStatusMsg, setImportStatusMsg] = useState('');
  const [importStatusType, setImportStatusType] = useState('success');

  // Download Excel Template for Importing Students
  const downloadSiswaTemplate = () => {
    try {
      const templateData = [
        { 'NIS': '1001', 'Nama Siswa': 'Ahmad Rizky Pratama', 'Nama Kelas': '5A', 'Jenis Kelamin (L/P)': 'L', 'QR Code': 'QR-1001' },
        { 'NIS': '1002', 'Nama Siswa': 'Anisa Rahmawati', 'Nama Kelas': '5A', 'Jenis Kelamin (L/P)': 'P', 'QR Code': 'QR-1002' },
        { 'NIS': '1003', 'Nama Siswa': 'Bagus Setiawan', 'Nama Kelas': '5B', 'Jenis Kelamin (L/P)': 'L', 'QR Code': 'QR-1003' },
        { 'NIS': '1004', 'Nama Siswa': 'Citra Dewi Permata', 'Nama Kelas': '5B', 'Jenis Kelamin (L/P)': 'P', 'QR Code': 'QR-1004' },
        { 'NIS': '1005', 'Nama Siswa': 'Daffa Al-Farizi', 'Nama Kelas': '6A', 'Jenis Kelamin (L/P)': 'L', 'QR Code': 'QR-1005' },
        { 'NIS': '1006', 'Nama Siswa': 'Eka Putri Lestari', 'Nama Kelas': '6A', 'Jenis Kelamin (L/P)': 'P', 'QR Code': 'QR-1006' }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);

      // Lebar kolom rapi
      worksheet['!cols'] = [
        { wch: 14 }, // NIS
        { wch: 30 }, // Nama Siswa
        { wch: 15 }, // Nama Kelas
        { wch: 22 }, // Jenis Kelamin (L/P)
        { wch: 18 }  // QR Code
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
      XLSX.writeFile(workbook, 'Template_Import_Siswa_PJOK.xlsx');
    } catch (err) {
      alert('Gagal mendownload template Excel: ' + err.message);
    }
  };

  // Handle Excel File Upload & Parse
  const handleImportSiswaExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        setImportStatusMsg('');
        
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('File Excel tidak memiliki sheet yang valid.');
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawData || rawData.length === 0) {
          throw new Error('File Excel kosong atau format data tidak ditemukan.');
        }

        const currentKelasList = [...kelas];
        let newClassesCount = 0;
        const toImport = [];

        const normalizeClassName = (str) => {
          if (!str) return '';
          return String(str)
            .toUpperCase()
            .replace(/^KELAS\s*/i, '')
            .replace(/\s+/g, '')
            .replace(/-/g, '')
            .trim();
        };

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];

          // 1. Ekstrak NIS / NISN
          let rawNis = row['NIS'] ?? row['nis'] ?? row['Nis'] ?? row['NISN'] ?? row['nisn'] ?? row['Nomor Induk'] ?? row['No Induk'] ?? row['No. Induk'];
          if (rawNis === undefined || rawNis === '') {
            for (const k of Object.keys(row)) {
              if (/nis|induk/i.test(k)) {
                rawNis = row[k];
                break;
              }
            }
          }
          const nis = String(rawNis ?? '').replace(/\.0$/, '').trim();

          // 2. Ekstrak Nama Siswa
          let rawNama = row['Nama Siswa'] ?? row['nama_siswa'] ?? row['Nama'] ?? row['NAMA SISWA'] ?? row['Nama Lengkap'];
          if (!rawNama) {
            for (const k of Object.keys(row)) {
              if (/nama/i.test(k)) {
                rawNama = row[k];
                break;
              }
            }
          }
          const namaSiswa = String(rawNama ?? '').trim();

          // 3. Ekstrak Nama Kelas
          let rawKelas = row['Nama Kelas'] ?? row['nama_kelas'] ?? row['Kelas'] ?? row['KELAS'] ?? row['Tingkat'];
          if (!rawKelas) {
            for (const k of Object.keys(row)) {
              if (/kelas/i.test(k)) {
                rawKelas = row[k];
                break;
              }
            }
          }
          const namaKelas = String(rawKelas ?? '').trim();

          // 4. Ekstrak Gender
          let rawGender = row['Jenis Kelamin (L/P)'] ?? row['Jenis Kelamin'] ?? row['jenis_kelamin'] ?? row['JK'] ?? row['Gender'] ?? row['L/P'] ?? 'L';
          if (!rawGender) {
            for (const k of Object.keys(row)) {
              if (/kelamin|jk|gender/i.test(k)) {
                rawGender = row[k];
                break;
              }
            }
          }
          const genderStr = String(rawGender ?? '').trim().toUpperCase();
          const gender = (genderStr.startsWith('P') || genderStr === 'PEREMPUAN' || genderStr === 'WOMAN' || genderStr === 'F') ? 'P' : 'L';

          // 5. Ekstrak QR Code jika ada di file Excel
          let rawQr = row['QR Code'] ?? row['qr_code'] ?? row['QR'] ?? row['Qr Code'];
          const customQr = String(rawQr ?? '').trim();

          if (!nis || !namaSiswa) continue;

          // Cari atau Buat Kelas Otomatis
          let matchedKelas = null;
          const cleanTargetKelas = normalizeClassName(namaKelas);

          if (cleanTargetKelas) {
            matchedKelas = currentKelasList.find(k => normalizeClassName(k.nama_kelas) === cleanTargetKelas);
            
            // Jika kelas belum ada di database, buat otomatis di Supabase
            if (!matchedKelas) {
              try {
                const formattedClassName = cleanTargetKelas;
                const tingkat = formattedClassName.replace(/\D/g, '') || '1';
                const createdKelas = await addOrUpdateKelas({
                  nama_kelas: formattedClassName,
                  tingkat: tingkat
                });
                if (createdKelas) {
                  currentKelasList.push(createdKelas);
                  matchedKelas = createdKelas;
                  newClassesCount++;
                }
              } catch (errCreate) {
                console.warn('Auto create kelas note:', errCreate);
              }
            }
          }

          // Fallback jika tidak ada nama kelas
          if (!matchedKelas && currentKelasList.length > 0) {
            matchedKelas = currentKelasList[0];
          }

          toImport.push({
            nis,
            nama_siswa: namaSiswa,
            kelas_id: matchedKelas?.id || null,
            jenis_kelamin: gender,
            qr_code: customQr || `QR-${nis}`
          });
        }

        if (toImport.length === 0) {
          throw new Error('Tidak ada data siswa valid. Pastikan kolom NIS dan Nama Siswa terisi dengan benar.');
        }

        await addOrUpdateSiswaBatch(toImport);
        await loadAllAdminData();
        
        let msg = `🎉 Berhasil mengimpor ${toImport.length} data siswa ke database!`;
        if (newClassesCount > 0) {
          msg += ` (${newClassesCount} kelas baru otomatis ditambahkan)`;
        }
        setImportStatusType('success');
        setImportStatusMsg(msg);
      } catch (err) {
        setImportStatusType('error');
        setImportStatusMsg('❌ Gagal mengimpor Excel: ' + err.message);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
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
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleEditJadwal(j)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Jadwal"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
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
      {activeTab === 'siswa' && (() => {
        const filteredSiswa = siswa.filter((s) => {
          const matchesSearch =
            s.nama_siswa?.toLowerCase().includes(siswaSearch.toLowerCase()) ||
            s.nis?.toLowerCase().includes(siswaSearch.toLowerCase());
          const matchesKelas =
            siswaKelasFilter === 'semua' || s.kelas_id === siswaKelasFilter;
          return matchesSearch && matchesKelas;
        });

        const totalLaki = siswa.filter(s => s.jenis_kelamin === 'L').length;
        const totalPerempuan = siswa.filter(s => s.jenis_kelamin === 'P').length;

        return (
          <div className="space-y-4">

            {/* Import Status Toast Banner */}
            {importStatusMsg && (
              <div className={`border rounded-2xl p-4 flex items-center justify-between text-xs font-bold animate-fade-in ${
                importStatusType === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
              }`}>
                <div className="flex items-center space-x-2">
                  {importStatusType === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  )}
                  <span>{importStatusMsg}</span>
                </div>
                <button onClick={() => setImportStatusMsg('')} className="p-1 text-slate-500 hover:text-slate-800">
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
                <p className="text-xs text-slate-500 font-medium">
                  Total {siswa.length} Siswa ({totalLaki} Laki-laki, {totalPerempuan} Perempuan)
                </p>
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

            {/* Filter & Search Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan NIS atau Nama Siswa..."
                  value={siswaSearch}
                  onChange={(e) => setSiswaSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <select
                  value={siswaKelasFilter}
                  onChange={(e) => setSiswaKelasFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="semua">Semua Kelas ({kelas.length})</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Siswa */}
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
                  {filteredSiswa.length > 0 ? (
                    filteredSiswa.map((s) => {
                      const k = kelas.find(item => item.id === s.kelas_id);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-bold text-slate-600">{s.nis}</td>
                          <td className="p-3.5 font-extrabold text-slate-900">{s.nama_siswa}</td>
                          <td className="p-3.5 font-bold text-sky-600">Kelas {k?.nama_kelas || '-'}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${s.jenis_kelamin === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                              {s.jenis_kelamin === 'P' ? 'Perempuan (P)' : 'Laki-laki (L)'}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-[10px] text-slate-500">{s.qr_code}</td>
                          <td className="p-3.5 text-right space-x-1">
                            <button
                              onClick={() => handleEditSiswa(s)}
                              className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Edit Data Siswa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                        Tidak ada data siswa yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

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
              <h3 className="font-extrabold text-base text-emerald-400">
                {jadwalForm.id ? 'Edit Jadwal Olahraga' : 'Tambah Jadwal PJOK'}
              </h3>
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
              <h3 className="font-extrabold text-base text-sky-400">
                {siswaForm.id ? 'Edit Data Siswa' : 'Tambah Data Siswa'}
              </h3>
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
