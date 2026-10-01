import React from 'react';
import { Award, Compass, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  completedPosCode: string;
  nextStation: {
    posNumber: number;
    totalPos: number;
    code: string;
    name?: string;
    hint: string;
    isFinal: boolean;
    story?: any;
  } | null;
  onContinue: () => void;
}

export const PosCompleteModal: React.FC<Props> = ({
  isOpen,
  completedPosCode,
  nextStation,
  onContinue,
}) => {
  if (!isOpen || !nextStation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-amber-400 p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-lg mb-4 rotate-3 animate-bounce">
          <BookOpen className="w-10 h-10 text-amber-900" />
        </div>

        <span className="text-xs font-black tracking-wider uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
          {completedPosCode} TUNTAS
        </span>

        <h2 className="text-2xl sm:text-3xl font-black font-display text-amber-950 mt-2 mb-1">
          🎉 BABAK CERITA DITAKLUKKAN!
        </h2>
        <p className="text-sm font-semibold text-emerald-700 mb-4">
          +100 Bonus Poin Babak & Catatan Jurnal Didapatkan! 🌟
        </p>

        {/* Next Location Clue Box (Description only) */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 text-left shadow-inner mb-6">
          <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4 text-amber-600 animate-spin-slow" />
            <span>Deskripsi Lokasi Berikutnya ({nextStation.code}):</span>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200 text-slate-800 text-sm font-medium leading-relaxed italic shadow-2xs">
            &ldquo;{nextStation.hint}&rdquo;
          </div>

          <p className="text-[11px] text-slate-500 mt-2 text-center">
            Temukan tempat yang sesuai dengan deskripsi di atas dan scan QR Code pos berikutnya!
          </p>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onContinue();
          }}
          className="w-full py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-black text-base rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 uppercase tracking-wide font-display cursor-pointer"
        >
          MENUJU BABAK BERIKUTNYA <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
