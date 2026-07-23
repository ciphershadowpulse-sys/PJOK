import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, QrCode, AlertCircle, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualNisn, setManualNisn] = useState('');
  const [scanNotif, setScanNotif] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'

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
  const startCamera = async (selectedFacingMode = facingMode) => {
    stopCamera();
    setCameraError('');
    try {
      const constraints = {
        video: {
          facingMode: { ideal: selectedFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        // Fallback to basic video constraint if ideal failed
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Gagal mengakses kamera: ' + (err.message || 'Periksa izin kamera browser Anda.'));
      setIsCameraActive(false);
    }
  };

  // Attach stream to videoRef whenever isCameraActive becomes true and videoRef is available in DOM
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.play().then(() => {
        requestAnimationFrame(scanFrame);
      }).catch(err => {
        console.warn('Video play error:', err);
      });
    }
  }, [isCameraActive]);

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

    if (streamRef.current) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
    }
  };

  const toggleCameraFacing = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
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
    if (isOpen) {
      startCamera();
    } else {
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
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white text-center relative">
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/30">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-extrabold text-lg tracking-tight">Scan QR / Barcode Siswa</h2>
          <p className="text-xs text-emerald-100 font-medium opacity-90 mt-0.5">
            Arahkan QR/Barcode siswa ke kamera atau input NIS manual
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
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-square border-2 border-emerald-500 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                ></video>
                <canvas ref={canvasRef} className="hidden" />

                {/* Target overlay frame */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400 rounded-2xl pointer-events-none opacity-80 animate-pulse"></div>
              </div>

              {/* Camera Active Indicator & Controls */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-600 animate-ping"></div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Kamera Aktif ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</p>
                    <p className="text-[10px] text-emerald-700 font-medium">Arahkan ke QR siswa...</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 bg-emerald-200 hover:bg-emerald-300 text-emerald-900 rounded-xl text-xs font-extrabold transition-all"
                    title="Ganti Kamera Depan/Belakang"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-extrabold transition-all"
                  >
                    Matikan
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startCamera()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
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
              INPUT NIS / NISN MANUAL
            </label>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualNisn}
                onChange={(e) => setManualNisn(e.target.value)}
                placeholder="Masukkan NIS / NISN siswa..."
                className="flex-1 border border-slate-300 bg-slate-50 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />

              <button
                type="submit"
                className="bg-slate-900 hover:bg-black active:scale-95 text-white px-5 rounded-2xl font-extrabold flex items-center justify-center transition-all shadow-md cursor-pointer"
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
