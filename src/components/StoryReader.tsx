import React, { useState, useEffect } from 'react';
import { StoryChapter } from '../types/game';
import {
  BookOpen,
  Volume2,
  VolumeX,
  Bookmark,
  Sparkles,
  HelpCircle,
  Eye,
  CheckCircle2,
  ZoomIn,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { sounds } from '../utils/audio';

import pos1Img from '../assets/images/pos1_bunga_generatif_1790819924705.jpg';
import pos2Img from '../assets/images/pos2_vegetatif_buatan_1790819939450.jpg';
import pos3Img from '../assets/images/pos3_penyerbukan_cempaka_1790819956152.jpg';
import pos4Img from '../assets/images/pos4_vegetatif_alami_1790819972661.jpg';
import pos5Img from '../assets/images/pos5_pemencaran_pelestarian_1790819986216.jpg';

const CHAPTER_IMAGES: Record<number, string> = {
  1: pos1Img,
  2: pos2Img,
  3: pos3Img,
  4: pos4Img,
  5: pos5Img,
};

interface StoryReaderProps {
  story: StoryChapter;
  highlightParagraph?: number; // 1-indexed, e.g. 2 for paragraph 2
  compact?: boolean;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  highlightParagraph,
}) => {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const chapterImage = CHAPTER_IMAGES[story.chapterNumber] || pos1Img;

  // Stop speech when unmounting or switching chapter
  useEffect(() => {
    setIsImageZoomed(false);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [story.chapterNumber]);

  const toggleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Fitur pembacaan suara tidak didukung di browser ini.');
      return;
    }

    if (isReadingAloud) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
      return;
    }

    sounds.playClick();
    window.speechSynthesis.cancel();

    // Prepare full text to speak
    const fullText = `${story.title}. ${story.subtitle || ''}. ${story.paragraphs.join(' ')}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95; // child friendly tempo
    utterance.pitch = 1.05;

    // Pick Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID'));
    if (idVoice) {
      utterance.voice = idVoice;
    }

    utterance.onstart = () => {
      setIsReadingAloud(true);
    };

    utterance.onend = () => {
      setIsReadingAloud(false);
    };

    utterance.onerror = () => {
      setIsReadingAloud(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-sm leading-relaxed';
      case 'lg':
        return 'text-lg sm:text-xl leading-relaxed';
      case 'base':
      default:
        return 'text-base sm:text-lg leading-relaxed';
    }
  };

  return (
    <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs">
      {/* Header bar: Chapter Title & Reading Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 sm:pb-4 border-b border-amber-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[11px] sm:text-xs font-black uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-800" />
            Materi Pos {story.chapterNumber} dari 5
          </div>
          <h3 className="text-lg sm:text-2xl font-black font-display text-amber-950 leading-tight">
            {story.title}
          </h3>
          {story.subtitle && (
            <p className="text-xs sm:text-sm font-semibold text-amber-800 italic mt-0.5">
              &ldquo;{story.subtitle}&rdquo;
            </p>
          )}
        </div>

        {/* Toolbar: Read Aloud & Font Resizer */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Read Aloud Button */}
          <button
            type="button"
            onClick={toggleReadAloud}
            className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isReadingAloud
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-amber-200 hover:bg-amber-300 text-amber-900'
            }`}
            title="Dengarkan pembacaan teks suara (Narator)"
          >
            {isReadingAloud ? (
              <>
                <VolumeX className="w-4 h-4" /> Stop Suara
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" /> Baca Nyaring
              </>
            )}
          </button>

          {/* Font Resizer */}
          <div className="inline-flex bg-amber-200/70 p-1 rounded-xl text-xs font-bold text-amber-900 items-center">
            <button
              type="button"
              onClick={() => setFontSize('sm')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                fontSize === 'sm' ? 'bg-amber-600 text-white shadow-xs' : 'hover:bg-amber-300/50'
              }`}
              title="Huruf Kecil"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize('base')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                fontSize === 'base' ? 'bg-amber-600 text-white shadow-xs' : 'hover:bg-amber-300/50'
              }`}
              title="Huruf Standar"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('lg')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                fontSize === 'lg' ? 'bg-amber-600 text-white shadow-xs' : 'hover:bg-amber-300/50'
              }`}
              title="Huruf Besar"
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Educational Botanical Illustration Card */}
      <div className="mt-4 bg-white rounded-2xl border-2 border-amber-300 overflow-hidden shadow-sm">
        <div
          onClick={() => {
            sounds.playClick();
            setIsImageZoomed(true);
          }}
          className="relative group cursor-pointer overflow-hidden bg-amber-100/50"
        >
          <img
            src={chapterImage}
            alt={story.imageCaption || story.title}
            referrerPolicy="no-referrer"
            className="w-full aspect-video object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <ImageIcon className="w-3.5 h-3.5 text-yellow-300" />
            <span>Ilustrasi Sains Pos {story.chapterNumber}</span>
          </div>
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-xs text-yellow-200 text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-sm">
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Ketuk untuk Perbesar</span>
          </div>
        </div>

        {/* Image Caption & Key Visual Highlights */}
        <div className="p-3 sm:p-4 bg-gradient-to-b from-amber-50/90 to-white space-y-2.5">
          {story.imageCaption && (
            <p className="text-xs sm:text-sm font-bold text-amber-950 leading-snug">
              🖼️ {story.imageCaption}
            </p>
          )}

          {story.visualHighlights && story.visualHighlights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {story.visualHighlights.map((item, idx) => (
                <div
                  key={idx}
                  className="text-[11px] sm:text-xs bg-amber-100/60 border border-amber-200/80 rounded-xl px-2.5 py-1.5 text-slate-800 font-semibold leading-snug"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Zoom Modal for Smartphone */}
      {isImageZoomed && (
        <div
          onClick={() => setIsImageZoomed(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        >
          <div className="max-w-4xl w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-yellow-300">
                Ilustrasi Materi — {story.title}
              </span>
              <button
                type="button"
                onClick={() => setIsImageZoomed(false)}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" /> Tutup
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-2xl bg-black">
              <img
                src={chapterImage}
                alt={story.imageCaption || story.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-[75dvh] object-contain mx-auto"
              />
            </div>

            {story.imageCaption && (
              <p className="text-xs sm:text-sm text-amber-100 text-center font-medium bg-white/10 p-3 rounded-xl">
                {story.imageCaption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Target Paragraph Guidance notification if any */}
      {highlightParagraph && (
        <div className="mt-3 bg-amber-100 border border-amber-400 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Petunjuk Soal: Perhatikan informasi pada <strong>Paragraf {highlightParagraph}</strong> di bawah ini!
          </span>
        </div>
      )}

      {/* Paragraphs of Story */}
      <div className={`mt-3.5 sm:mt-4 space-y-3 sm:space-y-4 font-normal text-slate-800 ${getFontSizeClass()}`}>
        {story.paragraphs.map((pText, idx) => {
          const paragraphNum = idx + 1;
          const isTarget = highlightParagraph === paragraphNum;

          return (
            <div
              key={idx}
              className={`relative rounded-2xl p-3 sm:p-4 transition-all duration-300 ${
                isTarget
                  ? 'bg-amber-200/90 border-2 border-amber-500 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-white/80 hover:bg-white border border-amber-200/80'
              }`}
            >
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span
                  className={`text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    isTarget
                      ? 'bg-amber-700 text-white'
                      : 'bg-amber-200/80 text-amber-900'
                  }`}
                >
                  <Bookmark className="w-3 h-3" />
                  Paragraf {paragraphNum}
                </span>
                {isTarget && (
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider bg-amber-300/80 px-2 py-0.5 rounded-full">
                    ⭐ Bagian Kunci Soal
                  </span>
                )}
              </div>
              <p className="text-left sm:text-justify sm:indent-6 tracking-normal leading-relaxed">{pText}</p>
            </div>
          );
        })}
      </div>

      {/* Detective Summary Clue Card */}
      {story.summaryClue && (
        <div className="mt-5 bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-3.5 sm:p-4 text-white flex items-start gap-3 shadow-sm">
          <Sparkles className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-yellow-200">
              Catatan Jurnal Detektif Babak {story.chapterNumber}:
            </div>
            <p className="text-xs sm:text-sm font-semibold mt-0.5 text-amber-100">
              &ldquo;{story.summaryClue}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Interactive Glossary (Kamus Kata Sulit) */}
      {story.glossary && story.glossary.length > 0 && (
        <div className="mt-4 pt-3 border-t border-amber-200">
          <button
            type="button"
            onClick={() => setShowGlossary(!showGlossary)}
            className="w-full text-left flex items-center justify-between text-xs font-bold text-amber-900 hover:text-amber-950 p-2 rounded-xl bg-amber-100/70 hover:bg-amber-200/80 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              Kamus Kata Sulit & Glosarium Babak {story.chapterNumber} ({story.glossary.length} kata)
            </span>
            <span className="text-[11px] underline">
              {showGlossary ? 'Tutup Glosarium ▲' : 'Buka Glosarium ▼'}
            </span>
          </button>

          {showGlossary && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {story.glossary.map((item, gIdx) => (
                <div key={gIdx} className="bg-white/90 p-2.5 rounded-xl border border-amber-200">
                  <div className="font-black text-amber-950 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {item.word}
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{item.meaning}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
