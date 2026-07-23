import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, QrCode, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualNisn, setManualNisn] = useState('');
  const [scanNotif, setScanNotif] = useState(null);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const lastScanTimeRef = useRef(0);

  // Stop camera stream safely
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start live camera stream
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.play();
      }
      setIsCameraActive(true);
      requestAnimationFrame(scanFrame);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Gagal mengakses kamera: ' + (err.message || 'Periksa izin kamera browser.'));
      setIsCameraActive(false);
    }
  };

  // Scan video frame using jsQR
  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        const now = Date.now();
        if (now - lastScanTimeRef.current > 2000) {
          lastScanTimeRef.current = now;
          handleScanResult(code.data);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleScanResult = (rawNisn) => {
    const nisn = String(rawNisn).replace(/[^a-zA-Z0-9-]/g, '').trim();
    if (!nisn) return;

    setScanNotif(`✅ NIS/QR terdeteksi: ${nisn}`);
    stopCamera();

    setTimeout(() => {
      onScanSuccess(nisn);
      setScanNotif(null);
      onClose();
    }, 800);
  };

  const handleManualSubmit = (e) => {
    e?.preventDefault();
    const nisn = manualNisn.trim();
    if (!nisn) {
      alert('Masukkan NISN / NIS terlebih dahulu.');
      return;
    }
    setManualNisn('');
    handleScanResult(nisn);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanNotif(null);
      setCameraError('');
      setManualNisn('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-slate-800 relative">
        
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white text-center relative">
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/30">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-extrabold text-lg tracking-tight">Scan QR Siswa</h2>
          <p className="text-xs text-purple-100 font-medium opacity-90 mt-0.5">
            Arahkan QR siswa ke kamera atau masukkan NISN
          </p>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          
          {/* Notification Alert Banner */}
          {scanNotif && (
            <div className="rounded-2xl p-3.5 text-xs font-bold text-center bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm animate-bounce-subtle">
              {scanNotif}
            </div>
          )}

          {cameraError && (
            <div className="rounded-2xl p-3 text-xs font-semibold text-center bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Camera View Area */}
          {isCameraActive ? (
            <div className="space-y-3">
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-square border-2 border-purple-500 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                ></video>
                <canvas ref={canvasRef} className="hidden" />

                {/* Target overlay frame */}
                <div className="absolute inset-8 border-2 border-dashed border-purple-400 rounded-2xl pointer-events-none opacity-80 animate-pulse"></div>
              </div>

              {/* Polling Camera Active Indicator */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-purple-600 animate-ping"></div>
                  <div>
                    <p className="text-xs font-bold text-purple-800">Kamera aktif</p>
                    <p className="text-[10px] text-purple-600 font-medium">Menunggu QR siswa...</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-purple-200 hover:bg-purple-300 text-purple-800 rounded-xl text-xs font-extrabold transition-all"
                >
                  Matikan Kamera
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              className="w-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-white py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>Buka Kamera Live</span>
            </button>
          )}

          {/* Separator */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[11px] text-slate-400 font-extrabold tracking-wider">ATAU</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Manual Input NIS / NISN */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
              INPUT NISN / NIS MANUAL
            </label>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualNisn}
                onChange={(e) => setManualNisn(e.target.value)}
                placeholder="Masukkan NISN / NIS..."
                className="flex-1 border border-slate-300 bg-slate-50 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />

              <button
                type="submit"
                className="bg-slate-900 hover:bg-black active:scale-95 text-white px-5 rounded-2xl font-extrabold flex items-center justify-center transition-all shadow-md"
                title="Submit Manual"
              >
                <Check className="w-5 h-5" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
