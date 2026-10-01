import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ClientQuestion, StoryChapter } from '../types/game';
import { StoryReader } from './StoryReader';
import { sounds } from '../utils/audio';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Send,
  AlertTriangle,
  BookOpen,
  Lock,
  NotebookPen,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  stationCode: string;
  stationName?: string;
  questionIndex: number;
  totalQuestions: number;
  question: ClientQuestion;
  storyChapter?: StoryChapter;
  maxAttempts: number;
  attemptsUsedSoFar: number;
  isPosFailed?: boolean;
  onSubmitAnswer: (answer: string) => Promise<{
    isCorrect: boolean;
    pointsAwarded: number;
    attemptsUsed: number;
    attemptsLeft?: number;
    canRetry?: boolean;
    message?: string;
    explanation?: string;
    posCompleted?: boolean;
    posFailed?: boolean;
    failedPosCode?: string;
    failedPosName?: string;
    failedReason?: string;
    allCompleted?: boolean;
    nextStation?: any;
    summary?: any;
    treasureCode?: string;
    teacherMessage?: string;
  }>;
  onNextQuestion: () => void;
  onProceedToNextStation: (result: any) => void;
  onOpenAdmin: () => void;
}

export const QuestionView: React.FC<Props> = ({
  stationCode,
  stationName,
  questionIndex,
  totalQuestions,
  question,
  storyChapter,
  maxAttempts,
  isPosFailed,
  onSubmitAnswer,
  onNextQuestion,
  onProceedToNextStation,
  onOpenAdmin,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [showConfirmLockModal, setShowConfirmLockModal] = useState<boolean>(false);

  // Key in localStorage to ensure the article can ONLY be viewed ONCE per Pos.
  // Once the student enters the question phase (or if questionIndex > 0), the article is permanently locked.
  const lockStorageKey = `sigundul_article_locked_${question.locationId}`;

  const [isArticleLocked, setIsArticleLocked] = useState<boolean>(() => {
    if (questionIndex > 0) return true;
    return localStorage.getItem(`sigundul_article_locked_${question.locationId}`) === 'true';
  });

  // Sync lock state whenever station changes
  useEffect(() => {
    setShowConfirmLockModal(false);
    setSelectedOption('');
    setTypedAnswer('');
    setFeedback(null);
    setValidationWarning(null);

    if (questionIndex > 0) {
      localStorage.setItem(lockStorageKey, 'true');
      setIsArticleLocked(true);
    } else {
      const alreadyLocked = localStorage.getItem(lockStorageKey) === 'true';
      setIsArticleLocked(alreadyLocked);
    }
  }, [question.locationId, questionIndex, lockStorageKey]);

  const handleConfirmLockArticleAndStartQuiz = () => {
    sounds.playSuccess();
    localStorage.setItem(lockStorageKey, 'true');
    setIsArticleLocked(true);
    setShowConfirmLockModal(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [feedback, setFeedback] = useState<{
    status: 'correct' | 'wrong';
    title: string;
    message: string;
    explanation?: string;
    canRetry?: boolean;
    attemptsLeft?: number;
    points?: number;
    posCompleted?: boolean;
    posFailed?: boolean;
    allCompleted?: boolean;
    rawResult?: any;
  } | null>(null);

  const hasOptions = Array.isArray(question.options) && question.options.length > 0;
  const effectiveAnswer = hasOptions ? selectedOption : typedAnswer;
  const hasAnswer = effectiveAnswer.trim().length > 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!hasAnswer) {
      sounds.playWrong();
      setValidationWarning(
        hasOptions
          ? '⚠️ Silakan pilih salah satu opsi jawaban terlebih dahulu!'
          : '⚠️ Silakan ketik jawabanmu pada kolom input terlebih dahulu!'
      );
      return;
    }

    setValidationWarning(null);
    sounds.playClick();
    setIsSubmitting(true);

    try {
      const res = await onSubmitAnswer(effectiveAnswer);

      if (res.isCorrect) {
        sounds.playSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });

        setFeedback({
          status: 'correct',
          title: '🎉 HEBAT! JAWABAN TEPAT!',
          message:
            res.attemptsUsed === 1
              ? `Luar biasa! Kamu menjawab benar pada percobaan pertama (+${res.pointsAwarded} Poin)!`
              : `Bagus! Kamu berhasil menjawab benar (+${res.pointsAwarded} Poin)!`,
          explanation: res.explanation,
          points: res.pointsAwarded,
          posCompleted: res.posCompleted,
          allCompleted: res.allCompleted,
          rawResult: res,
        });
      } else {
        sounds.playWrong();
        const attemptsLeft = Math.max(0, maxAttempts - res.attemptsUsed);
        const canRetry = attemptsLeft > 0 && !res.posFailed;

        setFeedback({
          status: 'wrong',
          title: canRetry ? '🤔 JAWABAN BELUM TEPAT' : `🚨 KELOMPOK GAGAL DI ${stationCode}!`,
          message: canRetry
            ? `Coba periksa kembali catatan di buku tulismu! Sisa kesempatan: ${attemptsLeft} kali lagi.`
            : `Kesempatan menjawab (${maxAttempts}x) telah habis. Kelompok dinyatakan GAGAL pada ${stationCode}${stationName ? ` (${stationName})` : ''}. Untuk mereset dan mengulang aplikasi, hanya bisa dilakukan oleh Guru pada Panel Guru.`,
          explanation: !canRetry ? res.explanation : undefined,
          canRetry,
          attemptsLeft,
          posCompleted: res.posCompleted,
          posFailed: !canRetry || res.posFailed,
          allCompleted: res.allCompleted,
          rawResult: res,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan pengiriman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    sounds.playClick();
    setSelectedOption('');
    setTypedAnswer('');
    setFeedback(null);
    setValidationWarning(null);
  };

  const handleNext = () => {
    sounds.playClick();
    setSelectedOption('');
    setTypedAnswer('');
    setFeedback(null);
    setValidationWarning(null);

    if (feedback?.posCompleted) {
      onProceedToNextStation(feedback.rawResult);
    } else {
      onNextQuestion();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const getCategoryBadge = () => {
    switch (question.literacyCategory) {
      case 'menemukan_informasi':
        return { label: '🔍 Informasi Penting Artikel', color: 'bg-blue-100 text-blue-900 border-blue-200' };
      case 'ide_pokok':
        return { label: '💡 Konsep Utama Tumbuhan', color: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'makna_kosakata':
        return { label: '📖 Istilah Sains Tumbuhan', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
      case 'evaluasi_amanat':
        return { label: '🌿 Analisis & Penerapan', color: 'bg-purple-100 text-purple-900 border-purple-200' };
      default:
        return { label: '📝 Pemahaman Materi', color: 'bg-amber-100 text-amber-900 border-amber-200' };
    }
  };

  const catBadge = getCategoryBadge();

  // ============================================================================
  // JIKA KELOMPOK SUDAH GAGAL DALAM POS INI -> TERKUNCI (HANYA GURU BISA RESET)
  // ============================================================================
  if (isPosFailed && !feedback) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border-4 border-rose-500 p-5 sm:p-7 shadow-2xl text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider border border-rose-300">
            🚨 KELOMPOK GAGAL DI {stationCode}
          </span>
          <h3 className="text-xl sm:text-2xl font-black font-display text-rose-950">
            Aplikasi Terkunci Sementara
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
            Kelompokmu kehabisan kesempatan menjawab soal pada <strong>{stationCode}{stationName ? ` (${stationName})` : ''}</strong>. Siswa <strong>tidak dapat mengulang atau mereset aplikasi sendiri</strong>.
          </p>
        </div>

        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 font-semibold leading-relaxed">
          👨‍🏫 Silakan menghadap <strong>Bapak/Ibu Guru</strong>. Reset aplikasi hanya bisa dilakukan oleh Guru pada <strong>Panel Guru</strong> dengan memasukkan kode khusus guru.
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onOpenAdmin();
          }}
          className="w-full py-4 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 uppercase tracking-wide font-display cursor-pointer"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Buka Panel Guru (Reset oleh Guru)</span>
        </button>
      </div>
    );
  }

  // ============================================================================
  // TAHAP 1: BACA ARTIKEL MATERI (HANYA TAMPIL SEKALI) & CATAT DI BUKU MANUAL
  // ============================================================================
  if (!isArticleLocked && storyChapter) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-200">
        {/* Top Warning & Instruction Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg border-3 border-yellow-300">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-yellow-400 text-amber-950 flex items-center justify-center text-xl shrink-0 shadow-sm">
              <NotebookPen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
                ⚠️ ARTIKEL HANYA BISA DILIHAT 1 KALI
              </div>
              <h3 className="text-base sm:text-xl font-black font-display leading-snug text-yellow-100">
                Bacalah Artikel & Catat di Buku Catatanmu!
              </h3>
              <p className="text-xs sm:text-sm text-amber-50 font-medium leading-relaxed">
                Siapkan <strong>buku tulis dan pulpenmu</strong>. Catatlah hal-hal penting dari artikel di bawah ini. Jika kamu sudah menekan tombol <strong>&ldquo;Mulai Menjawab Soal&rdquo;</strong>, artikel bacaan ini <strong>akan ditutup dan tidak dapat dibuka kembali</strong>!
              </p>
            </div>
          </div>
        </div>

        {/* Full Article Reader (Without any paragraph highlight spoilers) */}
        <StoryReader story={storyChapter} />

        {/* Bottom Reminder & Action Card to Lock Article and Enter Questions */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border-3 border-amber-400 p-4 sm:p-6 shadow-xl space-y-3.5 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold border border-amber-300">
            <NotebookPen className="w-4 h-4 text-amber-700" />
            <span>Sudah selesai mencatat di buku tulismu?</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto font-medium leading-relaxed">
            Pastikan semua poin penting (pengertian, ciri-ciri, dan contoh tumbuhan) sudah kamu tulis di <strong>buku catatan manualmu</strong> sebelum lanjut menjawab soal.
          </p>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setShowConfirmLockModal(true);
            }}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-98 flex items-center justify-center gap-2.5 uppercase tracking-wide font-display border-2 border-emerald-200 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
            <span>SIAP MENJAWAB SOAL {stationCode} ➔</span>
          </button>
        </div>

        {/* Confirmation Modal before permanently locking the article */}
        {showConfirmLockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 text-center border-4 border-amber-400 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg sm:text-xl font-black font-display text-amber-950">
                  Kunci Artikel & Mulai Jawab Soal?
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Setelah kamu masuk ke halaman soal, <strong>artikel bacaan {stationCode} akan dikunci dan tidak bisa dilihat lagi</strong>. Pastikan catatan di buku tulismu sudah lengkap ya!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowConfirmLockModal(false);
                  }}
                  className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  Baca & Catat Lagi
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLockArticleAndStartQuiz}
                  className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md cursor-pointer"
                >
                  Ya, Mulai Soal!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // TAHAP 2: MENJAWAB SOAL (ARTIKEL SUDAH TERKUNCI & TIDAK DAPAT DIAKSES LAGI)
  // ============================================================================
  return (
    <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-200">
      {/* Sticky Top Bar Navigation & Station Title for Smartphone */}
      <div className="sticky top-[53px] sm:static z-20 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-amber-300 p-3 sm:p-4 shadow-md flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0">
            {questionIndex + 1}/{totalQuestions}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-black uppercase text-amber-800 tracking-wider leading-tight truncate">
              {stationCode} {stationName ? `• ${stationName}` : ''}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
              Soal Materi {questionIndex + 1} dari {totalQuestions}
            </div>
          </div>
        </div>

        {/* Locked Article Status Indicator */}
        <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 shrink-0">
          <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Artikel Terkunci</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-amber-300 p-4 sm:p-6 shadow-md space-y-4 sm:space-y-5">
        {/* Category & Manual Notebook Reminder */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full border ${catBadge.color}`}>
            {catBadge.label}
          </span>

          <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Lihat Buku Catatanmu</span>
          </span>
        </div>

        {/* Question Text */}
        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
            {question.question}
          </h4>
          <p className="text-xs text-slate-500">
            {hasOptions
              ? 'Pilihlah satu jawaban yang paling tepat berdasarkan catatan di buku tulismu.'
              : 'Ketikkan jawaban singkatmu pada kotak yang tersedia.'}
          </p>
        </div>

        {/* Options or Text Input */}
        {hasOptions ? (
          <div className="space-y-2.5">
            {question.options!.map((opt, oIdx) => {
              const letters = ['A', 'B', 'C', 'D'];
              const letter = letters[oIdx] || `${oIdx + 1}`;
              const isSelected = selectedOption === opt;
              const isDisabled = feedback !== null;

              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedOption(opt);
                    setValidationWarning(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-100 border-amber-600 shadow-md ring-2 ring-amber-400/40 text-amber-950 font-bold'
                      : 'bg-white hover:bg-amber-50 border-amber-200 text-slate-700'
                  } ${isDisabled ? 'opacity-80 cursor-default' : ''}`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isSelected
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm mt-0.5 leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <label htmlFor="student-answer-input" className="block text-xs font-bold text-amber-900 mb-1">
              Jawaban Singkat:
            </label>
            <input
              id="student-answer-input"
              type="text"
              disabled={feedback !== null}
              value={typedAnswer}
              onChange={(e) => {
                setTypedAnswer(e.target.value);
                setValidationWarning(null);
              }}
              placeholder="Ketik jawabanmu di sini..."
              className="w-full p-3.5 rounded-2xl border-2 border-amber-200 focus:border-amber-600 focus:ring-4 focus:ring-amber-200 text-sm font-semibold text-slate-800 outline-hidden"
            />
          </div>
        )}

        {/* Validation Warning */}
        {validationWarning && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{validationWarning}</span>
          </div>
        )}

        {/* Submit Button (if feedback not yet given) */}
        {!feedback && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit()}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-black text-sm sm:text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Memeriksa...' : 'Kirim Jawaban'}
          </button>
        )}

        {/* Feedback Alert Panel */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border-2 space-y-3 animate-in fade-in duration-200 ${
              feedback.status === 'correct'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {feedback.status === 'correct' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-sm font-black">{feedback.title}</div>
                <p className="text-xs mt-0.5 leading-relaxed">{feedback.message}</p>
              </div>
            </div>

            {/* Explanation box */}
            {feedback.explanation && (
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs">
                <span className="font-bold text-amber-900">Pembahasan Materi: </span>
                <span className="text-slate-700">{feedback.explanation}</span>
              </div>
            )}

            {/* Action inside feedback */}
            <div className="pt-2 flex items-center gap-2">
              {feedback.status === 'wrong' && feedback.canRetry ? (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi ({feedback.attemptsLeft} Sisa Kesempatan)
                </button>
              ) : feedback.posFailed ? (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenAdmin();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Terkunci! Buka Panel Guru untuk Reset Aplikasi</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>
                    {feedback.posCompleted
                      ? feedback.allCompleted
                        ? '🏆 Selesaikan Misi & Buka Peti Ilmu!'
                        : 'Lanjut ke Pos Berikutnya ➔'
                      : 'Soal Selanjutnya ➔'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
