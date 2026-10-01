import React, { useEffect, useState } from 'react';
import {
  Compass,
  Trophy,
  Clock,
  MapPin,
  QrCode,
  Sparkles,
  Lock,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  BookOpen,
} from 'lucide-react';
import { GameSession, LocationConfig, GameSettings, ClientQuestion } from '../types/game';
import { sounds } from '../utils/audio';
import { MusicPlayerControl } from './MusicPlayerControl';

interface Props {
  session: GameSession;
  locations: LocationConfig[];
  settings: GameSettings;
  currentStation: {
    posNumber: number;
    totalPos: number;
    id: string;
    code: string;
    name?: string;
    hint: string;
    isFinal: boolean;
    story?: any;
  };
  questionsForCurrentPos: ClientQuestion[];
  onOpenScanner: () => void;
  onOpenHowToPlay: () => void;
  onTimeout: () => void;
}

export const AdventureDashboard: React.FC<Props> = ({
  session,
  locations,
  settings,
  currentStation,
  questionsForCurrentPos,
  onOpenScanner,
  onOpenHowToPlay,
  onTimeout,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (settings.durationMinutes <= 0) return null;
    const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);
    const totalSeconds = settings.durationMinutes * 60;
    return Math.max(0, totalSeconds - elapsedSeconds);
  });

  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining === null) return;
    if (secondsRemaining <= 0) {
      onTimeout();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onTimeout]);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundEnabled(sounds.enabled);
    if (sounds.enabled) sounds.playClick();
  };

  const formatTimer = (totalSecs: number | null) => {
    if (totalSecs === null) return '∞ Bebas';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentLocId = session.route[session.currentPosIndex];
  const currentPosProgress = session.posProgress[currentLocId];
  const isQrVerified = currentPosProgress?.qrVerified || false;
  const currentLocConfig = locations.find(l => l.id === currentLocId);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Floating Dashboard Bar (Smartphone-optimized) */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-md border-2 sm:border-3 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Player Name, Class & Help */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-xs font-black text-base shrink-0">
              📜
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight truncate">
                  {session.player.playerName}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                  {session.player.className}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Detektif Literasi &bull; {session.player.mode === 'group' ? 'Kelompok' : 'Individu'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenHowToPlay();
            }}
            title="Cara Bermain"
            className="sm:hidden p-2 rounded-xl text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Trio: Score, Pos, Timer (3 equal columns on smartphone) */}
        <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-2.5">
          {/* Score */}
          <div className="flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
            <div>
              <div className="text-[9px] font-bold text-amber-800 uppercase leading-none">Skor</div>
              <div className="text-xs sm:text-sm font-black text-amber-950 tabular-nums leading-tight">
                {session.score}
              </div>
            </div>
          </div>

          {/* Pos Tracker */}
          <div className="flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[9px] font-bold text-emerald-800 uppercase leading-none">Babak</div>
              <div className="text-xs sm:text-sm font-black text-emerald-950 tabular-nums leading-tight">
                {session.currentPosIndex + 1}/{session.route.length}
              </div>
            </div>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-1.5 rounded-xl border ${
              secondsRemaining !== null && secondsRemaining < 300
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            <div>
              <div className="text-[9px] font-bold uppercase leading-none">Waktu</div>
              <div className="text-xs sm:text-sm font-black font-mono tabular-nums leading-tight">
                {formatTimer(secondsRemaining)}
              </div>
            </div>
          </div>

          {/* Help Button on Desktop */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenHowToPlay();
            }}
            title="Cara Bermain"
            className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Serial Route Progression Bar (Babak 1 to Babak 5) */}
      <div className="bg-white/90 rounded-2xl p-2.5 sm:p-3 border-2 border-amber-200 shadow-xs">
        <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between gap-2">
          <span className="truncate">Alur Babak Cerita</span>
          <span className="text-[11px] text-amber-700 font-extrabold shrink-0">
            {session.currentPosIndex === 4 ? 'Babak 5: Puncak Misteri' : `Menuju Babak ${session.currentPosIndex + 1}`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {session.route.map((locId, idx) => {
            const isCompleted = idx < session.currentPosIndex;
            const isCurrent = idx === session.currentPosIndex;
            const isFinalPos = idx === 4;

            let statusClass = 'bg-slate-100 border-slate-300 text-slate-400';
            if (isCompleted) {
              statusClass = 'bg-emerald-500 border-emerald-600 text-white shadow-xs';
            } else if (isCurrent) {
              statusClass = isFinalPos
                ? 'bg-yellow-400 border-amber-500 text-amber-950 ring-2 ring-amber-400 ring-offset-1 animate-pulse font-black'
                : 'bg-amber-500 border-amber-600 text-white ring-2 ring-amber-300 ring-offset-1 font-black';
            }

            return (
              <div
                key={idx}
                className={`py-1.5 sm:py-2 px-1 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${statusClass}`}
              >
                <div className="flex items-center gap-1 text-[11px] font-extrabold uppercase">
                  {isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <MapPin className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {isFinalPos ? 'Babak 5' : `Babak ${idx + 1}`}
                  </span>
                </div>
                <span className="text-[10px] sm:hidden font-bold mt-0.5">
                  {isFinalPos ? 'Pos 5' : `Pos ${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Destination & QR Code Mission Box (When NOT yet QR verified) */}
      {!isQrVerified && (
        <>
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border-3 sm:border-4 border-amber-300 space-y-3.5 sm:space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-2xl text-xl sm:text-2xl shrink-0">🧭</span>
                <div>
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-200 block">
                    MISI POS LITERASI #{currentStation.posNumber}
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black font-display tracking-wide leading-tight">
                    {currentLocConfig?.story?.title || currentStation.code}
                  </h3>
                </div>
              </div>

              {currentStation.isFinal && (
                <span className="bg-yellow-400 text-amber-950 font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3" /> FINAL
                </span>
              )}
            </div>

            {/* Clue/Riddle Box */}
            <div className="bg-white/95 text-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-inner space-y-2 border-2 border-amber-300">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                <Compass className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Petunjuk Lokasi (Teka-Teki):</span>
              </div>

              {currentStation.name && (
                <div className="text-sm sm:text-base font-extrabold text-amber-950">
                  📍 Lokasi Pos: <span className="underline decoration-amber-400">{currentStation.name}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed italic bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                &ldquo;{currentStation.hint}&rdquo;
              </p>

              <div className="text-[11px] sm:text-xs text-slate-500 flex items-start gap-1.5 pt-0.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Cari kartu QR Code babak cerita ini di lokasi sekolah, lalu tekan tombol scan untuk membuka teks cerita!
                </span>
              </div>
            </div>

            {/* Scan QR Button inside Card */}
            <button
              onClick={() => {
                sounds.playClick();
                onOpenScanner();
              }}
              className="w-full py-3.5 sm:py-4 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-amber-950 font-black text-base sm:text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-98 flex items-center justify-center gap-2.5 uppercase tracking-wide font-display cursor-pointer"
            >
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-amber-950 shrink-0" />
              <span>SCAN QR CODE {currentStation.code}</span>
            </button>
          </div>

          {/* Sticky Bottom Scan Button on Smartphone for one-handed ergonomics */}
          <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t-2 border-amber-300 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <button
              onClick={() => {
                sounds.playClick();
                onOpenScanner();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 font-black text-sm rounded-2xl shadow-lg border-2 border-amber-600 flex items-center justify-center gap-2 uppercase tracking-wide font-display active:scale-98 cursor-pointer"
            >
              <QrCode className="w-5 h-5 text-amber-950 shrink-0" />
              <span>SCAN QR CODE {currentStation.code}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
