import {
  GameSession,
  LocationConfig,
  GameSettings,
  Question,
  ClientQuestion,
  LeaderboardEntry,
  PlayerInfo,
  StoryRetelling,
} from '../types/game';
import {
  DEFAULT_LOCATIONS,
  DEFAULT_SETTINGS,
  DEFAULT_QUESTIONS,
} from '../data/defaultData';

const LOCAL_SESSION_KEY = 'sigundul_tumbuhan_v4_session';
const LOCAL_SETTINGS_KEY = 'sigundul_tumbuhan_v4_settings';
const LOCAL_LOCATIONS_KEY = 'sigundul_tumbuhan_v5_locations';
const LOCAL_QUESTIONS_KEY = 'sigundul_tumbuhan_v4_questions';
const LOCAL_LEADERBOARD_KEY = 'sigundul_tumbuhan_v5_leaderboard';

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Client Question Sanitizer
function toClientQuestion(q: Question): ClientQuestion {
  return {
    id: q.id,
    locationId: q.locationId,
    question: q.question,
    type: q.type,
    literacyCategory: q.literacyCategory,
    difficulty: q.difficulty,
    targetParagraph: q.targetParagraph,
    options: q.options ? shuffleArray(q.options) : undefined,
  };
}

class GameService {
  // Get Settings
  async getSettings(): Promise<GameSettings> {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(data.settings));
          return data.settings;
        }
      }
    } catch {
      // fallback
    }
    const saved = localStorage.getItem(LOCAL_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  }

  // Update Settings
  async updateSettings(settings: Partial<GameSettings>): Promise<GameSettings> {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(data.settings));
        return data.settings;
      }
    } catch {
      // fallback
    }
    const current = await this.getSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  }

  // Get Locations
  async getLocations(): Promise<LocationConfig[]> {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        if (data.locations) {
          localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(data.locations));
          return data.locations;
        }
      }
    } catch {
      // fallback
    }
    const saved = localStorage.getItem(LOCAL_LOCATIONS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS;
  }

  // Update Locations
  async updateLocations(locations: LocationConfig[]): Promise<LocationConfig[]> {
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(data.locations));
        return data.locations;
      }
    } catch {
      // fallback
    }
    localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(locations));
    return locations;
  }

  // Get Questions (For Admin)
  async getQuestions(): Promise<Question[]> {
    try {
      const res = await fetch('/api/questions');
      if (res.ok) {
        const data = await res.json();
        if (data.questions) {
          localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(data.questions));
          return data.questions;
        }
      }
    } catch {
      // fallback
    }
    const saved = localStorage.getItem(LOCAL_QUESTIONS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_QUESTIONS;
  }

  // Update Questions (For Admin)
  async updateQuestions(questions: Question[]): Promise<Question[]> {
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(data.questions));
        return data.questions;
      }
    } catch {
      // fallback
    }
    localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(questions));
    return questions;
  }

  // Reset to default
  async resetAllData(): Promise<void> {
    try {
      await fetch('/api/questions/reset', { method: 'POST' });
    } catch {
      // fallback
    }
    localStorage.removeItem(LOCAL_QUESTIONS_KEY);
    localStorage.removeItem(LOCAL_LOCATIONS_KEY);
    localStorage.removeItem(LOCAL_SETTINGS_KEY);
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }

  // Get Leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard) {
          localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(data.leaderboard));
          return data.leaderboard;
        }
      }
    } catch {
      // fallback
    }
    const saved = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  // Rate a student retelling (Teacher review)
  async rateSubmission(id: string, rating: number, feedback: string): Promise<boolean> {
    try {
      const res = await fetch('/api/submissions/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rating, feedback }),
      });
      if (res.ok) {
        return true;
      }
    } catch {
      // fallback
    }
    const lb = await this.getLeaderboard();
    const entry = lb.find(item => item.id === id);
    if (entry && entry.storyRetelling) {
      entry.storyRetelling.teacherRating = rating;
      entry.storyRetelling.teacherFeedback = feedback;
      localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(lb));
      return true;
    }
    return false;
  }

  // Start a new game (Sequential episodic route from Pos 1 to Pos 5)
  async startGame(player: PlayerInfo): Promise<{
    session: GameSession;
    currentStation: {
      posNumber: number;
      totalPos: number;
      id: string;
      code: string;
      name?: string;
      hint: string;
      isFinal: boolean;
      story?: any;
    };
    settings: GameSettings;
  }> {
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data.session));
          return data;
        }
      }
    } catch {
      // fallback to offline local game logic
    }

    // Fallback: Local Client Execution
    const locations = await this.getLocations();
    const settings = await this.getSettings();

    // Randomize Pos 1 to Pos 4 per device/group, keeping Pos 5 fixed as the Final Pos
    const activeLocs = locations.filter(l => l.isActive);
    const nonFinalLocs = shuffleArray(
      activeLocs.filter(l => !l.isFinal)
    );
    const finalLocs = activeLocs
      .filter(l => l.isFinal)
      .sort((a, b) => a.story.chapterNumber - b.story.chapterNumber);
    const route = [...nonFinalLocs, ...finalLocs].map(l => l.id);

    const gameId = `LITERASI-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const posProgress: GameSession['posProgress'] = {};
    route.forEach(locId => {
      posProgress[locId] = {
        locationId: locId,
        qrVerified: false,
        completed: false,
        currentQuestionIndex: 0,
        questionAttempts: {},
        solvedQuestions: [],
      };
    });

    const session: GameSession = {
      gameId,
      player,
      startTime: Date.now(),
      route,
      currentPosIndex: 0,
      score: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      posProgress,
      status: 'active',
      treasureUnlocked: false,
    };

    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));

    const firstLocConfig = locations.find(l => l.id === route[0]);

    return {
      session,
      currentStation: {
        posNumber: 1,
        totalPos: route.length,
        id: route[0],
        code: firstLocConfig?.code || 'POS 1',
        name: settings.hintMode === 'easy' ? firstLocConfig?.name : undefined,
        hint: firstLocConfig?.hint || 'Carilah kode QR di pos pertama.',
        isFinal: false,
        story: firstLocConfig?.story,
      },
      settings,
    };
  }

  // Verify scanned QR Code
  async verifyQr(gameId: string, qrCode: string, currentSession: GameSession): Promise<{
    matched: boolean;
    message: string;
    stationName?: string;
    story?: any;
    questions?: ClientQuestion[];
  }> {
    try {
      const res = await fetch(`/api/game/${gameId}/verify-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.matched) {
          const currentLocId = currentSession.route[currentSession.currentPosIndex];
          currentSession.posProgress[currentLocId].qrVerified = true;
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));
        }
        return data;
      }
    } catch {
      // fallback
    }

    // Local client fallback
    const locations = await this.getLocations();
    const currentLocId = currentSession.route[currentSession.currentPosIndex];
    const targetLoc = locations.find(l => l.id === currentLocId);

    const scannedClean = qrCode.trim().toUpperCase();
    const targetClean = (targetLoc?.qrCode || '').trim().toUpperCase();

    if (scannedClean === targetClean) {
      currentSession.posProgress[currentLocId].qrVerified = true;
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));

      const allQ = await this.getQuestions();
      const stationQ = allQ
        .filter(q => q.locationId === currentLocId)
        .slice(0, 5)
        .map(toClientQuestion);

      return {
        matched: true,
        message: `🎉 KODE DITEMUKAN!\nSelamat! Kamu berhasil menemukan ${targetLoc?.code || 'Pos ini'}.\nBacalah artikel materi dengan seksama, catat di buku tulismu, lalu selesaikan soal!`,
        story: targetLoc?.story,
        questions: stationQ,
      };
    }

    return {
      matched: false,
      message: '🔒 KODE BELUM BISA DIBUKA\nKode ini bukan babak cerita tujuanmu saat ini.\nIkuti petunjuk babak secara berurutan.',
    };
  }

  // Submit Answer to a Question
  async submitAnswer(
    gameId: string,
    questionId: string,
    answer: string,
    currentSession: GameSession
  ): Promise<{
    isCorrect: boolean;
    pointsAwarded: number;
    attemptsUsed: number;
    explanation?: string;
    posCompleted: boolean;
    posFailed?: boolean;
    failedPosCode?: string;
    failedPosName?: string;
    failedReason?: string;
    allCompleted?: boolean;
    needsRetelling?: boolean;
    score?: number;
    nextStation?: any;
    treasureCode?: string;
    teacherMessage?: string;
    summary?: LeaderboardEntry;
  }> {
    try {
      const res = await fetch(`/api/game/${gameId}/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local session cache
        if (data.score !== undefined) {
          currentSession.score = data.score;
        }
        if (data.posFailed) {
          const currentLocId = currentSession.route[currentSession.currentPosIndex];
          if (currentSession.posProgress[currentLocId]) {
            currentSession.posProgress[currentLocId].failed = true;
          }
          currentSession.status = 'failed';
          currentSession.failedPosCode = data.failedPosCode;
          currentSession.failedPosName = data.failedPosName;
          currentSession.failedReason = data.failedReason;
        }
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));
        return data;
      }
    } catch {
      // fallback
    }

    // Local client fallback
    const allQ = await this.getQuestions();
    const settings = await this.getSettings();
    const locations = await this.getLocations();

    const q = allQ.find(item => item.id === questionId);
    if (!q) throw new Error('Soal tidak ditemukan');

    const currentLocId = currentSession.route[currentSession.currentPosIndex];
    const posProg = currentSession.posProgress[currentLocId];

    const currentAttempts = (posProg.questionAttempts[questionId] || 0) + 1;
    posProg.questionAttempts[questionId] = currentAttempts;
    currentSession.totalAttempts++;

    const u = answer.trim().toLowerCase().replace(/[\s\-_.,]+/g, ' ');
    const c = q.correctAnswer.trim().toLowerCase().replace(/[\s\-_.,]+/g, ' ');
    const isCorrect = u === c || (c.includes(u) && u.length >= 4);

    if (isCorrect) {
      currentSession.totalCorrect++;
      let pointsAwarded = settings.pointsFirstAttempt;
      if (currentAttempts === 2) pointsAwarded = settings.pointsSecondAttempt;
      else if (currentAttempts >= 3) pointsAwarded = settings.pointsThirdAttempt;

      currentSession.score += pointsAwarded;
      if (!posProg.solvedQuestions.includes(questionId)) {
        posProg.solvedQuestions.push(questionId);
      }

      const stationQuestions = allQ.filter(item => item.locationId === currentLocId).slice(0, 5);
      const isPosCompleted = stationQuestions.every(item => posProg.solvedQuestions.includes(item.id));

      if (isPosCompleted) {
        posProg.completed = true;
        currentSession.score += settings.pointsPosBonus;

        const nextIndex = currentSession.currentPosIndex + 1;
        const allCompleted = nextIndex >= currentSession.route.length;

        if (allCompleted) {
          currentSession.currentPosIndex = nextIndex;
          currentSession.endTime = Date.now();
          currentSession.score += settings.pointsGameBonus;
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));

          return {
            isCorrect: true,
            pointsAwarded,
            attemptsUsed: currentAttempts,
            explanation: q.explanation,
            posCompleted: true,
            allCompleted: true,
            needsRetelling: true,
            score: currentSession.score,
            treasureCode: settings.treasureCode,
            teacherMessage: settings.teacherMessage,
          };
        }

        currentSession.currentPosIndex = nextIndex;
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));

        const nextLocId = currentSession.route[nextIndex];
        const nextLocConfig = locations.find(l => l.id === nextLocId);

        return {
          isCorrect: true,
          pointsAwarded,
          attemptsUsed: currentAttempts,
          explanation: q.explanation,
          posCompleted: true,
          allCompleted: false,
          score: currentSession.score,
          nextStation: {
            posNumber: nextIndex + 1,
            totalPos: currentSession.route.length,
            id: nextLocId,
            code: nextLocConfig?.code,
            name: settings.hintMode === 'easy' ? nextLocConfig?.name : undefined,
            hint: nextLocConfig?.hint,
            isFinal: nextLocConfig?.isFinal || false,
            story: nextLocConfig?.story,
          },
        };
      }

      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));

      return {
        isCorrect: true,
        pointsAwarded,
        attemptsUsed: currentAttempts,
        explanation: q.explanation,
        posCompleted: false,
        score: currentSession.score,
      };
    }

    const isOutOfAttempts = currentAttempts >= settings.maxAttempts;
    if (isOutOfAttempts) {
      const currentLocConfig = locations.find(l => l.id === currentLocId);
      posProg.failed = true;
      currentSession.status = 'failed';
      currentSession.failedPosCode = currentLocConfig?.code || `POS ${currentSession.currentPosIndex + 1}`;
      currentSession.failedReason = `Gagal menaklukkan soal di ${currentSession.failedPosCode} setelah ${settings.maxAttempts} kali percobaan.`;
    }

    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));
    return {
      isCorrect: false,
      pointsAwarded: 0,
      attemptsUsed: currentAttempts,
      explanation: isOutOfAttempts ? q.explanation : undefined,
      posCompleted: false,
      posFailed: isOutOfAttempts,
      failedPosCode: currentSession.failedPosCode,
      failedPosName: currentSession.failedPosName,
      failedReason: currentSession.failedReason,
      score: currentSession.score,
    };
  }

  // Submit Final Story Retelling
  async submitStoryRetelling(
    gameId: string,
    retelling: StoryRetelling,
    currentSession: GameSession
  ): Promise<{
    summary: LeaderboardEntry;
    treasureCode: string;
    teacherMessage: string;
  }> {
    try {
      const res = await fetch(`/api/game/${gameId}/submit-retelling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retelling }),
      });
      if (res.ok) {
        const data = await res.json();
        currentSession.status = 'completed';
        currentSession.treasureUnlocked = true;
        currentSession.storyRetelling = retelling;
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));
        return data;
      }
    } catch {
      // fallback
    }

    // Local client fallback
    const settings = await this.getSettings();
    const questions = await this.getQuestions();

    currentSession.status = 'completed';
    currentSession.treasureUnlocked = true;
    currentSession.storyRetelling = retelling;
    if (!currentSession.endTime) currentSession.endTime = Date.now();
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));

    const durationSeconds = Math.round((currentSession.endTime - currentSession.startTime) / 1000);
    const totalQ = questions.length;
    const accuracy = Math.min(100, Math.round((currentSession.totalCorrect / Math.max(currentSession.totalAttempts, 1)) * 100));

    let badge = '📜 DETEKTIF LITERASI UTAMA';
    if (accuracy >= 95) badge = '🎯 AKURASI SEMPURNA';
    else if (durationSeconds <= 1200) badge = '⚡ PENJELAJAH KILAT';
    else if (accuracy >= 80) badge = '🧭 PETUALANG TANGGUH';

    const entry: LeaderboardEntry = {
      id: `lb_${Date.now()}`,
      gameId: currentSession.gameId,
      playerName: currentSession.player.playerName,
      mode: currentSession.player.mode,
      className: currentSession.player.className,
      members: currentSession.player.members,
      score: currentSession.score,
      completedStations: 5,
      correctCount: currentSession.totalCorrect,
      totalQuestions: totalQ,
      durationSeconds,
      accuracy,
      badge,
      completedAt: new Date().toISOString(),
      storyRetelling: retelling,
    };

    const lb = await this.getLeaderboard();
    lb.unshift(entry);
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(lb));

    return {
      summary: entry,
      treasureCode: settings.treasureCode,
      teacherMessage: settings.teacherMessage,
    };
  }

  // Restore stored active session
  getStoredSession(): GameSession | null {
    const saved = localStorage.getItem(LOCAL_SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  // Save/update session in localStorage
  saveSession(session: GameSession): void {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  }

  // Reset application session ONLY by Teacher using secret code "ulangi"
  async resetSessionByTeacher(
    code: string,
    gameId?: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanCode = (code || '').trim().toLowerCase();
    if (cleanCode !== 'ulangi') {
      return {
        success: false,
        message: 'Kode Reset Guru salah! Hanya guru yang dapat mereset aplikasi.',
      };
    }

    try {
      await fetch('/api/game/reset-by-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, code: cleanCode }),
      });
    } catch {
      // fallback offline
    }

    this.clearSession();
    ['pos_1', 'pos_2', 'pos_3', 'pos_4', 'pos_5'].forEach((id) => {
      localStorage.removeItem(`sigundul_article_locked_${id}`);
    });

    return {
      success: true,
      message: 'Aplikasi berhasil di-reset oleh Guru! Kelompok dapat memulai kembali dari Pos 1.',
    };
  }

  // Clear current active session
  clearSession(): void {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    ['pos_1', 'pos_2', 'pos_3', 'pos_4', 'pos_5'].forEach((id) => {
      localStorage.removeItem(`sigundul_article_locked_${id}`);
    });
  }
}

export const gameService = new GameService();
