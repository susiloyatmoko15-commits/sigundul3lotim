import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  GameSession,
  LocationConfig,
  GameSettings,
  Question,
  ClientQuestion,
  LeaderboardEntry,
  StoryRetelling,
} from './src/types/game.js';
import {
  DEFAULT_LOCATIONS,
  DEFAULT_SETTINGS,
  DEFAULT_QUESTIONS,
} from './src/data/defaultData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory data store with optional persistence
let locations: LocationConfig[] = [...DEFAULT_LOCATIONS];
let settings: GameSettings = { ...DEFAULT_SETTINGS };
let questions: Question[] = [...DEFAULT_QUESTIONS];
const activeGames: Map<string, GameSession> = new Map();

let leaderboard: LeaderboardEntry[] = [
  {
    id: 'lb_demo_1',
    gameId: 'GAME-2026-1024',
    playerName: 'Tim Tunas Hijau',
    mode: 'group',
    className: 'Kelas 6A',
    members: ['Putu', 'Made', 'Komang', 'Ketut'],
    score: 2450,
    completedStations: 5,
    correctCount: 20,
    totalQuestions: 20,
    durationSeconds: 1540,
    accuracy: 98,
    badge: '🌿 ILMUWAN TUMBUHAN UTAMA',
    completedAt: new Date(Date.now() - 3600000).toISOString(),
    storyRetelling: {
      studentText: 'Di Pos 1 Gudang Sekolah kami mencatat perkembangbiakan generatif menggunakan bunga (benang sari sebagai alat kelamin jantan dan putik sebagai betina). Di Pos 2 Bawah Pohon Jambu kami mempelajari vegetatif buatan seperti mencangkok tanaman berkambium, stek, okulasi, dan merunduk. Di Pos 3 Bawah Pohon Cempaka kami mencatat 4 jenis penyerbukan (sendiri, tetangga, silang, bastar) dan perantaranya. Di Pos 4 Lorong Parkir kami mempelajari vegetatif alami seperti tunas, umbi, rhizoma, geragih, dan spora. Terakhir di Pos 5 di Kelas kami mempelajari penyebaran biji serta pelestarian tumbuhan in-situ dan ex-situ.',
      wordCount: 89,
      submittedAt: new Date(Date.now() - 3600000).toISOString(),
      teacherRating: 5,
      teacherFeedback: 'Catatan materi dari Pos 1 hingga Pos 5 sangat lengkap, rapi, dan akurat!',
    },
  },
  {
    id: 'lb_demo_2',
    gameId: 'GAME-2026-1033',
    playerName: 'Kelompok Cempaka Wangi',
    mode: 'group',
    className: 'Kelas 5A',
    members: ['Ayu', 'Bagus', 'Citra', 'Dewa'],
    score: 2320,
    completedStations: 5,
    correctCount: 19,
    totalQuestions: 20,
    durationSeconds: 1820,
    accuracy: 94,
    badge: '🎯 PENELITI CERMAT',
    completedAt: new Date(Date.now() - 7200000).toISOString(),
    storyRetelling: {
      studentText: 'Tumbuhan berkembang biak secara generatif melalui penyerbukan dan pembuahan pada bunga, serta secara vegetatif tanpa perkawinan. Vegetatif buatan dibantu manusia seperti mencangkok pohon jambu, stek singkong, dan okulasi. Vegetatif alami terjadi sendiri seperti tunas pisang, tunas adventif cocor bebek, umbi lapis bawang, rhizoma jahe, geragih stroberi, dan spora paku.',
      wordCount: 51,
      submittedAt: new Date(Date.now() - 7200000).toISOString(),
      teacherRating: 5,
      teacherFeedback: 'Ringkasan catatan yang sangat padat dan jelas membedakan generatif serta vegetatif!',
    },
  },
];

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sanitize question for client (strips correctAnswer & explanation)
function toClientQuestion(q: Question): ClientQuestion {
  const sanitized: ClientQuestion = {
    id: q.id,
    locationId: q.locationId,
    question: q.question,
    type: q.type,
    literacyCategory: q.literacyCategory,
    difficulty: q.difficulty,
    targetParagraph: q.targetParagraph,
  };

  if (q.options && q.options.length > 0) {
    sanitized.options = shuffleArray(q.options);
  }

  return sanitized;
}

// Compare answer loosely
function checkAnswerMatch(userAns: string, correctAns: string): boolean {
  const u = userAns.trim().toLowerCase().replace(/[\s\-_.,]+/g, ' ');
  const c = correctAns.trim().toLowerCase().replace(/[\s\-_.,]+/g, ' ');

  if (u === c) return true;
  if (c.includes(u) && u.length >= 4) return true;
  return false;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // ----------------------------------------------------
  // API ROUTES
  // ----------------------------------------------------

  // Get current game settings
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json({ success: true, settings });
  });

  // Update game settings (teacher admin)
  app.post('/api/settings', (req: Request, res: Response) => {
    const newSettings = req.body;
    settings = { ...settings, ...newSettings };
    res.json({ success: true, settings });
  });

  // Get all station locations & stories
  app.get('/api/locations', (req: Request, res: Response) => {
    res.json({ success: true, locations });
  });

  // Update locations (teacher admin)
  app.post('/api/locations', (req: Request, res: Response) => {
    const { locations: newLocations } = req.body;
    if (Array.isArray(newLocations)) {
      locations = newLocations;
      res.json({ success: true, locations });
    } else {
      res.status(400).json({ success: false, error: 'Invalid locations data' });
    }
  });

  // Get all questions
  app.get('/api/questions', (req: Request, res: Response) => {
    res.json({ success: true, questions });
  });

  // Update questions (teacher admin)
  app.post('/api/questions', (req: Request, res: Response) => {
    const { questions: newQuestions } = req.body;
    if (Array.isArray(newQuestions)) {
      questions = newQuestions;
      res.json({ success: true, questions });
    } else {
      res.status(400).json({ success: false, error: 'Invalid questions data' });
    }
  });

  // Reset to default
  app.post('/api/questions/reset', (req: Request, res: Response) => {
    questions = [...DEFAULT_QUESTIONS];
    locations = [...DEFAULT_LOCATIONS];
    settings = { ...DEFAULT_SETTINGS };
    res.json({ success: true, message: 'Data cerita & soal literasi berhasil direset ke standar.' });
  });

  // Get leaderboard
  app.get('/api/leaderboard', (req: Request, res: Response) => {
    const sorted = [...leaderboard].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.durationSeconds - b.durationSeconds;
    });
    res.json({ success: true, leaderboard: sorted });
  });

  // Rate a student retelling (Teacher review)
  app.post('/api/submissions/rate', (req: Request, res: Response) => {
    const { id, rating, feedback } = req.body;
    const entry = leaderboard.find(item => item.id === id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Karya siswa tidak ditemukan.' });
    }
    if (entry.storyRetelling) {
      entry.storyRetelling.teacherRating = rating;
      entry.storyRetelling.teacherFeedback = feedback;
    }
    res.json({ success: true, entry });
  });

  // Start new game session
  app.post('/api/game/start', (req: Request, res: Response) => {
    const { player } = req.body;
    if (!player || !player.playerName || !player.className) {
      return res.status(400).json({ success: false, error: 'Nama pemain dan kelas wajib diisi.' });
    }

    const activeLocs = locations.filter(l => l.isActive);
    if (activeLocs.length === 0) {
      return res.status(500).json({ success: false, error: 'Tidak ada pos cerita aktif.' });
    }

    // Sort locations by chapter number 1 to 5 (Serial Episodic Story)
    const sortedLocs = [...activeLocs].sort((a, b) => a.story.chapterNumber - b.story.chapterNumber);
    const route = sortedLocs.map(l => l.id);

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

    activeGames.set(gameId, session);

    const currentLocId = route[0];
    const currentLocConfig = locations.find(l => l.id === currentLocId);

    res.json({
      success: true,
      gameId,
      session,
      currentStation: {
        posNumber: 1,
        totalPos: route.length,
        id: currentLocId,
        code: currentLocConfig?.code || 'POS 1',
        name: settings.hintMode === 'easy' ? currentLocConfig?.name : undefined,
        hint: currentLocConfig?.hint || 'Carilah kode QR di pos pertama.',
        isFinal: false,
        story: currentLocConfig?.story,
      },
      settings,
    });
  });

  // Get current game session info
  app.get('/api/game/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const session = activeGames.get(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    const currentLocId = session.route[session.currentPosIndex];
    const currentLocConfig = locations.find(l => l.id === currentLocId);
    const currentProgress = session.posProgress[currentLocId];

    const stationQuestions = questions
      .filter(q => q.locationId === currentLocId)
      .slice(0, 5)
      .map(toClientQuestion);

    res.json({
      success: true,
      session,
      currentStation: {
        posNumber: session.currentPosIndex + 1,
        totalPos: session.route.length,
        id: currentLocId,
        code: currentLocConfig?.code || `POS ${session.currentPosIndex + 1}`,
        name: settings.hintMode === 'easy' ? currentLocConfig?.name : undefined,
        hint: currentLocConfig?.hint,
        isFinal: currentLocConfig?.isFinal || false,
        qrVerified: currentProgress?.qrVerified || false,
        completed: currentProgress?.completed || false,
        story: currentLocConfig?.story,
      },
      questions: currentProgress?.qrVerified ? stationQuestions : [],
      settings,
    });
  });

  // Verify QR Code scanned by student
  app.post('/api/game/:id/verify-qr', (req: Request, res: Response) => {
    const { id } = req.params;
    const { qrCode } = req.body;
    const session = activeGames.get(id);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    if (!qrCode || typeof qrCode !== 'string') {
      return res.status(400).json({ success: false, error: 'Kode QR tidak valid.' });
    }

    const currentLocId = session.route[session.currentPosIndex];
    const targetLoc = locations.find(l => l.id === currentLocId);

    const scannedClean = qrCode.trim().toUpperCase();
    const targetClean = (targetLoc?.qrCode || '').trim().toUpperCase();

    // Check if matching target
    if (scannedClean === targetClean) {
      session.posProgress[currentLocId].qrVerified = true;

      const stationQuestions = questions
        .filter(q => q.locationId === currentLocId)
        .slice(0, 5)
        .map(toClientQuestion);

      return res.json({
        success: true,
        matched: true,
        message: `🎉 KODE DITEMUKAN!\nSelamat! Kamu tiba di ${targetLoc?.name || 'Pos Cerita'}.\nBacalah babak cerita dengan seksama dan selesaikan tantangan literasi!`,
        stationName: targetLoc?.name,
        story: targetLoc?.story,
        questions: stationQuestions,
        currentPosIndex: session.currentPosIndex,
      });
    }

    return res.json({
      success: true,
      matched: false,
      message: '🔒 KODE BELUM BISA DIBUKA\nKode ini bukan babak cerita tujuanmu saat ini.\nIkuti petunjuk babak secara berurutan.',
    });
  });

  // Submit answer for a question
  app.post('/api/game/:id/submit-answer', (req: Request, res: Response) => {
    const { id } = req.params;
    const { questionId, answer } = req.body;

    const session = activeGames.get(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    const currentLocId = session.route[session.currentPosIndex];
    const posProgress = session.posProgress[currentLocId];

    if (!posProgress.qrVerified) {
      return res.status(403).json({ success: false, error: 'Pos ini belum di-scan dengan QR code!' });
    }

    const q = questions.find(item => item.id === questionId);
    if (!q) {
      return res.status(404).json({ success: false, error: 'Soal tidak ditemukan.' });
    }

    const currentAttempts = (posProgress.questionAttempts[questionId] || 0) + 1;
    posProgress.questionAttempts[questionId] = currentAttempts;
    session.totalAttempts++;

    const isCorrect = checkAnswerMatch(answer, q.correctAnswer);

    if (isCorrect) {
      session.totalCorrect++;
      let pointsAwarded = settings.pointsFirstAttempt;
      if (currentAttempts === 2) pointsAwarded = settings.pointsSecondAttempt;
      else if (currentAttempts >= 3) pointsAwarded = settings.pointsThirdAttempt;

      session.score += pointsAwarded;
      if (!posProgress.solvedQuestions.includes(questionId)) {
        posProgress.solvedQuestions.push(questionId);
      }

      // Check if all questions for this pos are answered
      const stationQuestions = questions.filter(item => item.locationId === currentLocId).slice(0, 5);
      const isPosCompleted = stationQuestions.every(item => posProgress.solvedQuestions.includes(item.id));

      if (isPosCompleted) {
        posProgress.completed = true;
        session.score += settings.pointsPosBonus;

        const nextIndex = session.currentPosIndex + 1;
        const allCompleted = nextIndex >= session.route.length;

        if (allCompleted) {
          session.currentPosIndex = nextIndex;
          session.endTime = Date.now();
          session.score += settings.pointsGameBonus;

          return res.json({
            success: true,
            isCorrect: true,
            pointsAwarded,
            attemptsUsed: currentAttempts,
            explanation: q.explanation,
            posCompleted: true,
            allCompleted: true,
            needsRetelling: true, // triggers story retelling view!
            score: session.score,
            treasureCode: settings.treasureCode,
            teacherMessage: settings.teacherMessage,
          });
        }

        // Pos completed, unlock next station
        session.currentPosIndex = nextIndex;
        const nextLocId = session.route[nextIndex];
        const nextLocConfig = locations.find(l => l.id === nextLocId);

        return res.json({
          success: true,
          isCorrect: true,
          pointsAwarded,
          attemptsUsed: currentAttempts,
          explanation: q.explanation,
          posCompleted: true,
          allCompleted: false,
          score: session.score,
          nextStation: {
            posNumber: nextIndex + 1,
            totalPos: session.route.length,
            id: nextLocId,
            code: nextLocConfig?.code,
            name: settings.hintMode === 'easy' ? nextLocConfig?.name : undefined,
            hint: nextLocConfig?.hint,
            isFinal: nextLocConfig?.isFinal || false,
            story: nextLocConfig?.story,
          },
        });
      }

      return res.json({
        success: true,
        isCorrect: true,
        pointsAwarded,
        attemptsUsed: currentAttempts,
        explanation: q.explanation,
        posCompleted: false,
        score: session.score,
      });
    }

    // Wrong answer
    const isOutOfAttempts = currentAttempts >= settings.maxAttempts;
    if (isOutOfAttempts) {
      const currentLocConfig = locations.find(l => l.id === currentLocId);
      posProgress.failed = true;
      session.status = 'failed';
      session.failedPosCode = currentLocConfig?.code || `POS ${session.currentPosIndex + 1}`;
      session.failedPosName = currentLocConfig?.name || '';
      session.failedReason = `Gagal menaklukkan soal di ${session.failedPosCode}${session.failedPosName ? ` (${session.failedPosName})` : ''} setelah ${settings.maxAttempts} kali percobaan.`;
    }

    return res.json({
      success: true,
      isCorrect: false,
      pointsAwarded: 0,
      attemptsUsed: currentAttempts,
      explanation: isOutOfAttempts ? q.explanation : undefined,
      posCompleted: false,
      posFailed: isOutOfAttempts,
      failedPosCode: session.failedPosCode,
      failedPosName: session.failedPosName,
      failedReason: session.failedReason,
      score: session.score,
    });
  });

  // Reset active/failed game session by Teacher using secret code "ulangi"
  app.post('/api/game/reset-by-teacher', (req: Request, res: Response) => {
    const { gameId, code } = req.body as { gameId?: string; code?: string };
    const cleanCode = (code || '').trim().toLowerCase();

    if (cleanCode !== 'ulangi') {
      return res.status(403).json({
        success: false,
        error: 'Kode Reset Guru salah! Hanya guru yang dapat mereset aplikasi.',
      });
    }

    if (gameId && activeGames.has(gameId)) {
      activeGames.delete(gameId);
    }

    return res.json({
      success: true,
      message: 'Aplikasi berhasil di-reset oleh Guru. Kelompok dapat memulai kembali.',
    });
  });

  // Submit Final Story Retelling
  app.post('/api/game/:id/submit-retelling', (req: Request, res: Response) => {
    const { id } = req.params;
    const { retelling } = req.body as { retelling: StoryRetelling };

    const session = activeGames.get(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    session.status = 'completed';
    session.treasureUnlocked = true;
    session.storyRetelling = retelling;
    if (!session.endTime) session.endTime = Date.now();

    const durationSeconds = Math.round((session.endTime - session.startTime) / 1000);
    const totalQ = questions.length;
    const accuracy = Math.min(100, Math.round((session.totalCorrect / Math.max(session.totalAttempts, 1)) * 100));

    let badge = '📜 DETEKTIF LITERASI UTAMA';
    if (accuracy >= 95) badge = '🎯 AKURASI SEMPURNA';
    else if (durationSeconds <= 1200) badge = '⚡ PENJELAJAH KILAT';
    else if (accuracy >= 80) badge = '🧭 PETUALANG TANGGUH';

    const entry: LeaderboardEntry = {
      id: `lb_${Date.now()}`,
      gameId: session.gameId,
      playerName: session.player.playerName,
      mode: session.player.mode,
      className: session.player.className,
      members: session.player.members,
      score: session.score,
      completedStations: 5,
      correctCount: session.totalCorrect,
      totalQuestions: totalQ,
      durationSeconds,
      accuracy,
      badge,
      completedAt: new Date().toISOString(),
      storyRetelling: retelling,
    };

    leaderboard.unshift(entry);

    res.json({
      success: true,
      summary: entry,
      treasureCode: settings.treasureCode,
      teacherMessage: settings.teacherMessage,
    });
  });

  // ----------------------------------------------------
  // VITE DEV SERVER INTEGRATION
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
