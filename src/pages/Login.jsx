import React, { useState } from 'react';
import { User, Lock, LogIn, ShieldAlert, Activity, MapPin, WifiOff, UserPlus, Mail, CheckCircle2 } from 'lucide-react';
import { loginUser, registerUser, loginWithGoogle } from '../services/storage';

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
          throw new Error('Nama Lengkap, Username, Email Gmail, dan Password wajib diisi.');
        }

        if (password.length < 6) {
          throw new Error('Password minimal 6 karakter.');
        }

        const res = await registerUser({
          nama: namaGuru,
          email,
          username,
          nip,
          password
        });

        if (res.requiresEmailVerification) {
          setSuccessInfo(`📧 Email verifikasi telah dikirim ke ${res.email}. Silakan periksa inbox/spam email Gmail Anda untuk mengonfirmasi akun.`);
          setIsRegistering(false);
        } else {
          onLoginSuccess(res.user);
        }
      } else {
        if (!username.trim() || !password.trim()) {
          throw new Error('Masukkan Username/Email Gmail dan Password Anda.');
        }
        const userObj = await loginUser(username, password);
        onLoginSuccess(userObj);
      }
    } catch (err) {
      console.error('Registration/Login error:', err);
      const errMsg = err?.message || String(err);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle();
    } catch (err) {
      console.error('Google OAuth error:', err);
      const rawErr = err?.message || String(err);
      if (rawErr.toLowerCase().includes('not enabled') || rawErr.toLowerCase().includes('unsupported provider')) {
        setError('Layanan Login Otomatis Google belum diaktifkan di Supabase. Silakan mendaftar & login menggunakan formulir Email Gmail (@gmail.com) dan Password di bawah ini.');
      } else {
        setError(rawErr);
      }
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
          
          {/* Success Info Banner */}
          {successInfo && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start space-x-3 text-emerald-300 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start space-x-3 text-rose-300 text-xs font-semibold animate-shake">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{String(error)}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 mb-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-lg transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk / Daftar Akun Gmail (Google)</span>
          </button>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Atau Formulir Email</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

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
                    Alamat Email Gmail Resmi (@gmail.com)
                  </label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-5 w-5 text-emerald-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
                      placeholder="contoh: guru.pjok@gmail.com"
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
                {isRegistering ? 'Username Akses System' : 'Username / Email Gmail Guru'}
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
                  placeholder="Masukkan username atau email @gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password {isRegistering && '(Minimal 6 karakter)'}
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
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
                  <span>Daftar Akun Gmail Guru</span>
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
            <span>Deteksi Jam Real-time</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/50 border border-slate-800">
            <MapPin className="w-4 h-4 text-sky-400 mb-1" />
            <span>Tag GPS & Foto Lapangan</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/50 border border-slate-800">
            <WifiOff className="w-4 h-4 text-amber-400 mb-1" />
            <span>Integrasi Supabase DB</span>
          </div>
        </div>

      </div>
    </div>
  );
}
