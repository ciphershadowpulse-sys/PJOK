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
      NISN: s.nisn || '-',
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

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REKAPITULASI ABSENSI SISWA MATA PELAJARAN PJOK', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode/Tanggal: ${selectedTanggal} | Filter Kelas: ${selectedKelas || 'Semua Kelas'}`, 105, 22, { align: 'center' });
    doc.line(14, 25, 196, 25);

    const tableColumn = ["No", "Tanggal", "NIS", "NISN", "Nama Siswa", "Kelas", "Status", "Keterangan"];
    const tableRows = filteredReport.map((row, idx) => [
      idx + 1,
      row.Tanggal,
      row.NIS,
      row.NISN,
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
      headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 }
    });

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-[#121324] border border-[#242747] hover:bg-[#1a1c38] text-zinc-300 hover:text-white rounded-2xl transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#c084fc]" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Laporan & Rekapitulasi Absensi</h1>
            <p className="text-xs text-zinc-400 font-medium">
              Cetak dan unduh laporan absensi harian, mingguan, bulanan, per kelas, atau per siswa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="py-3 px-5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-600/30 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={exportExcel}
            className="py-3 px-5 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:scale-105 text-white font-black text-xs rounded-2xl shadow-lg shadow-[#8b5cf6]/35 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-[#121324] p-6 rounded-3xl border border-[#242747] shadow-xl space-y-4">
        <h2 className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#c084fc]" />
          <span>Pengaturan Parameter Laporan</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-wider mb-1.5">Jenis Rekapitulasi</label>
            <select
              value={jenisLaporan}
              onChange={(e) => setJenisLaporan(e.target.value)}
              className="w-full bg-[#181a33] border border-[#242747] rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-[#8b5cf6]"
            >
              <option value="harian" className="bg-[#121324]">Rekap Harian</option>
              <option value="mingguan" className="bg-[#121324]">Rekap Mingguan</option>
              <option value="bulanan" className="bg-[#121324]">Rekap Bulanan</option>
              <option value="per_kelas" className="bg-[#121324]">Rekap Per Kelas</option>
              <option value="per_siswa" className="bg-[#121324]">Rekap Per Siswa</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-wider mb-1.5">Filter Tanggal Acuan</label>
            <input
              type="date"
              value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              className="w-full bg-[#181a33] border border-[#242747] rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-[#8b5cf6]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-wider mb-1.5">Filter Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full bg-[#181a33] border border-[#242747] rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-[#8b5cf6]"
            >
              <option value="" className="bg-[#121324]">Semua Kelas</option>
              {kelas.map(k => (
                <option key={k.id} value={k.nama_kelas} className="bg-[#121324]">Kelas {k.nama_kelas}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-[#121324] rounded-3xl border border-[#242747] shadow-xl overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-[#242747] pb-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Table className="w-4 h-4 text-[#c084fc]" />
            <span>Pratinjau Data Laporan ({filteredReport.length} Data)</span>
          </h3>
        </div>

        {filteredReport.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Tidak ada data absensi untuk filter ini. Silakan ubah tanggal atau kelas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#181a33] text-zinc-400 font-black uppercase border-b border-[#242747]">
                  <th className="p-4">No</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">NIS</th>
                  <th className="p-4">NISN</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Guru PJOK</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242747] font-medium text-zinc-200">
                {filteredReport.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1d1f3d]">
                    <td className="p-4 font-bold text-zinc-500">{idx + 1}</td>
                    <td className="p-4 font-bold text-white">{row.Tanggal}</td>
                    <td className="p-4 text-zinc-400">{row.NIS}</td>
                    <td className="p-4 font-bold text-[#c084fc]">{row.NISN}</td>
                    <td className="p-4 font-black text-white">{row['Nama Siswa']}</td>
                    <td className="p-4 font-bold text-sky-400">{row.Kelas}</td>
                    <td className="p-4 text-zinc-300">{row['Guru Olahraga']}</td>
                    <td className="p-4 font-black">{row.Status}</td>
                    <td className="p-4 text-zinc-400 italic">{row.Keterangan}</td>
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
