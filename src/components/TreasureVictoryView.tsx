import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Key,
  RotateCcw,
  Award,
  Clock,
  Target,
  CheckCircle2,
  Sparkles,
  Printer,
  Copy,
  BookOpen,
  Star,
} from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { sounds } from '../utils/audio';

interface Props {
  summary: LeaderboardEntry;
  treasureCode: string;
  teacherMessage: string;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

export const TreasureVictoryView: React.FC<Props> = ({
  summary,
  treasureCode,
  teacherMessage,
  onPlayAgain,
  onViewLeaderboard,
}) => {
  const [chestOpen, setChestOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    sounds.playTreasureChest();

    // Trigger grand confetti show
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    const timer = setTimeout(() => {
      setChestOpen(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} menit ${secs} detik`;
  };

  const handleCopyStory = () => {
    if (summary.storyRetelling?.studentText) {
      navigator.clipboard.writeText(summary.storyRetelling.studentText);
      sounds.playSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Victory Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-yellow-400 text-amber-950 font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-widest shadow-md">
          <Sparkles className="w-4 h-4 text-amber-900" /> SELURUH BABAK & TUGAS AKHIR TUNTAS
        </div>

        <h1 className="text-3xl sm:text-5xl font-black font-display text-amber-950 tracking-tight">
          🎉 SELAMAT, DETEKTIF LITERASI! 🎉
        </h1>
        <p className="text-base sm:text-lg font-bold text-amber-900 max-w-lg mx-auto">
          Kamu telah berhasil menuntaskan seluruh 5 babak cerita bersambung dan merangkum alur kisahnya dengan cemerlang!
        </p>
      </div>

      {/* Animated Treasure Chest */}
      <div className="bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-center text-white border-4 border-yellow-400 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-300/30 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-32 h-32 sm:w-40 sm:h-40 transition-transform duration-700 ${
              chestOpen ? 'scale-105' : 'scale-95'
            }`}
          >
            {/* SVG Treasure Chest */}
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
              <rect x="30" y="85" width="140" height="90" rx="14" fill="#78350f" stroke="#f59e0b" strokeWidth="5" />
              <rect x="55" y="85" width="16" height="90" fill="#d97706" />
              <rect x="129" y="85" width="16" height="90" fill="#d97706" />
              <circle cx="63" cy="100" r="3" fill="#fde68a" />
              <circle cx="63" cy="130" r="3" fill="#fde68a" />
              <circle cx="63" cy="160" r="3" fill="#fde68a" />
              <circle cx="137" cy="100" r="3" fill="#fde68a" />
              <circle cx="137" cy="130" r="3" fill="#fde68a" />
              <circle cx="137" cy="160" r="3" fill="#fde68a" />
              {/* Lock Plate */}
              <rect x="85" y="85" width="30" height="34" rx="6" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
              <circle cx="100" cy="98" r="4" fill="#451a03" />
              <polygon points="98,99 102,99 103,109 97,109" fill="#451a03" />

              {/* Chest Lid Animated */}
              <g
                className="transition-transform duration-700 origin-bottom"
                style={{
                  transform: chestOpen ? 'rotate(-35deg) translateY(-25px)' : 'rotate(0deg)',
                  transformOrigin: '100px 85px',
                }}
              >
                <path d="M 26 85 Q 100 25 174 85 Z" fill="#92400e" stroke="#f59e0b" strokeWidth="5" />
                <path d="M 55 58 Q 63 46 71 85" stroke="#fde68a" strokeWidth="6" fill="none" />
                <path d="M 129 85 Q 137 46 145 58" stroke="#fde68a" strokeWidth="6" fill="none" />
              </g>

              {/* Glowing Book & Sparkles inside opened chest */}
              {chestOpen && (
                <g className="animate-pulse">
                  <polygon points="100,35 106,50 120,53 109,63 113,77 100,68 87,77 91,63 80,53 94,50" fill="#fef08a" />
                  <circle cx="65" cy="50" r="4" fill="#ffffff" />
                  <circle cx="135" cy="50" r="4" fill="#ffffff" />
                  {/* Book inside */}
                  <rect x="75" y="65" width="50" height="30" rx="3" fill="#ffffff" />
                  <rect x="78" y="70" width="44" height="2" fill="#d97706" />
                  <rect x="78" y="75" width="44" height="2" fill="#d97706" />
                  <rect x="78" y="80" width="30" height="2" fill="#d97706" />
                </g>
              )}
            </svg>
          </div>

          <div className="mt-4 space-y-2">
            <span className="text-xs uppercase tracking-widest text-yellow-300 font-black">
              KODE PUSAKA LITERASI ANDA
            </span>
            <div className="bg-yellow-400 text-amber-950 font-mono font-black text-2xl sm:text-3xl px-6 py-2 rounded-2xl tracking-wider shadow-inner inline-block select-all">
              {treasureCode}
            </div>
            <p className="text-xs sm:text-sm text-yellow-100 max-w-md mx-auto pt-2">
              {teacherMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Printable Certificate (Piagam Penghargaan) */}
      <div className="bg-white border-4 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-xl text-slate-800 relative print:border-2 print:shadow-none">
        {/* Decorative Certificate Corner Medallions */}
        <div className="flex justify-between items-center pb-4 border-b-2 border-dashed border-amber-200">
          <div className="flex items-center gap-2">
            <Award className="w-8 h-8 text-amber-600" />
            <div>
              <div className="text-xs font-black uppercase text-amber-700 tracking-wider">
                SEKOLAH DASAR NUSANTARA
              </div>
              <div className="text-lg sm:text-xl font-black font-display text-amber-950">
                PIAGAM PENGHARGAAN DETEKTIF LITERASI
              </div>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-slate-500">Badge:</span>
            <div className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              {summary.badge}
            </div>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="py-6 text-center space-y-2">
          <p className="text-xs sm:text-sm text-slate-600 uppercase tracking-widest font-semibold">
            Diberikan dengan penuh apresiasi kepada:
          </p>
          <h2 className="text-2xl sm:text-4xl font-black font-display text-amber-950">
            {summary.playerName}
          </h2>
          <p className="text-sm font-bold text-amber-800">
            {summary.className} {summary.members && summary.members.length > 0 ? `• Anggota: ${summary.members.join(', ')}` : ''}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto pt-1 leading-relaxed">
            Atas keberhasilannya menyelesaikan 5 Babak Cerita Bersambung &ldquo;Misteri Pusaka Aksara Nusantara&rdquo; dan menyusun tugas akhir ringkasan alur cerita dengan ketelitian dan budi pekerti yang luhur.
          </p>
        </div>

        {/* Manual Notebook Submission Reminder Box */}
        <div className="my-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-xs font-black text-amber-900 uppercase">
              Pemeriksaan Buku Catatan Manual Siswa (Pos 1 – Pos 5)
            </span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 font-medium">
            Jangan lupa tunjukkan dan kumpulkan <strong>Buku Catatan Manualmu</strong> yang berisi rangkuman poin penting dari <strong>Pos 1 (Gudang Sekolah), Pos 2 (Bawah Pohon Jambu), Pos 3 (Bawah Pohon Cempaka), Pos 4 (Lorong Parkir), dan Pos 5 (Di Kelas)</strong> kepada Bapak/Ibu Guru!
          </p>
        </div>

        {/* Stats Grid inside Certificate */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-amber-200 text-center">
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
            <div className="text-xs text-slate-500 font-bold">Total Skor</div>
            <div className="text-xl sm:text-2xl font-black font-display text-amber-900">{summary.score}</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
            <div className="text-xs text-slate-500 font-bold">Akurasi Jawaban</div>
            <div className="text-xl sm:text-2xl font-black font-display text-amber-900">{summary.accuracy}%</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
            <div className="text-xs text-slate-500 font-bold">Soal Benar</div>
            <div className="text-xl sm:text-2xl font-black font-display text-amber-900">
              {summary.correctCount} / {summary.totalQuestions}
            </div>
          </div>
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
            <div className="text-xs text-slate-500 font-bold">Waktu Tempuh</div>
            <div className="text-sm sm:text-base font-black text-amber-900 mt-1">
              {formatDuration(summary.durationSeconds)}
            </div>
          </div>
        </div>

        {/* Certificate Footer / Print button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-dashed border-amber-200">
          <div className="text-xs text-slate-400">
            Diverifikasi sistem pada {new Date(summary.completedAt).toLocaleDateString('id-ID')}
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak / Unduh Piagam
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onViewLeaderboard();
          }}
          className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-amber-50 text-amber-900 font-bold text-sm sm:text-base rounded-2xl border-2 border-amber-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-600" />
          Lihat Papan Peringkat
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onPlayAgain();
          }}
          className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Mulai Petualangan Baru
        </button>
      </div>
    </div>
  );
};
