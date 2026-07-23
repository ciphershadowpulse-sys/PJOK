import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, Printer, Filter, Table, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getAllAbsensi, getAllSiswa, getAllKelas, getAllGuru, getAllJadwal } from '../services/storage';

export default function LaporanExport({ onBack }) {
  const [absensi, setAbsensi] = useState([]);
  const [siswa, setSiswa] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [guru, setGuru] = useState([]);
  const [jadwal, setJadwal] = useState([]);

  // Report Filters
  const [jenisLaporan, setJenisLaporan] = useState('harian'); // 'harian', 'mingguan', 'bulanan', 'per_kelas', 'per_siswa'
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedTanggal, setSelectedTanggal] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function loadReportData() {
      try {
        const [aList, sList, kList, gList, jList] = await Promise.all([
          getAllAbsensi(),
          getAllSiswa(),
          getAllKelas(),
          getAllGuru(),
          getAllJadwal()
        ]);
        setAbsensi(aList || []);
        setSiswa(sList || []);
        setKelas(kList || []);
        setGuru(gList || []);
        setJadwal(jList || []);
      } catch (e) {
        console.error('Error loading report data:', e);
      }
    }
    loadReportData();
  }, []);

  // Enriched report data
  const enrichedData = absensi.map(rec => {
    const s = siswa.find(item => item.id === rec.siswa_id) || {};
    const k = kelas.find(item => item.id === s.kelas_id) || {};
    const j = jadwal.find(item => item.id === rec.jadwal_id) || {};
    const g = guru.find(item => item.id === j.guru_id) || {};

    return {
      Tanggal: rec.tanggal,
      NIS: s.nis || '-',
      'Nama Siswa': s.nama_siswa || 'N/A',
      Kelas: k.nama_kelas || 'N/A',
      'Guru Olahraga': g.nama_guru || 'Pak Budi',
      Mapel: 'PJOK',
      Status: rec.status,
      Keterangan: rec.keterangan || '-'
    };
  });

  const filteredReport = enrichedData.filter(d => {
    if (selectedKelas && d.Kelas !== selectedKelas) return false;
    if (jenisLaporan === 'harian' && selectedTanggal && d.Tanggal !== selectedTanggal) return false;
    return true;
  });

  // Export PDF Official School Document
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header Kop Sekolah
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REKAPITULASI ABSENSI SISWA MATA PELAJARAN PJOK', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode/Tanggal: ${selectedTanggal} | Filter Kelas: ${selectedKelas || 'Semua Kelas'}`, 105, 22, { align: 'center' });
    doc.line(14, 25, 196, 25);

    const tableColumn = ["No", "Tanggal", "NIS", "Nama Siswa", "Kelas", "Status", "Keterangan"];
    const tableRows = filteredReport.map((row, idx) => [
      idx + 1,
      row.Tanggal,
      row.NIS,
      row['Nama Siswa'],
      row.Kelas,
      row.Status,
      row.Keterangan
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    // Signature Footer
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.text('Mengetahui,', 140, finalY);
    doc.text('Guru Pengampu PJOK', 140, finalY + 5);
    doc.text('( Pak Budi Prasetyo, S.Pd )', 140, finalY + 25);

    doc.save(`Laporan_Absensi_PJOK_${selectedTanggal}.pdf`);
  };

  // Export Excel (.xlsx)
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredReport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap PJOK');
    XLSX.writeFile(workbook, `Laporan_Absensi_PJOK_${selectedTanggal}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Laporan & Rekapitulasi Absensi</h1>
            <p className="text-xs text-slate-500 font-medium">
              Cetak dan unduh laporan absensi harian, mingguan, bulanan, per kelas, atau per siswa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportPDF}
            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-600/30 flex items-center space-x-2 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={exportExcel}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan Parameter Laporan</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jenis Rekapitulasi</label>
            <select
              value={jenisLaporan}
              onChange={(e) => setJenisLaporan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
            >
              <option value="harian">Rekap Harian</option>
              <option value="mingguan">Rekap Mingguan</option>
              <option value="bulanan">Rekap Bulanan</option>
              <option value="per_kelas">Rekap Per Kelas</option>
              <option value="per_siswa">Rekap Per Siswa</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Tanggal Acuan</label>
            <input
              type="date"
              value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
            >
              <option value="">Semua Kelas</option>
              {kelas.map(k => (
                <option key={k.id} value={k.nama_kelas}>Kelas {k.nama_kelas}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-600" />
            <span>Pratinjau Data Laporan ({filteredReport.length} Data)</span>
          </h3>
        </div>

        {filteredReport.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada data absensi untuk filter ini. Silakan ubah tanggal atau kelas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase">
                  <th className="p-3">No</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">NIS</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Guru PJOK</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredReport.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold">{row.Tanggal}</td>
                    <td className="p-3 text-slate-600">{row.NIS}</td>
                    <td className="p-3 font-extrabold text-slate-900">{row['Nama Siswa']}</td>
                    <td className="p-3 font-bold text-emerald-600">{row.Kelas}</td>
                    <td className="p-3 text-slate-700">{row['Guru Olahraga']}</td>
                    <td className="p-3 font-extrabold">{row.Status}</td>
                    <td className="p-3 text-slate-500 italic">{row.Keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
