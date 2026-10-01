/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Home, BookOpen, Trophy, ShieldCheck, Compass } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { StudentHome } from './components/StudentHome';
import { PlayerSetup } from './components/PlayerSetup';
import { AdventureDashboard } from './components/AdventureDashboard';
import { QuestionView } from './components/QuestionView';
import { StoryRetellingView } from './components/StoryRetellingView';
import { QRScannerModal } from './components/QRScannerModal';
import { PosCompleteModal } from './components/PosCompleteModal';
import { FinalPosIntroModal } from './components/FinalPosIntroModal';
import { TreasureVictoryView } from './components/TreasureVictoryView';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminDashboard } from './components/AdminDashboard';
import { HowToPlayModal } from './components/HowToPlayModal';
import { SplashScreen } from './components/SplashScreen';
import { ScreenLockGuard } from './components/ScreenLockGuard';

import {
  GameSession,
  LocationConfig,
  GameSettings,
  PlayerInfo,
  ClientQuestion,
  LeaderboardEntry,
  StoryRetelling,
  StoryChapter,
} from './types/game';
import { gameService } from './services/gameService';
import { sounds } from './utils/audio';

type AppView = 'home' | 'setup' | 'adventure' | 'retelling' | 'victory' | 'leaderboard' | 'admin';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<AppView>('home');
  const [session, setSession] = useState<GameSession | null>(null);
  const [locations, setLocations] = useState<LocationConfig[]>([]);
  const [settings, setSettings] = useState<GameSettings | null>(null);

  // Active Station info
  const [currentStation, setCurrentStation] = useState<{
    posNumber: number;
    totalPos: number;
    id: string;
    code: string;
    name?: string;
    hint: string;
    isFinal: boolean;
    story?: StoryChapter;
  } | null>(null);

  // Questions for currently active station
  const [currentStationQuestions, setCurrentStationQuestions] = useState<ClientQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Completed Pos Celebration modal
  const [completedPosInfo, setCompletedPosInfo] = useState<{
    completedPosCode: string;
    nextStation: {
      posNumber: number;
      totalPos: number;
      code: string;
      name?: string;
      hint: string;
      isFinal: boolean;
      story?: StoryChapter;
    } | null;
  } | null>(null);

  // Final Pos (Pos 5) Intro modal
  const [isFinalIntroOpen, setIsFinalIntroOpen] = useState(false);

  // Victory / Final summary
  const [victorySummary, setVictorySummary] = useState<{
    summary: LeaderboardEntry;
    treasureCode: string;
    teacherMessage: string;
  } | null>(null);

  // Timeout state
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Load locations and settings on mount, plus restore existing session if any
  useEffect(() => {
    const init = async () => {
      try {
        const [locs, sets] = await Promise.all([
          gameService.getLocations(),
          gameService.getSettings(),
        ]);
        setLocations(locs);
        setSettings(sets);

        // Check if there is an active or failed (locked) saved game
        const stored = gameService.getStoredSession();
        if (
          stored &&
          (stored.status === 'active' || stored.status === 'failed' || stored.status === 'timeout')
        ) {
          setSession(stored);
          const currentLocId = stored.route[stored.currentPosIndex];
          const locConfig = locs.find((l) => l.id === currentLocId);

          setCurrentStation({
            posNumber: stored.currentPosIndex + 1,
            totalPos: stored.route.length,
            id: currentLocId,
            code: locConfig?.code || `POS ${stored.currentPosIndex + 1}`,
            name: sets.hintMode === 'easy' ? locConfig?.name : undefined,
            hint: locConfig?.hint || '',
            isFinal: locConfig?.isFinal || false,
            story: locConfig?.story,
          });

          // If QR was already verified for this pos, fetch questions
          const posProg = stored.posProgress[currentLocId];
          if (posProg?.qrVerified) {
            const allQ = await gameService.getQuestions();
            const stationQ = allQ
              .filter((q) => q.locationId === currentLocId)
              .slice(0, 5)
              .map((q) => ({
                id: q.id,
                locationId: q.locationId,
                question: q.question,
                type: q.type,
                literacyCategory: q.literacyCategory,
                difficulty: q.difficulty,
                targetParagraph: q.targetParagraph,
                options: q.options,
              }));
            setCurrentStationQuestions(stationQ);
            setCurrentQuestionIndex(posProg.solvedQuestions.length);
          }
        }
      } catch (err) {
        console.error('Initialization error', err);
      }
    };
    init();
  }, []);

  // Start new game
  const handleStartGame = async (player: PlayerInfo) => {
    try {
      // Request fullscreen immediately on user gesture so phone screen locks
      try {
        const el = document.documentElement as any;
        if (!document.fullscreenElement) {
          if (el.requestFullscreen) {
            await el.requestFullscreen({ navigationUI: 'hide' });
          } else if (el.webkitRequestFullscreen) {
            await el.webkitRequestFullscreen();
          }
        }
      } catch {
        // ignore if unsupported
      }

      // Clear any previous Pos article locks so new session starts fresh
      ['pos_1', 'pos_2', 'pos_3', 'pos_4', 'pos_5'].forEach((id) => {
        localStorage.removeItem(`sigundul_article_locked_${id}`);
      });

      const data = await gameService.startGame(player);
      setSession(data.session);
      setCurrentStation(data.currentStation);
      setCurrentStationQuestions([]);
      setCurrentQuestionIndex(0);
      setView('adventure');
      setIsTimedOut(false);
    } catch (err) {
      console.error('Start game error', err);
    }
  };

  // Resume active session
  const handleResumeSession = async () => {
    try {
      const el = document.documentElement as any;
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen({ navigationUI: 'hide' });
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }
      }
    } catch {
      // ignore
    }
    setView('adventure');
  };

  // Trigger screen lock when student leaves app / opens browser / exits fullscreen
  const handleLockTriggered = useCallback(
    async (reason: string) => {
      if (!session || session.status !== 'active') return;
      const updated = await gameService.lockScreen(session.gameId, reason, session);
      setSession(updated);
    },
    [session]
  );

  // Unlock screen display ONLY by Teacher
  const handleUnlockScreenByTeacher = async (code: string) => {
    const res = await gameService.unlockScreenByTeacher(code, session);
    if (res.success && res.session) {
      setSession(res.session);
    }
    return {
      success: res.success,
      message: res.message,
    };
  };

  // Verify scanned QR Code
  const handleVerifyQr = async (qrCode: string) => {
    if (!session || !currentStation) {
      return { matched: false, message: 'Sesi tidak aktif.' };
    }

    const res = await gameService.verifyQr(session.gameId, qrCode, session);

    if (res.matched && res.questions) {
      setCurrentStationQuestions(res.questions);
      const currentLocId = session.route[session.currentPosIndex];
      const posProg = session.posProgress[currentLocId];
      setCurrentQuestionIndex(posProg?.solvedQuestions.length || 0);

      if (res.story) {
        setCurrentStation((prev) => (prev ? { ...prev, story: res.story } : null));
      }
    }

    return res;
  };

  // Submit Answer to a Question
  const handleSubmitAnswer = async (answer: string) => {
    if (!session || !currentStationQuestions[currentQuestionIndex]) {
      throw new Error('Sesi atau soal tidak valid.');
    }

    const currentQ = currentStationQuestions[currentQuestionIndex];
    const res = await gameService.submitAnswer(session.gameId, currentQ.id, answer, session);

    // Keep session state updated immediately (score or failed lock)
    if (res.posFailed) {
      const currentLocId = session.route[session.currentPosIndex];
      const updatedSession: GameSession = {
        ...session,
        status: 'failed',
        failedPosCode: res.failedPosCode || currentStation?.code,
        failedPosName: res.failedPosName || currentStation?.name,
        failedReason: res.failedReason,
        posProgress: {
          ...session.posProgress,
          [currentLocId]: {
            ...session.posProgress[currentLocId],
            failed: true,
          },
        },
      };
      setSession(updatedSession);
      gameService.saveSession(updatedSession);
    } else if (res.isCorrect && res.score !== undefined) {
      setSession({
        ...session,
        score: res.score,
      });
    }

    return res;
  };

  // Proceed to next station after viewing celebration feedback
  const handleProceedToNextStation = async (res: any) => {
    if (!res) return;

    if (res.allCompleted && session) {
      // Pos 5 finished! Students record notes manually in their own notebooks,
      // so finalize session directly and open Victory / Certificate view!
      sounds.playSuccess();
      try {
        const finalRes = await gameService.submitStoryRetelling(
          session.gameId,
          {
            studentText: 'Catatan materi Pos 1 hingga Pos 5 ditulis di buku catatan manual siswa.',
            wordCount: 12,
            submittedAt: new Date().toISOString(),
          },
          session
        );
        setVictorySummary({
          summary: finalRes.summary,
          treasureCode: finalRes.treasureCode || 'SIGUNDUL-ILMU-TUMBUHAN',
          teacherMessage:
            finalRes.teacherMessage ||
            'Selamat! Kamu telah menyelesaikan seluruh 5 Pos Perkembangbiakan Tumbuhan! Serahkan buku catatanmu kepada Bapak/Ibu Guru.',
        });
        setView('victory');
        gameService.clearSession();
      } catch (err) {
        console.error('Failed finalizing game', err);
      }
      return;
    }

    if (res.posCompleted && res.nextStation) {
      // Pos finished! Show celebration and unlocked next station clue
      sounds.playPosComplete();
      const justFinishedCode = currentStation?.code || 'POS';
      const isNextFinal = res.nextStation.isFinal;

      setCompletedPosInfo({
        completedPosCode: justFinishedCode,
        nextStation: res.nextStation,
      });

      // Update current station state for next round
      setCurrentStation({
        ...res.nextStation,
        hint: res.nextStation.hint,
      });
      setCurrentStationQuestions([]);
      setCurrentQuestionIndex(0);

      // If next is Final, queue the Final Intro Modal
      if (isNextFinal) {
        setIsFinalIntroOpen(true);
      }
    }
  };

  // Student submits the final story retelling (Tugas Akhir)
  const handleStoryRetellingSubmit = async (retelling: StoryRetelling) => {
    if (!session) return;
    try {
      const res = await gameService.submitStoryRetelling(session.gameId, retelling, session);
      setVictorySummary({
        summary: res.summary,
        treasureCode: res.treasureCode || 'DETEKTIF-LITERASI-JUARA',
        teacherMessage:
          res.teacherMessage ||
          'Selamat! Kamu telah menyelesaikan seluruh rangkaian cerita dan tugas akhir literasi!',
      });
      setView('victory');
      gameService.clearSession();
    } catch (err) {
      console.error('Failed submitting retelling', err);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < currentStationQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleTimeout = useCallback(() => {
    setIsTimedOut(true);
    sounds.playWrong();
    setSession((prev) => {
      if (!prev) return null;
      const updated: GameSession = {
        ...prev,
        status: 'failed',
        failedPosCode: currentStation?.code || `POS ${prev.currentPosIndex + 1}`,
        failedPosName: currentStation?.name,
        failedReason: 'Waktu petualangan habis sebelum menyelesaikan seluruh pos.',
      };
      gameService.saveSession(updated);
      return updated;
    });
  }, [currentStation]);

  // Reset session ONLY by Teacher in Panel Guru using code "ulangi"
  const handleResetSessionByTeacher = async (code: string) => {
    const res = await gameService.resetSessionByTeacher(code, session?.gameId);
    if (res.success) {
      setSession(null);
      setCurrentStation(null);
      setCurrentStationQuestions([]);
      setCurrentQuestionIndex(0);
      setIsTimedOut(false);
      setCompletedPosInfo(null);
      setIsFinalIntroOpen(false);
    }
    return res;
  };

  const handlePlayAgain = () => {
    gameService.clearSession();
    setSession(null);
    setCurrentStation(null);
    setCurrentStationQuestions([]);
    setCurrentQuestionIndex(0);
    setView('home');
  };

  const currentLocId = session ? session.route[session.currentPosIndex] : '';
  const currentPosProgress = session?.posProgress[currentLocId];
  const isQrVerified = currentPosProgress?.qrVerified || false;
  const currentQuestion = currentStationQuestions[currentQuestionIndex];
  const attemptsSoFar =
    (currentQuestion && currentPosProgress?.questionAttempts[currentQuestion.id]) || 0;

  // Active story chapter
  const currentStoryChapter =
    currentStation?.story ||
    locations.find((l) => l.id === currentLocId)?.story;

  const isAdventureLocked = view === 'adventure' && session?.status === 'active';

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/50">
      {/* Fullscreen Initial Splash Screen */}
      {showSplash && <SplashScreen onEnter={() => setShowSplash(false)} />}

      {/* Anti-Cheat Screen Lock & Fullscreen Guard */}
      <ScreenLockGuard
        isActiveAdventure={isAdventureLocked}
        isScannerOpen={isScannerOpen}
        session={session}
        currentPosCode={currentStation?.code}
        onLockTriggered={handleLockTriggered}
        onUnlockByTeacher={handleUnlockScreenByTeacher}
        onResetByTeacher={handleResetSessionByTeacher}
      />

      {/* Top Navigation */}
      <Navbar
        onGoHome={() => {
          if (isAdventureLocked) return;
          setView('home');
        }}
        onOpenLeaderboard={() => {
          if (isAdventureLocked) return;
          setView('leaderboard');
        }}
        onOpenAdmin={() => setView('admin')}
        onShowSplash={() => {
          if (isAdventureLocked) return;
          setShowSplash(true);
        }}
        isAdventureLocked={isAdventureLocked}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 py-3 pb-24 sm:px-4 sm:py-6 sm:pb-8">
        {/* --- VIEW: HOME --- */}
        {view === 'home' && (
          <StudentHome
            onStart={() => {
              if (session && (session.status === 'failed' || session.status === 'timeout')) {
                setView('admin');
                return;
              }
              setView('setup');
            }}
            onHowToPlay={() => setIsHowToPlayOpen(true)}
            onLeaderboard={() => setView('leaderboard')}
            onAdmin={() => setView('admin')}
            hasActiveSession={!!session && session.status === 'active'}
            hasFailedSession={!!session && (session.status === 'failed' || session.status === 'timeout')}
            activeSession={session}
            onResumeSession={handleResumeSession}
          />
        )}

        {/* --- VIEW: PLAYER SETUP --- */}
        {view === 'setup' && (
          <PlayerSetup
            onStartGame={handleStartGame}
            onBack={() => setView('home')}
          />
        )}

        {/* --- VIEW: ACTIVE ADVENTURE --- */}
        {view === 'adventure' && session && currentStation && (
          <div className="space-y-6">
            {/* Dashboard Status Bar */}
            <AdventureDashboard
              session={session}
              locations={locations}
              settings={settings || ({} as GameSettings)}
              currentStation={currentStation}
              questionsForCurrentPos={currentStationQuestions}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
              onTimeout={handleTimeout}
            />

            {/* Question Solving Area (Only if QR is verified) */}
            {isQrVerified && currentQuestion ? (
              <QuestionView
                stationCode={currentStation.code}
                stationName={currentStation.name}
                questionIndex={currentQuestionIndex}
                totalQuestions={currentStationQuestions.length || 4}
                question={currentQuestion}
                storyChapter={currentStoryChapter}
                maxAttempts={settings?.maxAttempts || 3}
                attemptsUsedSoFar={attemptsSoFar}
                isPosFailed={session.status === 'failed' || !!currentPosProgress?.failed}
                onSubmitAnswer={handleSubmitAnswer}
                onNextQuestion={handleNextQuestion}
                onProceedToNextStation={handleProceedToNextStation}
                onOpenAdmin={() => setView('admin')}
              />
            ) : isQrVerified && currentStationQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border-2 border-amber-200">
                <div className="animate-spin text-3xl mb-2">⏳</div>
                <p className="font-bold text-slate-700">Memuat teks cerita dan soal literasi pos ini...</p>
              </div>
            ) : null}
          </div>
        )}

        {/* --- VIEW: RETELLING FINAL TASK (TUGAS AKHIR SISWA) --- */}
        {view === 'retelling' && session && (
          <StoryRetellingView
            locations={locations}
            playerName={session.player.playerName}
            className={session.player.className}
            onSubmitRetelling={handleStoryRetellingSubmit}
          />
        )}

        {/* --- VIEW: VICTORY & TREASURE UNLOCKED --- */}
        {view === 'victory' && victorySummary && (
          <TreasureVictoryView
            summary={victorySummary.summary}
            treasureCode={victorySummary.treasureCode}
            teacherMessage={victorySummary.teacherMessage}
            onPlayAgain={handlePlayAgain}
            onViewLeaderboard={() => setView('leaderboard')}
          />
        )}

        {/* --- VIEW: LEADERBOARD --- */}
        {view === 'leaderboard' && (
          <LeaderboardView onBack={() => setView('home')} />
        )}

        {/* --- VIEW: TEACHER / ADMIN DASHBOARD --- */}
        {view === 'admin' && (
          <AdminDashboard
            onBack={() => {
              if (session && session.status === 'active') {
                setView('adventure');
                return;
              }
              setView('home');
            }}
            activeSession={session}
            onResetSessionByTeacher={handleResetSessionByTeacher}
            onUnlockScreenByTeacher={handleUnlockScreenByTeacher}
          />
        )}
      </main>

      {/* --- SMARTPHONE BOTTOM NAVIGATION BAR (Shown on non-gameplay views) --- */}
      {view !== 'adventure' && view !== 'retelling' && (
        <nav
          aria-label="Navigasi Bawah Smartphone"
          className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-amber-200 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        >
          <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setView('home');
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                view === 'home' || view === 'setup'
                  ? 'bg-amber-100 text-amber-950 font-black'
                  : 'text-slate-600 hover:text-amber-900'
              }`}
            >
              <Home className="w-4 h-4 mb-0.5 text-amber-600" />
              <span>Beranda</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsHowToPlayOpen(true);
              }}
              className="flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold text-slate-600 hover:text-amber-900 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 mb-0.5 text-amber-600" />
              <span>Cara Main</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setView('leaderboard');
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                view === 'leaderboard'
                  ? 'bg-amber-100 text-amber-950 font-black'
                  : 'text-slate-600 hover:text-amber-900'
              }`}
            >
              <Trophy className="w-4 h-4 mb-0.5 text-amber-600" />
              <span>Peringkat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setView('admin');
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                view === 'admin'
                  ? 'bg-amber-100 text-amber-950 font-black'
                  : 'text-slate-600 hover:text-amber-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mb-0.5 text-amber-700" />
              <span>Guru</span>
            </button>
          </div>
        </nav>
      )}

      {/* --- MODAL: QR SCANNER --- */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onVerify={handleVerifyQr}
        currentPosCode={currentStation?.code || 'POS'}
      />

      {/* --- MODAL: HOW TO PLAY --- */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* --- MODAL: POS COMPLETED CELEBRATION --- */}
      {completedPosInfo && (
        <PosCompleteModal
          isOpen={!!completedPosInfo}
          completedPosCode={completedPosInfo.completedPosCode}
          nextStation={completedPosInfo.nextStation}
          onContinue={() => setCompletedPosInfo(null)}
        />
      )}

      {/* --- MODAL: FINAL POS INTRO BANNER --- */}
      {isFinalIntroOpen && currentStation && (
        <FinalPosIntroModal
          isOpen={isFinalIntroOpen}
          finalHint={currentStation.hint}
          finalLocationName={currentStation.name}
          onContinue={() => setIsFinalIntroOpen(false)}
        />
      )}

      {/* --- TIMEOUT MODAL --- */}
      {isTimedOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center border-4 border-rose-500 shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl">
              ⏰
            </div>
            <h3 className="text-2xl font-black font-display text-rose-950">
              WAKTU PETUALANGAN HABIS
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Durasi waktu yang ditentukan oleh guru telah selesai. Skor sementaramu:{' '}
              <strong className="text-amber-800 font-black">{session?.score || 0} poin</strong>. Untuk mengulang dan mereset aplikasi, <strong>hanya bisa dilakukan oleh Guru pada Panel Guru</strong>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsTimedOut(false);
                  setView('admin');
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs cursor-pointer"
              >
                Buka Panel Guru (Reset)
              </button>
              <button
                onClick={() => {
                  setIsTimedOut(false);
                  setView('home');
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
