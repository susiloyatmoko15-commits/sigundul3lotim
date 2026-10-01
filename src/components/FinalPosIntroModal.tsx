import React from 'react';
import { Crown, Sparkles, MapPin, ArrowRight, BookOpen } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  finalHint: string;
  finalLocationName?: string;
  onContinue: () => void;
}

export const FinalPosIntroModal: React.FC<Props> = ({
  isOpen,
  finalHint,
  finalLocationName,
  onContinue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-stone-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-yellow-400 p-6 sm:p-8 text-center text-white relative animate-in zoom-in-95 duration-200">
        {/* Glow & Sparkles */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-200 flex items-center justify-center shadow-2xl mb-4 border-2 border-yellow-200 animate-pulse">
          <Crown className="w-12 h-12 text-amber-950" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-black uppercase tracking-widest mb-2">
          <Sparkles className="w-3.5 h-3.5" /> BABAK 5 (FINAL) &bull; AULA PUSAKA AKSARA
        </div>

        <h2 className="text-3xl sm:text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 mb-2">
          🏆 PUNCAK PETUALANGAN 🏆
        </h2>

        <p className="text-amber-200 text-sm sm:text-base font-medium mb-5">
          Kamu telah melintasi 4 babak cerita! Temukan QR Code peti pusaka di aula sekolah, tuntaskan babak final, dan siapkan dirimu untuk <strong>Tugas Akhir Menceritakan Kembali Alur Kisah</strong>!
        </p>

        {/* Final Clue Parchment */}
        <div className="bg-amber-100/10 border-2 border-yellow-500/40 rounded-2xl p-4 text-left backdrop-blur-xs mb-6">
          <div className="flex items-center gap-2 mb-2 text-yellow-400 font-bold text-xs uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-yellow-400" />
            <span>Petunjuk Lokasi Babak 5 (Peti Pusaka):</span>
          </div>

          {finalLocationName && (
            <div className="text-sm font-extrabold text-yellow-300 mb-1">
              📍 {finalLocationName}
            </div>
          )}

          <div className="bg-black/30 p-3.5 rounded-xl border border-yellow-500/30 text-amber-100 text-sm font-medium leading-relaxed italic">
            &ldquo;{finalHint}&rdquo;
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onContinue();
          }}
          className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-amber-950 font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-98 flex items-center justify-center gap-2 font-display uppercase tracking-wide cursor-pointer"
        >
          MENUJU BABAK FINAL! <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
