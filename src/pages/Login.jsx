import React, { useState } from 'react';
import { User, Lock, LogIn, ShieldAlert, Activity, MapPin, WifiOff } from 'lucide-react';
import { loginUser } from '../services/storage';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginUser(username, password || 'password123');
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Gagal login. Periksa username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoUsername) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginUser(demoUsername, 'password123');
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorator Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-2xl shadow-emerald-500/30 mb-4 animate-bounce-subtle">
          <span className="text-4xl">⚽</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          ABSENSI GURU <span className="text-emerald-400">PJOK</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto font-medium">
          Aplikasi Absensi Lapangan Khusus Guru Olahraga Sekolah
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          
          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start space-x-3 text-rose-300 text-xs font-semibold animate-shake">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username / NIP Guru
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
                  placeholder="Masukkan username (contoh: budi_pjok)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Masuk ke Sistem Guru</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Fast Login Demo (Uji Coba Guru)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('budi_pjok')}
                className="flex flex-col items-center justify-center p-3 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  🏃
                </div>
                <span className="text-xs font-bold text-slate-200">Pak Budi, S.Pd</span>
                <span className="text-[10px] text-slate-400 font-medium">budi_pjok</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('siti_pjok')}
                className="flex flex-col items-center justify-center p-3 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-2xl transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  🏃‍♀️
                </div>
                <span className="text-xs font-bold text-slate-200">Bu Siti, S.Pd</span>
                <span className="text-[10px] text-slate-400 font-medium">siti_pjok</span>
              </button>
            </div>
          </div>

        </div>

        {/* Feature Badges */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400 font-medium">
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/50 border border-slate-800">
            <Activity className="w-4 h-4 text-emerald-400 mb-1" />
            <span>Deteksi Waktu Jam Aktif</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/50 border border-slate-800">
            <MapPin className="w-4 h-4 text-sky-400 mb-1" />
            <span>Tag GPS & Foto Lapangan</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/50 border border-slate-800">
            <WifiOff className="w-4 h-4 text-amber-400 mb-1" />
            <span>Support Offline Sync</span>
          </div>
        </div>

      </div>
    </div>
  );
}
