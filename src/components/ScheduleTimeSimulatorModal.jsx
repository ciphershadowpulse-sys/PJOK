import React, { useState } from 'react';
import { X, Clock, Calendar, RefreshCw } from 'lucide-react';

export default function ScheduleTimeSimulatorModal({ isOpen, onClose, currentSim, onApply, onReset }) {
  if (!isOpen) return null;

  const [hari, setHari] = useState(currentSim?.hari || 'Senin');
  const [jam, setJam] = useState(currentSim?.jam || '07:15');

  const handleSubmit = (e) => {
    e.preventDefault();
    onApply({ hari, jam });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <Clock className="w-5 h-5" />
            <span>Simulasi Waktu & Hari Jadwal</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-4 bg-slate-800/80 p-3 rounded-lg border border-slate-700 leading-relaxed">
          Gunakan modul simulasi ini untuk menguji kunci jam pelajaran aktif (deteksi waktu jadwal) tanpa perlu menunggu waktu sesungguhnya.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Pilih Hari Simulasi
            </label>
            <select
              value={hari}
              onChange={(e) => setHari(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Senin">Senin</option>
              <option value="Selasa">Selasa</option>
              <option value="Rabu">Rabu</option>
              <option value="Kamis">Kamis</option>
              <option value="Jumat">Jumat</option>
              <option value="Sabtu">Sabtu</option>
              <option value="Minggu">Minggu</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Pilih Jam Simulasi (HH:MM)
            </label>
            <input
              type="time"
              value={jam}
              onChange={(e) => setJam(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => { onReset(); onClose(); }}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Realtime</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30"
            >
              Terapkan Simulasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
