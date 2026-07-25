import React from 'react';
import { LogOut, Wifi, WifiOff, Clock, User, Calendar, FileText, Database, LayoutDashboard, Sparkles, Activity, Sun, Moon } from 'lucide-react';

export default function Navbar({ user, currentView, onNavigate, onLogout, isOffline, theme, onToggleTheme }) {
  const clockStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

  return (
    <header className="bg-[#0e0f1d]/90 backdrop-blur-xl text-white sticky top-0 z-40 shadow-2xl border-b border-[#242747]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand (Finova Inspired Dark Violet + Neon Purple Gradient) */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#a855f7] via-[#8b5cf6] to-[#6d28d9] flex items-center justify-center font-black text-white shadow-lg shadow-[#8b5cf6]/40 group-hover:scale-105 group-hover:shadow-[#8b5cf6]/60 transition-all duration-300">
              <span className="text-xl animate-pulse">🏃</span>
            </div>
            <div>
              <div className="font-black text-lg tracking-tight leading-none text-white group-hover:text-purple-300 transition-colors">
                ABSENSI <span className="bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#f43f5e] bg-clip-text text-transparent">PJOK</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-ping inline-block"></span>
                Aplikasi Guru Olahraga
              </p>
            </div>
          </div>

          {/* Navigation Links with Floating Violet Glow */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 bg-[#14152a] p-1.5 rounded-2xl border border-[#242747] text-xs font-extrabold shadow-inner">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 cursor-pointer ${
                  currentView === 'dashboard' || currentView === 'absensi_form'
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/35 scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1d1f3d]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('kelola')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 cursor-pointer ${
                  currentView === 'kelola'
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/35 scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1d1f3d]'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Kelola Data</span>
              </button>

              <button
                onClick={() => onNavigate('riwayat')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 cursor-pointer ${
                  currentView === 'riwayat'
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/35 scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1d1f3d]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Riwayat</span>
              </button>

              <button
                onClick={() => onNavigate('laporan')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 cursor-pointer ${
                  currentView === 'laporan'
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-[#8b5cf6]/35 scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#1d1f3d]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Laporan</span>
              </button>
            </nav>
          )}

          {/* Realtime Clock & Supabase Live Status Badge */}
          <div className="hidden lg:flex items-center space-x-3 text-xs bg-[#14152a] px-4 py-2 rounded-2xl border border-[#242747] shadow-sm">
            <div className="flex items-center space-x-2 text-zinc-300">
              <Clock className="w-4 h-4 text-[#a855f7]" />
              <span className="font-extrabold text-zinc-200">
                {dayStr}, {clockStr} WIB
              </span>
            </div>

            <div className="h-4 w-px bg-[#242747]"></div>

            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="inline-flex items-center text-emerald-400 font-extrabold space-x-1 text-[11px]">
                <Activity className="w-3.5 h-3.5" />
                <span>Supabase Live</span>
              </span>
            </div>
          </div>

          {/* User Profile, Theme Toggle & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 bg-[#14152a] hover:bg-[#1d1f3d] text-[#c084fc] hover:text-white rounded-2xl border border-[#242747] hover:border-[#8b5cf6]/50 transition-all duration-300 cursor-pointer shadow-sm flex items-center justify-center"
              title={theme === 'dark' ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className="w-4 h-4 text-[#a855f7] fill-[#a855f7]/20" />
              )}
            </button>

            {user && (
              <>
                <div className="flex items-center space-x-2.5 bg-[#14152a] px-3.5 py-1.5 rounded-2xl border border-[#242747] hover:border-[#8b5cf6]/40 transition-all duration-300">
                  <div className="w-7 h-7 rounded-xl bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left max-w-[100px] sm:max-w-[150px] truncate">
                    <p className="text-xs font-black text-zinc-100 truncate">{user.nama}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#c084fc] font-extrabold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Guru PJOK
                    </p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl border border-transparent hover:border-rose-500/20 transition-all duration-300 cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {user && (
        <div className="md:hidden flex items-center justify-around bg-[#090a14] border-t border-[#242747] px-2 py-2 text-[11px] font-extrabold">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex flex-col items-center space-y-1 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'dashboard' || currentView === 'absensi_form' 
                ? 'text-[#c084fc] bg-[#8b5cf6]/15 border border-[#8b5cf6]/30' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('kelola')}
            className={`flex flex-col items-center space-y-1 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'kelola' 
                ? 'text-[#c084fc] bg-[#8b5cf6]/15 border border-[#8b5cf6]/30' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Kelola Data</span>
          </button>

          <button
            onClick={() => onNavigate('riwayat')}
            className={`flex flex-col items-center space-y-1 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'riwayat' 
                ? 'text-[#c084fc] bg-[#8b5cf6]/15 border border-[#8b5cf6]/30' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Riwayat</span>
          </button>

          <button
            onClick={() => onNavigate('laporan')}
            className={`flex flex-col items-center space-y-1 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'laporan' 
                ? 'text-[#c084fc] bg-[#8b5cf6]/15 border border-[#8b5cf6]/30' 
                : 'text-zinc-400 hover:text-zinc-200'
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
