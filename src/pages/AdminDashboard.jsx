import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Calendar, Clock, ShieldCheck, Plus, Trash2, Edit, Save, X, Search, RefreshCw, Download, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Filter, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getAllUsers, getAllGuru, getAllKelas, getAllSiswa, getAllJadwal, getAuditLogs, logAudit, addOrUpdateKelas, addOrUpdateSiswa, addOrUpdateSiswaBatch, addOrUpdateJadwal, deleteJadwal, deleteSiswa } from '../services/storage';

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
    id: '', nis: '', nisn: '', nama_siswa: '', kelas_id: '', jenis_kelamin: 'L'
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
      setJadwalForm({ id: '', guru_id: '', kelas_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: 'PJOK', lokasi: 'Lapangan Utama' });
      await loadAllAdminData();
    } catch (err) {
      alert('Gagal menyimpan jadwal: ' + err.message);
    }
  };

  // Submit Siswa Form (Tambah / Edit)
  const handleSaveSiswa = async (e) => {
    e.preventDefault();
    if ((!siswaForm.nis && !siswaForm.nisn) || !siswaForm.nama_siswa || !siswaForm.kelas_id) {
      alert('Lengkapi NIS/NISN, Nama Siswa, dan Kelas.');
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
      nisn: s.nisn || '',
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
        {
          'NIS': '1001',
          'NISN': '0051234567',
          'Nama Siswa': 'Ahmad Rizky Pratama',
          'Nama Kelas': '5A',
          'Jenis Kelamin (L/P)': 'L',
          'QR Code': 'QR-1001'
        },
        {
          'NIS': '1002',
          'NISN': '0051234568',
          'Nama Siswa': 'Anisa Rahmawati',
          'Nama Kelas': '5A',
          'Jenis Kelamin (L/P)': 'P',
          'QR Code': 'QR-1002'
        },
        {
          'NIS': '1003',
          'NISN': '0051234569',
          'Nama Siswa': 'Bagus Setiawan',
          'Nama Kelas': '5B',
          'Jenis Kelamin (L/P)': 'L',
          'QR Code': 'QR-1003'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      ws['!cols'] = [
        { wch: 15 }, // NIS
        { wch: 15 }, // NISN
        { wch: 30 }, // Nama Siswa
        { wch: 15 }, // Nama Kelas
        { wch: 22 }, // Jenis Kelamin (L/P)
        { wch: 18 }  // QR Code
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
      XLSX.writeFile(wb, 'Template_Import_Siswa_PJOK.xlsx');
    } catch (e) {
      alert('Gagal mengunduh template: ' + e.message);
    }
  };

  const normalizeClassName = (rawName) => {
    if (!rawName) return '';
    return String(rawName).trim().toUpperCase().replace(/\s+/g, ' ');
  };

  // Import Siswa Excel Parser
  const handleImportSiswaExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImportStatusMsg('');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          throw new Error('File Excel kosong atau tidak terbaca.');
        }

        let currentKelasList = await getAllKelas();
        if (!currentKelasList || currentKelasList.length === 0) {
          currentKelasList = [...kelas];
        }

        const toImport = [];
        let newClassesCount = 0;

        for (const row of rawData) {
          let rawNis = row['NIS'] ?? row['nis'] ?? row['Nis'] ?? row['No Induk'] ?? row['NO INDUK'] ?? row['No. Induk'] ?? row['NO. INDUK'];
          if (!rawNis) {
            for (const k of Object.keys(row)) {
              if (/nis\b|induk/i.test(k)) {
                rawNis = row[k];
                break;
              }
            }
          }
          let nis = String(rawNis ?? '').trim();

          let rawNisn = row['NISN'] ?? row['nisn'] ?? row['Nisn'] ?? row['No NISN'] ?? row['NO NISN'];
          if (!rawNisn) {
            for (const k of Object.keys(row)) {
              if (/nisn/i.test(k)) {
                rawNisn = row[k];
                break;
              }
            }
          }
          let nisn = String(rawNisn ?? '').trim();

          if (!nis && nisn) nis = nisn;

          let rawNama = row['Nama Siswa'] ?? row['nama_siswa'] ?? row['NAMA SISWA'] ?? row['Nama'] ?? row['NAMA'] ?? row['Nama Lengkap'];
          if (!rawNama) {
            for (const k of Object.keys(row)) {
              if (/nama/i.test(k)) {
                rawNama = row[k];
                break;
              }
            }
          }
          const namaSiswa = String(rawNama ?? '').trim();

          let rawKelas = row['Nama Kelas'] ?? row['nama_kelas'] ?? row['Kelas'] ?? row['KELAS'];
          if (!rawKelas) {
            for (const k of Object.keys(row)) {
              if (/kelas/i.test(k)) {
                rawKelas = row[k];
                break;
              }
            }
          }
          const namaKelas = String(rawKelas ?? '').trim();

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

          let rawQr = row['QR Code'] ?? row['qr_code'] ?? row['QR'] ?? row['Qr Code'];
          const customQr = String(rawQr ?? '').trim();

          if (!nis && !namaSiswa) continue;
          if (!namaSiswa) continue;

          let matchedKelas = null;
          const cleanTargetKelas = normalizeClassName(namaKelas);

          if (cleanTargetKelas) {
            matchedKelas = currentKelasList.find(k => normalizeClassName(k.nama_kelas) === cleanTargetKelas);
            
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

          if (!matchedKelas && currentKelasList.length > 0) {
            matchedKelas = currentKelasList[0];
          }

          toImport.push({
            nis,
            nisn,
            nama_siswa: namaSiswa,
            kelas_id: matchedKelas?.id || null,
            jenis_kelamin: gender,
            qr_code: customQr || `QR-${nis || nisn}`
          });
        }

        if (toImport.length === 0) {
          throw new Error('Tidak ada data siswa valid. Pastikan kolom NIS/NISN dan Nama Siswa terisi dengan benar.');
        }

        await addOrUpdateSiswaBatch(toImport);
        await logAudit(user?.id || 'admin', 'IMPORT_SISWA_EXCEL', `Mengimpor ${toImport.length} siswa dari file Excel: ${file.name}`);
        await loadAllAdminData();
        
        let msg = `🎉 Berhasil mengimpor ${toImport.length} data siswa langsung ke Supabase!`;
        if (newClassesCount > 0) {
          msg += ` (${newClassesCount} kelas baru otomatis didaftarkan di Supabase)`;
        }
        setImportStatusType('success');
        setImportStatusMsg(msg);
      } catch (err) {
        setImportStatusType('error');
        setImportStatusMsg('❌ Gagal mengimpor Excel ke Supabase: ' + err.message);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#12132a] via-[#1a1c3b] to-[#101124] border border-[#242747] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#8b5cf6]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30 flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black">Kelola Data Siswa, Kelas & Jadwal Pelajaran</h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Pengaturan master data siswa, kelas, jadwal pelajaran PJOK, dan audit log aktivitas.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#242747] pb-3">
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all duration-300 cursor-pointer ${
            activeTab === 'jadwal'
              ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/35 scale-105'
              : 'bg-[#121324] text-zinc-400 hover:text-white hover:bg-[#1d1f3d] border border-[#242747]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal Pelajaran ({jadwal.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('siswa')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all duration-300 cursor-pointer ${
            activeTab === 'siswa'
              ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/35 scale-105'
              : 'bg-[#121324] text-zinc-400 hover:text-white hover:bg-[#1d1f3d] border border-[#242747]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Data Siswa ({siswa.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guru')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all duration-300 cursor-pointer ${
            activeTab === 'guru'
              ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/35 scale-105'
              : 'bg-[#121324] text-zinc-400 hover:text-white hover:bg-[#1d1f3d] border border-[#242747]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Data Guru PJOK ({guru.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all duration-300 cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/35 scale-105'
              : 'bg-[#121324] text-zinc-400 hover:text-white hover:bg-[#1d1f3d] border border-[#242747]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Logs ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: MANAJEMEN JADWAL PELAJARAN */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white">Jadwal Olahraga Terdaftar</h2>
            <button
              onClick={() => {
                setJadwalForm({ id: '', guru_id: guru[0]?.id || '', kelas_id: kelas[0]?.id || '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', mata_pelajaran: 'PJOK', lokasi: 'Lapangan Utama' });
                setShowJadwalModal(true);
              }}
              className="py-2.5 px-4 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:scale-105 text-white font-black text-xs rounded-2xl shadow-lg shadow-[#8b5cf6]/35 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Jadwal PJOK</span>
            </button>
          </div>

          <div className="bg-[#121324] rounded-3xl border border-[#242747] shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#181a33] text-zinc-400 font-black uppercase border-b border-[#242747]">
                  <th className="p-4">Hari</th>
                  <th className="p-4">Jam Pelajaran</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Guru Pengampu</th>
                  <th className="p-4">Lokasi</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242747] font-medium text-zinc-200">
                {jadwal.map((j) => {
                  const g = guru.find(item => item.id === j.guru_id);
                  const k = kelas.find(item => item.id === j.kelas_id);
                  return (
                    <tr key={j.id} className="hover:bg-[#1d1f3d]">
                      <td className="p-4 font-black text-white">{j.hari}</td>
                      <td className="p-4 text-zinc-300 font-bold">{j.jam_mulai} - {j.jam_selesai}</td>
                      <td className="p-4 font-black text-[#c084fc]">Kelas {k?.nama_kelas || '-'}</td>
                      <td className="p-4 text-zinc-200">{g?.nama_guru || '-'}</td>
                      <td className="p-4 text-zinc-400">{j.lokasi || 'Lapangan Utama'}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditJadwal(j)}
                          className="p-2 text-sky-400 hover:bg-sky-500/10 rounded-xl transition-colors"
                          title="Edit Jadwal"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteJadwal(j.id)}
                          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
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
            s.nis?.toLowerCase().includes(siswaSearch.toLowerCase()) ||
            s.nisn?.toLowerCase().includes(siswaSearch.toLowerCase());
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
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                <div className="flex items-center space-x-2">
                  {importStatusType === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  )}
                  <span>{importStatusMsg}</span>
                </div>
                <button onClick={() => setImportStatusMsg('')} className="p-1 text-zinc-400 hover:text-white">
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
                <h2 className="text-base font-black text-white">Daftar Siswa Sekolah</h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Total {siswa.length} Siswa ({totalLaki} Laki-laki, {totalPerempuan} Perempuan)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={downloadSiswaTemplate}
                  className="py-2.5 px-4 bg-[#181a33] hover:bg-[#25284d] text-emerald-400 border border-emerald-500/30 font-black text-xs rounded-2xl shadow-sm flex items-center space-x-2 transition-all cursor-pointer"
                  title="Unduh Format Contoh File Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Unduh Template Excel</span>
                </button>

                <button
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="py-2.5 px-4 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:scale-105 text-white font-black text-xs rounded-2xl shadow-lg shadow-[#8b5cf6]/35 flex items-center space-x-2 transition-all cursor-pointer"
                  title="Unggah dan Impor File Excel Siswa"
                >
                  <Upload className="w-4 h-4" />
                  <span>Impor Excel Siswa</span>
                </button>

                <button
                  onClick={() => {
                    setSiswaForm({ id: '', nis: '', nisn: '', nama_siswa: '', kelas_id: kelas[0]?.id || '', jenis_kelamin: 'L' });
                    setShowSiswaModal(true);
                  }}
                  className="py-2.5 px-4 bg-[#1d1f3d] hover:bg-[#25284d] text-sky-400 border border-sky-500/30 font-black text-xs rounded-2xl shadow-sm flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Tambah Siswa</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[#121324] p-3 rounded-2xl border border-[#242747] shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan NIS, NISN, atau Nama Siswa..."
                  value={siswaSearch}
                  onChange={(e) => setSiswaSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#181a33] border border-[#242747] rounded-xl font-medium text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <select
                  value={siswaKelasFilter}
                  onChange={(e) => setSiswaKelasFilter(e.target.value)}
                  className="bg-[#181a33] border border-[#242747] rounded-xl py-2 px-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
                >
                  <option value="semua">Semua Kelas ({kelas.length})</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id} className="bg-[#121324]">Kelas {k.nama_kelas}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Siswa */}
            <div className="bg-[#121324] rounded-3xl border border-[#242747] shadow-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#181a33] text-zinc-400 font-black uppercase border-b border-[#242747]">
                    <th className="p-4">NIS</th>
                    <th className="p-4">NISN</th>
                    <th className="p-4">Nama Siswa</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4">Gender</th>
                    <th className="p-4">QR Code ID</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242747] font-medium text-zinc-200">
                  {filteredSiswa.length > 0 ? (
                    filteredSiswa.map((s) => {
                      const k = kelas.find(item => item.id === s.kelas_id);
                      return (
                        <tr key={s.id} className="hover:bg-[#1d1f3d]">
                          <td className="p-4 font-bold text-zinc-400">{s.nis || '-'}</td>
                          <td className="p-4 font-bold text-[#c084fc]">{s.nisn || '-'}</td>
                          <td className="p-4 font-black text-white">{s.nama_siswa}</td>
                          <td className="p-4 font-bold text-sky-400">Kelas {k?.nama_kelas || '-'}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${s.jenis_kelamin === 'P' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                              {s.jenis_kelamin === 'P' ? 'Perempuan (P)' : 'Laki-laki (L)'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[10px] text-zinc-400">{s.qr_code}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleEditSiswa(s)}
                              className="p-2 text-sky-400 hover:bg-sky-500/10 rounded-xl transition-colors"
                              title="Edit Data Siswa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSiswa(s.id)}
                              className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
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
                      <td colSpan="7" className="p-8 text-center text-zinc-500 font-medium">
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
        <div className="bg-[#121324] rounded-3xl border border-[#242747] p-6 shadow-xl space-y-4">
          <h2 className="text-base font-black text-white">Data Guru Olahraga (PJOK)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guru.map(g => (
              <div key={g.id} className="bg-[#181a33] border border-[#242747] rounded-2xl p-5 space-y-1 hover:border-[#8b5cf6]/50 transition-all">
                <h3 className="font-black text-white text-sm">{g.nama_guru}</h3>
                <p className="text-xs text-zinc-400 font-medium">NIP: {g.nip}</p>
                <p className="text-xs text-[#c084fc] font-black">Mata Pelajaran: {g.mata_pelajaran}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-[#121324] rounded-3xl border border-[#242747] p-6 shadow-xl space-y-4">
          <h2 className="text-base font-black text-white">Audit Trail Aktivitas Sistem</h2>
          <div className="space-y-2.5">
            {logs.map(log => (
              <div key={log.id} className="bg-[#181a33] p-3.5 rounded-2xl border border-[#242747] text-xs flex justify-between items-center">
                <div>
                  <span className="font-black text-[#c084fc] mr-2">[{log.aksi}]</span>
                  <span className="font-semibold text-zinc-200">{log.detail}</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">{new Date(log.created_at).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH JADWAL */}
      {showJadwalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060b]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121324] border border-[#242747] rounded-3xl w-full max-w-md p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242747] pb-4">
              <h3 className="font-black text-base text-[#c084fc]">
                {jadwalForm.id ? 'Edit Jadwal Olahraga' : 'Tambah Jadwal PJOK'}
              </h3>
              <button onClick={() => setShowJadwalModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Pilih Guru PJOK</label>
                <select
                  value={jadwalForm.guru_id}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, guru_id: e.target.value })}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#8b5cf6]"
                >
                  {guru.map(g => (
                    <option key={g.id} value={g.id} className="bg-[#121324]">{g.nama_guru}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Pilih Kelas</label>
                <select
                  value={jadwalForm.kelas_id}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, kelas_id: e.target.value })}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#8b5cf6]"
                >
                  {kelas.map(k => (
                    <option key={k.id} value={k.id} className="bg-[#121324]">Kelas {k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Hari</label>
                <select
                  value={jadwalForm.hari}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, hari: e.target.value })}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#8b5cf6]"
                >
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => (
                    <option key={h} value={h} className="bg-[#121324]">{h}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={jadwalForm.jam_mulai}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, jam_mulai: e.target.value })}
                    className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white focus:ring-2 focus:ring-[#8b5cf6]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={jadwalForm.jam_selesai}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, jam_selesai: e.target.value })}
                    className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white focus:ring-2 focus:ring-[#8b5cf6]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Lokasi Olahraga</label>
                <input
                  type="text"
                  value={jadwalForm.lokasi}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, lokasi: e.target.value })}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white focus:ring-2 focus:ring-[#8b5cf6]"
                  placeholder="Contoh: Lapangan Utama"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:scale-105 font-black text-white rounded-xl shadow-lg shadow-[#8b5cf6]/35 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060b]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121324] border border-[#242747] rounded-3xl w-full max-w-md p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242747] pb-4">
              <h3 className="font-black text-base text-[#c084fc]">
                {siswaForm.id ? 'Edit Data Siswa' : 'Tambah Data Siswa'}
              </h3>
              <button onClick={() => setShowSiswaModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSiswa} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">NIS (No. Induk)</label>
                  <input
                    type="text"
                    value={siswaForm.nis}
                    onChange={(e) => setSiswaForm({ ...siswaForm, nis: e.target.value })}
                    className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white focus:ring-2 focus:ring-[#8b5cf6]"
                    placeholder="Contoh: 1015"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">NISN (Nasional)</label>
                  <input
                    type="text"
                    value={siswaForm.nisn}
                    onChange={(e) => setSiswaForm({ ...siswaForm, nisn: e.target.value })}
                    className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white focus:ring-2 focus:ring-[#8b5cf6]"
                    placeholder="Contoh: 0051234567"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={siswaForm.nama_siswa}
                  onChange={(e) => setSiswaForm({ ...siswaForm, nama_siswa: e.target.value })}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white focus:ring-2 focus:ring-[#8b5cf6]"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Kelas</label>
                <select
                  value={siswaForm.kelas_id}
                  onChange={(e) => setSiswaForm({ ...siswaForm, kelas_id: e.target.value })}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#8b5cf6]"
                >
                  {kelas.map(k => (
                    <option key={k.id} value={k.id} className="bg-[#121324]">Kelas {k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Jenis Kelamin</label>
                <select
                  value={siswaForm.jenis_kelamin}
                  onChange={(e) => setSiswaForm({ ...siswaForm, jenis_kelamin: e.target.value })}
                  className="w-full bg-[#181a33] border border-[#242747] rounded-xl p-3 text-white font-medium focus:ring-2 focus:ring-[#8b5cf6]"
                >
                  <option value="L" className="bg-[#121324]">Laki-laki (L)</option>
                  <option value="P" className="bg-[#121324]">Perempuan (P)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:scale-105 font-black text-white rounded-xl shadow-lg shadow-[#8b5cf6]/35 cursor-pointer"
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
