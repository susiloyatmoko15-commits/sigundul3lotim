import React, { useEffect, useState } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, Disc } from 'lucide-react';
import { sounds } from '../utils/audio';

export const MusicPlayerControl: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(sounds.isBgmPlaying);
  const [volume, setVolume] = useState(sounds.bgmVolume);
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = sounds.subscribeBgm((playing, vol) => {
      setIsPlaying(playing);
      setVolume(vol);
    });
    return () => unsubscribe();
  }, []);

  const handleTogglePlay = () => {
    sounds.playClick();
    sounds.toggleBgm();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    sounds.setBgmVolume(newVol);
  };

  return (
    <div className="relative">
      {/* Main Music Toggle Pill */}
      <div className="flex items-center bg-amber-100/90 hover:bg-amber-200/90 border border-amber-300 rounded-2xl p-1 shadow-xs transition-all">
        <button
          type="button"
          onClick={handleTogglePlay}
          title={isPlaying ? 'Jeda Musik Petualangan' : 'Putar Musik Petualangan'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isPlaying
              ? 'bg-amber-500 text-white shadow-xs animate-pulse-gentle'
              : 'text-amber-900 hover:text-amber-950'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-white" />
              {/* Mini Audio Equalizer Visualizer Bars */}
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-white rounded-full animate-music-bar-1 h-3"></span>
                <span className="w-1 bg-white rounded-full animate-music-bar-2 h-2"></span>
                <span className="w-1 bg-white rounded-full animate-music-bar-3 h-3"></span>
              </div>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-amber-800 text-amber-800" />
              <Music className="w-3.5 h-3.5 text-amber-800" />
            </>
          )}
          <span className="hidden sm:inline">
            {isPlaying ? 'Musik Aktif' : 'Musik'}
          </span>
        </button>

        {/* Volume Settings dropdown trigger */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setIsOpenMenu(!isOpenMenu);
          }}
          title="Pengaturan Volume Musik"
          className="p-1.5 text-amber-800 hover:text-amber-950 rounded-lg hover:bg-amber-300/60 transition-colors cursor-pointer"
        >
          {volume === 0 || !isPlaying ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Floating Volume Slider Popover */}
      {isOpenMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl p-3 shadow-2xl border-2 border-amber-300 z-50 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-1 text-amber-900">
              <Disc className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
              <span>Volume Musik</span>
            </span>
            <span className="text-[11px] text-amber-800">{Math.round(volume * 100)}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-amber-100 rounded-lg"
          />

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                sounds.setBgmVolume(0);
              }}
              className="text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
            >
              Mute
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                sounds.setBgmVolume(0.5);
              }}
              className="text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
            >
              Normal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
