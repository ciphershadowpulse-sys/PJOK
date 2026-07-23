import React, { useState } from 'react';
import { User, Lock, LogIn, ShieldAlert, Activity, MapPin, WifiOff, UserPlus, Mail, CheckCircle2 } from 'lucide-react';
import { loginUser, registerUser } from '../services/storage';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [namaGuru, setNamaGuru] = useState('');
  const [nip, setNip] = useState('');
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!namaGuru.trim() || !username.trim() || !email.trim() || !password.trim()) {
          throw new Error('Nama Lengkap, Username, Email, dan Password wajib diisi.');
        }

        const res = await registerUser({
          nama: namaGuru,
          email,
          username,
          nip,
          password
        });

        if (res.requiresEmailVerification) {
          setSuccessInfo(`📧 Email verifikasi telah dikirim ke ${res.email}. Silakan cek inbox/spam email Anda untuk memverifikasi akun sebelum login.`);
          setIsRegistering(false);
        } else {
          onLoginSuccess(res.user);
        }
      } else {
        if (!username.trim() || !password.trim()) {
          throw new Error('Masukkan Username/Email dan Password Anda.');
        }
        const userObj = await loginUser(username, password);
        onLoginSuccess(userObj);
      }
    } catch (err) {
      setError(err.message || 'Gagal memproses otentikasi. Silakan periksa kembali data Anda.');
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
          Aplikasi Absensi Lapangan Mandiri Khusus Guru Olahraga Sekolah
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          
          {/* Success Info Banner (e.g., Email Verification Sent) */}
          {successInfo && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start space-x-3 text-emerald-300 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{successInfo}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start space-x-3 text-rose-300 text-xs font-semibold animate-shake">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 mb-5 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setError(''); setSuccessInfo(''); }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  !isRegistering ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Akun</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsRegistering(true); setError(''); setSuccessInfo(''); }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  isRegistering ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Daftar Guru Baru</span>
              </button>
            </div>

            {/* Registration specific fields */}
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Lengkap Guru (Gelar)
                  </label>
                  <input
                    type="text"
                    required
                    value={namaGuru}
                    onChange={(e) => setNamaGuru(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
                    placeholder="Contoh: Pak Budi Prasetyo, S.Pd"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Resmi Guru (Untuk Verifikasi)
                  </label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
                      placeholder="contoh: budi@sekolah.sch.id"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    NIP Guru (Opsional)
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
                    placeholder="Contoh: 198504122010011005"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {isRegistering ? 'Username Akses' : 'Username / Email Guru'}
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
                  placeholder="Masukkan username atau email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
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
              className="w-full flex justify-center items-center space-x-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : isRegistering ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Daftar & Kirim Email Verifikasi</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Masuk ke Sistem Guru</span>
                </>
              )}
            </button>
          </form>

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
