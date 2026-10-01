import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  MapPin,
  QrCode,
  BookOpen,
  Printer,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Save,
  RotateCcw,
  Lock,
  Eye,
  Key,
  Star,
  MessageSquare,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  LocationConfig,
  GameSettings,
  Question,
  LiteracyQuestionType,
  DifficultyLevel,
  LeaderboardEntry,
  GameSession,
} from '../types/game';
import { generateQrDataUrl, downloadQrImage, printQrCards } from '../utils/qr';
import { gameService } from '../services/gameService';
import { sounds } from '../utils/audio';

interface Props {
  onBack: () => void;
  activeSession?: GameSession | null;
  onResetSessionByTeacher: (code: string) => Promise<{ success: boolean; message: string }>;
}

export const AdminDashboard: React.FC<Props> = ({
  onBack,
  activeSession,
  onResetSessionByTeacher,
}) => {
  // Simple PIN guard for teacher
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Teacher Reset Application state (code: "ulangi")
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [resetFeedback, setResetFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'stories' | 'retellings' | 'questions' | 'qr' | 'settings'>('stories');

  // State
  const [locations, setLocations] = useState<LocationConfig[]>([]);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  // Story chapter editing
  const [editingStoryPosId, setEditingStoryPosId] = useState<string | null>(null);

  // Question editing / creation modal state
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Teacher grading state for retellings
  const [gradingState, setGradingState] = useState<Record<string, { rating: number; feedback: string }>>({});

  // Load initial data
  useEffect(() => {
    const load = async () => {
      const locs = await gameService.getLocations();
      const sets = await gameService.getSettings();
      const qs = await gameService.getQuestions();
      const lb = await gameService.getLeaderboard();

      setLocations(locs);
      setSettings(sets);
      setQuestions(qs);
      setLeaderboard(lb);

      // Pre-fill grading state
      const initialGrading: Record<string, { rating: number; feedback: string }> = {};
      lb.forEach(item => {
        initialGrading[item.id] = {
          rating: item.storyRetelling?.teacherRating || 5,
          feedback: item.storyRetelling?.teacherFeedback || '',
        };
      });
      setGradingState(initialGrading);

      // Generate QR Data URLs
      const urls: Record<string, string> = {};
      for (const loc of locs) {
        urls[loc.id] = await generateQrDataUrl(loc.qrCode, { width: 280 });
      }
      setQrImages(urls);
    };
    load();
  }, []);

  const handleTeacherResetApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCodeInput.trim()) {
      sounds.playWrong();
      setResetFeedback({
        type: 'error',
        message: 'Harap masukkan Kode Reset Guru terlebih dahulu!',
      });
      return;
    }

    setIsResetting(true);
    setResetFeedback(null);
    const res = await onResetSessionByTeacher(resetCodeInput);
    setIsResetting(false);

    if (res.success) {
      sounds.playSuccess();
      setResetCodeInput('');
      setResetFeedback({
        type: 'success',
        message: res.message,
      });
    } else {
      sounds.playWrong();
      setResetFeedback({
        type: 'error',
        message: res.message,
      });
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim().toLowerCase();
    if (cleanPin === 'ulangi') {
      const res = await onResetSessionByTeacher(cleanPin);
      if (res.success) {
        sounds.playSuccess();
        setPinInput('');
        setPinError(false);
        setResetFeedback({
          type: 'success',
          message: res.message,
        });
      }
      return;
    }

    if (cleanPin === '1234' || cleanPin === 'guru' || cleanPin === 'admin') {
      sounds.playSuccess();
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      sounds.playWrong();
      setPinError(true);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    sounds.playClick();
    setSavingStatus('Menyimpan pengaturan...');
    await gameService.updateSettings(settings);
    setSavingStatus('Pengaturan berhasil disimpan! ✅');
    setTimeout(() => setSavingStatus(null), 2500);
  };

  const handleSaveLocations = async () => {
    sounds.playClick();
    setSavingStatus('Menyimpan data babak cerita...');
    await gameService.updateLocations(locations);

    // Regenerate QR
    const urls: Record<string, string> = {};
    for (const loc of locations) {
      urls[loc.id] = await generateQrDataUrl(loc.qrCode, { width: 280 });
    }
    setQrImages(urls);

    setSavingStatus('Data babak cerita berhasil disimpan! ✅');
    setEditingStoryPosId(null);
    setTimeout(() => setSavingStatus(null), 2500);
  };

  const handleResetData = async () => {
    if (
      confirm(
        '⚠️ PERINGATAN: Apakah Anda yakin ingin mereset seluruh naskah cerita dan bank soal ke kondisi awal bawaan aplikasi?'
      )
    ) {
      sounds.playClick();
      await gameService.resetAllData();
      alert('Data cerita & soal literasi berhasil direset ke standar pabrik.');
      window.location.reload();
    }
  };

  const handleSaveGrading = async (entryId: string) => {
    const data = gradingState[entryId];
    if (!data) return;

    sounds.playClick();
    setSavingStatus('Menyimpan nilai & catatan guru...');
    await gameService.rateSubmission(entryId, data.rating, data.feedback);

    // Update local leaderboard state
    setLeaderboard(prev =>
      prev.map(item => {
        if (item.id === entryId && item.storyRetelling) {
          return {
            ...item,
            storyRetelling: {
              ...item.storyRetelling,
              teacherRating: data.rating,
              teacherFeedback: data.feedback,
            },
          };
        }
        return item;
      })
    );

    setSavingStatus('Nilai berhasil disimpan! ✅');
    setTimeout(() => setSavingStatus(null), 2500);
  };

  const handlePrintAllStudentStories = () => {
    sounds.playClick();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Harap izinkan pop-up di browser untuk mencetak portofolio tugas cerita siswa.');
      return;
    }

    const itemsWithStory = leaderboard.filter(item => item.storyRetelling);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Portofolio Tugas Akhir Literasi Siswa - SD Nusantara</title>
          <style>
            @page { size: A4; margin: 1.5cm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 10px; }
            h1 { font-size: 20px; color: #92400e; margin-bottom: 4px; border-bottom: 2px solid #f59e0b; padding-bottom: 6px; }
            .subtitle { font-size: 13px; color: #64748b; margin-bottom: 20px; }
            .submission-card { border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 14px; margin-bottom: 16px; page-break-inside: avoid; }
            .sub-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; color: #0f172a; margin-bottom: 6px; }
            .meta { font-size: 11px; color: #64748b; margin-bottom: 10px; }
            .story-box { background: #fffbeb; border: 1px solid #fef3c7; padding: 10px; border-radius: 8px; font-size: 12px; line-height: 1.6; white-space: pre-line; }
            .teacher-box { margin-top: 8px; font-size: 11px; color: #78350f; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>PORTOFOLIO TUGAS AKHIR DETEKTIF LITERASI</h1>
          <div class="subtitle">Kompilasi Ringkasan Alur Cerita Bersambung Siswa • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</div>
          ${itemsWithStory.map((item, idx) => `
            <div class="submission-card">
              <div class="sub-header">
                <span>#${idx + 1}. ${item.playerName} (${item.className})</span>
                <span>Skor: ${item.score} Poin (${item.accuracy}% Akurat)</span>
              </div>
              <div class="meta">
                ${item.members ? `Anggota: ${item.members.join(', ')} • ` : ''}
                Panjang: ${item.storyRetelling?.wordCount || 0} kata •
                Waktu Selesai: ${new Date(item.completedAt).toLocaleString('id-ID')}
              </div>
              <div class="story-box">
                "${item.storyRetelling?.studentText || ''}"
              </div>
              ${item.storyRetelling?.teacherRating ? `
                <div class="teacher-box">
                  Nilai Guru: ${'★'.repeat(item.storyRetelling.teacherRating)} • Catatan: ${item.storyRetelling.teacherFeedback || '-'}
                </div>
              ` : ''}
            </div>
          `).join('')}
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Add new question
  const handleAddNewQuestion = async (qData: Omit<Question, 'id'>) => {
    const newId = `q_custom_${Date.now()}`;
    const newQuestion: Question = {
      ...qData,
      id: newId,
    };
    const updated = [...questions, newQuestion];
    setQuestions(updated);
    await gameService.updateQuestions(updated);
    setIsAddingQuestion(false);
    sounds.playSuccess();
  };

  // Update existing question
  const handleUpdateQuestion = async (updatedQ: Question) => {
    const updated = questions.map((q) => (q.id === updatedQ.id ? updatedQ : q));
    setQuestions(updated);
    await gameService.updateQuestions(updated);
    setEditingQuestion(null);
    sounds.playSuccess();
  };

  // Delete question
  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Hapus soal literasi ini?')) {
      const updated = questions.filter((q) => q.id !== id);
      setQuestions(updated);
      await gameService.updateQuestions(updated);
      sounds.playClick();
    }
  };

  // PIN Protection & Teacher Reset Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto space-y-4 animate-in fade-in">
        {/* CARD 1: RESET APLIKASI / ULANGI SESI KELOMPOK (KHUSUS GURU) */}
        <div className="p-5 sm:p-6 bg-white rounded-3xl border-3 border-rose-400 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-inner">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                KHUSUS BAPAK / IBU GURU
              </span>
              <h2 className="text-base sm:text-lg font-black font-display text-rose-950 leading-tight mt-0.5">
                Reset Aplikasi / Ulangi Pos Kelompok
              </h2>
            </div>
          </div>

          {activeSession ? (
            <div
              className={`p-3 rounded-2xl border text-xs space-y-1 text-left ${
                activeSession.status === 'failed' || activeSession.status === 'timeout'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="font-black flex items-center justify-between gap-2">
                <span>
                  👥 {activeSession.player.playerName} ({activeSession.player.className})
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                    activeSession.status === 'failed' || activeSession.status === 'timeout'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {activeSession.status === 'failed'
                    ? `Gagal di ${activeSession.failedPosCode || `POS ${activeSession.currentPosIndex + 1}`}`
                    : activeSession.status === 'timeout'
                    ? 'Waktu Habis'
                    : `Pos ${activeSession.currentPosIndex + 1}`}
                </span>
              </div>
              <p className="text-[11px] opacity-90">
                {activeSession.failedReason ||
                  'Masukkan Kode Reset Guru di bawah ini untuk mereset aplikasi agar kelompok dapat mengulang permainan.'}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-600 text-left leading-relaxed">
              Jika ada kelompok yang gagal dalam pos, Bapak/Ibu Guru dapat memasukkan <strong>Kode Reset Guru</strong> di bawah ini untuk mereset aplikasi ke awal.
            </p>
          )}

          <form onSubmit={handleTeacherResetApp} className="space-y-3">
            <input
              type="password"
              value={resetCodeInput}
              onChange={(e) => {
                setResetCodeInput(e.target.value);
                setResetFeedback(null);
              }}
              placeholder="Masukkan Kode Reset Guru..."
              className="w-full p-3.5 text-center text-base font-black tracking-widest bg-slate-50 border-2 border-rose-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />

            {resetFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold text-left ${
                  resetFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-300'
                }`}
              >
                {resetFeedback.message}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer"
              >
                Kembali ke Beranda
              </button>
              <button
                type="submit"
                disabled={isResetting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResetting ? 'Mereset...' : 'Reset Aplikasi'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2: PORTAL PENGELOLAAN MATERI, SOAL & QR (PIN GURU) */}
        <div className="p-5 sm:p-6 bg-white rounded-3xl border-3 border-amber-300 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black font-display text-amber-950">
              PANEL PENGELOLAAN GURU
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan PIN Guru untuk mengelola materi 5 pos, bank soal, dan mencetak kartu QR Code.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              maxLength={15}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="Masukkan PIN Guru..."
              className="w-full p-3 text-center text-base font-black tracking-widest bg-slate-50 border-2 border-amber-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />

            {pinError && (
              <p className="text-xs font-bold text-rose-600">
                PIN salah! Hanya Bapak/Ibu Guru yang dapat membuka panel ini.
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer"
            >
              Buka Pengelolaan Materi & Soal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="text-xs font-bold text-slate-600 hover:text-amber-800 flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-amber-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Keluar dari Admin
        </button>

        <div className="flex items-center gap-2">
          {savingStatus && (
            <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
              {savingStatus}
            </span>
          )}
          <span className="text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
            👑 Mode Guru Aktif
          </span>
        </div>
      </div>

      {/* Quick Teacher Reset Card inside Authenticated Admin Dashboard */}
      <div className="bg-rose-50/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-rose-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-700 shrink-0" />
            <h3 className="text-sm sm:text-base font-black text-rose-950">
              Reset Aplikasi / Sesi Kelompok Siswa
            </h3>
          </div>
          <p className="text-xs text-rose-900">
            {activeSession
              ? `Sesi saat ini: ${activeSession.player.playerName} (${activeSession.player.className}) — Status: ${
                  activeSession.status === 'failed'
                    ? `GAGAL di ${activeSession.failedPosCode || 'Pos'}`
                    : activeSession.status.toUpperCase()
                }. Masukkan kode "ulangi" untuk mereset.`
              : 'Tidak ada sesi kelompok yang terkunci saat ini, atau masukkan kode "ulangi" untuk memastikan aplikasi di-reset bersih.'}
          </p>
          {resetFeedback && (
            <p
              className={`text-xs font-extrabold ${
                resetFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {resetFeedback.message}
            </p>
          )}
        </div>

        <form onSubmit={handleTeacherResetApp} className="flex items-center gap-2 shrink-0">
          <input
            type="password"
            value={resetCodeInput}
            onChange={(e) => {
              setResetCodeInput(e.target.value);
              setResetFeedback(null);
            }}
            placeholder="Ketik kode reset..."
            className="w-40 sm:w-44 px-3 py-2 text-xs font-bold bg-white border-2 border-rose-300 rounded-xl focus:outline-hidden focus:border-rose-600"
          />
          <button
            type="submit"
            disabled={isResetting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
          >
            Reset Aplikasi
          </button>
        </form>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border-3 border-amber-300 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-amber-950">
            ⚙️ Panel Pengelolaan Detektif Literasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola naskah cerita bersambung 5 babak (4–10 paragraf), nilai tugas akhir siswa, bank soal literasi, dan cetak QR Code.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-amber-100 pb-3">
          {[
            { id: 'stories', label: '1. Babak Cerita (Pos 1-5)', icon: BookOpen },
            { id: 'retellings', label: `2. Tugas Akhir Siswa (${leaderboard.filter(e => e.storyRetelling).length})`, icon: FileText },
            { id: 'questions', label: `3. Bank Soal Literasi (${questions.length})`, icon: HelpCircle },
            { id: 'qr', label: '4. Cetak QR Code', icon: QrCode },
            { id: 'settings', label: '5. Pengaturan Game', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* TAB 1: KELOLA BABAK CERITA BERSAMBUNG (4-10 PARAGRAF) */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'stories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-amber-950">
                  Naskah Cerita Bersambung (Babak 1 s/d Babak 5)
                </h3>
                <p className="text-xs text-slate-500">
                  Guru dapat mengedit judul babak, lokasi sekolah, petunjuk teka-teki, dan teks bacaan (4–10 paragraf).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveLocations}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Save className="w-4 h-4" /> Simpan Semua Babak
              </button>
            </div>

            <div className="space-y-4">
              {locations.map((loc, idx) => {
                const isEditing = editingStoryPosId === loc.id;
                const chapterNum = loc.story?.chapterNumber || idx + 1;

                return (
                  <div
                    key={loc.id}
                    className={`rounded-2xl border-2 transition-all p-4 sm:p-5 ${
                      isEditing
                        ? 'bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-300'
                        : 'bg-white border-amber-200 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-2xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {chapterNum}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-amber-800">
                              {loc.code} • {loc.name}
                            </span>
                            {loc.isFinal && (
                              <span className="text-[10px] font-bold bg-yellow-300 text-amber-900 px-2 py-0.5 rounded-full">
                                Babak Final
                              </span>
                            )}
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-amber-950">
                            {loc.story?.title}
                          </h4>
                          <div className="text-xs text-slate-500 font-medium">
                            {loc.story?.paragraphs?.length || 0} Paragraf &bull; QR Code:{' '}
                            <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">
                              {loc.qrCode}
                            </code>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setEditingStoryPosId(isEditing ? null : loc.id);
                        }}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        {isEditing ? 'Tutup Editor' : 'Edit Babak & Paragraf'}
                      </button>
                    </div>

                    {/* Edit Form for this Chapter */}
                    {isEditing && (
                      <div className="mt-5 pt-4 border-t border-amber-200 space-y-4 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-amber-900 mb-1">
                              Judul Babak:
                            </label>
                            <input
                              type="text"
                              value={loc.story.title}
                              onChange={(e) => {
                                const newLocs = [...locations];
                                newLocs[idx].story.title = e.target.value;
                                setLocations(newLocs);
                              }}
                              className="w-full p-2.5 rounded-xl border border-amber-300 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-amber-900 mb-1">
                              Nama Lokasi Sekolah:
                            </label>
                            <input
                              type="text"
                              value={loc.name}
                              onChange={(e) => {
                                const newLocs = [...locations];
                                newLocs[idx].name = e.target.value;
                                setLocations(newLocs);
                              }}
                              className="w-full p-2.5 rounded-xl border border-amber-300 bg-white"
                            />
                          </div>
                        </div>

                        <div className="text-xs">
                          <label className="block font-bold text-amber-900 mb-1">
                            Petunjuk Lokasi (Teka-Teki yang dibaca siswa):
                          </label>
                          <textarea
                            rows={2}
                            value={loc.hint}
                            onChange={(e) => {
                              const newLocs = [...locations];
                              newLocs[idx].hint = e.target.value;
                              setLocations(newLocs);
                            }}
                            className="w-full p-2.5 rounded-xl border border-amber-300 bg-white leading-relaxed"
                          />
                        </div>

                        {/* Paragraf Cerita (4 to 10 Paragraf) */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block font-black text-amber-950 text-xs sm:text-sm">
                              Teks Cerita ({loc.story.paragraphs.length} Paragraf):
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const newLocs = [...locations];
                                newLocs[idx].story.paragraphs.push('Tuliskan paragraf cerita baru di sini...');
                                setLocations(newLocs);
                              }}
                              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 bg-amber-200/70 px-2 py-1 rounded-lg cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Tambah Paragraf
                            </button>
                          </div>

                          {loc.story.paragraphs.map((p, pIdx) => (
                            <div key={pIdx} className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                                <span>Paragraf {pIdx + 1}</span>
                                {loc.story.paragraphs.length > 3 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newLocs = [...locations];
                                      newLocs[idx].story.paragraphs.splice(pIdx, 1);
                                      setLocations(newLocs);
                                    }}
                                    className="text-rose-600 hover:text-rose-800 text-[11px] flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" /> Hapus
                                  </button>
                                )}
                              </div>
                              <textarea
                                rows={3}
                                value={p}
                                onChange={(e) => {
                                  const newLocs = [...locations];
                                  newLocs[idx].story.paragraphs[pIdx] = e.target.value;
                                  setLocations(newLocs);
                                }}
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed outline-hidden focus:border-amber-500"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Catatan Jurnal Detektif */}
                        <div className="text-xs">
                          <label className="block font-bold text-amber-900 mb-1">
                            Catatan Ringkasan Jurnal (Didapatkan setelah pos selesai):
                          </label>
                          <input
                            type="text"
                            value={loc.story.summaryClue}
                            onChange={(e) => {
                              const newLocs = [...locations];
                              newLocs[idx].story.summaryClue = e.target.value;
                              setLocations(newLocs);
                            }}
                            className="w-full p-2.5 rounded-xl border border-amber-300 bg-white"
                          />
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={handleSaveLocations}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Save className="w-4 h-4" /> Simpan Perubahan Babak Ini
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 2: REVIEW TUGAS AKHIR CERITA SISWA & PENILAIAN GURU */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'retellings' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-amber-950">
                  Karya Ringkasan Alur Cerita Siswa (Tugas Akhir)
                </h3>
                <p className="text-xs text-slate-500">
                  Guru dapat membaca karya siswa, memberikan penilaian bintang 1–5, menuliskan catatan apresiasi, dan mencetak portofolio.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePrintAllStudentStories}
                className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Printer className="w-4 h-4" /> Cetak Semua Portofolio
              </button>
            </div>

            {leaderboard.filter(e => e.storyRetelling).length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-amber-50/50 rounded-2xl border border-amber-200">
                <FileText className="w-10 h-10 mx-auto text-amber-300 mb-2" />
                <p className="text-sm font-semibold">Belum ada siswa yang mengumpulkan tugas akhir menceritakan kembali.</p>
                <p className="text-xs mt-1">Karya cerita siswa akan otomatis muncul di sini setelah mereka menuntaskan Babak 5.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard
                  .filter(item => item.storyRetelling)
                  .map((item) => {
                    const grade = gradingState[item.id] || { rating: 5, feedback: '' };

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-xs space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-amber-950 text-base">
                                {item.playerName}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                                {item.className}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {item.members && item.members.length > 0 ? `Anggota: ${item.members.join(', ')} • ` : ''}
                              Waktu: {new Date(item.completedAt).toLocaleString('id-ID')} • Skor: {item.score}
                            </div>
                          </div>

                          <div className="text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-xl border border-amber-200 self-start sm:self-auto">
                            Panjang: {item.storyRetelling?.wordCount || 0} Kata
                          </div>
                        </div>

                        {/* Student Story Text */}
                        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                          <div className="text-xs font-black text-amber-900 uppercase mb-1.5 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            Ringkasan Alur Cerita Karya Siswa:
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-lg border border-amber-100">
                            &ldquo;{item.storyRetelling?.studentText}&rdquo;
                          </p>
                        </div>

                        {/* Teacher Grading & Feedback Form */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700">Penilaian Bintang Guru:</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => {
                                      sounds.playClick();
                                      setGradingState({
                                        ...gradingState,
                                        [item.id]: { ...grade, rating: star },
                                      });
                                    }}
                                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                  >
                                    <Star
                                      className={`w-5 h-5 ${
                                        star <= grade.rating
                                          ? 'text-amber-500 fill-amber-500'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveGrading(item.id)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Save className="w-3.5 h-3.5" /> Simpan Nilai & Komentar
                            </button>
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Tuliskan catatan apresiasi guru untuk siswa ini (misal: 'Alur runtut dan pesan moral tersampaikan sangat baik!')..."
                              value={grade.feedback}
                              onChange={(e) => {
                                setGradingState({
                                  ...gradingState,
                                  [item.id]: { ...grade, feedback: e.target.value },
                                });
                              }}
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:border-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 3: BANK SOAL LITERASI */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Location Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Filter Babak:</span>
                <select
                  value={selectedLocationFilter}
                  onChange={(e) => setSelectedLocationFilter(e.target.value)}
                  className="p-2 text-xs font-bold bg-slate-50 border border-amber-300 rounded-xl outline-hidden"
                >
                  <option value="all">Semua Babak ({questions.length} Soal)</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.code} - {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsAddingQuestion(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Tambah Soal Literasi
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {questions
                .filter((q) =>
                  selectedLocationFilter === 'all' ? true : q.locationId === selectedLocationFilter
                )
                .map((q, idx) => {
                  const loc = locations.find((l) => l.id === q.locationId);

                  return (
                    <div
                      key={q.id}
                      className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                            {loc?.code || q.locationId}
                          </span>
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                            {q.literacyCategory || q.type}
                          </span>
                          {q.targetParagraph && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md">
                              Rujukan: Paragraf {q.targetParagraph}
                            </span>
                          )}
                        </div>

                        <div className="font-extrabold text-sm text-slate-800">
                          {idx + 1}. {q.question}
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`p-1.5 rounded-lg text-[11px] ${
                                  opt === q.correctAnswer
                                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                                    : 'bg-slate-50 text-slate-600'
                                }`}
                              >
                                {opt === q.correctAnswer ? '✓ ' : '• '} {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-slate-500 pt-1">
                          <strong>Kunci Jawaban:</strong>{' '}
                          <span className="text-emerald-700 font-bold">{q.correctAnswer}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setEditingQuestion(q);
                          }}
                          className="p-2 text-slate-500 hover:text-amber-800 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                          title="Edit Soal"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 4: CETAK QR CODE */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-amber-950">
                  Cetak Kartu QR Code Babak Cerita
                </h3>
                <p className="text-xs text-slate-500">
                  Cetak kartu QR ini pada kertas A4, lalu tempelkan di lokasi sekolah sesuai nama pos.
                </p>
              </div>

              <button
                type="button"
                onClick={() => printQrCards(locations, qrImages)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer self-start sm:self-auto"
              >
                <Printer className="w-4 h-4" /> Cetak Semua Kartu QR (Print A4)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((loc) => {
                const qrUrl = qrImages[loc.id];

                return (
                  <div
                    key={loc.id}
                    className="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl p-4 text-center space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black bg-amber-600 text-white px-2.5 py-0.5 rounded-full uppercase">
                        {loc.code}
                      </span>
                      {loc.isFinal && (
                        <span className="text-[10px] font-bold text-amber-800 bg-yellow-300 px-2 py-0.5 rounded-full">
                          ⭐ FINAL
                        </span>
                      )}
                    </div>

                    <div className="font-extrabold text-sm text-amber-950">
                      {loc.name}
                    </div>

                    <div className="w-40 h-40 mx-auto bg-white p-2 rounded-xl shadow-xs border border-amber-200 flex items-center justify-center">
                      {qrUrl ? (
                        <img src={qrUrl} alt={loc.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="animate-spin text-2xl">⏳</div>
                      )}
                    </div>

                    <div className="text-[11px] font-mono font-bold text-slate-600">
                      {loc.qrCode}
                    </div>

                    <button
                      type="button"
                      disabled={!qrUrl}
                      onClick={() => downloadQrImage(qrUrl, `QR_${loc.code.replace(/\s+/g, '_')}.png`)}
                      className="w-full py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh Gambar QR
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 5: PENGATURAN GAME & RESET */}
        {/* ----------------------------------------------------------- */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-amber-900 mb-1">
                  Durasi Petualangan (Menit):
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={settings.durationMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, durationMinutes: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-amber-300 rounded-xl"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Isi 0 untuk waktu bebas tanpa batasan.</p>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">
                  Maksimal Percobaan Jawaban Per Soal:
                </label>
                <select
                  value={settings.maxAttempts}
                  onChange={(e) =>
                    setSettings({ ...settings, maxAttempts: parseInt(e.target.value, 10) || 3 })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-amber-300 rounded-xl"
                >
                  <option value={2}>2 Kali Percobaan</option>
                  <option value={3}>3 Kali Percobaan (Standar)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">
                  Poin Percobaan Pertama:
                </label>
                <input
                  type="number"
                  value={settings.pointsFirstAttempt}
                  onChange={(e) =>
                    setSettings({ ...settings, pointsFirstAttempt: parseInt(e.target.value, 10) || 100 })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-amber-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">
                  Kode Rahasia Harta Karun / Pusaka:
                </label>
                <input
                  type="text"
                  value={settings.treasureCode}
                  onChange={(e) => setSettings({ ...settings, treasureCode: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-amber-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-amber-900 mb-1">
                Pesan Guru di Akhir Permainan:
              </label>
              <textarea
                rows={2}
                value={settings.teacherMessage}
                onChange={(e) => setSettings({ ...settings, teacherMessage: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-amber-300 rounded-xl"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-amber-100">
              <button
                type="button"
                onClick={handleResetData}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Naskah & Soal ke Awal
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Simpan Pengaturan
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal: Edit Question */}
      {(editingQuestion || isAddingQuestion) && (
        <QuestionEditorModal
          isOpen={true}
          question={editingQuestion}
          locations={locations}
          onClose={() => {
            setEditingQuestion(null);
            setIsAddingQuestion(false);
          }}
          onSave={(q) => {
            if (editingQuestion) {
              handleUpdateQuestion({ ...q, id: editingQuestion.id });
            } else {
              handleAddNewQuestion(q);
            }
          }}
        />
      )}
    </div>
  );
};

// Modal Helper for Editing / Adding Literacy Question
const QuestionEditorModal: React.FC<{
  isOpen: boolean;
  question: Question | null;
  locations: LocationConfig[];
  onClose: () => void;
  onSave: (q: Omit<Question, 'id'>) => void;
}> = ({ isOpen, question, locations, onClose, onSave }) => {
  if (!isOpen) return null;

  const [locationId, setLocationId] = useState(question?.locationId || locations[0]?.id || 'pos_1');
  const [questionText, setQuestionText] = useState(question?.question || '');
  const [literacyCategory, setLiteracyCategory] = useState<LiteracyQuestionType>(
    question?.literacyCategory || 'menemukan_informasi'
  );
  const [targetParagraph, setTargetParagraph] = useState<number | undefined>(
    question?.targetParagraph || 1
  );
  const [options, setOptions] = useState<string[]>(
    question?.options || ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D']
  );
  const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer || options[0]);
  const [explanation, setExplanation] = useState(question?.explanation || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert('Teks pertanyaan tidak boleh kosong!');
      return;
    }

    onSave({
      locationId,
      question: questionText.trim(),
      type: 'pilihan_ganda',
      literacyCategory,
      difficulty: 'sedang',
      targetParagraph,
      options,
      correctAnswer,
      explanation: explanation.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-amber-300 max-h-[90vh] overflow-y-auto space-y-4">
        <h3 className="text-lg font-black text-amber-950">
          {question ? 'Edit Soal Literasi' : 'Tambah Soal Literasi Baru'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-amber-900 mb-1">Pilih Babak Cerita:</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-amber-300 rounded-xl"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} - {loc.story.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-amber-900 mb-1">Kategori Soal:</label>
              <select
                value={literacyCategory}
                onChange={(e) => setLiteracyCategory(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-amber-300 rounded-xl"
              >
                <option value="menemukan_informasi">🔍 Menemukan Informasi</option>
                <option value="ide_pokok">💡 Ide Pokok Paragraf</option>
                <option value="makna_kosakata">📖 Makna Kosakata</option>
                <option value="evaluasi_amanat">⚖️ Evaluasi & Amanat</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-amber-900 mb-1">Rujukan Paragraf:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={targetParagraph || ''}
                onChange={(e) => setTargetParagraph(parseInt(e.target.value, 10) || undefined)}
                placeholder="Misal: 3"
                className="w-full p-2 bg-slate-50 border border-amber-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-amber-900 mb-1">Teks Pertanyaan:</label>
            <textarea
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Tuliskan butir soal membaca..."
              className="w-full p-2.5 bg-slate-50 border border-amber-300 rounded-xl leading-relaxed"
            />
          </div>

          {/* Options */}
          <div className="space-y-1.5">
            <label className="block font-bold text-amber-900">Pilihan Jawaban (A, B, C, D):</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-bold text-slate-500 w-4">{String.fromCharCode(65 + idx)}.</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[idx] = e.target.value;
                    if (correctAnswer === opt) setCorrectAnswer(e.target.value);
                    setOptions(newOpts);
                  }}
                  className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
                <input
                  type="radio"
                  name="correctRadio"
                  checked={correctAnswer === opt}
                  onChange={() => setCorrectAnswer(opt)}
                  title="Tandai sebagai jawaban benar"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block font-bold text-amber-900 mb-1">Pembahasan / Penjelasan:</label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Jelaskan alasan jawaban benar berdasarkan isi teks cerita..."
              className="w-full p-2 bg-slate-50 border border-amber-300 rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-md"
            >
              Simpan Soal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
