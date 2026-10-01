import React, { useState } from 'react';
import { sounds } from '../utils/audio';
import splashImage from '../assets/images/sigundul_splash_1790817657576.jpg';

interface Props {
  onEnter: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onEnter }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleStart = () => {
    if (isExiting) return;
    setIsExiting(true);
    sounds.playSuccess();

    // Start background music on first user gesture
    if (!sounds.isBgmPlaying) {
      try {
        sounds.startBgm();
      } catch {
        // ignore audio policy restrictions
      }
    }

    setTimeout(() => {
      onEnter();
    }, 350);
  };

  return (
    <div
      onClick={handleStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleStart();
        }
      }}
      aria-label="Sentuh layar untuk masuk ke menu utama Si Gundul"
      className={`fixed inset-0 z-50 w-screen h-dvh flex items-center justify-center bg-amber-950 cursor-pointer select-none overflow-hidden transition-all duration-350 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Fullscreen ambient background fill for widescreen / desktop viewports */}
      <img
        src={splashImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center blur-2xl scale-110 opacity-75 pointer-events-none select-none"
      />
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      {/* Main Fullscreen Image Container (Smartphone-first 9:16 frame) */}
      <div className="relative w-full h-full max-w-[480px] sm:max-w-none flex items-center justify-center overflow-hidden mx-auto">
        <img
          src={splashImage}
          alt="Si Gundul - Petualangan Seru Mencari Harta Karun Ilmu - SD Negeri 3 Loloan Timur"
          className="w-full h-full sm:w-auto sm:max-w-full object-cover sm:object-contain object-center pointer-events-none select-none shadow-2xl"
        />

        {/* Subtle bottom tap indicator that does not cover the LOGIN button in the illustration */}
        <div className="absolute bottom-2 sm:bottom-3 left-0 right-0 flex justify-center pointer-events-none px-3 pb-[env(safe-area-inset-bottom)]">
          <div className="px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-yellow-300/60 shadow-lg animate-pulse">
            <p className="text-[11px] sm:text-xs text-yellow-200 font-extrabold tracking-wide uppercase text-center drop-shadow-xs">
              ✨ Ketuk layar untuk masuk ke Menu Utama ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
