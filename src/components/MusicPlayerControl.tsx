import React, { useEffect, useState, useRef } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, Disc, Upload, RotateCcw } from 'lucide-react';
import { sounds } from '../utils/audio';

export const MusicPlayerControl: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(sounds.isBgmPlaying);
  const [volume, setVolume] = useState(sounds.bgmVolume);
  const [customTrackName, setCustomTrackName] = useState<string | null>(sounds.customTrackName);
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = sounds.subscribeBgm((playing, vol, customName) => {
      setIsPlaying(playing);
      setVolume(vol);
      setCustomTrackName(customName);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await sounds.setCustomBgmFile(file);
    e.target.value = '';
  };

  return (
    <div className="relative">
      {/* Hidden input for uploading custom MP3/MP4/WAV file */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/mp4,video/webm"
        onChange={handleFileChange}
        className="hidden"
      />

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

        {/* Volume & Track Settings dropdown trigger */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setIsOpenMenu(!isOpenMenu);
          }}
          title="Pengaturan Musik Petualangan"
          className="p-1.5 text-amber-800 hover:text-amber-950 rounded-lg hover:bg-amber-300/60 transition-colors cursor-pointer"
        >
          {volume === 0 || !isPlaying ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Floating Volume & Track Popover */}
      {isOpenMenu && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl p-3.5 shadow-2xl border-2 border-amber-300 z-50 animate-in zoom-in-95 duration-150 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-amber-950 truncate">
              <Disc className="w-3.5 h-3.5 text-amber-600 animate-spin-slow shrink-0" />
              <span className="truncate">
                {customTrackName ? customTrackName : 'Orkestra Suling Petualangan'}
              </span>
            </span>
            <span className="text-[11px] text-amber-800 shrink-0 ml-1">{Math.round(volume * 100)}%</span>
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

          <div className="flex items-center justify-between text-[11px]">
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
              Volume 50%
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                sounds.setBgmVolume(0.85);
              }}
              className="text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
            >
              Volume 85%
            </button>
          </div>

          <div className="pt-2 border-t border-amber-100 space-y-1.5">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                fileInputRef.current?.click();
              }}
              className="w-full py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-700" />
              <span>Pilih File Musik/Video (.mp3/.mp4)</span>
            </button>

            {customTrackName && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  sounds.clearCustomBgmFile();
                }}
                className="w-full py-1 px-2 text-slate-500 hover:text-rose-600 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Gunakan Orkestra Bawaan</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
