import React, { useState } from 'react';
import { Compass, Trophy, ShieldCheck, Volume2, VolumeX, Image as ImageIcon, Lock } from 'lucide-react';
import { sounds } from '../utils/audio';
import { MusicPlayerControl } from './MusicPlayerControl';

interface Props {
  onGoHome: () => void;
  onOpenLeaderboard: () => void;
  onOpenAdmin: () => void;
  onShowSplash?: () => void;
  showAdminBtn?: boolean;
  isAdventureLocked?: boolean;
}

export const Navbar: React.FC<Props> = ({
  onGoHome,
  onOpenLeaderboard,
  onOpenAdmin,
  onShowSplash,
  isAdventureLocked = false,
}) => {
  const [soundOn, setSoundOn] = useState(sounds.enabled);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundOn(sounds.enabled);
    if (sounds.enabled) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200/80 shadow-xs select-none">
      <div className="max-w-5xl mx-auto px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand */}
        <button
          onClick={() => {
            if (isAdventureLocked) return;
            sounds.playClick();
            onGoHome();
          }}
          className={`flex items-center gap-2 text-left group min-w-0 ${
            isAdventureLocked ? 'cursor-default' : 'cursor-pointer'
          }`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 animate-spin-slow" />
          </div>
          <div className="min-w-0">
            <div className="font-black text-amber-950 font-display text-sm sm:text-lg leading-none tracking-tight truncate">
              SI GUNDUL
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-amber-700 tracking-wide uppercase mt-0.5 truncate">
              SDN 3 Loloan Timur
            </div>
          </div>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Adventure Screen Lock Status Badge */}
          {isAdventureLocked && (
            <span
              title="Layar Terkunci selama petualangan berlangsung"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-[10px] sm:text-xs font-black"
            >
              <Lock className="w-3 h-3 text-rose-600 shrink-0" />
              <span className="hidden xs:inline">Layar Terkunci</span>
            </span>
          )}

          {/* Adventure Backsound Control */}
          <MusicPlayerControl />

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Matikan Suara Efek' : 'Nyalakan Suara Efek'}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-amber-800 hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Splash Poster Button (Hidden during locked adventure) */}
          {onShowSplash && !isAdventureLocked && (
            <button
              onClick={() => {
                sounds.playClick();
                onShowSplash();
              }}
              title="Lihat Tampilan Awal (Poster Si Gundul)"
              className="w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Poster</span>
            </button>
          )}

          {/* Leaderboard Button (Hidden during locked adventure) */}
          {!isAdventureLocked && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenLeaderboard();
              }}
              title="Papan Peringkat"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Peringkat</span>
            </button>
          )}

          {/* Teacher Portal (Always accessible for Teacher) */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAdmin();
            }}
            title="Portal Guru / Admin"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
            <span>Guru</span>
          </button>
        </div>
      </div>
    </header>
  );
};
