import React from 'react';
import { LogOut, Wifi, WifiOff, Clock, User, Calendar, FileText, Database, LayoutDashboard } from 'lucide-react';

export default function Navbar({ user, currentView, onNavigate, onLogout, isOffline }) {
  const clockStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
              <span className="text-xl">🏃</span>
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight leading-none text-white">
                ABSENSI <span className="text-emerald-400">PJOK</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Aplikasi Guru Olahraga</p>
            </div>
          </div>

          {/* Navigation Links for Guru */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-800/60 p-1 rounded-2xl border border-slate-700/60 text-xs font-bold">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                  currentView === 'dashboard' || currentView === 'absensi_form'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('kelola')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                  currentView === 'kelola'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Kelola Data</span>
              </button>

              <button
                onClick={() => onNavigate('riwayat')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                  currentView === 'riwayat'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Riwayat</span>
              </button>

              <button
                onClick={() => onNavigate('laporan')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                  currentView === 'laporan'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Laporan</span>
              </button>
            </nav>
          )}

          {/* Realtime Clock & Supabase Live Status */}
          <div className="hidden lg:flex items-center space-x-3 text-xs bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200">
                {dayStr}, {clockStr} WIB
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700"></div>

            <div className="flex items-center space-x-1">
              <span className="inline-flex items-center text-emerald-400 font-bold space-x-1">
                <Database className="w-3.5 h-3.5" />
                <span>Supabase Live</span>
              </span>
            </div>
          </div>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <User className="w-4 h-4 text-emerald-400" />
                <div className="text-left max-w-[100px] sm:max-w-[150px] truncate">
                  <p className="text-xs font-bold text-slate-100 truncate">{user.nama}</p>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                    Guru PJOK
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      {user && (
        <div className="md:hidden flex items-center justify-around bg-slate-950 border-t border-slate-800 px-2 py-2 text-[11px] font-bold">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex flex-col items-center space-y-0.5 px-3 py-1 rounded-xl ${
              currentView === 'dashboard' || currentView === 'absensi_form' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('kelola')}
            className={`flex flex-col items-center space-y-0.5 px-3 py-1 rounded-xl ${
              currentView === 'kelola' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Kelola Data</span>
          </button>

          <button
            onClick={() => onNavigate('riwayat')}
            className={`flex flex-col items-center space-y-0.5 px-3 py-1 rounded-xl ${
              currentView === 'riwayat' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Riwayat</span>
          </button>

          <button
            onClick={() => onNavigate('laporan')}
            className={`flex flex-col items-center space-y-0.5 px-3 py-1 rounded-xl ${
              currentView === 'laporan' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Laporan</span>
          </button>
        </div>
      )}
    </header>
  );
}
