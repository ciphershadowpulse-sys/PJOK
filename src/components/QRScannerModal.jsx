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

  // Start live camera stream
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

      if (barcodeDetectorRef.current) {
        try {
          const codes = await barcodeDetectorRef.current.detect(video);
          if (codes && codes.length > 0 && codes[0].rawValue) {
            detectedCode = codes[0].rawValue;
          }
        } catch (e) {}
      }

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

    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        const parsed = JSON.parse(str);
        if (parsed.nis) return String(parsed.nis).trim();
        if (parsed.nisn) return String(parsed.nisn).trim();
        if (parsed.id) return String(parsed.id).trim();
        if (parsed.code) return String(parsed.code).trim();
      } catch (e) {}
    }

    if (str.includes('http://') || str.includes('https://')) {
      try {
        const url = new URL(str);
        const nis = url.searchParams.get('nis') || url.searchParams.get('nisn') || url.searchParams.get('code') || url.searchParams.get('id');
        if (nis) return nis.trim();
      } catch (e) {}
    }

    const matchKV = str.match(/(?:scan\s+untuk\s+absensi|absensi|nisn|nis|code|id)[\s:=]+([a-zA-Z0-9-]+)/i);
    if (matchKV && matchKV[1]) {
      return matchKV[1].trim();
    }

    const digitsMatch = str.match(/\b([0-9]{3,12})\b/);
    if (digitsMatch && digitsMatch[1]) {
      return digitsMatch[1].trim();
    }

    return str;
  };

  const handleScanResult = (rawNisn) => {
    const cleanCode = parseRawQrData(rawNisn);
    if (!cleanCode) return;

    playSuccessBeep();
    setScanNotif(`🎉 BEEP! Berhasil Scan: ${cleanCode}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060b]/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121324] rounded-3xl shadow-2xl border border-[#242747] w-full max-w-md overflow-hidden text-white relative">
        
        {/* Header Gradient */}
        <div className="bg-gradient-to-br from-[#181a33] via-[#1a1c3b] to-[#121324] border-b border-[#242747] p-6 text-center relative">
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-xl transition-colors cursor-pointer bg-[#1d1f3d] border border-[#242747]"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-[#8b5cf6]/20 text-[#c084fc] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#8b5cf6]/40 shadow-lg shadow-[#8b5cf6]/20">
            <QrCode className="w-7 h-7" />
          </div>
          <h2 className="font-black text-xl tracking-tight text-white flex items-center justify-center gap-2">
            <span>Ultra-Fast QR Scanner</span>
            <span className="text-[10px] bg-[#8b5cf6]/20 text-[#c084fc] px-2.5 py-0.5 rounded-full border border-[#8b5cf6]/30 flex items-center gap-1 font-black">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-bounce" /> Fast Scan & Beep
            </span>
          </h2>
          <p className="text-xs text-zinc-400 font-medium opacity-90 mt-1">
            Arahkan kamera ke QR Code Kartu Siswa atau input NIS / NISN manual
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          
          {/* Notification Alert Banner */}
          {scanNotif && (
            <div className="rounded-2xl p-4 text-xs font-black text-center bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white border border-[#8b5cf6] shadow-xl shadow-[#8b5cf6]/35 animate-bounce">
              {scanNotif}
            </div>
          )}

          {cameraError && (
            <div className="rounded-2xl p-3.5 text-xs font-semibold text-center bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Camera View Area */}
          {isCameraActive ? (
            <div className="space-y-3">
              <div className="relative bg-black rounded-3xl overflow-hidden aspect-square border-2 border-[#8b5cf6]/80 shadow-2xl shadow-[#8b5cf6]/20 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                ></video>
                <canvas ref={canvasRef} className="hidden" />

                {/* Target overlay reticle box with glowing laser animation */}
                <div className="absolute inset-8 border-2 border-dashed border-[#a855f7]/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3 relative overflow-hidden">
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-t-2 border-l-2 border-[#a855f7]"></span>
                    <span className="w-4 h-4 border-t-2 border-r-2 border-[#a855f7]"></span>
                  </div>
                  
                  {/* Laser Scan Line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f43f5e] to-transparent shadow-lg shadow-[#f43f5e] animate-laser"></div>

                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-b-2 border-l-2 border-[#a855f7]"></span>
                    <span className="w-4 h-4 border-b-2 border-r-2 border-[#a855f7]"></span>
                  </div>
                </div>
              </div>

              {/* Camera Active Indicator & Controls */}
              <div className="bg-[#181a33] border border-[#242747] rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#a855f7] animate-ping"></div>
                  <div>
                    <p className="text-xs font-black text-[#c084fc]">Kamera Live ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Auto-scan responsif & langsung simpan...</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2.5 bg-[#1d1f3d] hover:bg-[#25284d] text-[#c084fc] rounded-xl text-xs font-black transition-all border border-[#242747]"
                    title="Ganti Kamera Depan/Belakang"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-black border border-rose-500/30 transition-all cursor-pointer"
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
              className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:from-[#9333ea] hover:to-[#581c87] active:scale-95 text-white py-4 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-[#8b5cf6]/35 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>Buka Kamera Live Scanner</span>
            </button>
          )}

          {/* Separator */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-[#242747]"></div>
            <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">Atau Input Manual</span>
            <div className="flex-1 h-px bg-[#242747]"></div>
          </div>

          {/* Manual Input NIS / NISN */}
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1.5">
              INPUT NIS / NISN SISWA MANUAL
            </label>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualNisn}
                onChange={(e) => setManualNisn(e.target.value)}
                placeholder="Masukkan NIS / NISN siswa..."
                className="flex-1 border border-[#242747] bg-[#181a33] rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-[#8b5cf6] transition-all"
              />

              <button
                type="submit"
                className="bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:scale-105 active:scale-95 text-white px-5 rounded-2xl font-black flex items-center justify-center transition-all shadow-lg shadow-[#8b5cf6]/35 cursor-pointer"
                title="Submit Manual"
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </button>
            </form>
          </div>

          {/* Done Scanning Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => { stopCamera(); onClose(); }}
              className="w-full bg-[#181a33] hover:bg-[#25284d] text-zinc-300 font-bold text-xs py-3 rounded-2xl border border-[#242747] transition-all cursor-pointer"
            >
              SELESAI SCAN (TUTUP KAMERA)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
