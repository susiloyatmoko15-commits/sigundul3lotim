import React, { useState } from 'react';
import { LocationConfig, StoryRetelling } from '../types/game';
import {
  BookOpen,
  Send,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface StoryRetellingViewProps {
  locations: LocationConfig[];
  playerName: string;
  className: string;
  onSubmitRetelling: (retelling: StoryRetelling) => void;
  isSubmitting?: boolean;
}

export const StoryRetellingView: React.FC<StoryRetellingViewProps> = ({
  locations,
  playerName,
  className,
  onSubmitRetelling,
  isSubmitting = false,
}) => {
  const [text, setText] = useState('');
  const [showRecap, setShowRecap] = useState(false);
  const [activePromptGuide, setActivePromptGuide] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Compute word count
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = text.trim() === '' ? 0 : words.length;
  const minWords = 25; // Friendly minimum for elementary school students

  const handleInsertScaffold = () => {
    sounds.playClick();
    // First check if student wrote notes at Pos 1 to Pos 5
    const savedNotes = ['pos_1', 'pos_2', 'pos_3', 'pos_4', 'pos_5']
      .map((id, idx) => {
        const note = localStorage.getItem(`sigundul_note_${id}`)?.trim();
        return note ? `Catatan Pos ${idx + 1}: ${note}` : null;
      })
      .filter(Boolean);

    if (savedNotes.length > 0 && text.trim().length === 0) {
      setText(savedNotes.join('\n\n'));
      return;
    }

    const template =
      `Di Pos 1 (Gudang Sekolah), tumbuhan berkembang biak secara generatif menggunakan bunga yang memiliki benang sari (jantan) dan putik (betina) melalui penyerbukan dan pembuahan.\n\n` +
      `Di Pos 2 (Bawah Pohon Jambu) dan Pos 4 (Lorong Parkir), tumbuhan berkembang biak secara vegetatif buatan (mencangkok pohon jambu, stek, okulasi, merunduk) serta vegetatif alami (tunas, tunas adventif cocor bebek, umbi, rhizoma jahe, geragih stroberi, dan spora).\n\n` +
      `Di Pos 3 (Bawah Pohon Cempaka) dan Pos 5 (Di Kelas), penyerbukan dibedakan menjadi sendiri, tetangga, silang, dan bastar, sedangkan biji menyebar melalui angin, air, dan hewan untuk menjaga kelestarian tumbuhan.`;
    setText(template);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wordCount < minWords) {
      sounds.playWrong();
      setValidationError(
        `Ceritamu baru memiliki ${wordCount} kata. Tuliskan minimal ${minWords} kata agar alur ceritamu dari awal sampai akhir terbaca lengkap dan bermakna ya!`
      );
      return;
    }

    setValidationError(null);
    sounds.playSuccess();

    onSubmitRetelling({
      studentText: text.trim(),
      wordCount,
      submittedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border-4 border-yellow-300 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 bg-yellow-400 text-amber-950 font-black px-4 py-1.5 rounded-full text-xs uppercase tracking-widest shadow-md mb-3">
          <Sparkles className="w-4 h-4 text-amber-900" /> TUGAS AKHIR DI KELAS (POS 5)
        </div>
        <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-yellow-100">
          Merangkum Catatan Perkembangbiakan Tumbuhan
        </h1>
        <p className="text-sm sm:text-base font-medium text-amber-100 mt-2 max-w-xl mx-auto leading-relaxed">
          Hebat! Kamu telah menuntaskan seluruh soal di 5 Pos. Sekarang, tuliskanlah kembali rangkuman catatan pentingmu tentang <strong>Perkembangbiakan pada Tumbuhan dari Pos 1 hingga Pos 5</strong>!
        </p>

        <div className="mt-4 inline-flex items-center gap-2 bg-black/20 px-3.5 py-1 rounded-full text-xs font-bold text-yellow-200">
          <span>Penjelajah Ilmu: <strong>{playerName}</strong> ({className})</span>
        </div>
      </div>

      {/* Collapsible Story Recap helper */}
      <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setShowRecap(!showRecap);
          }}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left bg-amber-100/70 hover:bg-amber-200/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-950">
                Buku Catatan Materi (Kilas Balik Pos 1 - Pos 5)
              </h3>
              <p className="text-xs text-amber-800 font-semibold">
                Klik untuk melihat kembali intisari materi di setiap lokasi pos
              </p>
            </div>
          </div>
          <div className="text-amber-800">
            {showRecap ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {showRecap && (
          <div className="p-4 sm:p-6 space-y-3 bg-amber-50/50 border-t border-amber-200 text-xs sm:text-sm">
            {locations.map((loc, idx) => (
              <div
                key={loc.id}
                className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-start gap-3 shadow-xs"
              >
                <div className="px-2.5 py-1 bg-amber-600 text-white rounded-xl text-xs font-black shrink-0">
                  Pos {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-amber-950">{loc.story.title}</div>
                  <div className="text-slate-600 mt-0.5 leading-relaxed">
                    {loc.story.summaryClue || loc.story.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Writing Prompt Guidelines */}
      <div className="bg-amber-100/80 border-2 border-amber-300 rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-black text-amber-950 text-sm sm:text-base">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0" />
            Panduan Rangkuman Catatan Materi
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-white/80 p-3 rounded-2xl border border-amber-200">
            <div className="font-black text-amber-900 mb-1">1. Pos 1 &amp; Pos 3 (Generatif)</div>
            <p className="text-slate-600">
              Tuliskan bagian-bagian bunga (benang sari &amp; putik), penyerbukan, pembuahan, serta 4 jenis penyerbukan.
            </p>
          </div>
          <div className="bg-white/80 p-3 rounded-2xl border border-amber-200">
            <div className="font-black text-amber-900 mb-1">2. Pos 2 &amp; Pos 4 (Vegetatif)</div>
            <p className="text-slate-600">
              Tuliskan contoh vegetatif buatan (mencangkok jambu, stek, okulasi) dan vegetatif alami (tunas, umbi, rhizoma, geragih, spora).
            </p>
          </div>
          <div className="bg-white/80 p-3 rounded-2xl border border-amber-200">
            <div className="font-black text-amber-900 mb-1">3. Pos 5 (Pelestarian)</div>
            <p className="text-slate-600">
              Tuliskan cara penyebaran biji (angin, air, hewan) serta pelestarian tumbuhan In-Situ dan Ex-Situ.
            </p>
          </div>
        </div>
      </div>

      {/* Main Story Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border-2 border-amber-300 p-5 sm:p-7 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="retelling-input" className="block text-sm sm:text-base font-black text-amber-950">
            Tuliskan Ringkasan Alur Ceritamu di Sini:
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                wordCount >= minWords
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {wordCount} kata {wordCount < minWords ? `(min. ${minWords})` : '✓ Memenuhi syarat'}
            </span>
          </div>
        </div>

        <textarea
          id="retelling-input"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder="Mulai ceritamu di sini... Contoh: Cerita ini bermula ketika Sita dan Bima menemukan buku bersampul kayu di perpustakaan sekolah. Di dalamnya terdapat peta kain sutra kuno yang mengarahkan mereka..."
          rows={9}
          className="w-full p-4 rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-200 text-sm sm:text-base leading-relaxed text-slate-800 outline-hidden transition-all resize-y placeholder:text-slate-400"
        />

        {validationError && (
          <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs sm:text-sm font-bold text-rose-800 flex items-center gap-2 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500 italic">
            * Tulisanmu akan tersimpan ke Piagam Detektif Literasi dan dibaca oleh Bapak/Ibu Guru.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Mengirim Cerita...' : 'Kirim Cerita & Buka Peti Pusaka 🏆'}
          </button>
        </div>
      </form>
    </div>
  );
};
