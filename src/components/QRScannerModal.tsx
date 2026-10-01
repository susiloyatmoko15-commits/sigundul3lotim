import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, CheckCircle, Keyboard, Scan, Zap } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (qrCode: string) => Promise<{
    matched: boolean;
    message: string;
    stationName?: string;
  }>;
  currentPosCode: string;
}

export const QRScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onVerify,
  currentPosCode,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const scannerContainerId = 'qr-reader-container';

  // Helper to safely stop scanner without throwing "Cannot stop, scanner is not running or paused"
  const safeStopScanner = async (scanner: Html5Qrcode | null) => {
    if (!scanner) return;
    try {
      // Html5QrcodeScannerState: UNKNOWN = 1, SCANNING = 2, PAUSED = 3
      const state = scanner.getState();
      if (state === 2 || state === 3) {
        await scanner.stop();
      }
    } catch {
      // Suppress any premature or already stopped errors
    }

    try {
      scanner.clear();
    } catch {
      // ignore
    }
  };

  // Start scanner when modal opens with camera tab
  useEffect(() => {
    let isMounted = true;

    if (isOpen && activeTab === 'camera') {
      const startScanner = async () => {
        try {
          setCameraError(null);
          isStartingRef.current = true;

          // Wait a tick for modal DOM mounting
          await new Promise((r) => setTimeout(r, 150));
          if (!isMounted) {
            isStartingRef.current = false;
            return;
          }

          // Check if element exists in DOM
          const el = document.getElementById(scannerContainerId);
          if (!el) {
            isStartingRef.current = false;
            return;
          }

          const scanner = new Html5Qrcode(scannerContainerId);
          scannerRef.current = scanner;

          await scanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const size = Math.max(160, Math.floor(minEdge * 0.78));
                return { width: size, height: size };
              },
              aspectRatio: 1.0,
            },
            async (decodedText) => {
              if (isVerifying) return;
              sounds.playClick();
              handleVerifyCode(decodedText);
            },
            () => {
              // scanning in progress, ignore frame errors
            }
          );

          isStartingRef.current = false;

          // If unmounted while start() was resolving, stop immediately
          if (!isMounted) {
            await safeStopScanner(scanner);
            scannerRef.current = null;
          }
        } catch (err: unknown) {
          isStartingRef.current = false;
          console.warn('Camera failed or not permitted', err);
          if (isMounted) {
            setCameraError(
              'Kamera tidak dapat diakses atau izin belum diberikan. Silakan gunakan opsi "Masukkan Kode Manual" di bawah ini!'
            );
            setActiveTab('manual');
          }
        }
      };

      startScanner();
    }

    return () => {
      isMounted = false;
      const currentScanner = scannerRef.current;
      scannerRef.current = null;

      // Handle safe shutdown
      if (currentScanner) {
        // If it was still starting, wait a bit then safely stop
        if (isStartingRef.current) {
          setTimeout(() => {
            safeStopScanner(currentScanner);
          }, 350);
        } else {
          safeStopScanner(currentScanner);
        }
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleVerifyCode = async (codeToTest: string) => {
    const clean = codeToTest.trim();
    if (!clean) return;

    setIsVerifying(true);
    setFeedback(null);

    // Pause scanner if running
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.pause(true);
        }
      } catch {
        // ignore
      }
    }

    try {
      const result = await onVerify(clean);
      if (result.matched) {
        sounds.playSuccess();
        setFeedback({
          type: 'success',
          title: '🎉 KODE BERHASIL DIVERIFIKASI!',
          message: 'Selamat! Kamu menemukan babak cerita yang tepat.\nBacalah teks cerita dengan seksama dan selesaikan tantangan literasi!',
        });

        // Safely stop before closing
        await safeStopScanner(scannerRef.current);
        scannerRef.current = null;

        setTimeout(() => {
          onClose();
          setFeedback(null);
        }, 1500);
      } else {
        sounds.playWrong();
        setFeedback({
          type: 'error',
          title: '🔒 KODE BELUM BISA DIBUKA',
          message: 'Kode ini bukan tujuan babak cerita saat ini.\nTemukan pos yang sesuai dengan petunjuk jalan cerita.',
        });

        // Resume scanner after 2 seconds if still in modal and active tab
        setTimeout(() => {
          if (scannerRef.current) {
            try {
              const state = scannerRef.current.getState();
              if (state === 3) {
                scannerRef.current.resume();
              }
            } catch {
              // ignore
            }
          }
        }, 2000);
      }
    } catch {
      sounds.playWrong();
      setFeedback({
        type: 'error',
        title: '❌ GAGAL MEMVALIDASI',
        message: 'Terjadi kesalahan saat memeriksa kode. Silakan coba lagi.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyCode(manualCode);
  };

  const handleCloseModal = async () => {
    sounds.playClick();
    await safeStopScanner(scannerRef.current);
    scannerRef.current = null;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-4 border-amber-400 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-400/30 rounded-xl text-xl">📷</span>
            <div>
              <h3 className="font-bold text-lg font-display tracking-wide">
                SCAN KODE POS LITERASI
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Mencari Pos: <span className="font-bold underline">{currentPosCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-amber-100 bg-amber-50/50 p-1.5">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('camera');
              setFeedback(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Camera className="w-4 h-4" /> Kamera Scan
          </button>
          <button
            onClick={async () => {
              sounds.playClick();
              await safeStopScanner(scannerRef.current);
              scannerRef.current = null;
              setActiveTab('manual');
              setFeedback(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Masukkan Manual
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 m-3 rounded-2xl flex items-start gap-3 animate-in zoom-in-95 duration-150 ${
              feedback.type === 'success'
                ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950'
                : 'bg-rose-100 border-2 border-rose-500 text-rose-950'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-extrabold text-base">{feedback.title}</div>
              <div className="text-xs whitespace-pre-line mt-1 font-medium leading-relaxed">
                {feedback.message}
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center">
          {activeTab === 'camera' ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full max-w-[290px] aspect-square rounded-2xl overflow-hidden border-4 border-amber-300 bg-black shadow-inner flex items-center justify-center">
                <div id={scannerContainerId} className="w-full h-full"></div>
                {/* Target overlay corners */}
                <div className="absolute inset-4 pointer-events-none border-2 border-amber-400/60 rounded-xl flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-t-4 border-l-4 border-amber-400"></span>
                    <span className="w-4 h-4 border-t-4 border-r-4 border-amber-400"></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-b-4 border-l-4 border-amber-400"></span>
                    <span className="w-4 h-4 border-b-4 border-r-4 border-amber-400"></span>
                  </div>
                </div>
              </div>

              {cameraError && (
                <div className="mt-3 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <p className="text-xs text-center text-slate-500 mt-3 font-medium">
                Arahkan kamera ke kartu QR Code yang ditempel di lokasi pos sekolah!
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="w-full space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ketik Kode QR Babak Cerita:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: LITERASI-POS-1"
                    className="w-full px-4 py-3 bg-amber-50/60 border-2 border-amber-300 rounded-xl text-slate-900 font-mono font-bold tracking-wider placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:bg-white text-base uppercase"
                    autoFocus
                  />
                  <Scan className="w-5 h-5 text-amber-500 absolute right-3 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Kode tertera tepat di bawah kotak QR Code pada kartu pos sekolah.
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifying || !manualCode.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                {isVerifying ? (
                  <span>Memeriksa Kode...</span>
                ) : (
                  <>
                    <Zap className="w-5 h-5" /> VALIDASI KODE POS
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Test Bar (Super helpful during classroom preview/evaluation) */}
          <div className="w-full mt-4 pt-4 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>🧪 Uji Coba Cepat (Klik kode pos yang dituju):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Babak 1', code: 'LITERASI-POS-1' },
                { label: 'Babak 2', code: 'LITERASI-POS-2' },
                { label: 'Babak 3', code: 'LITERASI-POS-3' },
                { label: 'Babak 4', code: 'LITERASI-POS-4' },
                { label: 'Babak 5 (Final)', code: 'LITERASI-POS-5' },
              ].map((testItem) => (
                <button
                  key={testItem.label}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setManualCode(testItem.code);
                    handleVerifyCode(testItem.code);
                  }}
                  className="text-xs bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 border border-slate-300 hover:border-amber-300 font-mono px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  {testItem.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
