import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import GuruDashboard from './pages/GuruDashboard';
import AbsensiForm from './pages/AbsensiForm';
import RiwayatAbsensi from './pages/RiwayatAbsensi';
import AdminDashboard from './pages/AdminDashboard';
import LaporanExport from './pages/LaporanExport';
import { logoutUser } from './services/storage';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // Protected routes: 'dashboard', 'absensi_form', 'riwayat', 'kelola', 'laporan'
  const [theme, setTheme] = useState(() => localStorage.getItem('pjok_theme') || 'dark');
  
  const [selectedJadwal, setSelectedJadwal] = useState(() => {
    try {
      const saved = localStorage.getItem('pjok_active_jadwal');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [realtimeClock, setRealtimeClock] = useState(new Date());

  // Dark Mode / Light Mode Theme Handler
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('pjok_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 1. Restore & Listen to Session (LocalStorage & Supabase Auth)
  useEffect(() => {
    const savedUser = localStorage.getItem('pjok_user_session');

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
          setCurrentView('dashboard');
        }
      } catch (e) {
        console.warn('LocalStorage restore note:', e);
      }
    }

    async function initAuthSession() {
      if (!isSupabaseConfigured) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userObj = {
            id: session.user.id,
            nama: session.user.user_metadata?.nama || session.user.email,
            username: session.user.user_metadata?.username || session.user.email.split('@')[0],
            email: session.user.email,
            role: 'guru'
          };
          setUser(userObj);
          localStorage.setItem('pjok_user_session', JSON.stringify(userObj));
        }
      } catch (err) {
        console.warn('Error fetching Supabase auth session:', err);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userObj = {
            id: session.user.id,
            nama: session.user.user_metadata?.nama || session.user.email,
            username: session.user.user_metadata?.username || session.user.email.split('@')[0],
            email: session.user.email,
            role: 'guru'
          };
          setUser(userObj);
          localStorage.setItem('pjok_user_session', JSON.stringify(userObj));
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('pjok_user_session');
          localStorage.removeItem('pjok_active_view');
          localStorage.removeItem('pjok_active_jadwal');
          setUser(null);
          setCurrentView('login');
        }
      });

      return () => subscription?.unsubscribe();
    }

    initAuthSession();
  }, []);

  // Realtime Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setRealtimeClock(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate strict real-time active day & time
  const getActiveTime = () => {
    const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDay = DAYS[realtimeClock.getDay()];
    const hours = String(realtimeClock.getHours()).padStart(2, '0');
    const minutes = String(realtimeClock.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    return {
      hari: currentDay,
      jam: timeStr,
      tanggalStr: realtimeClock.toISOString().split('T')[0],
      tanggalFormatted: realtimeClock.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    };
  };

  const activeTime = getActiveTime();

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('pjok_user_session', JSON.stringify(userData));
    localStorage.setItem('pjok_active_view', 'dashboard');
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await logoutUser();
    localStorage.removeItem('pjok_user_session');
    localStorage.removeItem('pjok_active_view');
    localStorage.removeItem('pjok_active_jadwal');
    setUser(null);
    setSelectedJadwal(null);
    setCurrentView('login');
  };

  const handleNavigate = (view) => {
    if (user) {
      setCurrentView(view);
      localStorage.setItem('pjok_active_view', view);
    } else {
      setCurrentView('login');
    }
  };

  const handleSelectJadwalForAbsensi = (jadwalItem) => {
    setSelectedJadwal(jadwalItem);
    setCurrentView('absensi_form');
    localStorage.setItem('pjok_active_view', 'absensi_form');
    localStorage.setItem('pjok_active_jadwal', JSON.stringify(jadwalItem));
  };

  const isDashboardView = ['dashboard', 'absensi_form', 'riwayat', 'kelola', 'laporan'].includes(currentView);
  const activeViewToRender = (!user && isDashboardView) ? 'login' : currentView;

  return (
    <div className={`min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#080911] text-zinc-100'}`}>
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        currentView={activeViewToRender}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isOffline={isOffline}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-10">
        {!user || activeViewToRender === 'login' ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : null}

        {user && activeViewToRender === 'dashboard' && (
          <GuruDashboard
            user={user}
            currentTime={activeTime}
            onSelectJadwalForAbsensi={handleSelectJadwalForAbsensi}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {user && activeViewToRender === 'absensi_form' && selectedJadwal && (
          <AbsensiForm
            jadwal={selectedJadwal}
            currentTime={activeTime}
            user={user}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {user && activeViewToRender === 'riwayat' && (
          <RiwayatAbsensi
            onBack={() => setCurrentView('dashboard')}
            onNavigateToLaporan={() => setCurrentView('laporan')}
          />
        )}

        {user && activeViewToRender === 'kelola' && (
          <AdminDashboard
            user={user}
          />
        )}

        {user && activeViewToRender === 'laporan' && (
          <LaporanExport
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>

    </div>
  );
}
