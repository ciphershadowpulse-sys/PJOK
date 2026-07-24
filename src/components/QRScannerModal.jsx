import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, QrCode, AlertCircle, RefreshCw, Volume2, Zap } from 'lucide-react';
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

  // Native BarcodeDetector API for Hardware-Accelerated 1ms QR Decoding
  const barcodeDetectorRef = useRef(
    typeof window !== 'undefined' && 'BarcodeDetector' in window
      ? new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'data_matrix'] })
      : null
  );

  // Audio Beep Sound Effect Generator (Web Audio API)
  const playSuccessBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // High chime tone 1 (880Hz / A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      // High chime tone 2 (1174.66Hz / D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio play note:', e);
    }
  };

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

  // Start live camera stream with continuous focus constraints
  const startCamera = async (selectedFacingMode = facingMode) => {
    stopCamera();
    setCameraError('');
    try {
      const constraints = {
        video: {
          facingMode: { ideal: selectedFacingMode },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, max: 60 },
          advanced: [{ focusMode: 'continuous' }]
        }
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
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

  // Ultra-Fast & Responsive QR Scanning Loop
  const scanFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      let detectedCode = null;

      // 1. Try Native BarcodeDetector API if available (Instant hardware GPU decoding!)
      if (barcodeDetectorRef.current) {
        try {
          const codes = await barcodeDetectorRef.current.detect(video);
          if (codes && codes.length > 0 && codes[0].rawValue) {
            detectedCode = codes[0].rawValue;
          }
        } catch (e) {}
      }

      // 2. Optimized jsQR fallback with fixed aspect downscaling (Max 480px width)
      if (!detectedCode) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const targetWidth = Math.min(video.videoWidth, 480);
        const targetHeight = Math.floor((video.videoHeight / video.videoWidth) * targetWidth);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          detectedCode = code.data;
        }
      }

      if (detectedCode) {
        const now = Date.now();
        if (now - lastScanTimeRef.current > 800) {
          lastScanTimeRef.current = now;
          handleScanResult(detectedCode);
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

  const parseRawQrData = (rawText) => {
    if (!rawText) return '';
    let str = String(rawText).trim();

    // 1. Try parsing JSON format e.g. {"nis": "3163288603"} or {"nisn": "3163288603"}
    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        const parsed = JSON.parse(str);
        if (parsed.nis) return String(parsed.nis).trim();
        if (parsed.nisn) return String(parsed.nisn).trim();
        if (parsed.id) return String(parsed.id).trim();
        if (parsed.code) return String(parsed.code).trim();
      } catch (e) {}
    }

    // 2. Try parsing URL query parameters e.g. https://domain.com/absensi?nis=3163288603
    if (str.includes('http://') || str.includes('https://')) {
      try {
        const url = new URL(str);
        const nis = url.searchParams.get('nis') || url.searchParams.get('nisn') || url.searchParams.get('code') || url.searchParams.get('id');
        if (nis) return nis.trim();
      } catch (e) {}
    }

    // 3. Try key-value or pattern format e.g. "Scan untuk Absensi: 1001", "NISN: 3163288603", "QR-1001"
    const matchKV = str.match(/(?:scan\s+untuk\s+absensi|absensi|nisn|nis|code|id)[\s:=]+([a-zA-Z0-9-]+)/i);
    if (matchKV && matchKV[1]) {
      return matchKV[1].trim();
    }

    // 4. Extract numeric sequence e.g. "Scan untuk Absensi 1001"
    const digitsMatch = str.match(/\b([0-9]{3,12})\b/);
    if (digitsMatch && digitsMatch[1]) {
      return digitsMatch[1].trim();
    }

    return str;
  };

  const handleScanResult = (rawNisn) => {
    const cleanCode = parseRawQrData(rawNisn);
    if (!cleanCode) return;

    // Play Audio Beep Sound Effect
    playSuccessBeep();

    setScanNotif(`🎉 BEEP! Berhasil Scan: ${cleanCode}`);

    // Call success callback
    onScanSuccess(cleanCode);

    setTimeout(() => {
      setScanNotif(null);
    }, 2200);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-md overflow-hidden text-white relative">
        
        {/* Futuristic Header Gradient */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-b border-emerald-500/30 p-5 text-center relative">
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer bg-slate-800/60"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
            <QrCode className="w-7 h-7" />
          </div>
          <h2 className="font-black text-xl tracking-tight text-white flex items-center justify-center gap-2">
            <span>Ultra-Fast QR Scanner</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-bold">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-bounce" /> Fast Scan & Beep
            </span>
          </h2>
          <p className="text-xs text-slate-300 font-medium opacity-90 mt-1">
            Arahkan kamera ke QR Code Kartu Siswa atau input NIS / NISN manual
          </p>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          
          {/* Notification Alert Banner */}
          {scanNotif && (
            <div className="rounded-2xl p-3.5 text-xs font-black text-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400 shadow-xl shadow-emerald-600/30 animate-bounce">
              {scanNotif}
            </div>
          )}

          {cameraError && (
            <div className="rounded-2xl p-3 text-xs font-semibold text-center bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Camera View Area */}
          {isCameraActive ? (
            <div className="space-y-3">
              <div className="relative bg-black rounded-3xl overflow-hidden aspect-square border-2 border-emerald-500/80 shadow-2xl shadow-emerald-500/20 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                ></video>
                <canvas ref={canvasRef} className="hidden" />

                {/* Target overlay reticle box */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></span>
                    <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></span>
                  </div>
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></span>
                    <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></span>
                  </div>
                </div>
              </div>

              {/* Camera Active Indicator & Controls */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                  <div>
                    <p className="text-xs font-extrabold text-emerald-300">Kamera Live Ultra-Fast ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</p>
                    <p className="text-[10px] text-slate-400 font-medium">Auto-scan responsif & langsung simpan...</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2.5 bg-slate-700 hover:bg-slate-600 text-emerald-400 rounded-xl text-xs font-extrabold transition-all border border-slate-600"
                    title="Ganti Kamera Depan/Belakang"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-extrabold border border-rose-500/30 transition-all"
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
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white py-4 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>Buka Kamera Live Scanner</span>
            </button>
          )}

          {/* Separator */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Atau Input Manual</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          {/* Manual Input NIS / NISN */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              INPUT NIS / NISN SISWA MANUAL
            </label>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualNisn}
                onChange={(e) => setManualNisn(e.target.value)}
                placeholder="Masukkan NIS / NISN siswa..."
                className="flex-1 border border-slate-700 bg-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-5 rounded-2xl font-black flex items-center justify-center transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
                title="Submit Manual"
              >
                <Check className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Done Scanning Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => { stopCamera(); onClose(); }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-2xl border border-slate-700 transition-all cursor-pointer"
            >
              SELESAI SCAN (TUTUP KAMERA)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
