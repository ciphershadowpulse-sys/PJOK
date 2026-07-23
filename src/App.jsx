import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScheduleTimeSimulatorModal from './components/ScheduleTimeSimulatorModal';
import Login from './pages/Login';
import GuruDashboard from './pages/GuruDashboard';
import AbsensiForm from './pages/AbsensiForm';
import RiwayatAbsensi from './pages/RiwayatAbsensi';
import AdminDashboard from './pages/AdminDashboard';
import LaporanExport from './pages/LaporanExport';
import { syncPendingData } from './services/storage';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'dashboard', 'absensi_form', 'riwayat', 'kelola', 'laporan'
  const [selectedJadwal, setSelectedJadwal] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Time & Simulator state
  const [simulatedTime, setSimulatedTime] = useState(null); // { hari: 'Senin', jam: '07:15' }
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [realtimeClock, setRealtimeClock] = useState(new Date());

  // Realtime Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setRealtimeClock(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncPendingData();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate current active day & time (Simulated vs Realtime)
  const getActiveTime = () => {
    if (simulatedTime) {
      return {
        hari: simulatedTime.hari,
        jam: simulatedTime.jam,
        tanggalStr: new Date().toISOString().split('T')[0],
        tanggalFormatted: `${simulatedTime.hari}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
      };
    }

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
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedJadwal(null);
    setCurrentView('login');
  };

  const handleSelectJadwalForAbsensi = (jadwalItem) => {
    setSelectedJadwal(jadwalItem);
    setCurrentView('absensi_form');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onLogout={handleLogout}
        isOffline={isOffline}
        simulatedTime={simulatedTime}
        onOpenSimulator={() => setShowSimulatorModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-10">
        {!user && <Login onLoginSuccess={handleLoginSuccess} />}

        {user && currentView === 'dashboard' && (
          <GuruDashboard
            user={user}
            currentTime={activeTime}
            onSelectJadwalForAbsensi={handleSelectJadwalForAbsensi}
            onNavigate={(view) => setCurrentView(view)}
            onOpenSimulator={() => setShowSimulatorModal(true)}
          />
        )}

        {user && currentView === 'absensi_form' && selectedJadwal && (
          <AbsensiForm
            jadwal={selectedJadwal}
            currentTime={activeTime}
            user={user}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {user && currentView === 'riwayat' && (
          <RiwayatAbsensi
            onBack={() => setCurrentView('dashboard')}
            onNavigateToLaporan={() => setCurrentView('laporan')}
          />
        )}

        {user && currentView === 'kelola' && (
          <AdminDashboard
            user={user}
          />
        )}

        {user && currentView === 'laporan' && (
          <LaporanExport
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Time Simulator Modal */}
      <ScheduleTimeSimulatorModal
        isOpen={showSimulatorModal}
        onClose={() => setShowSimulatorModal(false)}
        currentSim={simulatedTime}
        onApply={(sim) => setSimulatedTime(sim)}
        onReset={() => setSimulatedTime(null)}
      />

    </div>
  );
}
